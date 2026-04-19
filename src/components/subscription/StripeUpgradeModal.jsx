import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TIERS, TIER_ORDER, getUserTier } from '@/lib/subscription';
import { Check, X, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const TIER_SELLING_POINTS = {
  starter:    ['Up to 20 clients', 'Workout programs', 'Nutrition plans', 'Scheduling', 'Text messaging'],
  pro:        ['Up to 75 clients', 'Progress analytics', 'Check-in reviews', 'Adherence scoring', 'Analytics graphs', 'Voice & video messages', 'Client mobile dashboard'],
  elite:      ['Unlimited clients', 'Full AI assistant', 'Auto progression rules', 'Sales pipeline CRM', 'Revenue dashboard', 'White-label branding', 'Community module'],
  enterprise: ['Unlimited clients', 'All Elite features', 'API access', 'Priority support'],
};

const YEARLY_DISCOUNT = 0.20;

export default function StripeUpgradeModal({ open, onClose, user, onUserUpdate }) {
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(null);

  const userTier = getUserTier(user);
  const currentTierIndex = TIER_ORDER.indexOf(userTier.key);
  const recommendedKey = currentTierIndex >= TIER_ORDER.indexOf('pro') ? 'elite' : 'pro';

  const getPrice = (tier) => {
    const base = tier.price;
    return billing === 'yearly' ? Math.round(base * (1 - YEARLY_DISCOUNT)) : base;
  };

  const handleSelectTier = async (tierKey) => {
    if (tierKey === userTier.key) return;
    setLoading(tierKey);

    const res = await base44.functions.invoke('stripeCheckout', {
      action: 'checkout',
      tier: tierKey,
      success_url: `${window.location.origin}/subscription?success=1`,
      cancel_url: `${window.location.origin}/subscription`,
    });

    setLoading(null);

    if (res.data?.url) {
      // New checkout session — redirect
      window.location.href = res.data.url;
    } else if (res.data?.upgraded) {
      // Inline upgrade (existing subscription)
      const updated = await base44.auth.me();
      if (onUserUpdate) onUserUpdate(updated);
      toast.success(`Upgraded to ${TIERS[tierKey].name}!`);
      onClose();
    } else {
      toast.error(res.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border/50" style={{ background: 'hsl(222 28% 7%)' }}>
        {/* Header */}
        <div className="relative p-6 pb-4 overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex items-center justify-between gap-4 pr-10">
            <div>
              <h2 className="text-xl font-heading font-bold">Choose your plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Billed via Stripe · Cancel anytime · No setup fees</p>
            </div>
            <div className="flex items-center gap-1 bg-secondary/40 rounded-lg p-1 text-xs font-semibold">
              <button onClick={() => setBilling('monthly')} className={cn('px-3 py-1.5 rounded-md transition-all', billing === 'monthly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                Monthly
              </button>
              <button onClick={() => setBilling('yearly')} className={cn('px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5', billing === 'yearly' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
                Yearly <span className="text-[10px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="p-6 overflow-x-auto">
          <div className="grid grid-cols-4 gap-3 min-w-[640px]">
            {TIER_ORDER.map(tierKey => {
              const tier = TIERS[tierKey];
              const isCurrent = userTier.key === tierKey;
              const isRecommended = tierKey === recommendedKey && !isCurrent;
              const isUpgrade = TIER_ORDER.indexOf(tierKey) > currentTierIndex;
              const price = getPrice(tier);

              return (
                <div key={tierKey} className={cn(
                  'relative rounded-xl border flex flex-col transition-all',
                  isCurrent     ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' :
                  isRecommended ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20' :
                                  'border-border/40 bg-secondary/10 hover:border-border/70'
                )}>
                  {isRecommended && (
                    <div className="absolute -top-2.5 inset-x-0 flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-3 py-0.5 rounded-full">Recommended</span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-2.5 inset-x-0 flex justify-center">
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-0.5 rounded-full">Current Plan</span>
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
                      disabled={isCurrent || loading === tierKey}
                      onClick={() => handleSelectTier(tierKey)}
                    >
                      {loading === tierKey ? 'Loading...' :
                       isCurrent ? 'Current Plan' :
                       isUpgrade ? <><span>Upgrade to {tier.name}</span><ArrowRight className="w-3 h-3 ml-1" /></> :
                       `Switch to ${tier.name}`}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/40 pb-5">
          Payments securely processed by Stripe · Upgrades take effect immediately · Downgrades at period end
        </p>
      </DialogContent>
    </Dialog>
  );
}