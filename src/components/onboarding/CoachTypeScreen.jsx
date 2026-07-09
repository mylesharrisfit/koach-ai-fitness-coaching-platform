import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const FEATURES = [
  { id: 'ai_meals',      label: 'AI Meal Plans',         emoji: '🥗' },
  { id: 'ai_workouts',   label: 'AI Workout Plans',      emoji: '🏋️' },
  { id: 'checkins',      label: 'Smart Check-ins',       emoji: '📋' },
  { id: 'progress',      label: 'Progress Tracking',     emoji: '📈' },
  { id: 'habits',        label: 'Habit Tracking',        emoji: '🔄' },
  { id: 'automations',   label: 'Automations',           emoji: '⚡' },
  { id: 'analytics',     label: 'Analytics',             emoji: '📊' },
  { id: 'messaging',     label: 'Client Messaging',      emoji: '💬' },
  { id: 'payments',      label: 'Payments',              emoji: '💳' },
  { id: 'team',          label: 'Team Management',       emoji: '👥' },
];

export default function CoachTypeScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.wanted_features || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Your System"
      headline="What do you want KOACH AI to automate?"
      subtext="Select everything you want. We'll activate these in your system."
      onBack={onBack}
      onNext={() => onNext({ wanted_features: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {FEATURES.map((f, i) => {
          const isSelected = selected.includes(f.id);
          return (
            <motion.button
              key={f.id}
              onClick={() => toggle(f.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgb(var(--foreground))',
                border: isSelected ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 18px rgba(59,130,246,0.12)' : 'none',
              }}
            >
              <span className="text-xl flex-shrink-0">{f.emoji}</span>
              <span className="text-sm font-semibold leading-tight" style={{ color: isSelected ? 'rgb(var(--card))' : '#9A9A9A' }}>
                {f.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}