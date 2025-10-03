import { supabase } from "@/integrations/supabase/client";

export const runBackfillDisplayNames = async () => {
  const { data, error } = await supabase.functions.invoke('backfill-display-names');
  
  if (error) {
    console.error('Backfill error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('Backfill result:', data);
  return data;
};
