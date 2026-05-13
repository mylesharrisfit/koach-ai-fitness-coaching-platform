import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, ArrowRight, Users, Zap, Link2, CreditCard, BarChart3, Dumbbell, Utensils } from 'lucide-react';

const CHECKLIST = [
  { id: 'client',     icon: Users,       label: 'Add your first client',       path: '/clients' },
  { id: 'intake',     icon: Link2,       label: 'Generate client intake link',  path: '/onboarding-manager' },
  { id: 'program',    icon: Dumbbell,    label: 'Build a workout program',      path: '/program-builder' },
  { id: 'meal',       icon: Utensils,    label: 'Create a meal plan',           path: '/nutrition' },
  { id: 'automation', icon: Zap,         label: 'Set up an automation',         path: '/automations' },
  { id: 'stripe',     icon: CreditCard,  label: 'Connect payments',             path: '/revenue' },
  { id: 'analytics',  icon: BarChart3,   label: 'Explore analytics',            path: '/analytics' },
];

export default function FirstTimeBanner({ onDismiss }) {
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('koach_checklist') || '[]'); } catch { return []; }
  });

  const toggle = (id) => {
    setChecked(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('koach_checklist', JSON.stringify(next));
      return next;
    });
  };

  const done = checked.length;
  const total = CHECKLIST.length;
  const pct = Math.round((done / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', border: '1px solid rgba(59,130,246,0.2)' }}
    >
      {/* Top accent line */}
      <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }} />

      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🚀</span>
              <p className="text-sm font-bold text-white">Welcome to KOACH AI</p>
            </div>
            <p className="text-xs" style={{ color: '#94A3B8' }}>
              Your AI coaching system is live. Complete these steps to unlock the full platform.
            </p>
          </div>
          <button onClick={onDismiss} className="p-1.5 rounded-lg flex-shrink-0 hover:bg-white/5 transition-colors" style={{ color: '#475569' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs font-bold flex-shrink-0" style={{ color: '#3B82F6' }}>{done}/{total}</span>
        </div>

        {/* Checklist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {CHECKLIST.map((item) => {
            const Icon = item.icon;
            const isDone = checked.includes(item.id);
            return (
              <div key={item.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5 group transition-all"
                style={{ background: isDone ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.03)', border: isDone ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                <button onClick={() => toggle(item.id)}
                  className="w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all"
                  style={{ borderColor: isDone ? '#22C55E' : 'rgba(255,255,255,0.2)', background: isDone ? '#22C55E' : 'transparent' }}>
                  {isDone && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: isDone ? '#22C55E' : '#3B82F6' }} />
                <span className="text-xs font-medium flex-1" style={{ color: isDone ? '#4ADE80' : '#CBD5E1', textDecoration: isDone ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
                {!isDone && (
                  <Link to={item.path} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <ArrowRight className="w-3 h-3" style={{ color: '#3B82F6' }} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}