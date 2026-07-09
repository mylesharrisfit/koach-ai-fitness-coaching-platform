import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';

const GOALS = [
  { id: 'fat_loss',        emoji: '🔥', label: 'Lose Fat',             sublabel: 'Shred body fat and get lean' },
  { id: 'muscle',          emoji: '💪', label: 'Build Muscle',          sublabel: 'Gain size, strength and mass' },
  { id: 'hybrid',          emoji: '⚡', label: 'Hybrid Performance',    sublabel: 'Lose fat and gain muscle simultaneously' },
  { id: 'strength',        emoji: '🏋️', label: 'Strength',              sublabel: 'Move bigger weights, feel powerful' },
  { id: 'endurance',       emoji: '🏃', label: 'Endurance',             sublabel: 'Cardio, stamina and conditioning' },
  { id: 'athletic',        emoji: '🏅', label: 'Athleticism',           sublabel: 'Speed, agility and sport performance' },
  { id: 'health',          emoji: '🎯', label: 'General Health',        sublabel: 'Feel good, live longer' },
  { id: 'lifestyle',       emoji: '✨', label: 'Lifestyle Transformation', sublabel: 'Complete physical reinvention' },
];

function GoalCard({ goal, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      className="relative w-full text-left rounded-2xl p-5 transition-all"
      style={{
        background: selected ? 'rgb(var(--primary) / 0.1)' : 'rgba(255,255,255,0.03)',
        border: selected ? '1.5px solid rgb(var(--primary) / 0.6)' : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: selected ? '0 0 30px rgb(var(--primary) / 0.15)' : 'none',
      }}
    >
      {selected && (
        <div className="absolute inset-0 rounded-2xl opacity-[0.06]"
          style={{ background: 'radial-gradient(circle at 20% 50%, rgb(var(--primary)), transparent 70%)' }} />
      )}
      <div className="relative z-10 flex items-center gap-4">
        <span className="text-2xl leading-none">{goal.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base" style={{ color: selected ? 'rgb(var(--card))' : '#B3B3B3' }}>{goal.label}</p>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#5A5A5A' }}>{goal.sublabel}</p>
        </div>
        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
          style={{
            background: selected ? 'rgb(var(--primary))' : 'transparent',
            border: selected ? '2px solid rgb(var(--primary))' : '2px solid rgba(255,255,255,0.12)',
          }}>
          {selected && (
            <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
}

export default function ClientGoalScreen({ onNext, onBack, data }) {
  const [selected, setSelected] = useState(data.goals?.length ? data.goals[0] : (data.goal || null));

  return (
    <OnboardingLayout
      eyebrow="Goals"
      headline="What's your primary goal?"
      subtext="We'll build your entire system around this."
      onBack={onBack}
      onNext={() => onNext({ goals: [selected], goal: selected })}
      nextDisabled={!selected}
    >
      <div className="space-y-2.5">
        {GOALS.map((g, i) => (
          <motion.div key={g.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.4 }}>
            <GoalCard goal={g} selected={selected === g.id} onClick={() => setSelected(g.id)} />
          </motion.div>
        ))}
      </div>
    </OnboardingLayout>
  );
}