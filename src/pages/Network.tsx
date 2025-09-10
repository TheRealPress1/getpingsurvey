import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { StarField } from '@/components/StarField';
import { ArrowLeft, MessageSquare, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Connection {
  id: string;
  user_id: string;
  target_user_id: string;
  created_at: string;
}

const Network = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { name: string; avatar: string | null }>>({});

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch connections where current user participates
      const { data: connectionRows, error } = await supabase
        .from('connections')
        .select('*')
        .or(`user_id.eq.${user.id},target_user_id.eq.${user.id})`);

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      
      setConnections(connectionRows || []);

      // Fetch counterpart profiles
      const otherIds = (connectionRows || []).map(r => r.user_id === user.id ? r.target_user_id : r.user_id);
      const unique = Array.from(new Set(otherIds));
      if (unique.length) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', unique);
        const map: Record<string, { name: string; avatar: string | null }> = {};
        (profs || []).forEach(p => map[p.user_id] = { name: p.display_name || 'User', avatar: p.avatar_url });
        setProfiles(map);
      }

      setLoading(false);
    };

    load();
  }, [user]);

  const startConversation = async (otherId: string) => {
    if (!user) return;

    // Create conversation
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ category: 'personal' })
      .select('id')
      .single();
    if (convErr || !conv) { console.error(convErr); return; }

    // Add current user as participant (allowed by policy)
    const { error: partErr1 } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conv.id, user_id: user.id });
    if (partErr1) { console.error(partErr1); return; }

    // Add other user as participant (allowed by new policy)
    const { error: partErr2 } = await supabase
      .from('conversation_participants')
      .insert({ conversation_id: conv.id, user_id: otherId });
    if (partErr2) { console.error(partErr2); return; }

    navigate(`/chat/${conv.id}`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <StarField />

      <header className="border-b border-border p-4 relative z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/profile')} className="flex items-center gap-2 hover-scale">
            <ArrowLeft className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold iridescent-text">Back to Profile</span>
          </Button>
          <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> Network</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 pb-28 space-y-6 relative z-10">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="iridescent-text">Loading connections...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {connections.map((c) => {
              const other = c.user_id === user?.id ? c.target_user_id : c.user_id;
              const prof = profiles[other] || { name: 'User', avatar: null };
              return (
                <Card key={c.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      {prof.avatar ? <AvatarImage src={prof.avatar} /> : <AvatarFallback>{prof.name[0] || 'U'}</AvatarFallback>}
                    </Avatar>
                    <div>
                      <p className="font-medium iridescent-text">{prof.name}</p>
                      <p className="text-xs text-muted-foreground">Connected on {new Date(c.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button onClick={() => startConversation(other)} className="hover-scale">
                    <MessageSquare className="w-4 h-4 mr-2" /> Message
                  </Button>
                </Card>
              );
            })}
            {connections.length === 0 && (
              <Card className="p-6 text-center text-muted-foreground">No connections yet. Ping someone to connect!</Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Network;