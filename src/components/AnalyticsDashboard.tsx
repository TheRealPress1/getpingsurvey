import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Eye, Users, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    profileViews: 0,
    connections: 0,
    messages: 0,
    profileCompleteness: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      // Get profile completeness and other data
      const { data: profile } = await supabase
        .from('profiles')
        .select('profile_completeness')
        .eq('user_id', user?.id)
        .single();

      // Get connections count
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Get conversations count (as proxy for messages)
      const { count: conversationsCount } = await supabase
        .from('conversation_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      setAnalytics({
        profileViews: 0, // This would need to be tracked separately
        connections: connectionsCount || 0,
        messages: conversationsCount || 0,
        profileCompleteness: profile?.profile_completeness || 0
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Link to="/dashboard">
        <Button 
          variant="outline" 
          size="sm"
          className="shimmer border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Dashboard
          <Badge variant="secondary" className="ml-2 bg-primary/20 text-primary">
            Loading...
          </Badge>
        </Button>
      </Link>
    );
  }

  return (
    <Link to="/dashboard">
      <Button 
        variant="outline" 
        size="sm"
        className="shimmer border-primary/50 text-primary hover:bg-primary/10 hover:scale-105 transition-all duration-200"
      >
        <BarChart3 className="h-4 w-4 mr-2" />
        Dashboard
        <div className="ml-2 flex gap-1">
          <Badge variant="secondary" className="bg-primary/20 text-primary text-xs">
            <Users className="w-3 h-3 mr-1" />
            {analytics.connections}
          </Badge>
          {analytics.profileCompleteness > 0 && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-600 text-xs">
              {analytics.profileCompleteness}%
            </Badge>
          )}
        </div>
      </Button>
    </Link>
  );
};