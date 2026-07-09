import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const PROMPTS = ['Confidence', 'Family', 'Performance', 'Discipline', 'Health', 'Longevity', 'Strength', 'Freedom'];

export default function ClientWhyScreen({ onNext, onBack, data }) {
  const [why, setWhy] = useState(data.motivation || '');

  return (
    <OnboardingLayout
      eyebrow="Your Why"
      headline="Why does this matter to you?"
      subtext="This is what keeps you going when it gets hard. Be honest."
      onBack={onBack}
      onNext={() => onNext({ motivation: why })}
      nextDisabled={why.trim().length < 3}
      nextLabel="Build My System →"
    >
      <div className="space-y-6">
        {/* Emotional text area */}
        <div className="relative">
          <textarea
            value={why}
            onChange={e => setWhy(e.target.value)}
            placeholder="I want to feel strong, confident, and show up as my best self every day..."
            rows={6}
            className="w-full px-5 py-5 rounded-2xl text-white text-base leading-relaxed resize-none focus:outline-none transition-all"
            style={{
              background: 'color-mix(in srgb, white 4%, transparent)',
              border: '1.5px solid color-mix(in srgb, white 7%, transparent)',
              color: 'var(--tc-card)',
            }}
            onFocus={e => { e.target.style.border = '1.5px solid color-mix(in srgb, var(--tc-primary) 45%, transparent)'; e.target.style.boxShadow = '0 0 30px color-mix(in srgb, var(--tc-primary) 8%, transparent)'; }}
            onBlur={e => { e.target.style.border = '1.5px solid color-mix(in srgb, white 7%, transparent)'; e.target.style.boxShadow = 'none'; }}
          />
          <div className="absolute bottom-3 right-4 text-xs" style={{ color: 'var(--kc-3a3a3a)' }}>
            {why.length}/500
          </div>
        </div>

        {/* Quick picks */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--kc-3a3a3a)' }}>
            Quick picks
          </p>
          <div className="flex flex-wrap gap-2">
            {PROMPTS.map(p => (
              <motion.button
                key={p}
                onClick={() => setWhy(w => w ? `${w}, ${p.toLowerCase()}` : p)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-3.5 py-2 rounded-xl text-xs font-medium transition-all"
                style={{
                  background: 'color-mix(in srgb, white 4%, transparent)',
                  border: '1px solid color-mix(in srgb, white 7%, transparent)',
                  color: 'var(--kc-7a7a7a)',
                }}
              >
                {p}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}