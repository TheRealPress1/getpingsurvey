import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { userId, contactId } = await req.json();

    if (!userId || !contactId) {
      return new Response(
        JSON.stringify({ error: 'userId and contactId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Fetch interactions for this contact
    const { data: interactions } = await supabaseClient
      .from('interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('occurred_at', { ascending: false });

    const { data: contact } = await supabaseClient
      .from('contacts')
      .select('first_contact_date')
      .eq('id', contactId)
      .single();

    if (!interactions || interactions.length === 0) {
      return new Response(
        JSON.stringify({
          recency: 0,
          frequency: 0,
          reciprocity: 0,
          sentiment: 0,
          tenure: 0,
          overall: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Calculate scores using the 5-factor model
    const recency = calculateRecency(interactions);
    const frequency = calculateFrequency(interactions);
    const reciprocity = calculateReciprocity(interactions);
    const sentiment = calculateSentiment(interactions);
    const tenure = calculateTenure(contact?.first_contact_date);

    const overall = Math.round(
      recency * 0.30 +
      frequency * 0.25 +
      reciprocity * 0.20 +
      sentiment * 0.15 +
      tenure * 0.10
    );

    // Store in database
    await supabaseClient.from('health_scores').upsert({
      user_id: userId,
      contact_id: contactId,
      score: overall,
      recency_score: recency,
      frequency_score: frequency,
      reciprocity_score: reciprocity,
      consistency_score: sentiment,
      last_contact_days: getDaysSinceLastContact(interactions),
      total_interactions: interactions.length,
      calculated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,contact_id'
    });

    return new Response(
      JSON.stringify({ recency, frequency, reciprocity, sentiment, tenure, overall }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error calculating health scores:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

function calculateRecency(interactions: any[]): number {
  if (!interactions.length) return 0;
  const daysSince = getDaysSinceLastContact(interactions);
  if (daysSince <= 7) return 100;
  if (daysSince <= 30) return 80;
  if (daysSince <= 60) return 55;
  if (daysSince <= 90) return 30;
  return Math.max(0, 30 - (daysSince - 90) * 0.5);
}

function calculateFrequency(interactions: any[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentInteractions = interactions.filter(
    i => new Date(i.occurred_at) > thirtyDaysAgo
  );
  const count = recentInteractions.length;
  if (count >= 5) return 95;
  if (count >= 2) return 75;
  if (count >= 1) return 50;
  return 20;
}

function calculateReciprocity(interactions: any[]): number {
  const userInitiated = interactions.filter(i => i.direction === 'outgoing').length;
  const contactInitiated = interactions.filter(i => i.direction === 'incoming').length;
  const total = interactions.length;
  if (total === 0) return 0;
  const userPercent = (userInitiated / total) * 100;
  if (userPercent >= 40 && userPercent <= 60) return 95;
  if ((userPercent >= 20 && userPercent < 40) || (userPercent > 60 && userPercent <= 80)) return 75;
  return 35;
}

function calculateSentiment(interactions: any[]): number {
  const ratingsSum = interactions.reduce((sum, i) => {
    if (i.quality_rating) return sum + i.quality_rating;
    return sum + 4;
  }, 0);
  const avgRating = ratingsSum / interactions.length;
  if (avgRating >= 4) return 95;
  if (avgRating >= 3) return 75;
  return 40;
}

function calculateTenure(firstContactDate: string | null): number {
  if (!firstContactDate) return 50;
  const start = new Date(firstContactDate);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const monthsSince = daysSince / 30;
  if (monthsSince >= 12) return 95;
  if (monthsSince >= 3) return 80;
  return 50;
}

function getDaysSinceLastContact(interactions: any[]): number {
  if (!interactions || interactions.length === 0) return 999;
  const lastInteraction = interactions[0];
  const lastDate = new Date(lastInteraction.occurred_at);
  const now = new Date();
  return Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
}
