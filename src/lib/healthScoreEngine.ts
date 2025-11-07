import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  recency: number;
  frequency: number;
  reciprocity: number;
  sentiment: number;
  tenure: number;
  overall: number;
}

export async function calculateHealthScore(
  userId: string,
  contactId: string
): Promise<HealthMetrics> {
  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .order('occurred_at', { ascending: false });

  const { data: contact } = await supabase
    .from('contacts')
    .select('first_contact_date')
    .eq('id', contactId)
    .single();

  if (!interactions || interactions.length === 0) {
    return {
      recency: 0,
      frequency: 0,
      reciprocity: 0,
      sentiment: 0,
      tenure: 0,
      overall: 0
    };
  }

  const recency = calculateRecency(interactions);
  const frequency = calculateFrequency(interactions);
  const reciprocity = calculateReciprocity(interactions);
  const sentiment = calculateSentiment(interactions);
  const tenure = calculateTenure(contact?.first_contact_date);

  // 5-Factor weighted model
  const overall = Math.round(
    recency * 0.30 +
    frequency * 0.25 +
    reciprocity * 0.20 +
    sentiment * 0.15 +
    tenure * 0.10
  );

  await supabase.from('health_scores').upsert({
    user_id: userId,
    contact_id: contactId,
    score: overall,
    recency_score: recency,
    frequency_score: frequency,
    reciprocity_score: reciprocity,
    consistency_score: sentiment, // Using consistency field for sentiment
    last_contact_days: getDaysSinceLastContact(interactions),
    total_interactions: interactions.length,
    calculated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,contact_id'
  });

  return {
    recency,
    frequency,
    reciprocity,
    sentiment,
    tenure,
    overall
  };
}

// 1. Recency (30%) - How long since last contact
function calculateRecency(interactions: any[]): number {
  if (!interactions.length) return 0;
  
  const daysSince = getDaysSinceLastContact(interactions);
  
  // Exponential decay
  if (daysSince <= 7) return 100;
  if (daysSince <= 30) return 80;
  if (daysSince <= 60) return 55;
  if (daysSince <= 90) return 30;
  return Math.max(0, 30 - (daysSince - 90) * 0.5); // Further decay
}

// 2. Frequency (25%) - Consistency of touchpoints
function calculateFrequency(interactions: any[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentInteractions = interactions.filter(
    i => new Date(i.occurred_at) > thirtyDaysAgo
  );

  const count = recentInteractions.length;
  
  // Scoring based on touchpoints per month
  if (count >= 5) return 95; // High: 90-100
  if (count >= 2) return 75; // Medium: 60-89
  if (count >= 1) return 50; // Low: 40-59
  return 20; // None: 0-39
}

// 3. Reciprocity (20%) - Balance of initiation
function calculateReciprocity(interactions: any[]): number {
  const userInitiated = interactions.filter(i => i.direction === 'outgoing').length;
  const contactInitiated = interactions.filter(i => i.direction === 'incoming').length;
  const total = interactions.length;

  if (total === 0) return 0;

  const userPercent = (userInitiated / total) * 100;
  
  // Perfect balance (40-60%): 90-100
  if (userPercent >= 40 && userPercent <= 60) return 95;
  
  // Slightly one-sided (20-39% or 61-80%): 70-89
  if ((userPercent >= 20 && userPercent < 40) || (userPercent > 60 && userPercent <= 80)) return 75;
  
  // Mostly one-sided (<20% or >80%): 0-69
  return 35;
}

// 4. Sentiment (15%) - Emotional quality
function calculateSentiment(interactions: any[]): number {
  // Use quality_rating if available, otherwise infer from notes/metadata
  const ratingsSum = interactions.reduce((sum, i) => {
    if (i.quality_rating) return sum + i.quality_rating;
    // Default to positive if no rating
    return sum + 4; // Assuming 1-5 scale, default to 4
  }, 0);

  const avgRating = ratingsSum / interactions.length;
  
  // Convert 1-5 scale to 0-100
  // 4-5 → 90-100 (Positive)
  // 3-4 → 60-89 (Neutral)
  // 1-3 → 0-59 (Negative)
  if (avgRating >= 4) return 95;
  if (avgRating >= 3) return 75;
  return 40;
}

// 5. Tenure (10%) - Duration and embeddedness
function calculateTenure(firstContactDate: string | null): number {
  if (!firstContactDate) return 50; // Default for unknown
  
  const start = new Date(firstContactDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const monthsSince = daysSince / 30;
  
  // Known 1+ year (12+ months): 90-100
  if (monthsSince >= 12) return 95;
  
  // Known 3-12 months: 70-89
  if (monthsSince >= 3) return 80;
  
  // Known <3 months: 0-69
  return 50;
}

function getDaysSinceLastContact(interactions: any[]): number {
  if (!interactions || interactions.length === 0) return 999;
  
  const lastInteraction = interactions[0];
  const lastDate = new Date(lastInteraction.occurred_at);
  const now = new Date();
  
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}

export async function calculateAllHealthScores(userId: string): Promise<void> {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId);

  if (!contacts) return;

  for (const contact of contacts) {
    await calculateHealthScore(userId, contact.id);
  }
}
