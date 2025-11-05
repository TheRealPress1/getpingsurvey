import { supabase } from '@/integrations/supabase/client';

export async function generateNextStep(
  userId: string,
  contactId: string
): Promise<{
  message: string;
  actions: Array<{ type: 'call' | 'message' | 'meet'; label: string }>;
}> {
  const { data: health } = await supabase
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('contact_id', contactId)
    .single();

  const { data: contact } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .single();

  if (!health || !contact) {
    return {
      message: "Stay connected with your network!",
      actions: [
        { type: 'message', label: 'Message' },
        { type: 'call', label: 'Call' }
      ]
    };
  }

  const daysSince = health.last_contact_days;
  const name = contact.name.split(' ')[0];

  let message = '';
  let actions: any[] = [];

  if (daysSince >= 60) {
    message = `It's been ${daysSince} days—time to reconnect with ${name}!`;
    actions = [
      { type: 'call', label: 'Call' },
      { type: 'message', label: 'Message' },
      { type: 'meet', label: 'Meet' }
    ];
  } else if (daysSince >= 30) {
    message = `${name} might be wondering about you—reach out today!`;
    actions = [
      { type: 'message', label: 'Message' },
      { type: 'call', label: 'Call' }
    ];
  } else if (daysSince >= 14) {
    message = `Check in with ${name}—it's been a couple weeks!`;
    actions = [
      { type: 'message', label: 'Message' }
    ];
  } else if (health.reciprocity_score < 50) {
    message = `${name} has been reaching out—time to reciprocate!`;
    actions = [
      { type: 'call', label: 'Call' },
      { type: 'message', label: 'Message' }
    ];
  } else if (health.consistency_score < 60) {
    message = `Build consistency with ${name}—schedule a catch-up!`;
    actions = [
      { type: 'meet', label: 'Schedule Meet' },
      { type: 'call', label: 'Call' }
    ];
  } else {
    message = `Your connection with ${name} is strong—keep it up!`;
    actions = [
      { type: 'message', label: 'Send Quick Note' }
    ];
  }

  return { message, actions };
}
