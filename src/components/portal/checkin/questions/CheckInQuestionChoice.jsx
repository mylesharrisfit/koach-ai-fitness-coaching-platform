import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function CheckInQuestionChoice({ value, onChange, options, multi = false }) {
  const selected = multi
    ? (Array.isArray(value) ? value : [])
    : value;

  const toggle = (opt) => {
    if (multi) {
      const arr = Array.isArray(selected) ? [...selected] : [];
      const idx = arr.indexOf(opt);
      if (idx > -1) arr.splice(idx, 1); else arr.push(opt);
      onChange(arr);
    } else {
      onChange(opt);
    }
  };

  const isSelected = (opt) => multi ? selected.includes(opt) : selected === opt;

  return (
    <div className="space-y-3">
      {options.map((opt, i) => (
        <motion.button key={opt}
          onClick={() => toggle(opt)}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          whileTap={{ scale: 0.97 }}
          className="w-full p-4 rounded-2xl text-left flex items-center justify-between transition-all"
          style={{
            background: isSelected(opt) ? 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(99,102,241,0.2))' : 'rgba(255,255,255,0.05)',
            border: `1.5px solid ${isSelected(opt) ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.08)'}`,
          }}>
          <span className="text-sm font-semibold"
            style={{ color: isSelected(opt) ? 'rgb(var(--primary))' : 'rgba(255,255,255,0.7)' }}>
            {opt}
          </span>
          {isSelected(opt) && (
            <div className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(59,130,246,0.4)' }}>
              <Check className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  );
}