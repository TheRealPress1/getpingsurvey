import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Globe, Circle, Search } from 'lucide-react';
import { Network3D } from '@/components/Network3D';
import { NetworkGlobe } from '@/components/NetworkGlobe';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChatList } from '@/components/ChatList';
import { MessageCircle } from 'lucide-react';
import { RelationshipHealthPanel } from '@/components/RelationshipHealthPanel';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface NetworkPerson {
  id: string;
  name: string;
  circle: 'family' | 'friends' | 'business' | 'acquaintances';
  angle: number;
  lat: number;
  lng: number;
  userId?: string;
}

export default function NetworkVisualization() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [people, setPeople] = useState<NetworkPerson[]>([]);
  const [viewMode, setViewMode] = useState<'chats' | 'circles' | 'globe'>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<NetworkPerson | null>(null);
  const [personHealth, setPersonHealth] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadRealConnections();
    }
  }, [user]);

  const loadRealConnections = async () => {
    if (!user) return;

    // Fetch all connections for the user
    const { data: connections } = await supabase
      .from('connections')
      .select('target_user_id')
      .eq('user_id', user.id);

    if (!connections || connections.length === 0) {
      setPeople([]);
      return;
    }

    // Get contact details for each connection
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id);

    // Get profiles for connected users
    const targetUserIds = connections.map(c => c.target_user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, location')
      .in('user_id', targetUserIds);

    // Get health scores
    const { data: healthScores } = await supabase
      .from('health_scores')
      .select('contact_id, score')
      .eq('user_id', user.id);

    const healthMap: Record<string, number> = {};
    healthScores?.forEach(h => {
      if (h.contact_id && h.score !== null) {
        healthMap[h.contact_id] = h.score;
      }
    });
    setPersonHealth(healthMap);

    // Combine contacts and profiles
    const networkPeople: NetworkPerson[] = [];
    let angleIncrement = 360 / (connections.length || 1);
    let currentAngle = 0;

    // Add contacts first
    contacts?.forEach((contact, index) => {
      // Assign circle based on tags or default to acquaintances
      let circle: 'family' | 'friends' | 'business' | 'acquaintances' = 'acquaintances';
      if (contact.tags?.includes('family')) circle = 'family';
      else if (contact.tags?.includes('friends') || contact.tags?.includes('friend')) circle = 'friends';
      else if (contact.tags?.includes('work') || contact.tags?.includes('business')) circle = 'business';

      // Generate random but consistent coordinates
      const lat = (Math.sin(currentAngle * Math.PI / 180) * 60) + (Math.random() * 20 - 10);
      const lng = (Math.cos(currentAngle * Math.PI / 180) * 180) + (Math.random() * 20 - 10);

      networkPeople.push({
        id: contact.id,
        name: contact.name,
        circle,
        angle: currentAngle,
        lat: Math.max(-85, Math.min(85, lat)),
        lng,
        userId: undefined
      });

      currentAngle += angleIncrement;
    });

    // Add connected profiles that aren't already in contacts
    const contactUserIds = new Set(contacts?.map(c => c.id) || []);
    profiles?.forEach((profile) => {
      if (!contactUserIds.has(profile.user_id)) {
        const lat = (Math.sin(currentAngle * Math.PI / 180) * 60) + (Math.random() * 20 - 10);
        const lng = (Math.cos(currentAngle * Math.PI / 180) * 180) + (Math.random() * 20 - 10);

        networkPeople.push({
          id: profile.user_id,
          name: profile.display_name || 'User',
          circle: 'friends',
          angle: currentAngle,
          lat: Math.max(-85, Math.min(85, lat)),
          lng,
          userId: profile.user_id
        });

        currentAngle += angleIncrement;
      }
    });

    setPeople(networkPeople);
  };

  const handlePersonClick = (person: NetworkPerson) => {
    console.log('Person clicked:', person);
    setSelectedPerson(person);
  };

  const handleHealthChange = (id: string, score: number) => {
    setPersonHealth((prev) => ({ ...prev, [id]: score }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border z-50">
        <div className="p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (viewMode === 'chats') {
                navigate('/profile');
              } else {
                setViewMode('chats');
              }
            }}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold iridescent-text">
            {viewMode === 'chats' ? 'chats' : 'visualize your circle'}
          </h1>
        </div>
        
        {/* Search bar - only show in chats view */}
        {viewMode === 'chats' && (
          <div className="px-4 pb-4">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'chats' | 'circles' | 'globe')} className="flex-1 flex flex-col w-full h-full">
        <TabsContent value="chats" className="flex-1 m-0 h-full">
          <ChatList searchQuery={searchQuery} />
        </TabsContent>
        
        <TabsContent value="circles" className="flex-1 m-0 h-full">
          <Network3D people={people} onPersonClick={handlePersonClick} personHealth={personHealth} />
        </TabsContent>
        
        <TabsContent value="globe" className="flex-1 m-0 h-full">
          <NetworkGlobe people={people} onPersonClick={handlePersonClick} />
        </TabsContent>

        {/* View toggle at bottom */}
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pb-2">
          <TabsList className="bg-card/95 backdrop-blur border border-border shadow-lg">
            <TabsTrigger value="chats" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Chats
            </TabsTrigger>
            <TabsTrigger value="circles" className="gap-2">
              <Circle className="h-4 w-4" />
              Circles
            </TabsTrigger>
            <TabsTrigger value="globe" className="gap-2">
              <Globe className="h-4 w-4" />
              Globe
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Relationship Health Panel */}
      <RelationshipHealthPanel 
        person={selectedPerson} 
        onClose={() => setSelectedPerson(null)} 
        onHealthChange={handleHealthChange}
      />
    </div>
  );
}
