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
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.07)',
              color: 'rgb(var(--card))',
            }}
            onFocus={e => { e.target.style.border = '1.5px solid rgba(59,130,246,0.45)'; e.target.style.boxShadow = '0 0 30px rgba(59,130,246,0.08)'; }}
            onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
          />
          <div className="absolute bottom-3 right-4 text-xs" style={{ color: '#3A3A3A' }}>
            {why.length}/500
          </div>
        </div>

        {/* Quick picks */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: '#3A3A3A' }}>
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
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: '#7A7A7A',
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