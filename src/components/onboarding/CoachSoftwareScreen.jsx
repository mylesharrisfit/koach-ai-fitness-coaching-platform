import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const SOFTWARE = [
  { id: 'trainerize',   label: 'Trainerize',        emoji: '🏋️' },
  { id: 'everfit',      label: 'Everfit',            emoji: '⚡' },
  { id: 'trucoach',     label: 'TrueCoach',          emoji: '✅' },
  { id: 'sheets',       label: 'Google Sheets',      emoji: '📊' },
  { id: 'notion',       label: 'Notion',             emoji: '📝' },
  { id: 'mfp',          label: 'MyFitnessPal',       emoji: '🥗' },
  { id: 'spreadsheets', label: 'Custom Spreadsheets',emoji: '📋' },
  { id: 'none',         label: 'Nothing yet',        emoji: '🚀' },
];

export default function CoachSoftwareScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.current_software || []);

  const toggle = (id) => {
    if (id === 'none') { setSelected(['none']); return; }
    setSelected(s => {
      const without = s.filter(x => x !== 'none');
      return without.includes(id) ? without.filter(x => x !== id) : [...without, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Migration"
      headline="What are you currently using?"
      subtext="We'll tailor your import and migration experience to get you running fast."
      onBack={onBack}
      onNext={() => onNext({ current_software: selected })}
    >
      <div className="grid grid-cols-2 gap-2.5">
        {SOFTWARE.map((s, i) => {
          const isSelected = selected.includes(s.id);
          return (
            <motion.button
              key={s.id}
              onClick={() => toggle(s.id)}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
              style={{
                background: isSelected ? 'rgba(59,130,246,0.1)' : 'rgb(var(--foreground))',
                border: isSelected ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 18px rgba(59,130,246,0.12)' : 'none',
              }}
            >
              <span className="text-lg flex-shrink-0">{s.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: isSelected ? 'rgb(var(--card))' : '#9A9A9A' }}>
                {s.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}