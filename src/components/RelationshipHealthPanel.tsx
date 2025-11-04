import { useState } from 'react';
import { X, Pin, PinOff, Phone, MessageCircle, Calendar, TrendingUp, Activity, Clock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface NetworkPerson {
  id: string;
  name: string;
  circle: 'family' | 'friends' | 'business' | 'acquaintances' | 'network' | 'extended';
  angle: number;
  lat: number;
  lng: number;
  userId?: string;
}

interface HealthMetrics {
  lastInteractionAt?: Date;
  msgsSent30d?: number;
  msgsRecv30d?: number;
  calls30d?: number;
  callMinutes30d?: number;
  meetings30d?: number;
  streakDays?: number;
  sentiment30d?: number; // 0-1 scale
}

interface RelationshipHealthPanelProps {
  person: NetworkPerson | null;
  onClose: () => void;
}

export function RelationshipHealthPanel({ person, onClose }: RelationshipHealthPanelProps) {
  const [isPinned, setIsPinned] = useState(false);

  if (!person) return null;

  // Mock health metrics - in production, fetch from database
  const metrics: HealthMetrics = {
    lastInteractionAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    msgsSent30d: Math.floor(Math.random() * 50),
    msgsRecv30d: Math.floor(Math.random() * 50),
    calls30d: Math.floor(Math.random() * 10),
    callMinutes30d: Math.floor(Math.random() * 200),
    meetings30d: Math.floor(Math.random() * 8),
    streakDays: Math.floor(Math.random() * 30),
    sentiment30d: 0.5 + Math.random() * 0.5,
  };

  const { healthScore, subMetrics, nextStep } = calculateHealthScore(person.circle, metrics);

  // Mock trend data for sparkline
  const trendData = Array.from({ length: 12 }, (_, i) => 
    Math.max(20, Math.min(100, healthScore + (Math.random() - 0.5) * 30))
  );

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'hsl(142, 76%, 36%)'; // green
    if (score >= 40) return 'hsl(48, 96%, 53%)'; // yellow
    return 'hsl(0, 84%, 60%)'; // red
  };

  const getScoreGradient = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-600';
    if (score >= 40) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-full sm:w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 transform transition-transform duration-300 ${
        person ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Relationship Health</h2>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPinned(!isPinned)}
              className="hover:bg-primary/10"
            >
              {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-primary/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Person Info */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-foreground">{person.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{person.circle}</p>
        </div>

        {/* Health Score Ring */}
        <Card className="p-6 bg-card/50 backdrop-blur">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative w-40 h-40">
              {/* Gradient Ring */}
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke={getScoreColor(healthScore)}
                  strokeWidth="12"
                  strokeDasharray={`${(healthScore / 100) * 440} 440`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                  style={{
                    filter: 'drop-shadow(0 0 8px currentColor)',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-4xl font-bold bg-gradient-to-br ${getScoreGradient(healthScore)} bg-clip-text text-transparent`}>
                    {Math.round(healthScore)}
                  </div>
                  <div className="text-xs text-muted-foreground">Health Score</div>
                </div>
              </div>
            </div>

            {/* Sparkline Trend */}
            <div className="w-full space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>12-month trend</span>
                <TrendingUp className="h-3 w-3" />
              </div>
              <div className="h-12 w-full">
                <svg className="w-full h-full" viewBox="0 0 240 48" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={getScoreColor(healthScore)}
                    strokeWidth="2"
                    points={trendData
                      .map((value, index) => `${(index / (trendData.length - 1)) * 240},${48 - (value / 100) * 48}`)
                      .join(' ')}
                  />
                  <polyline
                    fill={`url(#gradient-${person.id})`}
                    points={`0,48 ${trendData
                      .map((value, index) => `${(index / (trendData.length - 1)) * 240},${48 - (value / 100) * 48}`)
                      .join(' ')} 240,48`}
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient id={`gradient-${person.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor={getScoreColor(healthScore)} />
                      <stop offset="100%" stopColor={getScoreColor(healthScore)} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </Card>

        {/* Sub-Metrics */}
        <Card className="p-4 bg-card/50 backdrop-blur space-y-4">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Key Metrics
          </h4>
          
          {Object.entries(subMetrics).map(([key, metric]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-semibold text-foreground">{Math.round(metric.value)}/100</span>
              </div>
              <Progress value={metric.value} className="h-1.5" />
              <p className="text-xs text-muted-foreground italic">{metric.description}</p>
            </div>
          ))}
        </Card>

        {/* Next Step Suggestion */}
        <Card className={`p-4 bg-gradient-to-br ${getScoreGradient(healthScore)} bg-opacity-10 border-2`}>
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4" />
            Next Step
          </h4>
          <p className="text-sm text-foreground mb-4">{nextStep}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-3 w-3 mr-1" />
              Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageCircle className="h-3 w-3 mr-1" />
              Message
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Calendar className="h-3 w-3 mr-1" />
              Meet
            </Button>
          </div>
        </Card>

        {/* Interaction Stats */}
        <Card className="p-4 bg-card/50 backdrop-blur space-y-3">
          <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Recent Activity
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <div className="text-muted-foreground">Messages sent</div>
              <div className="text-lg font-bold text-foreground">{metrics.msgsSent30d}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Messages received</div>
              <div className="text-lg font-bold text-foreground">{metrics.msgsRecv30d}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Calls (30d)</div>
              <div className="text-lg font-bold text-foreground">{metrics.calls30d}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Call minutes</div>
              <div className="text-lg font-bold text-foreground">{metrics.callMinutes30d}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Meetings (30d)</div>
              <div className="text-lg font-bold text-foreground">{metrics.meetings30d}</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Streak days</div>
              <div className="text-lg font-bold text-foreground">{metrics.streakDays}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function calculateHealthScore(
  circle: string,
  metrics: HealthMetrics
): {
  healthScore: number;
  subMetrics: Record<string, { value: number; description: string }>;
  nextStep: string;
} {
  const now = Date.now();
  const daysSinceLastInteraction = metrics.lastInteractionAt
    ? (now - metrics.lastInteractionAt.getTime()) / (1000 * 60 * 60 * 24)
    : 30;

  // Normalize metrics to 0-100
  const recency = Math.max(0, 100 - daysSinceLastInteraction * 3.33); // 0 days = 100, 30 days = 0
  const frequency = Math.min(100, ((metrics.msgsSent30d || 0) + (metrics.msgsRecv30d || 0)) * 2);
  const reciprocity = (metrics.msgsSent30d && metrics.msgsRecv30d)
    ? Math.min(100, (Math.min(metrics.msgsSent30d, metrics.msgsRecv30d) / Math.max(metrics.msgsSent30d, metrics.msgsRecv30d)) * 100)
    : 50;
  const depth = Math.min(100, ((metrics.callMinutes30d || 0) / 2) + ((metrics.meetings30d || 0) * 10));
  const consistency = Math.min(100, (metrics.streakDays || 0) * 3.33);
  const responsiveness = Math.min(100, (metrics.msgsRecv30d || 0) * 2.5);
  const meetings = Math.min(100, (metrics.meetings30d || 0) * 12.5);

  let weights: Record<string, number>;
  let subMetrics: Record<string, { value: number; description: string }>;

  // Different weights by circle
  switch (circle) {
    case 'family':
      weights = {
        recency: 0.35,
        depth: 0.30,
        consistency: 0.25,
        frequency: 0.10,
      };
      subMetrics = {
        recency: { value: recency, description: `Last contact ${Math.round(daysSinceLastInteraction)} days ago` },
        depth: { value: depth, description: `${metrics.callMinutes30d || 0} call minutes this month` },
        consistency: { value: consistency, description: `${metrics.streakDays || 0}-day interaction streak` },
        frequency: { value: frequency, description: `${(metrics.msgsSent30d || 0) + (metrics.msgsRecv30d || 0)} messages exchanged` },
      };
      break;

    case 'friends':
      weights = {
        frequency: 0.35,
        reciprocity: 0.30,
        recency: 0.20,
        depth: 0.15,
      };
      subMetrics = {
        frequency: { value: frequency, description: `${(metrics.msgsSent30d || 0) + (metrics.msgsRecv30d || 0)} messages exchanged` },
        reciprocity: { value: reciprocity, description: 'Balanced back-and-forth communication' },
        recency: { value: recency, description: `Last contact ${Math.round(daysSinceLastInteraction)} days ago` },
        depth: { value: depth, description: `${metrics.callMinutes30d || 0} minutes in calls/meetings` },
      };
      break;

    case 'business':
      weights = {
        meetings: 0.35,
        responsiveness: 0.30,
        recency: 0.20,
        frequency: 0.15,
      };
      subMetrics = {
        meetings: { value: meetings, description: `${metrics.meetings30d || 0} meetings this month` },
        responsiveness: { value: responsiveness, description: 'Quick response rate' },
        recency: { value: recency, description: `Last contact ${Math.round(daysSinceLastInteraction)} days ago` },
        frequency: { value: frequency, description: `${(metrics.msgsSent30d || 0) + (metrics.msgsRecv30d || 0)} messages exchanged` },
      };
      break;

    default: // acquaintances, network, extended
      weights = {
        frequency: 0.40,
        recency: 0.35,
        reciprocity: 0.15,
        consistency: 0.10,
      };
      subMetrics = {
        frequency: { value: frequency, description: `${(metrics.msgsSent30d || 0) + (metrics.msgsRecv30d || 0)} messages exchanged` },
        recency: { value: recency, description: `Last contact ${Math.round(daysSinceLastInteraction)} days ago` },
        reciprocity: { value: reciprocity, description: 'Mutual engagement level' },
        consistency: { value: consistency, description: `${metrics.streakDays || 0}-day interaction streak` },
      };
  }

  // Calculate weighted score
  const healthScore = Object.entries(weights).reduce((sum, [key, weight]) => {
    const metricValue = key === 'recency' ? recency :
                       key === 'frequency' ? frequency :
                       key === 'reciprocity' ? reciprocity :
                       key === 'depth' ? depth :
                       key === 'consistency' ? consistency :
                       key === 'responsiveness' ? responsiveness :
                       key === 'meetings' ? meetings : 0;
    return sum + metricValue * weight;
  }, 0);

  // Generate next step suggestion
  let nextStep: string;
  if (daysSinceLastInteraction > 14) {
    nextStep = `It's been ${Math.round(daysSinceLastInteraction)} days—reach out today to reconnect!`;
  } else if (metrics.streakDays && metrics.streakDays > 0) {
    nextStep = `Keep your ${metrics.streakDays}-day streak alive! Send a quick message.`;
  } else if (circle === 'family' && (metrics.callMinutes30d || 0) < 60) {
    nextStep = 'Schedule a call this week to catch up properly.';
  } else if (circle === 'business' && (metrics.meetings30d || 0) === 0) {
    nextStep = 'Book a meeting to discuss ongoing projects.';
  } else if (reciprocity < 50) {
    nextStep = "They've been reaching out more—make sure to respond!";
  } else {
    nextStep = 'Relationship is healthy! Keep up the great communication.';
  }

  return { healthScore, subMetrics, nextStep };
}
