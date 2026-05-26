import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { TIERS, TIER_ORDER, getUserTier, getLimit } from '@/lib/subscription';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import {
  Check, Zap, Users, Dumbbell, Salad, AlertTriangle,
  ExternalLink, RefreshCw, Calendar, CreditCard, CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import StripeUpgradeModal from '@/components/subscription/StripeUpgradeModal';

const BILLING_STATUS_CONFIG = {
  active:     { label: 'Active',      cls: 'bg-emerald-50 text-emerald-600 border-emerald-100',   icon: CheckCircle2 },
  trialing:   { label: 'Trial',       cls: 'bg-blue-50 text-blue-600 border-blue-100',            icon: Clock },
  past_due:   { label: 'Past Due',    cls: 'bg-amber-50 text-amber-600 border-amber-100',         icon: AlertTriangle },
  unpaid:     { label: 'Unpaid',      cls: 'bg-red-50 text-red-500 border-red-100',               icon: XCircle },
  incomplete: { label: 'Incomplete',  cls: 'bg-amber-50 text-amber-600 border-amber-100',         icon: Clock },
  canceled:   { label: 'Canceled',    cls: 'bg-[#F6F7FB] text-[#374151] border-[#E7EAF3]',       icon: XCircle },
};

const PLAN_PRICES = {
  starter: 29, pro: 79, elite: 149, enterprise: 299,
};

const TIER_HIGHLIGHTS = {
  starter:    ['Up to 20 clients', 'Workout program builder', 'Basic nutrition plans', 'Scheduling & calendar', 'In-app messaging', 'Client mobile app access', 'Basic progress tracking', 'Email support'],
  pro:        ['Up to 75 clients', 'Everything in Starter', 'Progress analytics & graphs', 'Check-in review system', 'Adherence scoring', 'Voice & video messages', 'Client mobile dashboard', 'AI reply suggestions', 'Custom branding (logo)', 'Priority email support'],
  elite:      ['Unlimited clients', 'Everything in Pro', 'Full AI assistant', 'Auto progression rules', 'Sales pipeline CRM', 'Revenue dashboard', 'White-label branding', 'Community module', 'Zapier integrations', 'Chat support'],
  enterprise: ['Unlimited clients', 'Everything in Elite', 'API access', 'Custom integrations', 'Dedicated account manager', 'Team accounts (multiple coaches)', 'Custom contract & invoicing', 'Priority phone support', 'Custom onboarding & training'],
};

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  // Refetch user after Stripe success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setTimeout(() => {
        base44.auth.me().then(u => { setUser(u); toast.success('Subscription updated!'); });
      }, 2000);
    }
  }, []);

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list() });
  const { data: programs = [] } = useQuery({ queryKey: ['programs'], queryFn: () => base44.entities.WorkoutProgram.list() });
  const { data: nutritionPlans = [] } = useQuery({ queryKey: ['nutrition-plans'], queryFn: () => base44.entities.NutritionPlan.list() });

  const userTier = getUserTier(user);
  const billingStatus = user?.billing_status || 'active';
  const billingCfg = BILLING_STATUS_CONFIG[billingStatus] || BILLING_STATUS_CONFIG.active;
  const BillingIcon = billingCfg.icon;
  const isPastDue = ['past_due', 'unpaid', 'incomplete'].includes(billingStatus);
  const isCanceled = billingStatus === 'canceled';
  const renewalDate = user?.subscription_renewal_date;
  const cancelAtEnd = user?.subscription_cancel_at_period_end;

  const usages = [
    { key: 'max_clients', label: 'Clients', icon: Users, current: clients.length },
    { key: 'max_programs', label: 'Programs', icon: Dumbbell, current: programs.length },
    { key: 'max_nutrition_plans', label: 'Nutrition Plans', icon: Salad, current: nutritionPlans.length },
  ];

  const handleOpenPortal = async () => {
    if (!user?.stripe_subscription_id && !user?.stripe_customer_id) {
      setUpgradeOpen(true);
      return;
    }
    setOpeningPortal(true);
    const res = await base44.functions.invoke('stripeCheckout', {
      action: 'portal',
      cancel_url: window.location.href,
    });
    setOpeningPortal(false);
    if (res.data?.url) {
      window.open(res.data.url, '_blank');
    } else {
      toast.error('Could not open billing portal');
    }
  };

  const refreshUser = async () => {
    const u = await base44.auth.me();
    setUser(u);
    toast.success('Subscription status refreshed');
  };

  return (
    <div className="p-8 lg:p-10 max-w-5xl mx-auto">
      <PageHeader
        title="Subscription"
        subtitle="Manage your KOACH AI plan and billing"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshUser}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Refresh
            </Button>
            {user?.stripe_subscription_id && (
              <Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={openingPortal}>
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                {openingPortal ? 'Opening...' : 'Billing Portal'}
              </Button>
            )}
          </div>
        }
      />

      {/* Past Due / Payment Issue Banner */}
      {isPastDue && (
        <div className="mb-6 flex items-start gap-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-700">Payment Issue — Action Required</p>
            <p className="text-xs text-[#374151] mt-0.5">
              Your last payment failed. Update your billing details to restore full access.
            </p>
          </div>
          <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold flex-shrink-0" onClick={handleOpenPortal}>
            Fix Payment
          </Button>
        </div>
      )}

      {/* Canceling Soon Banner */}
      {cancelAtEnd && !isCanceled && (
        <div className="mb-6 flex items-start gap-4 bg-[#F6F7FB] border border-[#E7EAF3] rounded-2xl p-4">
          <Clock className="w-5 h-5 text-[#374151] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#1F2A44]">Subscription Ending</p>
            <p className="text-xs text-[#374151] mt-0.5">
              Your {userTier.name} plan will end on {renewalDate || 'the renewal date'}. You'll be downgraded to Starter after that.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleOpenPortal} className="flex-shrink-0">Reactivate</Button>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6 mb-6 relative overflow-hidden shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className={cn('w-13 h-13 w-12 h-12 rounded-xl flex items-center justify-center ring-1', userTier.bgColor, userTier.borderColor)}>
              <Zap className={cn('w-6 h-6', userTier.color)} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#374151] mb-0.5">Current Plan</p>
              <h2 className="text-2xl font-heading font-bold text-[#1F2A44]">{userTier.name}</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border', billingCfg.cls)}>
                  <BillingIcon className="w-3 h-3" />{billingCfg.label}
                </span>
                {renewalDate && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#374151]">
                    <Calendar className="w-3 h-3" />
                    {cancelAtEnd ? 'Ends' : 'Renews'} {renewalDate}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-end gap-1">
              <span className="text-3xl font-heading font-bold stat-number">${PLAN_PRICES[userTier.key] ?? userTier.price}</span>
              <span className="text-[#374151] text-sm mb-0.5">/mo</span>
            </div>
            {user?.stripe_price_id && (
              <span className="text-[10px] text-[#374151]/60 font-mono">{user.stripe_price_id.slice(0, 24)}…</span>
            )}
          </div>
        </div>

        {/* Usage Meters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {usages.map(({ key, label, icon: Icon, current }) => {
            const limit = getLimit(user, key);
            const pct = limit === -1 ? 0 : Math.min((current / limit) * 100, 100);
            const atLimit = limit !== -1 && current >= limit;
            const nearLimit = limit !== -1 && pct >= 80;
            return (
              <div key={key} className="bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon className="w-4 h-4 text-[#374151]" />
                  <span className="text-xs font-semibold text-[#374151]">{label}</span>
                </div>
                <div className="flex items-end justify-between mb-2">
                  <span className={cn('stat-number text-2xl font-heading font-bold', atLimit && 'text-destructive', nearLimit && !atLimit && 'text-chart-4')}>
                    {current}
                  </span>
                  <span className="text-xs text-[#374151]">{limit === -1 ? '∞ unlimited' : `/ ${limit}`}</span>
                </div>
                {limit !== -1 && (
                  <div className="h-1.5 rounded-full bg-[#E7EAF3] overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-700', atLimit ? 'bg-destructive' : nearLimit ? 'bg-chart-4' : 'bg-primary')} style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Features + Upgrade CTA */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-bold text-base text-[#1F2A44]">What's included in {userTier.name}</h3>
          <Button onClick={() => setUpgradeOpen(true)} className="gap-2">
            <Zap className="w-4 h-4" /> Upgrade Plan
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(TIER_HIGHLIGHTS[userTier.key] || []).map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-[#374151]">
              <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />{f}
            </div>
          ))}
        </div>
      </div>

      {/* Stripe Billing Info */}
      {user?.stripe_customer_id && (
        <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EEF4FF] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1F2A44]">Billing managed by Stripe</p>
              <p className="text-xs text-[#374151]">Update payment method, download invoices, or cancel</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleOpenPortal} disabled={openingPortal}>
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            {openingPortal ? 'Opening...' : 'Manage Billing'}
          </Button>
        </div>
      )}

      <StripeUpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        user={user}
        onUserUpdate={setUser}
      />
    </div>
  );
}