import React from 'react';
import { getUserTier } from '@/lib/subscription';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';

export default function TierBadge({ user, className }) {
  const tier = getUserTier(user);

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold",
      tier.badge,
      className
    )}>
      <Zap className="w-3 h-3" />
      {tier.name}
    </div>
  );
}