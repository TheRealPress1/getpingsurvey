import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export const useConnections = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkConnection = async (targetUserId: string) => {
    if (!user || !targetUserId) return false;
    
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('id')
        .or(`and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`)
        .limit(1);

      if (error) throw error;
      
      const connected = data && data.length > 0;
      setIsConnected(connected);
      return connected;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  };

  const removeConnection = async (targetUserId: string) => {
    if (!user || !targetUserId) return false;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .or(`and(user_id.eq.${user.id},target_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},target_user_id.eq.${user.id})`);

      if (error) throw error;

      setIsConnected(false);
      toast({
        title: "Removed from tribe",
        description: "User has been removed from your tribe",
      });
      return true;
    } catch (error) {
      console.error('Error removing connection:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from tribe",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    isConnected,
    loading,
    checkConnection,
    removeConnection,
  };
};