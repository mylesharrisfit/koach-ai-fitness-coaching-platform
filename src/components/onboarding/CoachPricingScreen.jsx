import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Zap } from 'lucide-react';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$49',
    period: '/mo',
    tag: null,
    color: '#6B7280',
    features: [
      'Up to 10 clients',
      'Core coaching tools',
      'AI client onboarding',
      'Workout builder',
      'Check-in system',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99',
    period: '/mo',
    tag: 'Most Popular',
    color: '#3B82F6',
    features: [
      'Unlimited clients',
      'Full AI automations',
      'AI check-in analysis',
      'Nutrition builder + AI meals',
      'Advanced analytics',
      'Client portal',
      'Integrations',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$199',
    period: '/mo',
    tag: 'Scale',
    color: '#8B5CF6',
    features: [
      'Everything in Pro',
      'Team members & staff',
      'White label branding',
      'Advanced analytics',
      'Priority support',
      'Custom integrations',
    ],
  },
];

export default function CoachPricingScreen({ onNext, onBack }) {
  const [selected, setSelected] = useState('pro');

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#0A0A0A' }}>
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-[0.06]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)', filter: 'blur(80px)' }} />
      </div>

      {/* Back */}
      <div className="flex-shrink-0 pt-5 px-5 relative z-10">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: '#555' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Back
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-36 pt-6 max-w-lg mx-auto w-full relative z-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-2 mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: '#3B82F6' }}>
            30-Day Free Trial
          </p>
          <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
            Choose your coaching system.
          </h2>
          <p className="text-sm" style={{ color: '#6B6B6B' }}>
            Start free. Cancel anytime. No commitment.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="space-y-3 mb-8">
          {PLANS.map((plan, i) => {
            const isSelected = selected === plan.id;
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelected(plan.id)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileTap={{ scale: 0.985 }}
                className="w-full text-left rounded-2xl p-5 transition-all"
                style={{
                  background: isSelected ? `rgba(${plan.id === 'pro' ? '59,130,246' : plan.id === 'team' ? '139,92,246' : '107,114,128'},0.08)` : '#111',
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
                      <span className="text-2xl font-bold" style={{ color: isSelected ? plan.color : '#fff' }}>{plan.price}</span>
                      <span className="text-xs" style={{ color: '#555' }}>{plan.period} after trial</span>
                    </div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all"
                    style={{
                      borderColor: isSelected ? plan.color : 'rgba(255,255,255,0.15)',
                      background: isSelected ? plan.color : 'transparent',
                    }}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
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
          {['30-day free trial', 'Cancel anytime', 'No credit card'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <Check className="w-2 h-2" style={{ color: '#22C55E' }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: '#555' }}>{t}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-5 z-20"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))', background: 'linear-gradient(to top, #0A0A0A 70%, transparent)' }}>
        <div className="max-w-lg mx-auto w-full pt-4">
          <motion.button
            onClick={() => onNext({ selected_plan: selected })}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(59,130,246,0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 28px rgba(59,130,246,0.3)' }}
          >
            <Zap className="w-5 h-5" />
            Start 30-Day Free Trial
          </motion.button>
          <p className="text-center text-xs mt-2" style={{ color: '#333' }}>
            You won't be charged until your trial ends
          </p>
        </div>
      </div>
    </div>
  );
}