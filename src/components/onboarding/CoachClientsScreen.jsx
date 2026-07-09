import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const OPTIONS = [
  { id: '1-10',   label: '1–10',   sub: 'Boutique coaching practice',      tag: 'Getting Started' },
  { id: '10-25',  label: '10–25',  sub: 'Growing steadily, need systems',  tag: 'Growing' },
  { id: '25-50',  label: '25–50',  sub: 'Scaling fast, automation critical', tag: 'Scaling' },
  { id: '50-100', label: '50–100', sub: 'High-volume, need elite tools',    tag: 'High Volume' },
  { id: '100+',   label: '100+',   sub: 'Enterprise-level coaching ops',    tag: 'Enterprise' },
];

export default function CoachClientsScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.client_count || null);

  return (
    <OnboardingLayout
      eyebrow="Business Size"
      headline="How many clients do you currently coach?"
      subtext="We'll tailor your system's capacity and automation level accordingly."
      onBack={onBack}
      onNext={() => onNext({ client_count: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-2.5">
        {OPTIONS.map((o, i) => {
          const isSelected = selected === o.id;
          return (
            <motion.button
              key={o.id}
              onClick={() => setSelected(o.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.985 }}
              className="w-full flex items-center gap-5 px-5 py-4 rounded-2xl text-left transition-all"
              style={{
                background: isSelected ? 'rgb(var(--primary) / 0.09)' : 'rgb(var(--foreground))',
                border: isSelected ? '1.5px solid rgb(var(--primary) / 0.5)' : '1.5px solid rgba(255,255,255,0.06)',
                boxShadow: isSelected ? '0 0 24px rgb(var(--primary) / 0.12)' : 'none',
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
                style={{
                  background: isSelected ? 'rgb(var(--primary) / 0.18)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? 'rgb(var(--primary))' : '#555',
                }}
              >
                {o.label}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: isSelected ? 'rgb(var(--card))' : '#B3B3B3' }}>
                  {o.sub}
                </p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                style={{
                  background: isSelected ? 'rgb(var(--primary) / 0.15)' : 'rgba(255,255,255,0.04)',
                  color: isSelected ? 'rgb(var(--primary))' : '#444',
                }}
              >
                {o.tag}
              </span>
            </motion.button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}