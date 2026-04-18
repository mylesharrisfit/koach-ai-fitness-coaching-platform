import React from 'react';
import { getUserTier, getLimit } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export default function UsageMeter({ user, limitKey, currentCount, label, onUpgrade }) {
  const tier = getUserTier(user);
  const limit = getLimit(user, limitKey);

  if (limit === -1) return null; // Unlimited — hide meter

  const pct = Math.min((currentCount / limit) * 100, 100);
  const nearLimit = pct >= 80;
  const atLimit = currentCount >= limit;

  return (
    <div className={cn(
      "rounded-xl p-3 border text-xs transition-all",
      atLimit ? "border-destructive/30 bg-destructive/5" : nearLimit ? "border-chart-4/30 bg-chart-4/5" : "border-border/50 bg-secondary/20"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-muted-foreground">{label || limitKey}</span>
        <span className={cn("font-bold font-heading", atLimit ? "text-destructive" : nearLimit ? "text-chart-4" : "text-foreground")}>
          {currentCount} / {limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", atLimit ? "bg-destructive" : nearLimit ? "bg-chart-4" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(nearLimit || atLimit) && (
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <AlertTriangle className="w-3 h-3" />
            <span>{atLimit ? 'Limit reached' : `${Math.round(100 - pct)}% remaining`}</span>
          </div>
          {onUpgrade && (
            <button onClick={onUpgrade} className="text-primary font-semibold hover:underline">
              Upgrade →
            </button>
          )}
        </div>
      )}
    </div>
  );
}