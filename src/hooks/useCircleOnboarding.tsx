import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type OnboardingStep = 'welcome' | 'create-circles' | 'add-people' | 'complete';

export interface Circle {
  id: string;
  name: string;
  color: string;
}

export function useCircleOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [circles, setCircles] = useState<Circle[]>([]);

  const createDefaultCircles = async (userId: string) => {
    const defaultCircles = [
      { name: 'Close Friends', color: '#00FF66' },
      { name: 'Family', color: '#FFD700' },
      { name: 'Work', color: '#FF6B6B' },
      { name: 'Acquaintances', color: '#4ECDC4' }
    ];

    const { data, error } = await supabase
      .from('circles')
      .insert(
        defaultCircles.map(c => ({
          user_id: userId,
          name: c.name,
          color: c.color
        }))
      )
      .select();

    if (!error && data) {
      setCircles(data);
      return data;
    }
    return [];
  };

  const addContactsToCircle = async (circleId: string, contactIds: string[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const members = contactIds.map(contactId => ({
      circle_id: circleId,
      user_id: user.id,
      contact_id: contactId,
      position_x: Math.random() * 2 - 1,
      position_y: Math.random() * 2 - 1,
      position_z: Math.random() * 2 - 1
    }));

    await supabase.from('circle_members').insert(members);
  };

  const completeOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('profiles').update({
      circles_onboarded: true
    }).eq('user_id', user.id);

    setStep('complete');
  };

  return {
    step,
    setStep,
    circles,
    createDefaultCircles,
    addContactsToCircle,
    completeOnboarding
  };
}
