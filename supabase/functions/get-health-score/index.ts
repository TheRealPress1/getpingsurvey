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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const url = new URL(req.url);
    const contactId = url.pathname.split('/').pop();

    if (!contactId) {
      return new Response(
        JSON.stringify({ error: 'Contact ID required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const { data: metrics } = await supabaseClient
      .from('health_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('contact_id', contactId)
      .single();

    const { data: contact } = await supabaseClient
      .from('contacts')
      .select('name')
      .eq('id', contactId)
      .single();

    let nextStep = {
      message: "Stay connected with your network!",
      actions: [
        { type: 'message', label: 'Message' },
        { type: 'call', label: 'Call' }
      ]
    };

    if (metrics && contact) {
      const daysSince = metrics.last_contact_days;
      const name = contact.name.split(' ')[0];

      if (daysSince >= 60) {
        nextStep = {
          message: `It's been ${daysSince} days—time to reconnect with ${name}!`,
          actions: [
            { type: 'call', label: 'Call' },
            { type: 'message', label: 'Message' },
            { type: 'meet', label: 'Meet' }
          ]
        };
      } else if (daysSince >= 30) {
        nextStep = {
          message: `${name} might be wondering about you—reach out today!`,
          actions: [
            { type: 'message', label: 'Message' },
            { type: 'call', label: 'Call' }
          ]
        };
      }
    }

    return new Response(
      JSON.stringify({ metrics, nextStep }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching health score:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
