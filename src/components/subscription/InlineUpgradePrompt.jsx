import React from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TIERS, FEATURE_INFO } from '@/lib/subscription';

/**
 * Subtle inline upgrade prompt — drop anywhere a feature is locked.
 * Usage: <InlineUpgradePrompt featureKey="analytics_graphs" onUpgrade={openUpgradeModal} />
 */
export default function InlineUpgradePrompt({ featureKey, onUpgrade, className, compact = false }) {
  const info = FEATURE_INFO[featureKey] || {};
  const tier = TIERS[info.minTier] || TIERS.pro;

  if (compact) {
    return (
      <button
        onClick={() => onUpgrade && onUpgrade(featureKey)}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors',
          className
        )}
      >
        <Zap className="w-3 h-3" />
        Upgrade to {tier.name}
      </button>
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3',
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">{info.name || 'Premium Feature'}</p>
          <p className="text-[11px] text-muted-foreground">{info.description || `Available on ${tier.name}+`}</p>
        </div>
      </div>
      <Button size="sm" className="text-xs flex-shrink-0" onClick={() => onUpgrade && onUpgrade(featureKey)}>
        <Zap className="w-3 h-3 mr-1" /> Upgrade
      </Button>
    </div>
  );
}