import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 29,
    annual: 23,
    tag: null,
    color: 'rgb(var(--muted-foreground))',
    clientCap: 'Up to 10 clients',
    features: [
      'Up to 10 clients',
      '5 AI generations/month',
      'Workout program builder',
      'Basic nutrition plans',
      'Scheduling & calendar',
      'In-app messaging',
      'Client mobile app access',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 79,
    annual: 63,
    tag: 'Most Popular',
    color: 'rgb(var(--primary))',
    clientCap: 'Up to 75 clients',
    features: [
      'Up to 75 clients',
      'Unlimited AI program & meal plan builder',
      'Progress analytics & graphs',
      'Check-in review system',
      'Adherence scoring',
      'Voice & video messages',
      'Client mobile dashboard',
      'AI reply suggestions',
    ],
  },
  {
    id: 'elite',
    name: 'Elite',
    monthly: 149,
    annual: 119,
    tag: 'Recommended',
    color: 'rgb(var(--ai))',
    clientCap: 'Unlimited clients',
    features: [
      'Unlimited clients',
      'Full AI Assistant (auto progression + check-in analysis)',
      'Sales pipeline CRM',
      'Revenue dashboard',
      'White-label branding',
      'Community module',
      'Zapier integrations',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 299,
    annual: 239,
    tag: 'Scale',
    color: 'rgb(var(--warning))',
    clientCap: 'Unlimited clients',
    features: [
      'Unlimited clients',
      'Team-wide AI access for multiple coaches',
      'AI API access',
      'Custom integrations',
      'Dedicated account manager',
      'Custom contract & invoicing',
      'Priority phone support',
    ],
  },
];

export default function CoachPricingScreen({ onNext, onBack, resuming }) {
  const [selected, setSelected] = useState('pro');
  const [billing, setBilling] = useState('monthly');
  const [loading, setLoading] = useState(false);

  const handleStartTrial = async () => {
    setLoading(true);
    try {
      const origin = window.location.origin;
      const res = await base44.functions.invoke('stripeCheckout', {
        tier: selected,
        billing_cycle: billing,
        success_url: `${origin}/?checkout=success`,
        cancel_url: `${origin}/start?resume=checkout`,
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error(res.data?.error || 'Could not start checkout. Please try again.');
        setLoading(false);
      }
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'rgb(var(--sidebar))' }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, rgb(var(--primary)) 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      {/* Back — hidden when resuming after account creation */}
      {!resuming && onBack && (
        <div className="flex-shrink-0 pt-5 px-5 relative z-10">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#555' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pb-36 pt-6 max-w-lg mx-auto w-full relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-6 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: 'rgb(var(--primary))' }}>
            Step 3 of 3 · Choose Your Plan
          </p>
          <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
            Choose your coaching system.
          </h2>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Card required. No charge for 30 days. Cancel anytime.
          </p>
        </motion.div>

        {/* Billing toggle */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex justify-center mb-5">
          <div className="flex items-center rounded-full p-1" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'monthly', label: 'Monthly' },
              { key: 'annual', label: 'Annual', badge: '-20%' },
            ].map(b => (
              <button
                key={b.key}
                onClick={() => setBilling(b.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: billing === b.key ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)))' : 'transparent',
                  color: billing === b.key ? 'rgb(var(--card))' : '#666',
                }}
              >
                {b.label}
                {b.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: billing === b.key ? 'rgba(255,255,255,0.2)' : 'rgba(34,197,94,0.15)', color: billing === b.key ? 'rgb(var(--card))' : 'rgb(var(--success))' }}>
                    {b.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Plans */}
        <div className="space-y-3 mb-6">
          {PLANS.map((plan, i) => {
            const isSelected = selected === plan.id;
            const price = billing === 'annual' ? plan.annual : plan.monthly;
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.985 }}
                className="w-full text-left rounded-2xl p-5 transition-all"
                style={{
                  background: isSelected ? `rgba(${plan.id === 'pro' ? '59,130,246' : plan.id === 'elite' ? '139,92,246' : plan.id === 'enterprise' ? '245,158,11' : '107,114,128'},0.08)` : 'rgb(var(--foreground))',
                  border: isSelected ? `1.5px solid ${plan.color}55` : '1.5px solid rgba(255,255,255,0.06)',
                  boxShadow: isSelected ? `0 0 28px ${plan.color}18` : 'none',
                  transform: isSelected && plan.id === 'pro' ? 'scale(1.015)' : 'scale(1)',
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-base font-bold text-white">{plan.name}</span>
                      {plan.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: `${plan.color}20`, color: plan.color }}>
                          {plan.tag}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold" style={{ color: isSelected ? plan.color : 'rgb(var(--card))' }}>${price}</span>
                      <span className="text-xs" style={{ color: '#555' }}>/mo{billing === 'annual' ? ' billed annually' : ''} after trial</span>
                    </div>
                    <p className="text-[11px] mt-0.5" style={{ color: '#555' }}>{plan.clientCap}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                    style={{
                      borderColor: isSelected ? plan.color : 'rgba(255,255,255,0.15)',
                      background: isSelected ? plan.color : 'transparent',
                    }}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-card" />}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: isSelected ? plan.color : '#444' }} />
                      <span className="text-xs" style={{ color: isSelected ? '#C3C3C3' : '#666' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Trust signals */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-6 py-4"
        >
          {['30-day free trial', 'Cancel anytime', 'Card on file required'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Check className="w-2 h-2" style={{ color: 'rgb(var(--success))' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: '#555' }}>{t}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 z-20"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))', background: 'rgb(var(--sidebar))' }}>
        <div className="max-w-lg mx-auto w-full pt-4">
          <motion.button
            onClick={handleStartTrial}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 40px rgba(59,130,246,0.45)' } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5"
            style={{ background: loading ? '#1a2a4a' : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)))', boxShadow: '0 0 28px rgba(59,130,246,0.3)', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to checkout…</>
            ) : (
              <><Zap className="w-5 h-5" /> Start 30-Day Free Trial</>
            )}
          </motion.button>
          <p className="text-center text-xs mt-2" style={{ color: '#555' }}>
            Card required · No charge for 30 days · Cancel anytime
          </p>
          <p className="text-center text-xs mt-3" style={{ color: '#444' }}>
            Already have an account?{' '}
            <button
              onClick={() => base44.auth.redirectToLogin(window.location.origin + '/')}
              className="underline transition-colors"
              style={{ color: 'rgb(var(--primary))' }}
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}