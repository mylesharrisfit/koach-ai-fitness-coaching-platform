import React, { useState } from 'react';
import { AlertTriangle, Lock, X, TrendingUp } from 'lucide-react';
import { getLimit } from '@/lib/subscription';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * LimitBanner — shows a soft warning at 75%+ usage, hard block at 100%.
 * The soft warning is session-dismissable (won't re-appear until page reload).
 * The hard block cannot be dismissed.
 *
 * Usage:
 *   <LimitBanner limitKey="max_clients" currentCount={clients.length} label="clients" featureKey="clients" />
 */
export default function LimitBanner({ limitKey, currentCount, label, featureKey, className }) {
  const { user, openUpgradeModal } = useUpgradeModal();
  const [dismissed, setDismissed] = useState(false);

  const limit = getLimit(user, limitKey);
  if (limit === -1 || !user) return null;

  const pct = (currentCount / limit) * 100;
  const atLimit = currentCount >= limit;
  const nearLimit = !atLimit && pct >= 75;

  if (!atLimit && !nearLimit) return null;
  if (nearLimit && dismissed) return null;

  const remaining = limit - currentCount;

  if (atLimit) {
    return (
      <div className={cn(
        'flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm',
        className
      )}>
        <div className="flex items-center gap-2 text-destructive">
          <Lock className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">
            You've reached your {limit}-{label} limit. Upgrade to add more.
          </span>
        </div>
        <Button size="sm" onClick={() => openUpgradeModal(featureKey || limitKey)} className="flex-shrink-0">
          Upgrade Plan
        </Button>
      </div>
    );
  }

  // Near-limit warning (75–99%)
  return (
    <div className={cn(
      'flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm',
      className
    )}>
      <div className="flex items-center gap-2 text-warning dark:text-warning">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium">
          {remaining === 1
            ? `Only 1 ${label.replace(/s$/, '')} slot remaining — you're almost at your ${limit}-${label} limit.`
            : `${remaining} ${label} remaining on your plan (${Math.round(pct)}% full).`}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => openUpgradeModal(featureKey || limitKey)}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <TrendingUp className="w-3.5 h-3.5" /> Upgrade
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}