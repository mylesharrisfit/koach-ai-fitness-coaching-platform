import React from 'react';
import { BADGE_CONFIG } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function BadgeRow({ earnedKeys = [], max = 6 }) {
  if (!earnedKeys.length) return null;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {earnedKeys.slice(0, max).map(key => {
          const cfg = BADGE_CONFIG[key];
          if (!cfg) return null;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium cursor-default', cfg.bg, cfg.color)}>
                  <span>{cfg.emoji}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{cfg.desc}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}