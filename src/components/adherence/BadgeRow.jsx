import React from 'react';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
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
                <div
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold cursor-default"
                  style={{
                    background: `${tier.accent}18`,
                    color: tier.accent,
                    border: `1px solid ${tier.accent}40`,
                  }}
                >
                  <span>{cfg.emoji}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs font-medium">{cfg.desc}</p>
                <p className="text-[10px] opacity-60 mt-0.5">{tier.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        {overflow > 0 && (
          <span className="text-xs text-muted-foreground font-medium px-2 py-0.5 bg-[var(--kc-1f2937)] rounded-full border border-white/10">
            +{overflow} more
          </span>
        )}
        {onAdd && (
          <button
            onClick={onAdd}
            className="w-6 h-6 rounded-full border border-dashed border-foreground text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center text-sm font-bold"
          >
            +
          </button>
        )}
        {earnedKeys.length === 0 && (
          <span className="text-xs text-[var(--tc-muted-foreground)] italic">No achievements yet</span>
        )}
      </div>
    </TooltipProvider>
  );
}