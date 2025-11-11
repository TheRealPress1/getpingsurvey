import React, { useLayoutEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Briefcase } from "lucide-react";

export type Pinger = {
  name: string;
  city?: string;
  lat: number;
  lng: number;
  role?: string;
  bio?: string;
  avatarUrl?: string;
};

interface PingerOverlayProps {
  pinger: Pinger;
  position: { x: number; y: number };
  placement?: "top" | "right" | "left";
  containerSize?: { width: number; height: number };
  onClose: () => void;
  onPing: () => void;
}

const PingerOverlay: React.FC<PingerOverlayProps> = ({ 
  pinger, 
  position, 
  placement = "top", 
  containerSize, 
  onClose, 
  onPing 
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [overlaySize, setOverlaySize] = useState<{ width: number; height: number }>({ 
    width: 200, 
    height: 140 
  });

  useLayoutEffect(() => {
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setOverlaySize({ width: rect.width, height: rect.height });
    }
  }, [pinger, placement]);

  // Calculate position and placement
  const margin = 12;
  let x = position.x;
  let y = position.y;
  let finalPlacement: "top" | "right" | "left" = placement;

  // Simple positioning: always below the clicked sphere
  if (containerSize && overlaySize.height) {
    const halfW = overlaySize.width / 2;
    
    // Center horizontally, ensure it stays within bounds
    x = Math.max(margin + halfW, Math.min(containerSize.width - margin - halfW, x));
    
    // Position below the sphere with small offset
    y = y + 40;
    
    // If going off bottom, position above instead
    if (y + overlaySize.height + margin > containerSize.height) {
      y = position.y - 40;
    }
  }

  // Center horizontally
  const transform = "translate(-50%, 0)";

  return (
    <div
      ref={wrapperRef}
      className="absolute z-50"
      style={{ left: x, top: y, transform }}
    >
      <Card className="w-48 border-border bg-popover text-popover-foreground shadow-lg rounded-lg p-2 animate-enter">
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {pinger.avatarUrl ? (
              <img
                src={pinger.avatarUrl}
                alt={`${pinger.name} profile photo`}
                className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                loading="lazy"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs leading-tight truncate">{pinger.name}</h3>
              {pinger.role && (
                <p className="text-[10px] text-muted-foreground truncate">{pinger.role}</p>
              )}
            </div>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 -mt-1"
          >
            ×
          </button>
        </div>
        <Button onClick={onPing} size="sm" className="w-full text-xs h-7">
          ping!
        </Button>
      </Card>
    </div>
  );
};

export default PingerOverlay;