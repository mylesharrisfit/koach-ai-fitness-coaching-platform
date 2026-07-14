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
        background: selected ? 'color-mix(in srgb, var(--tc-primary) 8%, transparent)' : 'var(--kc-161616)',
        border: selected ? '1px solid color-mix(in srgb, var(--tc-primary) 50%, transparent)' : '1px solid color-mix(in srgb, white 6%, transparent)',
        boxShadow: selected ? '0 0 24px color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'none',
      }}
    >
      {selected && (
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at 30% 50%, var(--tc-primary), transparent 70%)' }}
        />
      )}
      <div className="relative z-10 flex items-start gap-4">
        {Icon && (
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: selected ? 'color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'color-mix(in srgb, white 4%, transparent)',
            }}
          >
            <Icon className="w-5 h-5" style={{ color: selected ? 'var(--tc-primary)' : 'var(--kc-7a7a7a)' }} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base" style={{ color: selected ? 'var(--tc-primary-foreground)' : 'var(--kc-b3b3b3)' }}>
            {label}
          </p>
          {description && (
            <p className="text-sm mt-1 leading-relaxed" style={{ color: 'var(--kc-7a7a7a)' }}>
              {description}
            </p>
          )}
        </div>
        <div
          className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            background: selected ? 'var(--tc-primary)' : 'transparent',
            border: selected ? '2px solid var(--tc-primary)' : '2px solid color-mix(in srgb, white 12%, transparent)',
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
        background: selected ? 'color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'color-mix(in srgb, white 4%, transparent)',
        border: selected ? '1px solid color-mix(in srgb, var(--tc-primary) 45%, transparent)' : '1px solid color-mix(in srgb, white 6%, transparent)',
        color: selected ? 'var(--tc-primary-foreground)' : 'var(--kc-7a7a7a)',
        boxShadow: selected ? '0 0 16px color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'none',
      }}
    >
      {label}
    </motion.button>
  );
}