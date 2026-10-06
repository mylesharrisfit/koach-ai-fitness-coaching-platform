import React from 'react';
import { getLimit } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { Meter } from '@/components/business/ui';

/** "38 of 75 clients used" with a thin ink bar. */
export default function UsageMeter({ user, limitKey, currentCount, label, onUpgrade }) {
  const limit = getLimit(user, limitKey);
  if (limit === -1) return null; // Unlimited, hide meter

  const pct = Math.min((currentCount / limit) * 100, 100);
  const atLimit = pct >= 100;
  const nearLimit = pct >= 75;

  return (
    <div className="text-[13px]">
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-muted-foreground">{currentCount} of {limit} {label || limitKey} used</span>
        {(nearLimit || atLimit) && onUpgrade && (
          <button onClick={onUpgrade} className="font-semibold text-foreground underline underline-offset-4 decoration-1 hover:decoration-2">
            See plans
          </button>
        )}
      </div>
      <Meter value={currentCount} max={limit} tone={atLimit ? 'danger' : nearLimit ? 'warning' : 'ink'} />
      {atLimit && <p className={cn('mt-1.5 text-destructive font-medium')}>Limit reached</p>}
    </div>
  );
}
