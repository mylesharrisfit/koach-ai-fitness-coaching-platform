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
                background: level === l.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
                border: level === l.id ? '1.5px solid rgba(59,130,246,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
                boxShadow: level === l.id ? '0 0 30px rgba(59,130,246,0.15)' : 'none',
              }}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{l.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-base" style={{ color: level === l.id ? 'rgb(var(--card))' : '#B3B3B3' }}>{l.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#5A5A5A' }}>{l.description}</p>
                </div>
                <div className="w-5 h-5 rounded-full flex-shrink-0 transition-all"
                  style={{
                    background: level === l.id ? 'rgb(var(--primary))' : 'transparent',
                    border: level === l.id ? '2px solid rgb(var(--primary))' : '2px solid rgba(255,255,255,0.12)',
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
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>How many days per week can you train?</p>
          <div className="flex gap-2.5">
            {DAYS.map(d => (
              <motion.button key={d} whileTap={{ scale: 0.93 }} onClick={() => setDays(d)}
                className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all"
                style={{
                  background: days === d ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                  border: days === d ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                  color: days === d ? 'rgb(var(--card))' : '#5A5A5A',
                  boxShadow: days === d ? '0 0 16px rgba(59,130,246,0.12)' : 'none',
                }}>{d}</motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}