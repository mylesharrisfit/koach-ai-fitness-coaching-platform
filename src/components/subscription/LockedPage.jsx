import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIERS, FEATURE_INFO } from '@/lib/subscription';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LockedPage({ featureKey, onUpgrade }) {
  const info = FEATURE_INFO[featureKey] || {};
  const minTier = TIERS[info.minTier] || TIERS.pro;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-2xl bg-secondary/50 flex items-center justify-center ring-1 ring-border">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
      </div>

      <Badge className={cn("mb-3 text-xs border", minTier.badge)}>
        {minTier.name} Plan Required
      </Badge>

      <h2 className="text-2xl font-heading font-bold mb-2">{info.name || 'Premium Feature'}</h2>
      <p className="text-muted-foreground max-w-md leading-relaxed mb-6">
        {info.description || 'This feature is available on higher plans.'}
      </p>

      <Button onClick={() => onUpgrade?.(featureKey)} className="gap-2">
        Upgrade to {minTier.name} <ArrowRight className="w-4 h-4" />
      </Button>

      <p className="text-xs text-muted-foreground/50 mt-4">Starting at ${minTier.price}/month</p>
    </div>
  );
}