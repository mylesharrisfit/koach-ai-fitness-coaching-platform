import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dismissNudge } from '@/lib/upgradeNudges';

export default function BehaviorNudge({ nudge, onUpgrade, className }) {
  const [dismissed, setDismissed] = useState(false);

  if (!nudge || dismissed) return null;


  const handleDismiss = () => {
    dismissNudge(nudge.id);
    setDismissed(true);
  };

  const handleUpgrade = () => {
    onUpgrade && onUpgrade(nudge.featureKey);
    dismissNudge(nudge.id);
    setDismissed(true);
  };

  return (
    <div className={cn(
      'flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-card px-4 py-3 shadow-[0_0_0_1px_rgb(var(--border)/0.6)]',
      className
    )}>
      <div className="flex-1 min-w-[200px]">
        <p className="text-sm font-semibold text-foreground">{nudge.title}</p>
        <p className="text-[13px] text-muted-foreground leading-relaxed">{nudge.message}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button size="sm" variant="outline" onClick={handleUpgrade}>{nudge.cta}</Button>
        <button
          onClick={handleDismiss}
          className="touch-compact p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
