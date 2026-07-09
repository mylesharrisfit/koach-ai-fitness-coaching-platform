import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const LEVELS = [
  {
    id: 'beginner',
    emoji: '🌱',
    label: 'Beginner',
    description: 'New to structured training. Building foundational habits.',
  },
  {
    id: 'intermediate',
    emoji: '🔥',
    label: 'Intermediate',
    description: '1–3 years of consistent training. Ready to optimize.',
  },
  {
    id: 'advanced',
    emoji: '⚡',
    label: 'Advanced',
    description: '3+ years of serious training. Focused on precision.',
  },
];

const DAYS = [2, 3, 4, 5, 6];

export default function ClientExperienceScreen({ onNext, onBack, data }) {
  const [level, setLevel] = useState(data.experience || null);
  const [days, setDays] = useState(data.training_days_per_week || null);

  return (
    <OnboardingLayout
      eyebrow="Experience"
      headline="What's your fitness level?"
      subtext="We'll calibrate intensity and program complexity to match you."
      onBack={onBack}
      onNext={() => onNext({ experience: level, training_days_per_week: days })}
      nextDisabled={!level}
    >
      <div className="space-y-8">
        {/* Level cards */}
        <div className="space-y-2.5">
          {LEVELS.map((l, i) => (
            <motion.button
              key={l.id}
              onClick={() => setLevel(l.id)}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i, duration: 0.4 }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              className="relative w-full text-left rounded-2xl p-5 transition-all"
              style={{
                background: level === l.id ? 'color-mix(in srgb, var(--tc-primary) 10%, transparent)' : 'color-mix(in srgb, white 3%, transparent)',
                border: level === l.id ? '1.5px solid color-mix(in srgb, var(--tc-primary) 60%, transparent)' : '1.5px solid color-mix(in srgb, white 7%, transparent)',
                boxShadow: level === l.id ? '0 0 30px color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'none',
              }}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{l.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-base" style={{ color: level === l.id ? 'var(--tc-card)' : 'var(--kc-b3b3b3)' }}>{l.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--kc-5a5a5a)' }}>{l.description}</p>
                </div>
                <div className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background: level === l.id ? 'var(--tc-primary)' : 'transparent',
                    border: level === l.id ? '2px solid var(--tc-primary)' : '2px solid color-mix(in srgb, white 12%, transparent)',
                  }}>
                  {level === l.id && (
                    <svg viewBox="0 0 10 10" fill="none" className="w-full h-full p-1">
                      <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Days per week */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--kc-b3b3b3)' }}>How many days per week can you train?</p>
          <div className="flex gap-2.5">
            {DAYS.map(d => (
              <motion.button key={d} whileTap={{ scale: 0.93 }} onClick={() => setDays(d)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: days === d ? 'color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'color-mix(in srgb, white 4%, transparent)',
                  border: days === d ? '1.5px solid color-mix(in srgb, var(--tc-primary) 50%, transparent)' : '1.5px solid color-mix(in srgb, white 7%, transparent)',
                  color: days === d ? 'var(--tc-card)' : 'var(--kc-5a5a5a)',
                  boxShadow: days === d ? '0 0 16px color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'none',
                }}>{d}</motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}