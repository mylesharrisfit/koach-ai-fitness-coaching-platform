import React from 'react';
import { motion } from 'framer-motion';

const MOODS = [
  { value: 'stressed', emoji: '😫', label: 'Stressed' },
  { value: 'tired', emoji: '😕', label: 'Tired' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'great', emoji: '😄', label: 'Great' },
];

export default function CheckInQuestionMood({ value, onChange }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between gap-3">
        {MOODS.map((m, i) => (
          <motion.button
            key={m.value}
            onClick={() => onChange(m.value)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileTap={{ scale: 0.85 }}
            className="flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl transition-all"
            style={{
              background: value === m.value ? 'rgb(var(--primary) / 0.2)' : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${value === m.value ? 'rgb(var(--primary) / 0.5)' : 'rgba(255,255,255,0.08)'}`,
            }}>
            <motion.span
              animate={value === m.value ? { scale: [1, 1.3, 1.1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-3xl">
              {m.emoji}
            </motion.span>
            <span className="text-[10px] font-semibold"
              style={{ color: value === m.value ? 'rgb(var(--primary))' : 'rgba(255,255,255,0.3)' }}>
              {m.label}
            </span>
          </motion.button>
        ))}
      </div>
      {value && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-white/40 text-sm">
          You're feeling <span className="text-white/70 font-semibold">{MOODS.find(m => m.value === value)?.label}</span> this week
        </motion.p>
      )}
    </div>
  );
}