import { supabase } from '@/integrations/supabase/client';
import { calculateHealthScore } from './healthScoreEngine';

export async function logInteraction(params: {
  userId: string;
  contactId: string;
  type: 'message' | 'call' | 'meeting' | 'email';
  direction: 'sent' | 'received' | 'mutual';
  durationMinutes?: number;
  metadata?: any;
  occurredAt?: Date;
}) {
  const dateValue = params.occurredAt || new Date();
  const { error } = await supabase.from('interactions').insert({
    contact_id: params.contactId,
    type: params.type,
    date: dateValue.toISOString().split('T')[0],
    duration_minutes: params.durationMinutes || null,
    notes: params.metadata ? JSON.stringify(params.metadata) : null
  } as any);

  if (error) {
    console.error('Failed to log interaction:', error);
    return;
  }

  await calculateHealthScore(params.userId, params.contactId);
}

export function useInteractionLogger() {
  const logMessage = async (contactId: string, direction: 'sent' | 'received') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await logInteraction({
      userId: user.id,
      contactId,
      type: 'message',
      direction
    });
  };

  const logCall = async (contactId: string, durationMinutes: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await logInteraction({
      userId: user.id,
      contactId,
      type: 'call',
      direction: 'mutual',
      durationMinutes
    });
  };

  const logMeeting = async (contactId: string, durationMinutes: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await logInteraction({
      userId: user.id,
      contactId,
      type: 'meeting',
      direction: 'mutual',
      durationMinutes
    });
  };

  return { logMessage, logCall, logMeeting };
}
