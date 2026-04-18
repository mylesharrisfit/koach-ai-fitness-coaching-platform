import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIERS, TIER_ORDER, FEATURE_INFO, getUserTier } from '@/lib/subscription';
import { Check, X, Zap, ArrowRight, Sparkles, TrendingUp, Trophy, ShoppingBag,
  ClipboardList, DollarSign, Globe, Smartphone, Users, Palette, Code } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const ICON_MAP = {
  TrendingUp, Trophy, ShoppingBag, ClipboardList, DollarSign, Globe,
  Smartphone, Users, Sparkles, Palette, Code, Zap,
};

// Key selling points shown per tier in the comparison table
const TIER_SELLING_POINTS = {
  starter: ['Up to 20 clients', 'Workout programs', 'Nutrition plans', 'Scheduling', 'Text messaging'],
  pro:     ['Up to 75 clients', 'Progress analytics', 'Check-in reviews', 'Adherence scoring', 'Analytics graphs', 'Voice & video messages', 'Client mobile dashboard'],
  elite:   ['Unlimited clients', 'Full AI assistant', 'AI calorie & progression', 'Auto progression rules', 'Sales pipeline CRM', 'Revenue dashboard', 'White-label branding', 'Community module'],
  enterprise: ['Unlimited clients', 'Multi-coach team accounts', 'Advanced analytics (LTV, churn)', 'Stripe & Sheets integrations', 'API access', 'Priority support'],
};

const YEARLY_DISCOUNT = 0.20; // 20% off yearly

export default function UpgradeModal({ open, onClose, featureKey, user, onUserUpdate }) {
  const [billing, setBilling] = useState('monthly');
  const [saving, setSaving] = useState(null);

  const featureInfo = FEATURE_INFO[featureKey] || {};
  const minTierKey = featureInfo.minTier || 'pro';
  const userTier = getUserTier(user);
  const currentTierIndex = TIER_ORDER.indexOf(userTier.key);
  const FeatureIcon = ICON_MAP[featureInfo.icon] || Zap;

  const getPrice = (tier) => {
    const base = tier.price;
    if (billing === 'yearly') return Math.round(base * (1 - YEARLY_DISCOUNT));
    return base;
  };

  const handleSelectTier = async (tierKey) => {
    if (tierKey === userTier.key) return;
    setSaving(tierKey);
    try {
      await base44.auth.updateMe({ subscription_tier: tierKey });
      const updated = await base44.auth.me();
      if (onUserUpdate) onUserUpdate(updated);
      const tier = TIERS[tierKey];
      const isUpgrade = TIER_ORDER.indexOf(tierKey) > currentTierIndex;
      toast.success(`${isUpgrade ? '🚀 Upgraded' : 'Switched'} to ${tier.name}!`, {
        description: isUpgrade ? 'New features are unlocked instantly.' : undefined,
      });
      onClose();
    } catch {
      toast.error('Failed to switch plan. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  // Recommended = 'elite' if user is pro or above, otherwise 'pro'
  const recommendedKey = currentTierIndex >= TIER_ORDER.indexOf('pro') ? 'elite' : 'pro';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/50" style={{ background: 'hsl(222 28% 7%)' }}>
        {/* Header */}
        <div className="relative p-6 pb-4 overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex items-center gap-4">
            {featureKey && (
              <div className="w-10 h-10 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0 glow-sm">
                <FeatureIcon className="w-5 h-5 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-heading font-bold">
                {featureInfo.name ? `Unlock ${featureInfo.name}` : 'Choose your plan'}
              </h2>
              {featureInfo.description && (
                <p className="text-sm text-muted-foreground mt-0.5">{featureInfo.description}</p>
              )}
            </div>
            {/* Billing toggle */}
            <div className="flex items-center gap-1 bg-secondary/40 rounded-lg p-1 text-xs font-semibold">
              <button
                onClick={() => setBilling('monthly')}
                className={cn('px-3 py-1.5 rounded-md transition-all', billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={cn('px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5', billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
              >
                Yearly
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans comparison grid */}
        <div className="p-6 overflow-x-auto">
          <div className="grid grid-cols-4 gap-3 min-w-[640px]">
            {TIER_ORDER.map(tierKey => {
              const tier = TIERS[tierKey];
              const isCurrent = userTier.key === tierKey;
              const isRecommended = tierKey === recommendedKey && !isCurrent;
              const tierIndex = TIER_ORDER.indexOf(tierKey);
              const isUpgrade = tierIndex > currentTierIndex;
              const isDowngrade = tierIndex < currentTierIndex;
              const price = getPrice(tier);

              return (
                <div key={tierKey} className={cn(
                  'relative rounded-xl border flex flex-col transition-all',
                  isCurrent      ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' :
                  isRecommended  ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20' :
                                   'border-border/40 bg-secondary/10 hover:border-border/70'
                )}>
                  {isRecommended && (
                    <div className="absolute -top-2.5 inset-x-0 flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-3 py-0.5 rounded-full">
                        Recommended
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-2.5 inset-x-0 flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-0.5 rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  <div className="p-4 pb-3 border-b border-border/20">
                    <p className={cn('font-heading font-bold text-sm mb-1', tier.color)}>{tier.name}</p>
                    <div className="flex items-end gap-1">
                      <span className="stat-number text-2xl font-heading font-bold">${price}</span>
                      <span className="text-xs text-muted-foreground mb-0.5">/mo</span>
                    </div>
                    {billing === 'yearly' && (
                      <p className="text-[10px] text-accent mt-0.5">Save ${Math.round((tier.price - price) * 12)}/yr</p>
                    )}
                  </div>

                  <div className="p-4 flex-1 space-y-1.5">
                    {TIER_SELLING_POINTS[tierKey].map(point => (
                      <div key={point} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-[11px] text-muted-foreground leading-tight">{point}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 pt-3">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      variant={isCurrent ? 'secondary' : isRecommended ? 'default' : 'outline'}
                      disabled={isCurrent || saving === tierKey}
                      onClick={() => handleSelectTier(tierKey)}
                    >
                      {saving === tierKey ? 'Switching...' :
                       isCurrent ? 'Current Plan' :
                       isUpgrade ? <><span>Upgrade to {tier.name}</span> <ArrowRight className="w-3 h-3" /></> :
                       `Switch to ${tier.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 pb-5">
          Changes take effect immediately · No setup fees · Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  );
}