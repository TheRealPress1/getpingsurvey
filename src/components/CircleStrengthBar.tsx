import { useMemo } from 'react';

interface CircleStrengthBarProps {
  people: any[];
  personHealth: Record<string, number>;
}

export const CircleStrengthBar = ({ people, personHealth }: CircleStrengthBarProps) => {
  const overallScore = useMemo(() => {
    if (people.length === 0) return 0;
    
    const totalScore = people.reduce((sum, person) => {
      return sum + (personHealth[person.id] || 70);
    }, 0);
    
    return Math.round(totalScore / people.length);
  }, [people, personHealth]);

  const percentage = overallScore;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Iridescent Shimmering Text - Green to Pink */}
      <div className="relative text-2xl uppercase tracking-wider font-bold">
        <div 
          className="iridescent-text shimmer"
          style={{
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
          }}
        >
          how strong is your circle?
        </div>
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-sm opacity-50"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, rgba(255, 192, 203, 0.9) 50%, hsl(var(--primary)) 100%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          how strong is your circle?
        </div>
      </div>
      
      {/* Glowing Bar - Green to Pink Gradient */}
      <div className="relative w-80 h-3 bg-black/50 rounded-full overflow-hidden border border-primary/30">
        {/* Glow Effect Layer */}
        <div 
          className="absolute inset-0 blur-md"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, rgba(0, 255, 102, 0) 0%, rgba(0, 255, 102, 0.6) 25%, rgba(255, 192, 203, 0.6) 75%, rgba(255, 192, 203, 0) 100%)',
          }}
        />
        
        {/* Bar Fill with Green-Pink Gradient */}
        <div 
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{ 
            width: `${percentage}%`,
            background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, rgba(255, 192, 203, 0.9) 50%, hsl(var(--primary)) 100%)',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s ease-in-out infinite',
            boxShadow: '0 0 30px rgba(0, 255, 102, 0.6), 0 0 20px rgba(255, 192, 203, 0.4)',
          }}
        />
        
        {/* Additional Shimmer */}
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          style={{ 
            width: `${percentage}%`,
            animation: 'slide 2s ease-in-out infinite',
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes slide {
          0%, 100% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};
