import React, { useState } from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TIERS, TIER_ORDER, getUserTier } from '@/lib/subscription';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PLAN_PRICES = {
  starter:    { monthly: 29,  annual: 23,  annualSave: 72 },
  pro:        { monthly: 79,  annual: 63,  annualSave: 192 },
  elite:      { monthly: 149, annual: 119, annualSave: 360 },
  enterprise: { monthly: 299, annual: 239, annualSave: 720 },
};

const CLIENT_LIMIT = {
  starter: 'Up to 20 clients',
  pro: 'Up to 75 clients',
  elite: 'Unlimited clients',
  enterprise: 'Unlimited clients',
};

const TIER_FEATURES = {
  starter: {
    inherited: [],
    unique: [
      'Workout program builder',
      'Basic nutrition plans',
      'Scheduling & calendar',
      'In-app messaging',
      'Client mobile app access',
      'Basic progress tracking',
      'Email support',
    ],
  },
  pro: {
    inherited: ['Everything in Starter'],
    unique: [
      'Progress analytics & graphs',
      'Check-in review system',
      'Adherence scoring',
      'Voice & video messages',
      'Client mobile dashboard',
      'AI reply suggestions',
      'Custom branding (logo)',
      'Priority email support',
    ],
  },
  elite: {
    inherited: ['Everything in Pro'],
    unique: [
      'Full AI assistant (program + meal plans)',
      'Auto progression rules',
      'Sales pipeline CRM',
      'Revenue dashboard',
      'White-label branding',
      'Community module',
      'Zapier integrations',
      'Chat support',
    ],
  },
  enterprise: {
    inherited: ['Everything in Elite'],
    unique: [
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'Team accounts (multiple coaches)',
      'Custom contract & invoicing',
      'Priority phone support',
      'Custom onboarding & training',
    ],
  },
};

const CARD_CONFIG = {
  starter: {
    accentColor: '#94a3b8',
    topBorder: 'border-t-[#94a3b8]',
    checkColor: 'text-slate-400',
    btnClass: 'border-slate-500 text-slate-300 hover:bg-slate-700/50 bg-transparent',
    btnVariant: 'outline',
    badge: null,
    glow: false,
  },
  pro: {
    accentColor: '#3b82f6',
    topBorder: 'border-t-blue-500',
    checkColor: 'text-blue-400',
    btnClass: 'bg-blue-600 hover:bg-blue-500 text-white border-0',
    btnVariant: 'default',
    badge: { label: 'MOST POPULAR', cls: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
    glow: false,
  },
  elite: {
    accentColor: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
    topBorder: null,
    checkColor: 'text-violet-400',
    btnClass: '',
    btnVariant: 'gradient',
    badge: { label: '⭐ RECOMMENDED', cls: 'bg-gradient-to-r from-blue-500/20 to-violet-500/20 text-violet-300 border border-violet-500/30' },
    glow: true,
  },
  enterprise: {
    accentColor: '#f59e0b',
    topBorder: 'border-t-amber-500',
    checkColor: 'text-amber-400',
    btnClass: 'border-amber-500/50 text-amber-400 hover:bg-amber-500/10 bg-transparent',
    btnVariant: 'outline',
    badge: { label: 'ENTERPRISE', cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/30' },
    glow: false,
  },
};

function PlanCard({ tierKey, billing, isCurrent, isUpgrade, onSelect, loading }) {
  const tier = TIERS[tierKey];
  const config = CARD_CONFIG[tierKey];
  const features = TIER_FEATURES[tierKey];
  const prices = PLAN_PRICES[tierKey];
  const price = billing === 'annual' ? prices.annual : prices.monthly;
  const isElite = tierKey === 'elite';

  return (
    <div className={cn(
      'relative flex flex-col rounded-2xl border border-white/10 overflow-hidden transition-all duration-300',
      'hover:-translate-y-1',
      isElite
        ? 'bg-gradient-to-b from-[#1a1040] to-[#120c35] hover:shadow-[0_0_40px_rgba(139,92,246,0.25)]'
        : 'bg-[#0f1117] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
      isElite ? 'md:scale-[1.03] z-10' : '',
    )}>
      {/* Colored top border */}
      {isElite ? (
        <div className="h-[3px] w-full" style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', boxShadow: '0 0 12px rgba(139,92,246,0.6)' }} />
      ) : config.topBorder ? (
        <div className={cn('h-[3px] w-full border-t-2', config.topBorder)} style={{ borderTopWidth: 3, backgroundColor: config.accentColor }} />
      ) : null}

      {/* Badge */}
      {config.badge && !isCurrent && (
        <div className="flex justify-center pt-3">
          <span className={cn('text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full', config.badge.cls)}>
            {config.badge.label}
          </span>
        </div>
      )}
      {isCurrent && (
        <div className="flex justify-center pt-3">
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            ✓ Your Current Plan
          </span>
        </div>
      )}

      {/* Price section */}
      <div className="p-6 pb-4">
        <p className="font-bold text-sm mb-3" style={{ color: isElite ? '#a78bfa' : config.accentColor }}>
          {tier.name}
        </p>

        {/* Client limit pill */}
        <p className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/5 text-slate-400 border border-white/10 mb-4">
          {CLIENT_LIMIT[tierKey]}
        </p>

        <div className="flex items-end gap-2 mb-2">
          {billing === 'annual' && (
            <span className="text-xl text-slate-500 line-through mb-1">${prices.monthly}</span>
          )}
          <span className="text-5xl font-bold text-white leading-none">${price}</span>
          <span className="text-slate-400 text-sm mb-1">/mo</span>
        </div>

        {billing === 'annual' ? (
          <span className="inline-block text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            Save ${prices.annualSave}/year
          </span>
        ) : (
          <p className="text-[11px] text-slate-500">or ${prices.annual}/mo billed annually</p>
        )}
      </div>

      {/* Divider */}
      <div className="mx-6 border-t border-white/10" />

      {/* Features */}
      <div className="p-6 flex-1 space-y-2.5">
        {features.inherited.length > 0 && (
          <>
            {features.inherited.map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                <span className="text-[12px] text-slate-500">{f}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 pb-0.5">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">Also includes</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
          </>
        )}
        {features.unique.map(f => (
          <div key={f} className="flex items-start gap-2">
            <Check className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', config.checkColor)} />
            <span className="text-[12px] text-slate-200 font-medium leading-snug">{f}</span>
          </div>
        ))}
      </div>

      {/* Button */}
      <div className="p-6 pt-0 space-y-2">
        {isCurrent ? (
          <div className="w-full text-center py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/30 rounded-xl bg-emerald-500/5">
            ✓ Your Current Plan
          </div>
        ) : isElite ? (
          <button
            onClick={() => onSelect(tierKey)}
            disabled={loading === tierKey}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50"
            style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', boxShadow: '0 0 20px rgba(139,92,246,0.4)' }}
          >
            {loading === tierKey ? 'Loading...' : isUpgrade ? `Upgrade to ${tier.name} →` : `Switch to ${tier.name}`}
          </button>
        ) : (
          <button
            onClick={() => onSelect(tierKey)}
            disabled={loading === tierKey}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 disabled:opacity-50',
              config.btnClass
            )}
          >
            {loading === tierKey ? 'Loading...' : isUpgrade ? `Upgrade to ${tier.name} →` : `Switch to ${tier.name}`}
          </button>
        )}
        {tierKey === 'enterprise' && (
          <p className="text-center text-[11px] text-slate-500">
            <a href="mailto:support@koach.ai" className="hover:text-amber-400 transition-colors">Talk to Sales →</a>
          </p>
        )}
      </div>
    </div>
  );
}

export default function PricingCards({ user, onUserUpdate, onClose }) {
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(null);

  const userTier = getUserTier(user);
  const currentTierIndex = TIER_ORDER.indexOf(userTier.key);

  const handleSelect = async (tierKey) => {
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
      window.location.href = res.data.url;
    } else if (res.data?.upgraded) {
      const updated = await base44.auth.me();
      if (onUserUpdate) onUserUpdate(updated);
      toast.success(`Upgraded to ${TIERS[tierKey].name}!`);
      if (onClose) onClose();
    } else {
      toast.error(res.data?.error || 'Something went wrong. Please try again.');
    }
  };

  // Mobile: show Elite first
  const orderedTiers = ['elite', 'pro', 'starter', 'enterprise'];

  return (
    <div>
      {/* Toggle */}
      <div className="flex flex-col items-center mb-10">
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
          <button
            onClick={() => setBilling('monthly')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200',
              billing === 'monthly' ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-semibold flex items-center gap-2 transition-all duration-200',
              billing === 'annual' ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
            )}
          >
            Annual
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors',
              billing === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
            )}>-20%</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-3">Billed via Stripe · Cancel anytime · No setup fees</p>
      </div>

      {/* Desktop grid — standard order */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 items-start">
        {TIER_ORDER.map(tierKey => (
          <PlanCard
            key={tierKey}
            tierKey={tierKey}
            billing={billing}
            isCurrent={userTier.key === tierKey}
            isUpgrade={TIER_ORDER.indexOf(tierKey) > currentTierIndex}
            onSelect={handleSelect}
            loading={loading}
          />
        ))}
      </div>

      {/* Mobile — Elite first */}
      <div className="md:hidden flex flex-col gap-4">
        {orderedTiers.map(tierKey => (
          <PlanCard
            key={tierKey}
            tierKey={tierKey}
            billing={billing}
            isCurrent={userTier.key === tierKey}
            isUpgrade={TIER_ORDER.indexOf(tierKey) > currentTierIndex}
            onSelect={handleSelect}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}