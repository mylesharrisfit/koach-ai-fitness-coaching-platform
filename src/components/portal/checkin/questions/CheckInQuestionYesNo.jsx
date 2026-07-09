import React from 'react';
import { motion } from 'framer-motion';

export default function CheckInQuestionYesNo({ value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {[
          { val: 'yes', label: 'Yes', emoji: '✅', color: 'rgb(var(--success))', bg: 'rgb(var(--success) / 0.15)', border: 'rgb(var(--success) / 0.4)' },
          { val: 'no', label: 'No', emoji: '❌', color: 'rgb(var(--destructive))', bg: 'rgb(var(--destructive) / 0.15)', border: 'rgb(var(--destructive) / 0.4)' },
        ].map(opt => (
          <motion.button key={opt.val}
            onClick={() => onChange(opt.val)}
            whileTap={{ scale: 0.94 }}
            className="flex-1 py-8 rounded-2xl flex flex-col items-center gap-3 transition-all"
            style={{
              background: value === opt.val ? opt.bg : 'rgba(255,255,255,0.05)',
              border: `2px solid ${value === opt.val ? opt.border : 'rgba(255,255,255,0.08)'}`,
            }}>
            <span className="text-4xl">{opt.emoji}</span>
            <span className="font-bold text-lg"
              style={{ color: value === opt.val ? opt.color : 'rgba(255,255,255,0.4)' }}>
              {opt.label}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}