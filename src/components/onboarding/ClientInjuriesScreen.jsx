import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const INJURIES = [
  { id: 'lower_back',  label: 'Lower Back' },
  { id: 'knee',        label: 'Knees' },
  { id: 'shoulder',    label: 'Shoulders' },
  { id: 'hip',         label: 'Hips' },
  { id: 'ankle',       label: 'Ankles' },
  { id: 'neck',        label: 'Neck' },
  { id: 'elbow_wrist', label: 'Wrists / Elbow' },
  { id: 'mobility',    label: 'Mobility Issues' },
  { id: 'surgery',     label: 'Previous Surgery' },
  { id: 'none',        label: '✓ No Injuries' },
];

export default function ClientInjuriesScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.injuries || []);
  const [notes, setNotes] = useState(data.injury_notes || '');

  const toggle = (id) => {
    if (id === 'none') { setSelected(['none']); return; }
    setSelected(s => {
      const without_none = s.filter(x => x !== 'none');
      return without_none.includes(id)
        ? without_none.filter(x => x !== id)
        : [...without_none, id];
    });
  };

  return (
    <OnboardingLayout
      eyebrow="Physical Health"
      headline="Any injuries or limitations?"
      subtext="Critical for your safety. We'll modify exercises accordingly."
      onBack={onBack}
      onNext={() => onNext({ injuries: selected, injury_notes: notes })}
      nextDisabled={selected.length === 0}
    >
      <div className="space-y-8">
        <div className="flex flex-wrap gap-2.5">
          {INJURIES.map((inj, i) => (
            <motion.button
              key={inj.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.03 * i }}
              onClick={() => toggle(inj.id)}
              whileTap={{ scale: 0.93 }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: selected.includes(inj.id) ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                border: selected.includes(inj.id) ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
                color: selected.includes(inj.id) ? '#fff' : '#7A7A7A',
                boxShadow: selected.includes(inj.id) ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
              }}
            >
              {inj.label}
            </motion.button>
          ))}
        </div>

        <div className="space-y-2.5">
          <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Anything else we should know?</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Describe injuries, pain levels, or limitations in detail..."
            rows={4}
            className="w-full px-5 py-4 rounded-2xl text-white text-sm leading-relaxed resize-none focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid rgba(255,255,255,0.07)',
              color: '#fff',
            }}
            onFocus={e => { e.target.style.border = '1.5px solid rgba(59,130,246,0.45)'; }}
            onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.07)'; }}
          />
        </div>
      </div>
    </OnboardingLayout>
  );
}