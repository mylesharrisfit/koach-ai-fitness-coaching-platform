import React, { useState } from 'react';
import { X, Users, TrendingUp, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dismissNudge } from '@/lib/upgradeNudges';

const ICON_MAP = { Users, TrendingUp, Sparkles, Zap };

const COLOR_STYLES = {
  amber: {
    wrapper: 'bg-warning/8 border-warning/25',
    icon: 'bg-warning/15 text-warning',
    cta: 'bg-warning hover:bg-warning text-white',
    title: 'text-warning dark:text-warning',
  },
  blue: {
    wrapper: 'bg-primary/8 border-primary/25',
    icon: 'bg-primary/15 text-primary',
    cta: '',   // use default button
    title: 'text-primary',
  },
  purple: {
    wrapper: 'bg-ai/8 border-ai/25',
    icon: 'bg-ai/15 text-ai',
    cta: 'bg-ai hover:bg-ai text-ai-foreground',
    title: 'text-ai dark:text-ai',
  },
};

export default function BehaviorNudge({ nudge, onUpgrade, className }) {
  const [dismissed, setDismissed] = useState(false);

  if (!nudge || dismissed) return null;

  const Icon = ICON_MAP[nudge.icon] || Zap;
  const colors = COLOR_STYLES[nudge.color] || COLOR_STYLES.blue;

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
      'relative flex items-start gap-3 rounded-xl border px-4 py-3.5 transition-all',
      colors.wrapper,
      className
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', colors.icon)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-xs font-bold mb-0.5', colors.title)}>{nudge.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{nudge.message}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
        <Button
          size="sm"
          className={cn('h-7 text-xs px-3', colors.cta || '')}
          variant={colors.cta ? 'default' : 'default'}
          onClick={handleUpgrade}
        >
          <Zap className="w-3 h-3 mr-1" />
          {nudge.cta}
        </Button>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}