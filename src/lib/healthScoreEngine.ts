import { supabase } from '@/integrations/supabase/client';

export interface HealthMetrics {
  frequency: number;
  recency: number;
  reciprocity: number;
  consistency: number;
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

  if (!interactions || interactions.length === 0) {
    return {
      frequency: 0,
      recency: 0,
      reciprocity: 0,
      consistency: 0,
      overall: 0
    };
  }

  const { data: goals } = await supabase
    .from('relationship_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .single();

  const targetFrequency = goals?.contact_frequency_days || 14;

  const frequency = calculateFrequency(interactions, targetFrequency);
  const recency = calculateRecency(interactions);
  const reciprocity = calculateReciprocity(interactions);
  const consistency = calculateConsistency(interactions);

  const overall = Math.round(
    frequency * 0.3 +
    recency * 0.3 +
    reciprocity * 0.2 +
    consistency * 0.2
  );

  await supabase.from('health_scores').upsert({
    user_id: userId,
    contact_id: contactId,
    score: overall,
    frequency_score: frequency,
    recency_score: recency,
    reciprocity_score: reciprocity,
    consistency_score: consistency,
    last_contact_days: getDaysSinceLastContact(interactions),
    total_interactions: interactions.length,
    calculated_at: new Date().toISOString()
  }, {
    onConflict: 'user_id,contact_id'
  });

  return {
    frequency,
    recency,
    reciprocity,
    consistency,
    overall
  };
}

function calculateFrequency(interactions: any[], targetDays: number): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentInteractions = interactions.filter(
    i => new Date(i.occurred_at) > thirtyDaysAgo
  );

  const expectedInteractions = 30 / targetDays;
  const actualInteractions = recentInteractions.length;
  
  const score = Math.min(100, (actualInteractions / expectedInteractions) * 100);
  return Math.round(score);
}

function calculateRecency(interactions: any[]): number {
  const lastInteraction = interactions[0];
  if (!lastInteraction) return 0;

  const daysSince = getDaysSinceLastContact(interactions);
  
  let score = 100;
  if (daysSince > 60) score = 0;
  else if (daysSince > 30) score = 30;
  else if (daysSince > 14) score = 60;
  else if (daysSince > 7) score = 80;
  else score = 100 - (daysSince * 5);
  
  return Math.max(0, Math.round(score));
}

function calculateReciprocity(interactions: any[]): number {
  const sent = interactions.filter(i => i.direction === 'sent').length;
  const received = interactions.filter(i => i.direction === 'received').length;
  const mutual = interactions.filter(i => i.direction === 'mutual').length;

  const total = sent + received + mutual;
  if (total === 0) return 0;

  const balance = received > 0 ? Math.min(sent / received, received / sent) : 0;
  const mutualBonus = (mutual / total) * 20;
  
  const score = (balance * 80) + mutualBonus;
  return Math.round(Math.min(100, score));
}

function calculateConsistency(interactions: any[]): number {
  if (interactions.length < 2) return 0;

  const gaps: number[] = [];
  for (let i = 0; i < interactions.length - 1; i++) {
    const gap = Math.abs(
      new Date(interactions[i].occurred_at).getTime() - 
      new Date(interactions[i + 1].occurred_at).getTime()
    );
    gaps.push(gap / (1000 * 60 * 60 * 24));
  }

  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const variance = gaps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / gaps.length;
  const stdDev = Math.sqrt(variance);

  const score = Math.max(0, 100 - (stdDev * 3.33));
  return Math.round(score);
}

function getDaysSinceLastContact(interactions: any[]): number {
  if (interactions.length === 0) return 999;
  
  const lastInteraction = new Date(interactions[0].occurred_at);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - lastInteraction.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export async function calculateAllHealthScores(userId: string) {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', userId);

  if (!contacts) return;

  for (const contact of contacts) {
    await calculateHealthScore(userId, contact.id);
  }
}
