import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TIERS, FEATURE_INFO } from '@/lib/subscription';

/**
 * Quiet inline upgrade prompt for a locked feature.
 * Usage: <InlineUpgradePrompt featureKey="analytics_graphs" onUpgrade={openUpgradeModal} />
 */
export default function InlineUpgradePrompt({ featureKey, onUpgrade, className, compact = false }) {
  const info = FEATURE_INFO[featureKey] || {};
  const tier = TIERS[info.minTier] || TIERS.pro;

  if (compact) {
    return (
      <button
        onClick={() => onUpgrade && onUpgrade(featureKey)}
        className={cn('text-[13px] font-semibold text-foreground underline underline-offset-4 decoration-1 hover:decoration-2', className)}
      >
        On {tier.name}. See plans
      </button>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-4 py-3 shadow-[0_0_0_1px_rgb(var(--border)/0.6)]', className)}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{info.name || 'Not on your plan'}</p>
        <p className="text-[13px] text-muted-foreground">{info.description || `Available on ${tier.name} and up.`}</p>
      </div>
      <Button size="sm" variant="outline" className="flex-shrink-0" onClick={() => onUpgrade && onUpgrade(featureKey)}>
        See {tier.name}
      </Button>
    </div>
  );
}
