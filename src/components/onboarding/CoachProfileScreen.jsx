import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const NICHES = [
  { id: 'fat_loss', label: '🔥 Fat Loss' },
  { id: 'muscle', label: '💪 Muscle Building' },
  { id: 'hybrid', label: '⚡ Hybrid' },
  { id: 'strength', label: '🏋️ Strength' },
  { id: 'general', label: '🎯 General Health' },
  { id: 'lifestyle', label: '🌿 Lifestyle' },
  { id: 'performance', label: '🚀 Performance' },
  { id: 'sports', label: '⚽ Sports Performance' },
];

export default function CoachProfileScreen({ onNext, onBack, data }) {
  const [name, setName] = useState(data.business_name || '');
  const [handle, setHandle] = useState(data.social_handle || '');
  const [niche, setNiche] = useState(data.niche || null);

  const canContinue = name.trim().length > 0 && niche;

  return (
    <OnboardingLayout
      eyebrow="Your Brand"
      headline="Tell us about your coaching."
      subtext="We'll personalize your KOACH AI system around your business."
      onBack={onBack}
      onNext={() => onNext({ business_name: name.trim(), social_handle: handle.trim(), niche })}
      nextDisabled={!canContinue}
    >
      <div className="space-y-6">
        {/* Business name */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--kc-7a7a7a)' }}>
            Coaching Business Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Elite Coaching Co."
            className="w-full rounded-xl px-4 py-3.5 text-sm text-white font-medium outline-none transition-all"
            style={{
              background: 'var(--kc-141414)',
              border: name ? '1px solid color-mix(in srgb, var(--tc-primary) 50%, transparent)' : '1px solid color-mix(in srgb, white 8%, transparent)',
              boxShadow: name ? '0 0 16px color-mix(in srgb, var(--tc-primary) 10%, transparent)' : 'none',
            }}
          />
        </div>

        {/* Social handle */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--kc-7a7a7a)' }}>
            Instagram / Social Handle <span style={{ color: 'var(--kc-3a3a3a)' }}>(optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--kc-555555)' }}>@</span>
            <input
              type="text"
              value={handle}
              onChange={e => setHandle(e.target.value)}
              placeholder="yourhandle"
              className="w-full rounded-xl pl-8 pr-4 py-3.5 text-sm text-white font-medium outline-none transition-all"
              style={{
                background: 'var(--kc-141414)',
                border: '1px solid color-mix(in srgb, white 8%, transparent)',
              }}
            />
          </div>
        </div>

        {/* Niche */}
        <div className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--kc-7a7a7a)' }}>
            Your Coaching Niche
          </label>
          <div className="flex flex-wrap gap-2">
            {NICHES.map(n => (
              <motion.button
                key={n.id}
                whileTap={{ scale: 0.93 }}
                onClick={() => setNiche(n.id)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: niche === n.id ? 'color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'color-mix(in srgb, white 4%, transparent)',
                  border: niche === n.id ? '1px solid color-mix(in srgb, var(--tc-primary) 55%, transparent)' : '1px solid color-mix(in srgb, white 7%, transparent)',
                  color: niche === n.id ? 'var(--tc-primary-foreground)' : 'var(--kc-7a7a7a)',
                  boxShadow: niche === n.id ? '0 0 16px color-mix(in srgb, var(--tc-primary) 15%, transparent)' : 'none',
                }}
              >
                {n.label}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}