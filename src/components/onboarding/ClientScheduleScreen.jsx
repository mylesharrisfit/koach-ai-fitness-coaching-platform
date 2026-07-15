import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OnboardingLayout from './OnboardingLayout';
import { ChipSelect } from './SelectionCard';

const DURATIONS = [
  { id: '30', label: '30 min' },
  { id: '45', label: '45 min' },
  { id: '60', label: '60 min' },
  { id: '90', label: '90+ min' },
];

const TIMES = [
  { id: 'early_morning', label: '🌅 Early Morning' },
  { id: 'morning', label: '☀️ Morning' },
  { id: 'afternoon', label: '🕐 Afternoon' },
  { id: 'evening', label: '🌆 Evening' },
  { id: 'late_night', label: '🌙 Late Night' },
];

export default function ClientScheduleScreen({ onNext, onBack, data }) {
  const [days, setDays] = useState(data.training_days || 4);
  const [duration, setDuration] = useState(data.workout_duration || null);
  const [time, setTime] = useState(data.workout_time || null);

  return (
    <OnboardingLayout
      eyebrow="Schedule"
      headline="How many days per week can you train?"
      onBack={onBack}
      onNext={() => onNext({ training_days: days, workout_duration: duration, workout_time: time })}
      nextDisabled={!duration}
    >
      <div className="space-y-10">
        {/* Days slider */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--kc-b3b3b3)' }}>Days per week</span>
            <motion.span
              key={days}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-bold text-white tabular-nums"
            >{days}</motion.span>
          </div>
          <div className="relative py-2">
            <input
              type="range" min={1} max={7} value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--tc-primary) 0%, var(--tc-primary) ${((days - 1) / 6) * 100}%, color-mix(in srgb, white 8%, transparent) ${((days - 1) / 6) * 100}%, color-mix(in srgb, white 8%, transparent) 100%)`,
                WebkitAppearance: 'none',
              }}
            />
            <div className="flex justify-between mt-2">
              {[1, 2, 3, 4, 5, 6, 7].map(d => (
                <span key={d} className="text-xs" style={{ color: d <= days ? 'var(--tc-primary)' : 'var(--kc-3a3a3a)' }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--kc-b3b3b3)' }}>How long can your workouts be?</p>
          <div className="grid grid-cols-2 gap-2.5">
            {DURATIONS.map(d => (
              <motion.button
                key={d.id}
                onClick={() => setDuration(d.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-4 rounded-2xl text-sm font-semibold transition-all"
                style={{
                  background: duration === d.id ? 'color-mix(in srgb, var(--tc-primary) 10%, transparent)' : 'var(--kc-161616)',
                  border: duration === d.id ? '1px solid color-mix(in srgb, var(--tc-primary) 45%, transparent)' : '1px solid color-mix(in srgb, white 6%, transparent)',
                  color: duration === d.id ? 'var(--tc-primary-foreground)' : 'var(--kc-7a7a7a)',
                  boxShadow: duration === d.id ? '0 0 18px color-mix(in srgb, var(--tc-primary) 12%, transparent)' : 'none',
                }}
              >{d.label}</motion.button>
            ))}
          </div>
        </div>

        {/* Time of day */}
        <div className="space-y-3">
          <p className="text-sm font-semibold" style={{ color: 'var(--kc-b3b3b3)' }}>What time do you usually train?</p>
          <div className="flex flex-wrap gap-2.5">
            {TIMES.map(t => (
              <ChipSelect key={t.id} label={t.label} selected={time === t.id} onClick={() => setTime(t.id)} />
            ))}
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}