import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface ChatPreview {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
}

export const ChatPreviewPopup = () => {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get recent chats with last message
      const { data: connections, error } = await supabase
        .from('connections')
        .select(`
          id,
          display_name,
          messages:messages(
            content,
            created_at,
            sender_id
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const chatPreviews: ChatPreview[] = (connections || [])
        .filter((conn: any) => conn.messages && conn.messages.length > 0)
        .map((conn: any) => {
          const lastMsg = conn.messages[0];
          return {
            id: conn.id,
            name: conn.display_name || 'Unknown',
            lastMessage: lastMsg?.content?.substring(0, 50) || 'No messages',
            timestamp: new Date(lastMsg?.created_at),
            unreadCount: 0, // TODO: Calculate unread count
          };
        })
        .slice(0, isExpanded ? 10 : 3);

      setChats(chatPreviews);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId: string) => {
    navigate(`/chat?connection=${chatId}`);
  };

  if (loading) {
    return (
      <Card className="bg-black/80 backdrop-blur border-primary/30 p-4 w-80 shadow-xl">
        <div className="space-y-2">
          <div className="h-4 bg-primary/20 rounded animate-pulse" />
          <div className="h-4 bg-primary/20 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-black/80 backdrop-blur border-primary/30 p-4 w-80 shadow-xl animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Recent Chats</h3>
          </div>
          
          {chats.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsExpanded(!isExpanded);
                if (!isExpanded) loadChats();
              }}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-primary" />
              )}
            </Button>
          )}
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {chats.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent chats</p>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer group"
              >
                <Avatar className="h-10 w-10 border border-primary/30">
                  <AvatarImage src={chat.avatar} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {chat.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {chat.name}
                    </p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(chat.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <div className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {chats.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/chat')}
            className="w-full border-primary/30 hover:bg-primary/10"
          >
            View All Chats
          </Button>
        )}
      </div>
    </Card>
  );
};
