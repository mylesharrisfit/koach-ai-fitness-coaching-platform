import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const EXAMPLES = ['Confidence', 'Performance', 'Health', 'Discipline', 'Family', 'Longevity', 'Strength'];

export default function ClientWhyScreen({ onNext, onBack, data }) {
  const [why, setWhy] = useState(data.motivation || '');

  return (
    <OnboardingLayout
      eyebrow="Your Why"
      headline="Why does this matter to you?"
      subtext="This helps personalize your journey and keep you motivated when it's hard."
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
            placeholder="I want to feel strong, confident, and disciplined..."
            rows={5}
            className="w-full px-4 py-4 rounded-2xl text-white text-base leading-relaxed resize-none focus:outline-none transition-all"
            style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.06)',
              color: '#fff',
            }}
            onFocus={e => { e.target.style.border = '1px solid rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.target.style.border = '1px solid rgba(255,255,255,0.06)'; }}
          />
          <div className="absolute bottom-3 right-3 text-xs" style={{ color: '#3A3A3A' }}>
            {why.length} / 500
          </div>
        </div>

        {/* Example chips */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3A3A3A' }}>
            Common motivations
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map(ex => (
              <motion.button
                key={ex}
                onClick={() => setWhy(w => w ? `${w}, ${ex.toLowerCase()}` : ex)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#7A7A7A',
                }}
              >
                {ex}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}