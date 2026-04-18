import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TIERS, TIER_ORDER, getUserTier, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { Check, X, Zap, ArrowRight, Users, Dumbbell, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// Human-readable highlight features per tier (ordered for the card)
const TIER_HIGHLIGHTS = {
  starter: [
    'Up to 20 clients',
    'Client management',
    'Programs & nutrition builder',
    'Scheduling & calendar',
    'Text messaging',
  ],
  pro: [
    'Up to 75 clients',
    'Weekly check-in system',
    'Coach check-in review dashboard',
    'Adherence scoring (training, nutrition, sleep)',
    'Analytics graphs (weight, body fat, trends)',
    'Program templates & duplication',
    'Basic notifications (missed workouts, low compliance)',
    'Voice & video messaging',
    'Client mobile dashboard',
  ],
  elite: [
    'Up to 200 clients',
    'All Pro features',
    'Digital store',
    'Sales & revenue CRM pipeline',
    'Community module',
    'Advanced AI coach assistant',
    'AI message suggestions',
    'Custom branding',
  ],
  enterprise: [
    'Unlimited clients',
    'All Elite features',
    'API access',
    'Priority support',
  ],
};

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });
  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list(),
  });
  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
  });

  const userTier = getUserTier(user);

  // Admin-only: simulate switching tiers for demo purposes
  const handleSelectTier = async (tierKey) => {
    if (user?.role !== 'admin') return;
    setSaving(tierKey);
    await base44.auth.updateMe({ subscription_tier: tierKey });
    const updated = await base44.auth.me();
    setUser(updated);
    setSaving(null);
    toast.success(`Switched to ${TIERS[tierKey].name} plan`);
    setTimeout(() => window.location.reload(), 800);
  };

  const usages = [
    { key: 'max_clients', label: 'Clients', icon: Users, current: clients.length },
    { key: 'max_programs', label: 'Programs', icon: Dumbbell, current: programs.length },
    { key: 'max_nutrition_plans', label: 'Nutrition Plans', icon: Salad, current: nutritionPlans.length },
  ];

  return (
    <div className="p-8 lg:p-10 max-w-6xl mx-auto">
      <PageHeader
        title="Subscription"
        subtitle="Manage your FitForge plan and usage"
      />

      {/* Current Plan Summary */}
      <div className="glass-card rounded-2xl p-6 mb-8 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center ring-1", userTier.bgColor, userTier.borderColor)}>
              <Zap className={cn("w-6 h-6", userTier.color)} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">Current Plan</p>
              <h2 className="text-2xl font-heading font-bold">{userTier.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-heading font-bold">${userTier.price}</span>
            <span className="text-muted-foreground text-sm">/month</span>
          </div>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {usages.map(({ key, label, icon: Icon, current }) => {
            const limit = getLimit(user, key);
            const pct = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
            const atLimit = limit !== -1 && current >= limit;
            const nearLimit = limit !== -1 && pct >= 80;
            return (
              <div key={key} className="bg-secondary/30 rounded-xl p-4 border border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={cn("stat-number text-2xl font-heading font-bold", atLimit && "text-destructive", nearLimit && !atLimit && "text-chart-4")}>
                    {current}
                  </span>
                  <span className="text-xs text-muted-foreground">{limit === -1 ? '∞' : `/ ${limit}`}</span>
                </div>
                {limit !== -1 && (
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all duration-700", atLimit ? "bg-destructive" : nearLimit ? "bg-chart-4" : "bg-primary")} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {TIER_ORDER.map(tierKey => {
          const tier = TIERS[tierKey];
          const isCurrent = userTier.key === tierKey;
          return (
            <div key={tierKey} className={cn(
              "relative glass-card rounded-2xl p-6 flex flex-col transition-all duration-300",
              isCurrent ? "ring-2 ring-primary/40 shadow-glow-sm" : "hover:border-primary/20",
              tier.popular && !isCurrent && "border-primary/25"
            )}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest bg-primary text-primary-foreground px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4 text-[9px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-3 py-1 rounded-full">
                  Current
                </div>
              )}

              <div className="mb-4">
                <p className={cn("font-heading font-bold text-lg", tier.color)}>{tier.name}</p>
                <div className="flex items-end gap-1 mt-2">
                  <span className="stat-number text-3xl font-heading font-bold">${tier.price}</span>
                  <span className="text-xs text-muted-foreground mb-1">/mo</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {(TIER_HIGHLIGHTS[tierKey] || []).map(feature => (
                  <div key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3 h-3 text-accent flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                {/* Explicitly show what's locked on lower tiers */}
                {tierKey === 'starter' && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground/40 mt-2">
                    <X className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>Analytics, check-ins, templates, notifications</span>
                  </div>
                )}
                {tierKey === 'pro' && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground/40 mt-2">
                    <X className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span>Advanced AI, sales pipeline, community</span>
                  </div>
                )}
              </div>

              {user?.role === 'admin' ? (
                <Button
                  size="sm"
                  variant={isCurrent ? "secondary" : "default"}
                  disabled={isCurrent || saving === tierKey}
                  onClick={() => handleSelectTier(tierKey)}
                  className="w-full"
                >
                  {isCurrent ? 'Current Plan' : saving === tierKey ? 'Switching...' : (
                    <>{`Switch to ${tier.name}`} <ArrowRight className="w-3 h-3 ml-1" /></>
                  )}
                </Button>
              ) : (
                <Button size="sm" variant={isCurrent ? "secondary" : "default"} disabled={isCurrent} className="w-full">
                  {isCurrent ? 'Current Plan' : `Upgrade to ${tier.name}`}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {user?.role === 'admin' && (
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Admin mode: switching tiers immediately for demo purposes.
        </p>
      )}
    </div>
  );
}