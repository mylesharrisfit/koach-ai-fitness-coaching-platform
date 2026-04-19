import React from 'react';
import { Lock } from 'lucide-react';
import { hasFeature, FEATURE_INFO, TIERS } from '@/lib/subscription';
import { useUpgradeModal } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

/**
 * FeatureLock — wraps any UI section and shows a blurred lock overlay
 * when the user's tier doesn't include the feature.
 *
 * Usage:
 *   <FeatureLock feature="ai_suggestions">
 *     <MySectionComponent />
 *   </FeatureLock>
 */
export default function FeatureLock({ feature, children, className }) {
  const { user, openUpgradeModal } = useUpgradeModal();

  // While user is loading, render children normally (avoids flash)
  if (user === null) return <div className={className}>{children}</div>;

  const locked = !hasFeature(user, feature);
  if (!locked) return <div className={className}>{children}</div>;

  const info = FEATURE_INFO[feature];
  const minTierKey = info?.minTier || 'pro';
  const tierConfig = TIERS[minTierKey];

  return (
    <div className={cn('relative', className)}>
      {/* Blurred children */}
      <div className="pointer-events-none select-none blur-sm opacity-60 saturate-50">
        {children}
      </div>

      {/* Lock overlay */}
      <button
        onClick={() => openUpgradeModal(feature)}
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl z-10 group"
        aria-label={`Unlock ${info?.name || feature}`}
      >
        {/* Glassmorphic backdrop */}
        <div className="absolute inset-0 rounded-xl bg-background/60 backdrop-blur-[2px]" />

        {/* Lock card */}
        <div className="relative flex flex-col items-center gap-2 px-5 py-4 rounded-2xl glass-card border border-border/80 shadow-lg group-hover:border-primary/40 transition-all duration-200 group-hover:shadow-glow-sm max-w-[240px] text-center">
          {/* Tier badge */}
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border',
            tierConfig?.badge || 'bg-primary/15 text-primary border-primary/20'
          )}>
            {tierConfig?.name || minTierKey} Feature
          </span>

          {/* Lock icon */}
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            tierConfig?.bgColor || 'bg-primary/10'
          )}>
            <Lock className={cn('w-5 h-5', tierConfig?.color || 'text-primary')} />
          </div>

          {/* Feature name */}
          <div>
            <p className="text-sm font-semibold font-heading leading-tight">
              {info?.name || feature}
            </p>
            {info?.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {info.description}
              </p>
            )}
          </div>

          {/* CTA */}
          <span className={cn(
            'text-xs font-bold px-3 py-1 rounded-lg transition-colors',
            'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
          )}>
            Upgrade to {tierConfig?.name || minTierKey} →
          </span>
        </div>
      </button>
    </div>
  );
}