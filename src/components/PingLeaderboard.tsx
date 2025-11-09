import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar?: string;
  pingCount: number;
  rank: number;
}

export const PingLeaderboard = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaders();
  }, []);

  const loadLeaders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all connections with their ping counts
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          display_name,
          messages:messages(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform and sort by ping count
      const leaderboardData: LeaderboardEntry[] = (connections || [])
        .map((conn: any) => ({
          id: conn.id,
          name: conn.display_name || 'Unknown',
          pingCount: conn.messages?.[0]?.count || 0,
        }))
        .sort((a, b) => b.pingCount - a.pingCount)
        .slice(0, 5)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setLeaders(leaderboardData);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/80 backdrop-blur border-primary/30 p-4 w-72 shadow-xl">
        <div className="space-y-2">
          <div className="h-4 bg-primary/20 rounded animate-pulse" />
          <div className="h-4 bg-primary/20 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 backdrop-blur border-primary/30 p-4 w-72 shadow-xl animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Most Pings</h3>
        </div>

        <div className="space-y-2">
          {leaders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pings yet</p>
          ) : (
            leaders.map((leader) => (
              <div
                key={leader.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold">
                  {leader.rank}
                </div>
                
                <Avatar className="h-8 w-8 border border-primary/30">
                  <AvatarImage src={leader.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {leader.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {leader.name}
                  </p>
                </div>

                <div className="flex items-center gap-1 text-primary">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-sm font-bold">{leader.pingCount}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
