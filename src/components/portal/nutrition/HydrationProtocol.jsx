import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const RULES = [
  { emoji: '🌅', label: 'Morning', text: '16–20 oz before anything else — rehydrate after sleep' },
  { emoji: '🏋️', label: 'Pre-Workout', text: '16–20 oz + electrolytes 30 min before training' },
  { emoji: '⏱️', label: 'Throughout Day', text: 'Sip consistently — never let thirst hit. Thirst = already dehydrated.' },
  { emoji: '🌙', label: 'Evening', text: 'Taper off 1–2 hrs before bed to protect sleep quality' },
];

export default function HydrationProtocol({ weightLbs }) {
  const [open, setOpen] = useState(false);
  const ozTarget = weightLbs ? Math.round(weightLbs / 2) : null;

  return (
    <div className="mx-4 mb-3 bg-card rounded-[18px] overflow-hidden"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid rgb(var(--muted))' }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-4 flex items-center gap-3 active:bg-muted transition-colors">
        <span className="text-xl">💧</span>
        <div className="flex-1 text-left">
          <p className="text-foreground font-bold text-sm">Hydration Protocol</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            {ozTarget ? `Daily target: ${ozTarget} oz / ~${Math.round(ozTarget * 0.0296)}L` : 'Daily water intake guide'}
          </p>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-border" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t border-border px-4 pb-4 overflow-hidden">

            {ozTarget && (
              <div className="mt-3 mb-4 bg-accent border border-accent rounded-xl px-4 py-3 text-center">
                <p className="text-2xl font-black text-primary">{ozTarget} oz</p>
                <p className="text-xs text-primary font-semibold">Daily target · bodyweight ÷ 2</p>
              </div>
            )}

            <div className="space-y-3 mt-3">
              {RULES.map(r => (
                <div key={r.label} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{r.emoji}</span>
                  <div>
                    <p className="text-foreground font-bold text-xs">{r.label}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{r.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}