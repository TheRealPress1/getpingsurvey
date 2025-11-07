import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CircleStrengthTrackerProps {
  people: any[];
  personHealth: Record<string, number>;
  isDemoMode: boolean;
}

export const CircleStrengthTracker = ({ people, personHealth, isDemoMode }: CircleStrengthTrackerProps) => {
  const stats = useMemo(() => {
    if (people.length === 0) {
      return {
        overallScore: 0,
        label: 'No Data',
        labelColor: 'text-muted-foreground',
        strong: 0,
        moderate: 0,
        atRisk: 0,
        inactive: 0,
        trend: 0,
      };
    }

    // Circle weights
    const circleWeights: Record<string, number> = {
      family: 2.0,
      friends: 2.0,
      business: 2.0,
      acquaintances: 1.0,
      network: 1.0,
      extended: 0.5,
    };

    let totalWeightedScore = 0;
    let totalWeight = 0;
    let strong = 0;
    let moderate = 0;
    let atRisk = 0;
    let inactive = 0;

    people.forEach(person => {
      const score = personHealth[person.id] || 70;
      const weight = circleWeights[person.circle] || 1.0;
      
      totalWeightedScore += score * weight;
      totalWeight += weight;

      // Categorize
      if (score >= 70) strong++;
      else if (score >= 40) moderate++;
      else if (score >= 20) atRisk++;
      else inactive++;
    });

    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    // Determine label
    let label = 'Critical';
    let labelColor = 'text-red-500';
    
    if (overallScore >= 80) {
      label = 'Thriving';
      labelColor = 'text-primary';
    } else if (overallScore >= 60) {
      label = 'Strong';
      labelColor = 'text-green-400';
    } else if (overallScore >= 40) {
      label = 'Stable';
      labelColor = 'text-yellow-400';
    } else if (overallScore >= 20) {
      label = 'At Risk';
      labelColor = 'text-orange-500';
    }

    // Mock trend (in real app, would compare to previous snapshot)
    const trend = isDemoMode ? 4.2 : Math.random() > 0.5 ? Math.random() * 10 : -Math.random() * 5;

    return {
      overallScore,
      label,
      labelColor,
      strong,
      moderate,
      atRisk,
      inactive,
      trend,
    };
  }, [people, personHealth, isDemoMode]);

  return (
    <Card className="bg-black/80 backdrop-blur border-primary/30 p-4 w-80 shadow-xl">
      <div className="space-y-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Circle Strength
        </h3>

        {/* Main Score */}
        <div className="flex items-baseline gap-2">
          <div className="text-5xl font-bold text-primary">
            {stats.overallScore}
          </div>
          <div className="text-muted-foreground text-sm">/100</div>
        </div>

        {/* Label */}
        <div className={`text-lg font-semibold ${stats.labelColor}`}>
          {stats.label}
        </div>

        {/* Trend */}
        <div className="flex items-center gap-2 text-sm">
          {stats.trend >= 0 ? (
            <>
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-green-400">+{stats.trend.toFixed(1)}% vs last week</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-red-400">{stats.trend.toFixed(1)}% vs last week</span>
            </>
          )}
        </div>

        {/* Distribution Bar */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Connection Health Distribution</div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-card">
            {stats.strong > 0 && (
              <div 
                className="bg-green-500" 
                style={{ width: `${(stats.strong / people.length) * 100}%` }}
              />
            )}
            {stats.moderate > 0 && (
              <div 
                className="bg-yellow-500" 
                style={{ width: `${(stats.moderate / people.length) * 100}%` }}
              />
            )}
            {stats.atRisk > 0 && (
              <div 
                className="bg-orange-500" 
                style={{ width: `${(stats.atRisk / people.length) * 100}%` }}
              />
            )}
            {stats.inactive > 0 && (
              <div 
                className="bg-red-500" 
                style={{ width: `${(stats.inactive / people.length) * 100}%` }}
              />
            )}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Strong: {stats.strong}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Moderate: {stats.moderate}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-muted-foreground">At Risk: {stats.atRisk}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-muted-foreground">Inactive: {stats.inactive}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
