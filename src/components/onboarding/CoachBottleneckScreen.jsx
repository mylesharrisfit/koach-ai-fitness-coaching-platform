import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const BOTTLENECKS = [
  { id: 'checkins',    label: 'Check-ins',         emoji: '📋' },
  { id: 'programming', label: 'Programming',        emoji: '📝' },
  { id: 'nutrition',   label: 'Nutrition Plans',    emoji: '🥗' },
  { id: 'client_mgmt', label: 'Client Management',  emoji: '🗂️' },
  { id: 'leads',       label: 'Lead Generation',    emoji: '🎯' },
  { id: 'accountability', label: 'Accountability',  emoji: '🔒' },
  { id: 'retention',   label: 'Retention',          emoji: '💎' },
  { id: 'scaling',     label: 'Scaling',            emoji: '📈' },
  { id: 'time',        label: 'Time Management',    emoji: '⏱️' },
];

export default function CoachBottleneckScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.bottlenecks || []);
  const toggle = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <OnboardingLayout
      eyebrow="Pain Points"
      headline="What slows your coaching business down most?"
      subtext="Select all that apply — KOACH AI will prioritize automating these first."
      onBack={onBack}
      onNext={() => onNext({ bottlenecks: selected })}
      nextDisabled={selected.length === 0}
    >
      <div className="grid grid-cols-3 gap-2.5">
        {BOTTLENECKS.map((b, i) => {
          const isSelected = selected.includes(b.id);
          return (
            <motion.button
              key={b.id}
              onClick={() => toggle(b.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.93 }}
              className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl text-center transition-all"
              style={{
                background: isSelected ? 'rgba(59,130,246,0.1)' : '#111',
                border: isSelected ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 18px rgba(59,130,246,0.12)' : 'none',
              }}
            >
              <span className="text-xl">{b.emoji}</span>
              <span className="text-[11px] font-semibold leading-tight" style={{ color: isSelected ? '#fff' : '#7A7A7A' }}>
                {b.label}
              </span>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#3B82F6' }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}