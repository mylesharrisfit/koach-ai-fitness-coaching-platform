import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function SelectionCard({ label, description, icon: Icon, selected, onClick, size = 'md' }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="relative w-full text-left rounded-2xl p-5 transition-all duration-200 overflow-hidden"
      style={{
        background: selected ? 'rgba(59,130,246,0.08)' : '#161616',
        border: selected ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.06)',
        boxShadow: selected ? '0 0 24px rgba(59,130,246,0.12)' : 'none',
      }}
    >
      {selected && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at 30% 50%, rgb(var(--primary)), transparent 70%)' }}
        />
      )}
      <div className="relative z-10 flex items-start gap-4">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: selected ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: selected ? 'rgb(var(--primary))' : '#7A7A7A' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base" style={{ color: selected ? 'rgb(var(--card))' : '#B3B3B3' }}>
            {label}
          </p>
          {description && (
            <p className="text-sm mt-1 leading-relaxed" style={{ color: '#7A7A7A' }}>
              {description}
            </p>
          )}
        </div>
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            background: selected ? 'rgb(var(--primary))' : 'transparent',
            border: selected ? '2px solid rgb(var(--primary))' : '2px solid rgba(255,255,255,0.12)',
          }}
        >
          {selected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </div>
      </div>
    </motion.button>
  );
}

export function ChipSelect({ label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1px solid rgba(59,130,246,0.45)' : '1px solid rgba(255,255,255,0.06)',
        color: selected ? 'rgb(var(--card))' : '#7A7A7A',
        boxShadow: selected ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      {label}
    </motion.button>
  );
}