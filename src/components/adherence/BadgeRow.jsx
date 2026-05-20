import React from 'react';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function BadgeRow({ earnedKeys = [], max = 5, onAdd }) {
  const visible = earnedKeys.slice(0, max);
  const overflow = earnedKeys.length - max;

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map(key => {
          const cfg = BADGE_CONFIG[key];
          if (!cfg) return null;
          const tier = TIER_STYLES[cfg.tier] || TIER_STYLES.bronze;
          return (
            <Tooltip key={key}>
              <TooltipTrigger asChild>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium cursor-default',
                  tier.bg, tier.border, tier.text
                )}>
                  <span>{cfg.emoji}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent><p className="text-xs">{cfg.desc}</p></TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <span className="text-xs text-[#6B7280] font-medium px-2 py-0.5 bg-[#F3F4F6] rounded-full border border-[#E5E7EB]">
            +{overflow} more
          </span>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-6 h-6 rounded-full border border-dashed border-[#D1D5DB] text-[#9CA3AF] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors flex items-center justify-center text-sm font-bold"
          >
            +
          </button>
        )}
        {earnedKeys.length === 0 && (
          <span className="text-xs text-[#9CA3AF] italic">No achievements yet — award their first badge!</span>
        )}
      </div>
    </TooltipProvider>
  );
}