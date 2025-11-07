import { useState, useMemo } from 'react';
import { X, MessageCircle, Trophy, Users, Send, Copy, Mail, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface RecommendedPingsSidebarProps {
  selectedPerson: any | null;
  onClose: () => void;
  people: any[];
  personHealth: Record<string, number>;
  isDemoMode: boolean;
}

export const RecommendedPingsSidebar = ({ 
  selectedPerson, 
  onClose, 
  people,
  personHealth,
  isDemoMode 
}: RecommendedPingsSidebarProps) => {
  const [activeTab, setActiveTab] = useState('network');
  const [pingModalOpen, setPingModalOpen] = useState(false);
  const [selectedPing, setSelectedPing] = useState<any>(null);
  const [aiMessage, setAiMessage] = useState('');

  // Calculate recommended follow-ups
  const recommendedFollowUps = useMemo(() => {
    return people
      .filter(p => {
        const score = personHealth[p.id] || 70;
        return score < 60; // At-risk or worse
      })
      .sort((a, b) => {
        const scoreA = personHealth[a.id] || 70;
        const scoreB = personHealth[b.id] || 70;
        return scoreA - scoreB; // Lower scores first
      })
      .slice(0, 10)
      .map(p => ({
        ...p,
        lastContact: Math.floor(Math.random() * 60) + 14,
        state: personHealth[p.id] < 40 ? 'At Risk' : 'Fading',
        tags: ['MIT', 'AI'],
      }));
  }, [people, personHealth]);

  // Mock recommended new pings
  const recommendedNewPings = useMemo(() => {
    if (!isDemoMode) return [];
    
    return [
      {
        id: 'new-1',
        name: 'Sarah Chen',
        summary: 'AI founder in Boston',
        reasonTag: 'Same event: Buildathon 2025',
        image: null,
      },
      {
        id: 'new-2',
        name: 'Marcus Williams',
        summary: 'Product designer at early-stage startup',
        reasonTag: 'Same industry: AI & Design',
        image: null,
      },
      {
        id: 'new-3',
        name: 'Elena Rodriguez',
        summary: 'VC investor focused on climate tech',
        reasonTag: 'Nearby: Boston',
        image: null,
      },
    ];
  }, [isDemoMode]);

  // Mock leaderboard
  const leaderboard = useMemo(() => {
    if (!isDemoMode) return [];
    
    return [
      { rank: 1, name: 'Alex Thompson', score: 145, followUps: 12, revives: 8, intros: 5 },
      { rank: 2, name: 'Jordan Lee', score: 132, followUps: 15, revives: 5, intros: 4 },
      { rank: 3, name: 'Sam Rivera', score: 128, followUps: 10, revives: 7, intros: 6 },
      { rank: 4, name: 'Casey Moore', score: 119, followUps: 14, revives: 4, intros: 3 },
      { rank: 5, name: 'Taylor Kim', score: 115, followUps: 11, revives: 6, intros: 4 },
      { rank: 6, name: 'Morgan Davis', score: 108, followUps: 9, revives: 5, intros: 5 },
      { rank: 7, name: 'You', score: 98, followUps: 8, revives: 4, intros: 3, isUser: true },
    ];
  }, [isDemoMode]);

  const handlePingNow = (person: any) => {
    setSelectedPing(person);
    // Generate AI message
    const messages = [
      `Hey ${person.name}! It's been a while since we connected. Would love to catch up over coffee soon!`,
      `Hi ${person.name}, I was thinking about you recently. How have you been? Let's reconnect!`,
      `${person.name}, hope you're doing well! I'd love to hear what you're working on these days.`,
    ];
    setAiMessage(messages[Math.floor(Math.random() * messages.length)]);
    setPingModalOpen(true);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(aiMessage);
    toast('Message copied to clipboard!');
  };

  const handleMarkContacted = () => {
    toast('Contact marked as reached out!');
    setPingModalOpen(false);
  };

  return (
    <>
      <div className="w-96 bg-black/90 backdrop-blur border-l border-border/30 flex flex-col overflow-hidden">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border/30 p-4">
            <TabsList className="w-full grid grid-cols-3 bg-card/50">
              <TabsTrigger value="network" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Info
              </TabsTrigger>
              <TabsTrigger value="pings" className="text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                Pings
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="text-xs">
                <Trophy className="h-3 w-3 mr-1" />
                Leaders
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Network Info Tab */}
          <TabsContent value="network" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
            {selectedPerson ? (
              <Card className="bg-card/50 border-border/30 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedPerson.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{selectedPerson.circle}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Health Score</span>
                    <span className={`font-semibold ${
                      (personHealth[selectedPerson.id] || 70) >= 70 ? 'text-green-500' :
                      (personHealth[selectedPerson.id] || 70) >= 40 ? 'text-yellow-500' :
                      'text-red-500'
                    }`}>
                      {personHealth[selectedPerson.id] || 70}/100
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Last contact: {Math.floor(Math.random() * 30)} days ago
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">View Profile</Button>
                  <Button size="sm" variant="outline" className="flex-1">Log Interaction</Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Network Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Connections</span>
                    <span className="font-semibold">{people.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">At Risk</span>
                    <span className="font-semibold text-orange-500">
                      {recommendedFollowUps.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">
                    💡 You have {recommendedFollowUps.length} at-risk connections to revive this week.
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Recommended Pings Tab */}
          <TabsContent value="pings" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
            {/* Follow-Ups Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                Recommended Follow-Ups
              </h3>
              {recommendedFollowUps.length === 0 ? (
                <p className="text-sm text-muted-foreground">All your connections are healthy! 🎉</p>
              ) : (
                recommendedFollowUps.map(person => (
                  <Card key={person.id} className="bg-card/50 border-border/30 p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm">{person.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {person.tags?.join(' • ')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-500">
                        {person.state}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Last contact: {person.lastContact} days ago
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      onClick={() => handlePingNow(person)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Ping Now
                    </Button>
                  </Card>
                ))
              )}
            </div>

            {/* New Pings Section */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Recommended New Pings
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  AI-suggested people to discover based on your circles, events, and interests.
                </p>
              </div>
              {recommendedNewPings.map(person => (
                <Card key={person.id} className="bg-card/50 border-border/30 p-3 space-y-2">
                  <div className="font-semibold text-sm">{person.name}</div>
                  <div className="text-xs text-muted-foreground">{person.summary}</div>
                  <div className="text-xs px-2 py-1 rounded bg-primary/20 text-primary inline-block">
                    {person.reasonTag}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      View Profile
                    </Button>
                    <Button size="sm" className="flex-1">
                      Save
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto p-4 space-y-4 m-0">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Top Connectors
                </h3>
                <select className="text-xs bg-card border border-border rounded px-2 py-1">
                  <option>Global</option>
                  <option>My School</option>
                  <option>My City</option>
                </select>
              </div>

              {leaderboard.map(entry => (
                <Card 
                  key={entry.rank} 
                  className={`p-3 ${entry.isUser ? 'bg-primary/10 border-primary/30' : 'bg-card/50 border-border/30'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${
                      entry.rank === 1 ? 'text-yellow-500' :
                      entry.rank === 2 ? 'text-gray-400' :
                      entry.rank === 3 ? 'text-orange-600' :
                      'text-muted-foreground'
                    }`}>
                      #{entry.rank}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{entry.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {entry.followUps} follow-ups • {entry.revives} revives • {entry.intros} intros
                      </div>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      {entry.score}
                    </div>
                  </div>
                  {entry.isUser && (
                    <div className="text-xs text-primary mt-2">
                      🚀 You're rising fast – up 5 places this week!
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ping Modal */}
      <Dialog open={pingModalOpen} onOpenChange={setPingModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Ping {selectedPing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                AI-Generated Message
              </label>
              <Textarea 
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                rows={4}
                className="bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleCopyMessage}
              >
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Email
              </Button>
              <Button 
                className="flex-1"
                onClick={handleMarkContacted}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Mark Contacted
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
