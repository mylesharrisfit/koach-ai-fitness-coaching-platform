import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import KoachLogo from '@/components/brand/KoachLogo.jsx';

/* ─── URL params ─── */
const urlParams = new URLSearchParams(window.location.search);
const COACH_ID = urlParams.get('coach') || '';

/* ─── Step helpers ─── */
const STEPS = ['welcome', 'name', 'email', 'metrics', 'goal', 'experience', 'injuries', 'nutrition', 'lifestyle', 'why', 'generating', 'done'];
const PROGRESS_STEPS = STEPS.filter(s => !['welcome', 'generating', 'done'].includes(s));

function useStep() {
  const [step, setStep] = useState('welcome');
  const [direction, setDirection] = useState(1);
  const next = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) { setDirection(1); setStep(STEPS[idx + 1]); }
  };
  const back = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) { setDirection(-1); setStep(STEPS[idx - 1]); }
  };
  const goTo = (s) => { setDirection(1); setStep(s); };
  return { step, direction, next, back, goTo };
}

/* ─── Shared primitives ─── */
function PremiumInput({ placeholder, value, onChange, type = 'text', autoFocus = false }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full text-center text-2xl font-semibold text-white placeholder-white/20 bg-transparent border-0 border-b-2 pb-3 focus:outline-none transition-all"
      style={{ borderColor: value ? 'rgba(59,130,246,0.7)' : 'rgba(255,255,255,0.1)' }}
    />
  );
}

function BigCard({ emoji, label, sublabel, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className="relative w-full text-left rounded-2xl p-5 transition-all"
      style={{
        background: selected ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
        border: selected ? '1.5px solid rgba(59,130,246,0.6)' : '1.5px solid rgba(255,255,255,0.07)',
        boxShadow: selected ? '0 0 30px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      {selected && (
        <div className="absolute inset-0 rounded-2xl opacity-[0.06]"
          style={{ background: 'radial-gradient(circle at 20% 50%, #3B82F6, transparent 70%)' }} />
      )}
      <div className="relative z-10 flex items-center gap-4">
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="font-semibold text-base" style={{ color: selected ? '#fff' : '#B3B3B3' }}>{label}</p>
          {sublabel && <p className="text-xs mt-0.5" style={{ color: '#5A5A5A' }}>{sublabel}</p>}
        </div>
        <div className="ml-auto w-5 h-5 rounded-full flex-shrink-0 transition-all"
          style={{
            background: selected ? '#3B82F6' : 'transparent',
            border: selected ? '2px solid #3B82F6' : '2px solid rgba(255,255,255,0.12)',
          }}
        >
          {selected && (
            <svg viewBox="0 0 10 10" fill="none" className="w-full h-full p-1">
              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
      style={{
        background: selected ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.07)',
        color: selected ? '#fff' : '#7A7A7A',
        boxShadow: selected ? '0 0 16px rgba(59,130,246,0.15)' : 'none',
      }}
    >
      {label}
    </motion.button>
  );
}

function MetricBox({ label, value, onChange, unit, placeholder }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 p-5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.07)' }}>
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#5A5A5A' }}>{label}</p>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-center text-3xl font-bold text-white bg-transparent border-0 focus:outline-none placeholder-white/15"
        style={{ minWidth: 0 }}
      />
      {unit && <p className="text-xs" style={{ color: '#5A5A5A' }}>{unit}</p>}
    </div>
  );
}

/* ─── Screen wrapper ─── */
function Screen({ children, className = '' }) {
  return (
    <div className={`w-full h-full flex flex-col ${className}`} style={{ background: '#0A0A0A' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>
      {children}
    </div>
  );
}

/* ─── CTA Button ─── */
function CTAButton({ label = 'Continue', onClick, disabled }) {
  return (
    <div className="px-6 pb-8 pt-3 flex-shrink-0 w-full max-w-md mx-auto"
      style={{ background: 'linear-gradient(to top, #0A0A0A 60%, transparent)' }}>
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.02, boxShadow: '0 0 35px rgba(59,130,246,0.4)' } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all"
        style={{
          background: disabled ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
          boxShadow: disabled ? 'none' : '0 0 24px rgba(59,130,246,0.25)',
          color: disabled ? '#555' : '#fff',
        }}
      >
        {label}
      </motion.button>
    </div>
  );
}

/* ─── Back button ─── */
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm font-medium mb-auto flex-shrink-0 px-6 pt-5"
      style={{ color: '#555' }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
        <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

/* ─── Screen Header ─── */
function ScreenHeader({ eyebrow, headline, subtext }) {
  return (
    <motion.div
      className="px-6 pt-8 pb-4 flex-shrink-0 max-w-md mx-auto w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
    >
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.22em] font-bold mb-3" style={{ color: '#3B82F6' }}>{eyebrow}</p>
      )}
      <h2 className="font-bold text-white leading-tight mb-2"
        style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', letterSpacing: '-0.025em' }}>
        {headline}
      </h2>
      {subtext && (
        <p className="text-sm leading-relaxed mt-1" style={{ color: '#7A7A7A' }}>{subtext}</p>
      )}
    </motion.div>
  );
}

/* ─── SCREENS ─── */

function WelcomeStep({ onNext }) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-10 relative z-10">
        <motion.div
          className="flex flex-col items-center gap-8 text-center"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}
        >
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.8 }, show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] } } }}>
            <KoachLogo size={80} rounded="rounded-3xl" glow bg />
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
            className="space-y-3">
            <p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: '#3B82F6' }}>KOACH AI</p>
            <h1 className="text-white font-bold leading-tight"
              style={{ fontSize: 'clamp(2rem, 7vw, 3.5rem)', letterSpacing: '-0.03em' }}>
              Let KOACH AI<br />build your system.
            </h1>
            <p style={{ color: '#7A7A7A' }}>Training. Nutrition. Recovery. Performance.</p>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5 } } }}
            className="flex flex-wrap justify-center gap-2">
            {['AI-Powered', 'Personalized', 'Elite-Grade', 'Science-Backed'].map(t => (
              <span key={t} className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}>
                {t}
              </span>
            ))}
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="w-full max-w-xs space-y-4">
            <motion.button
              onClick={onNext}
              whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(59,130,246,0.45)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 24px rgba(59,130,246,0.3)' }}
            >
              Get Started
            </motion.button>
            <p className="text-xs text-center" style={{ color: '#3A3A3A' }}>Takes less than 3 minutes</p>
          </motion.div>
        </motion.div>
      </div>
    </Screen>
  );
}

function NameStep({ data, set, onNext, onBack }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 gap-10 relative z-10">
        <ScreenHeader eyebrow="Let's start" headline="What should we call you?" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-6 w-full max-w-md mx-auto px-6">
          <PremiumInput
            placeholder="Your full name"
            value={data.name || ''}
            onChange={v => set('name', v)}
            autoFocus
          />
        </motion.div>
      </div>
      <CTAButton onClick={onNext} disabled={!(data.name || '').trim()} />
    </Screen>
  );
}

function EmailStep({ data, set, onNext, onBack }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 gap-10 relative z-10">
        <ScreenHeader eyebrow="Contact" headline={`Nice to meet you, ${(data.name || '').split(' ')[0] || 'you'}.`}
          subtext="Where should we send your plan?" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="space-y-4 w-full max-w-md mx-auto px-6">
          <PremiumInput placeholder="Your email address" value={data.email || ''} onChange={v => set('email', v)} type="email" autoFocus />
          <PremiumInput placeholder="Phone (optional)" value={data.phone || ''} onChange={v => set('phone', v)} type="tel" />
        </motion.div>
      </div>
      <CTAButton onClick={onNext} disabled={!(data.email || '').includes('@')} />
    </Screen>
  );
}

function MetricsStep({ data, set, onNext, onBack }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Body Stats" headline="Tell us about yourself." subtext="We use this to calculate your targets." />
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-3">
            <div className="flex gap-3">
              <MetricBox label="Age" value={data.age || ''} onChange={v => set('age', v)} unit="years" placeholder="25" />
              <MetricBox label="Weight" value={data.current_weight || ''} onChange={v => set('current_weight', v)} unit="lbs" placeholder="175" />
            </div>
            <MetricBox label="Height" value={data.height || ''} onChange={v => set('height', v)} unit="e.g. 5'10&quot;" placeholder="5'10&quot;" />
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={!(data.age && data.current_weight && data.height)} />
    </Screen>
  );
}

const GOALS = [
  { id: 'fat_loss', emoji: '🔥', label: 'Lose Fat', sublabel: 'Shred body fat and get lean' },
  { id: 'muscle_gain', emoji: '💪', label: 'Build Muscle', sublabel: 'Gain size, strength and mass' },
  { id: 'hybrid', emoji: '⚡', label: 'Hybrid Performance', sublabel: 'Lose fat and gain muscle' },
  { id: 'strength', emoji: '🏋️', label: 'Strength', sublabel: 'Move bigger weights' },
  { id: 'endurance', emoji: '🏃', label: 'Endurance', sublabel: 'Cardio and stamina' },
  { id: 'general_fitness', emoji: '🎯', label: 'General Health', sublabel: 'Feel good inside and out' },
];

function GoalStep({ data, set, onNext, onBack }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Goals" headline="What's your primary goal?" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-2.5">
            {GOALS.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.4 }}>
                <BigCard {...g} selected={data.goal === g.id} onClick={() => set('goal', g.id)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={!data.goal} />
    </Screen>
  );
}

const LEVELS = [
  { id: 'beginner', emoji: '🌱', label: 'Beginner', sublabel: 'New to structured training' },
  { id: 'intermediate', emoji: '🔥', label: 'Intermediate', sublabel: '1–3 years of consistent training' },
  { id: 'advanced', emoji: '⚡', label: 'Advanced', sublabel: '3+ years of serious training' },
];

function ExperienceStep({ data, set, onNext, onBack }) {
  const days = [2, 3, 4, 5, 6];
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Experience" headline="What's your fitness level?" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-4 space-y-8">
            <div className="space-y-2.5">
              {LEVELS.map((l, i) => (
                <motion.div key={l.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}>
                  <BigCard {...l} selected={data.experience === l.id} onClick={() => set('experience', l.id)} />
                </motion.div>
              ))}
            </div>
            <div className="space-y-4">
              <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Days per week to train</p>
              <div className="flex gap-2.5">
                {days.map(d => (
                  <motion.button key={d} whileTap={{ scale: 0.93 }} onClick={() => set('training_days_per_week', d)}
                    className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all"
                    style={{
                      background: data.training_days_per_week === d ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                      border: data.training_days_per_week === d ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
                      color: data.training_days_per_week === d ? '#fff' : '#5A5A5A',
                      boxShadow: data.training_days_per_week === d ? '0 0 16px rgba(59,130,246,0.12)' : 'none',
                    }}>{d}</motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={!data.experience} />
    </Screen>
  );
}

const INJURIES = [
  { id: 'lower_back', label: 'Lower Back' },
  { id: 'knees', label: 'Knees' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'hips', label: 'Hips' },
  { id: 'ankles', label: 'Ankles' },
  { id: 'neck', label: 'Neck' },
  { id: 'wrists', label: 'Wrists' },
  { id: 'none', label: '✓ None' },
];

function InjuriesStep({ data, set, onNext, onBack }) {
  const selected = data.injuries || [];
  const toggle = (id) => {
    if (id === 'none') { set('injuries', ['none']); return; }
    const without_none = selected.filter(x => x !== 'none');
    set('injuries', without_none.includes(id) ? without_none.filter(x => x !== id) : [...without_none, id]);
  };
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Physical" headline="Any injuries or limitations?"
            subtext="We'll modify exercises to keep you safe and progressing." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-6">
            <div className="flex flex-wrap gap-2.5">
              {INJURIES.map(inj => (
                <Chip key={inj.id} label={inj.label} selected={selected.includes(inj.id)} onClick={() => toggle(inj.id)} />
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm" style={{ color: '#7A7A7A' }}>Anything else we should know?</p>
              <textarea
                value={data.injury_notes || ''}
                onChange={e => set('injury_notes', e.target.value)}
                placeholder="Describe injuries or pain points..."
                rows={3}
                className="w-full px-4 py-4 rounded-2xl text-white text-sm resize-none focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)', color: '#fff' }}
                onFocus={e => { e.target.style.border = '1.5px solid rgba(59,130,246,0.45)'; }}
                onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.07)'; }}
              />
            </div>
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={selected.length === 0} />
    </Screen>
  );
}

const FOODS = ['Chicken', 'Salmon', 'Steak', 'Eggs', 'Rice', 'Potatoes', 'Oats', 'Greek Yogurt', 'Broccoli', 'Avocado', 'Pasta', 'Bread'];
const DIETS = [
  { id: 'none', label: 'No restrictions' },
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten_free', label: 'Gluten-free' },
  { id: 'dairy_free', label: 'Dairy-free' },
  { id: 'halal', label: 'Halal' },
];

function NutritionStep({ data, set, onNext, onBack }) {
  const favFoods = data.fav_foods || [];
  const toggle = (f) => set('fav_foods', favFoods.includes(f) ? favFoods.filter(x => x !== f) : [...favFoods, f]);
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Nutrition" headline="What foods do you enjoy?"
            subtext="We'll build your plan around foods you actually like." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-8">
            <div className="flex flex-wrap gap-2.5">
              {FOODS.map(f => <Chip key={f} label={f} selected={favFoods.includes(f)} onClick={() => toggle(f)} />)}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>Any dietary restrictions?</p>
              <div className="flex flex-wrap gap-2.5">
                {DIETS.map(d => (
                  <Chip key={d.id} label={d.label} selected={data.diet === d.id} onClick={() => set('diet', d.id)} />
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={false} label="Continue" />
    </Screen>
  );
}

const LIFESTYLE_OPTS = {
  sleep: [{ id: 'poor', label: '😴 Poor' }, { id: 'average', label: '😐 Average' }, { id: 'good', label: '😊 Good' }],
  stress: [{ id: 'low', label: '😌 Low' }, { id: 'moderate', label: '😤 Moderate' }, { id: 'high', label: '🔥 High' }],
  activity: [{ id: 'low', label: '🪑 Sedentary' }, { id: 'moderate', label: '🚶 Active' }, { id: 'high', label: '⚡ Very Active' }],
};

function LifestyleRow({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold" style={{ color: '#B3B3B3' }}>{label}</p>
      <div className="flex gap-2">
        {options.map(o => (
          <motion.button key={o.id} whileTap={{ scale: 0.95 }} onClick={() => onChange(o.id)}
            className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: value === o.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.04)',
              border: value === o.id ? '1.5px solid rgba(59,130,246,0.5)' : '1.5px solid rgba(255,255,255,0.07)',
              color: value === o.id ? '#fff' : '#7A7A7A',
            }}>{o.label}</motion.button>
        ))}
      </div>
    </div>
  );
}

function LifestyleStep({ data, set, onNext, onBack }) {
  const isValid = data.sleep_quality && data.stress_level && data.activity_outside_gym;
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Lifestyle" headline="How's your lifestyle?" subtext="Recovery is half the battle." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-6">
            <LifestyleRow label="Sleep quality" options={LIFESTYLE_OPTS.sleep} value={data.sleep_quality} onChange={v => set('sleep_quality', v)} />
            <LifestyleRow label="Stress level" options={LIFESTYLE_OPTS.stress} value={data.stress_level} onChange={v => set('stress_level', v)} />
            <LifestyleRow label="Daily activity outside gym" options={LIFESTYLE_OPTS.activity} value={data.activity_outside_gym} onChange={v => set('activity_outside_gym', v)} />
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={!isValid} />
    </Screen>
  );
}

const WHY_PROMPTS = ['Confidence', 'Family', 'Performance', 'Discipline', 'Health', 'Longevity', 'Strength'];

function WhyStep({ data, set, onNext, onBack }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto w-full relative z-10">
          <ScreenHeader eyebrow="Your Why"
            headline="Why does this matter to you?"
            subtext="This helps personalize your coaching and keeps you going when it's hard." />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="px-6 pb-6 space-y-6">
            <div className="relative">
              <textarea
                value={data.motivation || ''}
                onChange={e => set('motivation', e.target.value)}
                placeholder="I want to feel strong, confident, and show up as my best self every day..."
                rows={5}
                className="w-full px-5 py-5 rounded-2xl text-white text-base leading-relaxed resize-none focus:outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.07)' }}
                onFocus={e => { e.target.style.border = '1.5px solid rgba(59,130,246,0.45)'; }}
                onBlur={e => { e.target.style.border = '1.5px solid rgba(255,255,255,0.07)'; }}
              />
              <span className="absolute bottom-3 right-4 text-xs" style={{ color: '#3A3A3A' }}>
                {(data.motivation || '').length}/500
              </span>
            </div>
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: '#3A3A3A' }}>Quick picks</p>
              <div className="flex flex-wrap gap-2">
                {WHY_PROMPTS.map(p => (
                  <motion.button key={p} whileTap={{ scale: 0.95 }}
                    onClick={() => set('motivation', (data.motivation || '') ? `${data.motivation}, ${p.toLowerCase()}` : p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#7A7A7A' }}>
                    {p}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <CTAButton onClick={onNext} disabled={(data.motivation || '').trim().length < 3} label="Build My System →" />
    </Screen>
  );
}

/* ─── AI Generation ─── */
const GEN_ITEMS = [
  { label: 'Analyzing your profile', icon: '🧠', delay: 0 },
  { label: 'Building training plan', icon: '🏋️', delay: 0.7 },
  { label: 'Designing nutrition plan', icon: '🥗', delay: 1.4 },
  { label: 'Setting recovery targets', icon: '⚡', delay: 2.1 },
  { label: 'Calibrating habit system', icon: '🔄', delay: 2.8 },
];

function GenCard({ item }) {
  const [status, setStatus] = useState('waiting');
  React.useEffect(() => {
    const t1 = setTimeout(() => setStatus('loading'), item.delay * 1000);
    const t2 = setTimeout(() => setStatus('done'), (item.delay + 0.8) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: status === 'waiting' ? 0.25 : 1, y: 0 }}
      transition={{ delay: item.delay * 0.6, duration: 0.4 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500"
      style={{
        background: status === 'done' ? 'rgba(34,197,94,0.06)' : status === 'loading' ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.03)',
        border: status === 'done' ? '1.5px solid rgba(34,197,94,0.25)' : status === 'loading' ? '1.5px solid rgba(59,130,246,0.25)' : '1.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="text-xl">{item.icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: status === 'waiting' ? '#3A3A3A' : '#fff' }}>
          {item.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: status === 'done' ? 'rgba(34,197,94,0.8)' : '#5A5A5A' }}>
          {status === 'done' ? 'Complete' : status === 'loading' ? 'Processing...' : 'Queued'}
        </p>
      </div>
      <div className="w-6 h-6 flex items-center justify-center">
        {status === 'loading' && (
          <motion.div className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }} />
        )}
        {status === 'done' && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}
            className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#22C55E' }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function GeneratingStep({ onNext }) {
  const [allDone, setAllDone] = useState(false);
  React.useEffect(() => {
    const lastDelay = GEN_ITEMS[GEN_ITEMS.length - 1].delay + 0.8;
    const t = setTimeout(() => setAllDone(true), lastDelay * 1000);
    return () => clearTimeout(t);
  }, []);
  React.useEffect(() => {
    if (allDone) { const t = setTimeout(onNext, 1400); return () => clearTimeout(t); }
  }, [allDone]);

  return (
    <Screen>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 4, repeat: Infinity }}>
          <div className="w-[700px] h-[700px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 65%)', filter: 'blur(60px)' }} />
        </motion.div>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full px-6 gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: '#3B82F6' }}>KOACH AI Engine</p>
          <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Building your system…
          </h2>
          <p className="text-sm" style={{ color: '#7A7A7A' }}>Personalizing everything based on your profile</p>
        </motion.div>
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            animate={{ width: allDone ? '100%' : '85%' }}
            initial={{ width: '0%' }}
            transition={{ duration: allDone ? 0.5 : GEN_ITEMS[GEN_ITEMS.length - 1].delay * 0.9 }} />
        </div>
        <div className="space-y-2.5">
          {GEN_ITEMS.map((item, i) => <GenCard key={i} item={item} />)}
        </div>
        {allDone && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>✓ Your system is ready</p>
          </motion.div>
        )}
      </div>
    </Screen>
  );
}

function DoneStep({ name }) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="flex flex-col items-center gap-8 text-center">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-24 h-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.3)' }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M8 20L16 28L32 12" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: '#22C55E' }}>You're all set</p>
            <h2 className="text-4xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
              Welcome,<br />{(name || 'you').split(' ')[0]}.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#7A7A7A' }}>
              Your responses have been received.<br />Your coach will be in touch within 24 hours.
            </p>
          </div>
          <div className="w-full max-w-xs px-6 py-5 rounded-2xl text-sm text-center space-y-1"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1.5px solid rgba(59,130,246,0.15)' }}>
            <p className="font-semibold text-white">What happens next?</p>
            <p style={{ color: '#7A7A7A' }}>Your coach reviews your profile and builds your personalized plan.</p>
          </div>
        </motion.div>
      </div>
    </Screen>
  );
}

/* ─── MAIN ─── */
export default function ClientOnboarding() {
  const { step, direction, next, back, goTo } = useStep();
  const [data, setData] = useState({ training_days_per_week: 4 });
  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const submitMutation = useMutation({
    mutationFn: () => base44.entities.OnboardingResponse.create({
      name: data.name,
      email: data.email,
      phone: data.phone,
      age: data.age ? Number(data.age) : undefined,
      height: data.height,
      current_weight: data.current_weight ? Number(data.current_weight) : undefined,
      goal: data.goal,
      activity_level: data.activity_outside_gym,
      training_days_per_week: data.training_days_per_week,
      previous_experience: data.experience,
      food_preferences: [
        (data.fav_foods || []).join(', '),
        data.diet,
        data.injury_notes,
      ].filter(Boolean).join(' | '),
      health_conditions: (data.injuries || []).join(', '),
      motivation: data.motivation,
      schedule_preferences: `Sleep: ${data.sleep_quality}, Stress: ${data.stress_level}`,
      coach_id: COACH_ID,
      status: 'pending',
    }),
    onSuccess: () => goTo('done'),
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const handleNext = () => {
    if (step === 'why') { submitMutation.mutate(); next(); return; }
    next();
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };
  const transition = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.38 };

  const progressIdx = PROGRESS_STEPS.indexOf(step);
  const showProgress = progressIdx >= 0;
  const progress = showProgress ? (progressIdx + 1) / PROGRESS_STEPS.length : 0;

  const renderStep = () => {
    switch (step) {
      case 'welcome': return <WelcomeStep onNext={next} />;
      case 'name': return <NameStep data={data} set={set} onNext={next} onBack={back} />;
      case 'email': return <EmailStep data={data} set={set} onNext={next} onBack={back} />;
      case 'metrics': return <MetricsStep data={data} set={set} onNext={next} onBack={back} />;
      case 'goal': return <GoalStep data={data} set={set} onNext={next} onBack={back} />;
      case 'experience': return <ExperienceStep data={data} set={set} onNext={next} onBack={back} />;
      case 'injuries': return <InjuriesStep data={data} set={set} onNext={next} onBack={back} />;
      case 'nutrition': return <NutritionStep data={data} set={set} onNext={next} onBack={back} />;
      case 'lifestyle': return <LifestyleStep data={data} set={set} onNext={next} onBack={back} />;
      case 'why': return <WhyStep data={data} set={set} onNext={handleNext} onBack={back} />;
      case 'generating': return <GeneratingStep onNext={next} />;
      case 'done': return <DoneStep name={data.name} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute top-0 left-0 right-0 z-50 h-[2px]" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div className="h-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }} />
        </div>
      )}

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div key={step} custom={direction} variants={variants}
          initial="enter" animate="center" exit="exit"
          transition={transition} className="absolute inset-0">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}