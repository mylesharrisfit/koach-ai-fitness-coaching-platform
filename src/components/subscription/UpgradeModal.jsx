import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TIERS, TIER_ORDER, FEATURE_INFO, getUserTier } from '@/lib/subscription';
import { Check, Sparkles, TrendingUp, Trophy, ShoppingBag, ClipboardList, DollarSign, Globe, Smartphone, Users, Palette, Code, Zap, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  TrendingUp, Trophy, ShoppingBag, ClipboardList, DollarSign, Globe, Smartphone, Users, Sparkles, Palette, Code, Zap
};

export default function UpgradeModal({ open, onClose, featureKey, user }) {
  const featureInfo = FEATURE_INFO[featureKey] || {};
  const minTierKey = featureInfo.minTier || 'pro';
  const userTier = getUserTier(user);
  const currentTierIndex = TIER_ORDER.indexOf(userTier.key);

  // Show tiers from minTier upward
  const upgradeTiers = TIER_ORDER
    .slice(TIER_ORDER.indexOf(minTierKey))
    .map(k => TIERS[k]);

  const FeatureIcon = ICON_MAP[featureInfo.icon] || Zap;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-border/50 bg-card" style={{ background: 'hsl(222 28% 7%)' }}>
        {/* Header */}
        <div className="relative p-8 pb-6 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-mesh opacity-60" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10">
            <X className="w-4 h-4" />
          </button>
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 ring-1 ring-primary/30 flex items-center justify-center flex-shrink-0 glow-sm">
              <FeatureIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Premium Feature</span>
                <Badge className={cn("text-[10px] border", TIERS[minTierKey]?.badge)}>
                  {TIERS[minTierKey]?.name}+
                </Badge>
              </div>
              <h2 className="text-xl font-heading font-bold">{featureInfo.name || 'Premium Feature'}</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{featureInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <div className="px-8 pb-8">
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest mb-4">Upgrade to unlock</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${upgradeTiers.length}, 1fr)` }}>
            {upgradeTiers.map(tier => (
              <div key={tier.key} className={cn(
                "relative rounded-xl p-4 border transition-all",
                tier.popular
                  ? "border-primary/40 bg-primary/8 ring-1 ring-primary/20"
                  : "border-border/50 bg-secondary/20"
              )}>
                {tier.popular && (
                  <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="mb-3">
                  <p className={cn("font-heading font-bold text-sm", tier.color)}>{tier.name}</p>
                  <p className="text-2xl font-heading font-bold mt-1">
                    ${tier.price}<span className="text-xs text-muted-foreground font-normal">/mo</span>
                  </p>
                </div>
                <div className="space-y-1.5 mb-4">
                  {Object.entries(tier.features)
                    .filter(([, v]) => v)
                    .slice(0, 5)
                    .map(([k]) => (
                      <div key={k} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-accent flex-shrink-0" />
                        <span className="text-[11px] text-muted-foreground capitalize">{k.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  {tier.limits.max_clients !== -1
                    ? <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent flex-shrink-0" /><span className="text-[11px] text-muted-foreground">Up to {tier.limits.max_clients} clients</span></div>
                    : <div className="flex items-center gap-1.5"><Check className="w-3 h-3 text-accent flex-shrink-0" /><span className="text-[11px] text-muted-foreground">Unlimited clients</span></div>
                  }
                </div>
                <Button
                  size="sm"
                  className={cn("w-full text-xs", tier.popular ? "" : "variant-outline")}
                  variant={tier.popular ? "default" : "outline"}
                  onClick={onClose}
                >
                  Choose {tier.name} <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground/50 mt-4">
            Contact us to upgrade your plan · No setup fees · Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}