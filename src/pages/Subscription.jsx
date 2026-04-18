import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TIERS, TIER_ORDER, getUserTier, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { Check, X, Zap, ArrowRight, Users, Dumbbell, Salad } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import UpgradeModal from '@/components/subscription/UpgradeModal';

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
    'Unlimited clients',
    'All Pro features',
    'Full AI assistant (calorie, progression, check-in responses)',
    'Auto progression rules for workouts',
    'Trigger-based notifications',
    'Sales pipeline (lead → booked → closed)',
    'Revenue dashboard (MRR, active clients)',
    'White-label branding (logo & colors)',
    'Digital store',
    'Community module',
    'Voice & video messaging',
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
  const [upgradeOpen, setUpgradeOpen] = useState(false);

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

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
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

      {/* Plan overview + CTA */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-base">Plan Features</h3>
          <Button onClick={() => setUpgradeOpen(true)} className="gap-2">
            <Zap className="w-4 h-4" /> Change Plan
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(TIER_HIGHLIGHTS[userTier.key] || []).map(feature => (
            <div key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        featureKey={null}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  );
}