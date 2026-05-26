import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import KoachLogo from '@/components/brand/KoachLogo.jsx';
import canvas from 'canvas-confetti';

/* ── Slide variants ── */
const slideVariants = {
  enter: dir => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};
const slideTrans = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.36 };

/* ── Shared primitives ── */
function Screen({ children, bg = 'from-[#0A0A14] to-[#0F0F1E]' }) {
  return (
    <div className={`w-full h-full flex flex-col bg-gradient-to-br ${bg} relative overflow-hidden`}>
      {/* subtle glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full opacity-[0.07] pointer-events-none"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', filter: 'blur(60px)' }} />
      {children}
    </div>
  );
}

function ProgressBar({ step, total }) {
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] z-50" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
        animate={{ width: `${((step) / total) * 100}%` }} transition={{ duration: 0.4, ease: 'easeInOut' }} />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, disabled, required, autoFocus, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
        {label}{required && <span className="text-blue-500 ml-1">*</span>}
      </label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
        className="w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-[#2E2E3A] bg-[#111] focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = 'rgba(37,99,235,0.55)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
      {hint && <p className="text-[10px]" style={{ color: '#374151' }}>{hint}</p>}
    </div>
  );
}

function PasswordField({ value, onChange }) {
  const [show, setShow] = useState(false);
  const strength = !value ? 0 : value.length < 6 ? 1 : value.length < 10 ? 2 : /[A-Z]/.test(value) && /[0-9]/.test(value) ? 4 : 3;
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#EF4444', '#F59E0B', '#10B981', '#10B981'];
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
        Password<span className="text-blue-500 ml-1">*</span>
      </label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Create a secure password"
          className="w-full px-4 py-3.5 pr-12 rounded-xl text-white text-sm placeholder-[#2E2E3A] bg-[#111] focus:outline-none transition-all"
          style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.55)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold"
          style={{ color: '#4B5563' }}>{show ? 'Hide' : 'Show'}</button>
      </div>
      {value && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all"
                style={{ background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
          <span className="text-[10px] font-semibold" style={{ color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
        </div>
      )}
    </div>
  );
}

function Chip({ label, selected, onClick, emoji }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: selected ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1.5px solid rgba(37,99,235,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
        color: selected ? '#fff' : '#6B7280',
      }}>
      {emoji && <span className="mr-1.5">{emoji}</span>}{label}
    </button>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-white">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className="w-11 h-6 rounded-full transition-all relative"
        style={{ background: checked ? '#2563EB' : 'rgba(255,255,255,0.1)' }}>
        <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
          style={{ left: checked ? '24px' : '4px' }} />
      </button>
    </div>
  );
}

function CTABtn({ label, onClick, disabled, loading }) {
  return (
    <div className="flex-shrink-0 px-5 pt-3 pb-8 w-full max-w-md mx-auto"
      style={{ background: 'linear-gradient(to top, #0A0A14 65%, transparent)' }}>
      <motion.button type="button" onClick={onClick} disabled={disabled || loading}
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        className="w-full py-4 rounded-2xl font-bold text-base transition-all"
        style={{
          background: disabled || loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, #2563EB, #7C3AED)',
          boxShadow: disabled || loading ? 'none' : '0 0 28px rgba(37,99,235,0.3)',
          color: disabled || loading ? '#444' : '#fff',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
        }}>
        {loading ? 'Saving...' : label}
      </motion.button>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium px-5 pt-5 pb-1 relative z-10 flex-shrink-0"
      style={{ color: '#4B5563' }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
        <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

/* ── Step: Welcome ── */
function StepWelcome({ coachName, coachWelcome, onStart }) {
  return (
    <Screen>
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8 relative z-10 text-center">
        <motion.div className="flex flex-col items-center gap-6 w-full max-w-sm"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={{ hidden: { opacity: 0, scale: 0.7 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6 } } }}>
            <KoachLogo size={72} rounded="rounded-2xl" glow bg />
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }} className="space-y-3">
            {coachName && (
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#2563EB' }}>
                {coachName} invited you to join KOACH AI ✦
              </p>
            )}
            <h1 className="font-black text-white leading-[1.05]"
              style={{ fontSize: 'clamp(2.2rem, 8vw, 3rem)', letterSpacing: '-0.03em' }}>
              Your transformation<br />starts here.
            </h1>
            {coachWelcome ? (
              <div className="px-4 py-3 rounded-xl text-sm leading-relaxed text-left"
                style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#93C5FD' }}>
                "{coachWelcome}"
              </div>
            ) : (
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                Set up your account and let's build your personalized coaching plan together.
              </p>
            )}
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="w-full space-y-2">
            <motion.button onClick={onStart} type="button"
              whileHover={{ scale: 1.03, boxShadow: '0 0 48px rgba(37,99,235,0.5)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 0 28px rgba(37,99,235,0.3)' }}>
              Get Started →
            </motion.button>
            <p className="text-[11px]" style={{ color: '#374151' }}>Takes about 3 minutes · 5 steps</p>
          </motion.div>
        </motion.div>
      </div>
    </Screen>
  );
}

/* ── Step 1: Basic Info ── */
function Step1BasicInfo({ data, set, onNext, onBack, prefillEmail }) {
  const valid = (data.first_name || '').trim() && (data.last_name || '').trim()
    && (data.email || '').includes('@') && (data.password || '').length >= 6;
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-2 pb-1 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2563EB' }}>Step 1 of 5</p>
        <h2 className="text-2xl font-black text-white leading-tight">Create your account</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Basic info to get you set up</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 relative z-10">
        <div className="space-y-3 max-w-md mx-auto w-full pb-4">
          <div className="flex gap-3">
            <div className="flex-1"><Field label="First Name" value={data.first_name} onChange={v => set('first_name', v)} placeholder="Alex" required autoFocus /></div>
            <div className="flex-1"><Field label="Last Name" value={data.last_name} onChange={v => set('last_name', v)} placeholder="Johnson" required /></div>
          </div>
          <Field label="Email" value={data.email} onChange={v => set('email', v)} type="email" placeholder="you@email.com" required
            disabled={!!prefillEmail} hint={prefillEmail ? 'Pre-filled from your invite' : ''} />
          <PasswordField value={data.password} onChange={v => set('password', v)} />
          <Field label="Phone (optional)" value={data.phone} onChange={v => set('phone', v)} type="tel" placeholder="+1 (555) 000-0000" />
        </div>
      </div>
      <CTABtn label="Continue" onClick={onNext} disabled={!valid} />
    </Screen>
  );
}

/* ── Step 2: Personal Profile ── */
const GENDER_OPTS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

function Step2Profile({ data, set, onNext, onBack }) {
  const valid = data.dob && data.gender;
  const [unit, setUnit] = useState('imperial');
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-2 pb-1 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2563EB' }}>Step 2 of 5</p>
        <h2 className="text-2xl font-black text-white leading-tight">Your profile</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Helps your coach personalize everything</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 relative z-10">
        <div className="space-y-4 max-w-md mx-auto w-full pb-4">
          <Field label="Date of Birth" value={data.dob} onChange={v => set('dob', v)} type="date" required />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Gender<span className="text-blue-500 ml-1">*</span></label>
            <div className="flex flex-wrap gap-2">
              {GENDER_OPTS.map(g => <Chip key={g} label={g} selected={data.gender === g} onClick={() => set('gender', g)} />)}
            </div>
          </div>
          {/* Unit toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Units</span>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {['imperial', 'metric'].map(u => (
                <button key={u} type="button" onClick={() => setUnit(u)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all capitalize"
                  style={unit === u ? { background: '#2563EB', color: '#fff' } : { color: '#6B7280' }}>{u}</button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <Field label={unit === 'imperial' ? "Height (ft'in\")" : "Height (cm)"}
                value={data.height} onChange={v => set('height', v)} placeholder={unit === 'imperial' ? "5'10\"" : "178"} />
            </div>
            <div className="flex-1">
              <Field label={unit === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}
                value={data.current_weight} onChange={v => set('current_weight', v)} type="number" placeholder={unit === 'imperial' ? '170' : '77'} />
            </div>
          </div>
          <Field label={unit === 'imperial' ? 'Goal Weight (lbs, optional)' : 'Goal Weight (kg, optional)'}
            value={data.target_weight} onChange={v => set('target_weight', v)} type="number"
            placeholder={unit === 'imperial' ? '155' : '70'} />
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Profile Photo (optional)</label>
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px dashed rgba(255,255,255,0.09)' }}>
              <span className="text-2xl">📷</span>
              <div>
                <p className="text-xs text-white font-medium">Add a profile photo</p>
                <p className="text-[10px]" style={{ color: '#4B5563' }}>You can add this later in settings</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <CTABtn label="Continue" onClick={onNext} disabled={!valid} />
    </Screen>
  );
}

/* ── Step 3: Fitness Background ── */
const FITNESS_LEVELS = [
  { id: 'complete_beginner', emoji: '🌱', label: 'Complete Beginner', sub: 'Just starting out' },
  { id: 'beginner', emoji: '🔥', label: 'Beginner', sub: 'Some experience, not consistent' },
  { id: 'intermediate', emoji: '💪', label: 'Intermediate', sub: '1-3 years consistent training' },
  { id: 'advanced', emoji: '⚡', label: 'Advanced', sub: '3+ years of serious training' },
];
const GOALS = ['Lose Weight', 'Build Muscle', 'Get Stronger', 'Improve Endurance', 'General Health', 'Athletic Performance'];
const SESSION_DURATIONS = ['15 min', '30 min', '45 min', '60 min', '90 min+'];

function Step3Fitness({ data, set, onNext, onBack }) {
  const valid = data.fitness_level && data.primary_goal && data.training_days;
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-2 pb-1 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2563EB' }}>Step 3 of 5</p>
        <h2 className="text-2xl font-black text-white leading-tight">Your fitness background</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>So we can build the right plan</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 relative z-10">
        <div className="space-y-5 max-w-md mx-auto w-full pb-4">
          {/* Fitness level */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Current fitness level</p>
            {FITNESS_LEVELS.map(l => (
              <button key={l.id} type="button" onClick={() => set('fitness_level', l.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                style={{
                  background: data.fitness_level === l.id ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.03)',
                  border: data.fitness_level === l.id ? '1.5px solid rgba(37,99,235,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                }}>
                <span className="text-xl">{l.emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: data.fitness_level === l.id ? '#fff' : '#9CA3AF' }}>{l.label}</p>
                  <p className="text-[10px]" style={{ color: '#4B5563' }}>{l.sub}</p>
                </div>
                <div className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ background: data.fitness_level === l.id ? '#2563EB' : 'transparent', border: `2px solid ${data.fitness_level === l.id ? '#2563EB' : 'rgba(255,255,255,0.12)'}` }}>
                  {data.fitness_level === l.id && <svg viewBox="0 0 10 10" fill="none" className="w-full h-full p-0.5"><path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>}
                </div>
              </button>
            ))}
          </div>
          {/* Primary goal */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Primary goal</p>
            <div className="flex flex-wrap gap-2">
              {GOALS.map(g => <Chip key={g} label={g} selected={data.primary_goal === g} onClick={() => set('primary_goal', g)} />)}
            </div>
          </div>
          {/* Training days */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Days per week you can train</p>
            <div className="flex gap-2">
              {[1,2,3,4,5,6,7].map(d => (
                <button key={d} type="button" onClick={() => set('training_days', d)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: data.training_days === d ? 'rgba(37,99,235,0.15)' : 'rgba(255,255,255,0.04)',
                    border: data.training_days === d ? '1.5px solid rgba(37,99,235,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                    color: data.training_days === d ? '#fff' : '#4B5563',
                  }}>{d}</button>
              ))}
            </div>
          </div>
          {/* Session length */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Time per session</p>
            <div className="flex flex-wrap gap-2">
              {SESSION_DURATIONS.map(d => <Chip key={d} label={d} selected={data.session_length === d} onClick={() => set('session_length', d)} />)}
            </div>
          </div>
          {/* Injuries */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Injuries or limitations (optional)</label>
            <textarea value={data.injuries || ''} onChange={e => set('injuries', e.target.value)} rows={2}
              placeholder="e.g. lower back pain, bad knee..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none bg-[#111] placeholder-[#2E2E3A]"
              style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.45)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
          </div>
        </div>
      </div>
      <CTABtn label="Continue" onClick={onNext} disabled={!valid} />
    </Screen>
  );
}

/* ── Step 4: Nutrition Preferences ── */
const DIET_PREFS = ['No Restriction', 'Vegetarian', 'Vegan', 'Gluten Free', 'Dairy Free', 'Keto', 'Paleo', 'Halal', 'Kosher'];
const MACRO_COMFORT = ['Not at all', 'Somewhat', 'Very comfortable'];

function Step4Nutrition({ data, set, onNext, onBack }) {
  const diets = data.dietary_prefs || [];
  const toggleDiet = d => {
    if (d === 'No Restriction') { set('dietary_prefs', ['No Restriction']); return; }
    const without = diets.filter(x => x !== 'No Restriction');
    set('dietary_prefs', without.includes(d) ? without.filter(x => x !== d) : [...without, d]);
  };
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-2 pb-1 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2563EB' }}>Step 4 of 5</p>
        <h2 className="text-2xl font-black text-white leading-tight">Nutrition preferences</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>So your coach can build the right meal plan</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 relative z-10">
        <div className="space-y-5 max-w-md mx-auto w-full pb-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Dietary preferences</p>
            <div className="flex flex-wrap gap-2">
              {DIET_PREFS.map(d => <Chip key={d} label={d} selected={diets.includes(d)} onClick={() => toggleDiet(d)} />)}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Food allergies (optional)</label>
            <textarea value={data.allergies || ''} onChange={e => set('allergies', e.target.value)} rows={2}
              placeholder="e.g. peanuts, shellfish, tree nuts..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none bg-[#111] placeholder-[#2E2E3A]"
              style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.45)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Foods you dislike (optional)</label>
            <textarea value={data.disliked_foods || ''} onChange={e => set('disliked_foods', e.target.value)} rows={2}
              placeholder="e.g. fish, broccoli, tofu..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm resize-none focus:outline-none bg-[#111] placeholder-[#2E2E3A]"
              style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
              onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.45)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4B5563' }}>Comfortable tracking macros?</p>
            <div className="flex gap-2">
              {MACRO_COMFORT.map(m => <Chip key={m} label={m} selected={data.macro_comfort === m} onClick={() => set('macro_comfort', m)} />)}
            </div>
          </div>
        </div>
      </div>
      <CTABtn label="Continue" onClick={onNext} />
    </Screen>
  );
}

/* ── Step 5: Notifications ── */
function Step5Notifications({ data, set, onNext, onBack, loading }) {
  return (
    <Screen>
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-2 pb-1 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#2563EB' }}>Step 5 of 5</p>
        <h2 className="text-2xl font-black text-white leading-tight">Stay in the loop</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Notification preferences — change anytime</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 relative z-10">
        <div className="space-y-4 max-w-md mx-auto w-full pb-4">
          {[
            { key: 'notif_workouts', label: '💪 Workout reminders' },
            { key: 'notif_checkin', label: '📋 Check-in reminders' },
            { key: 'notif_messages', label: '💬 Coach message notifications' },
            { key: 'notif_progress', label: '🎉 Progress milestone alerts' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-3 px-4 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
              <span className="text-sm text-white">{label}</span>
              <Toggle checked={data[key] !== false} onChange={v => set(key, v)} />
            </div>
          ))}
          <div className="py-3 px-4 rounded-xl text-sm text-center"
            style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)', color: '#6B7280' }}>
            You can change these anytime in your profile settings
          </div>
        </div>
      </div>
      <CTABtn label="Finish Setup 🎉" onClick={onNext} loading={loading} />
    </Screen>
  );
}

/* ── Welcome Complete ── */
function StepComplete({ firstName, client }) {
  useEffect(() => {
    // Confetti burst
    const end = Date.now() + 2000;
    const frame = () => {
      canvas({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2563EB', '#7C3AED', '#10B981'] });
      canvas({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2563EB', '#7C3AED', '#F59E0B'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, []);

  const goToPortal = () => { window.location.href = '/portal'; };

  return (
    <Screen bg="from-[#030714] to-[#0A0A14]">
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div className="flex flex-col items-center gap-7 text-center w-full max-w-sm"
          initial="hidden" animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12 } } }}>
          <motion.div variants={{ hidden: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, delay: 0.1 } } }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
            style={{ background: 'rgba(37,99,235,0.12)', border: '2px solid rgba(37,99,235,0.3)' }}>
            🎉
          </motion.div>
          <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>You're all set!</p>
            <h2 className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>
              Welcome, {firstName || 'there'}! 🎉
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
              Your coach has been notified and will reach out soon.
            </p>
          </motion.div>

          {/* What's waiting */}
          <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            className="w-full rounded-2xl overflow-hidden"
            style={{ background: 'rgba(37,99,235,0.07)', border: '1.5px solid rgba(37,99,235,0.15)' }}>
            <div className="px-4 py-3 border-b border-white/5">
              <p className="text-xs font-bold text-white">What's waiting for you</p>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {[
                { icon: '💪', text: 'Your program will be ready soon', color: '#2563EB' },
                { icon: '🥗', text: 'Nutrition plan coming from your coach', color: '#10B981' },
                { icon: '📋', text: 'First check-in due this week', color: '#F59E0B' },
              ].map(({ icon, text, color }) => (
                <div key={text} className="flex items-center gap-3">
                  <span className="text-base flex-shrink-0">{icon}</span>
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="w-full">
            <motion.button onClick={goToPortal} type="button"
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="w-full py-4 rounded-2xl text-white font-bold text-base"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 0 32px rgba(37,99,235,0.35)' }}>
              Go to My Dashboard →
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </Screen>
  );
}

/* ── Main Page ── */
const TOTAL_STEPS = 5;
const STEP_ORDER = ['welcome', 1, 2, 3, 4, 5, 'complete'];

export default function ClientInviteJoin() {
  const { code } = useParams();
  const [step, setStep] = useState('welcome');
  const [dir, setDir] = useState(1);
  const [data, setData] = useState({ training_days: 4 });
  const [coachInfo, setCoachInfo] = useState(null); // { name, welcome_message }
  const [saving, setSaving] = useState(false);

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);

  // Try to fetch invite code metadata from a Client record with a matching invite code
  useEffect(() => {
    if (!code) return;
    // Look up the client record that has this invite code in notes or a tag
    // We store invite info in the URL params as a fallback
    const params = new URLSearchParams(window.location.search);
    const coachName = params.get('coach') || params.get('name') || '';
    const welcome = params.get('welcome') || '';
    const email = params.get('email') || '';
    if (coachName || email) {
      setCoachInfo({ name: decodeURIComponent(coachName), welcome_message: decodeURIComponent(welcome) });
      if (email) set('email', decodeURIComponent(email));
    }
  }, [code]);

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) { setDir(1); setStep(STEP_ORDER[idx + 1]); }
  };
  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) { setDir(-1); setStep(STEP_ORDER[idx - 1]); }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save onboarding response
      await base44.entities.OnboardingResponse.create({
        name: [data.first_name, data.last_name].filter(Boolean).join(' '),
        email: data.email,
        phone: data.phone,
        age: data.dob ? undefined : undefined,
        height: data.height,
        current_weight: data.current_weight ? Number(data.current_weight) : undefined,
        goal: data.primary_goal || 'general_fitness',
        activity_level: data.fitness_level,
        training_days_per_week: data.training_days,
        previous_experience: data.fitness_level,
        food_preferences: [
          data.dietary_prefs?.length ? `Diet: ${data.dietary_prefs.join(', ')}` : '',
          data.allergies ? `Allergies: ${data.allergies}` : '',
          data.disliked_foods ? `Dislikes: ${data.disliked_foods}` : '',
          data.macro_comfort ? `Macros: ${data.macro_comfort}` : '',
        ].filter(Boolean).join(' | '),
        health_conditions: data.injuries || '',
        schedule_preferences: [
          data.session_length ? `Session: ${data.session_length}` : '',
          data.training_days ? `Days/week: ${data.training_days}` : '',
        ].filter(Boolean).join(' | '),
        coach_id: coachInfo?.coach_id || code || '',
        status: 'pending',
      });

      // Try to update the matching Client record if exists
      try {
        const clients = await base44.entities.Client.filter({ email: data.email });
        if (clients && clients.length > 0) {
          await base44.entities.Client.update(clients[0].id, {
            height: data.height,
            current_weight: data.current_weight ? Number(data.current_weight) : undefined,
            target_weight: data.target_weight ? Number(data.target_weight) : undefined,
            goal: data.primary_goal?.toLowerCase().replace(/ /g, '_') || undefined,
          });
        }
      } catch (_) { /* silent */ }

      goNext();
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const props = { data, set, onNext: goNext, onBack: goBack };
  const stepNum = typeof step === 'number' ? step : null;

  const renderStep = () => {
    switch (step) {
      case 'welcome': return <StepWelcome coachName={coachInfo?.name} coachWelcome={coachInfo?.welcome_message} onStart={goNext} />;
      case 1: return <Step1BasicInfo {...props} prefillEmail={!!new URLSearchParams(window.location.search).get('email')} />;
      case 2: return <Step2Profile {...props} />;
      case 3: return <Step3Fitness {...props} />;
      case 4: return <Step4Nutrition {...props} />;
      case 5: return <Step5Notifications {...props} onNext={handleFinish} loading={saving} />;
      case 'complete': return <StepComplete firstName={data.first_name} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A14' }}>
      {/* Progress bar for steps 1-5 */}
      {stepNum !== null && <ProgressBar step={stepNum} total={TOTAL_STEPS} />}

      {/* Step counter for steps 1-5 */}
      {stepNum !== null && step !== 'complete' && (
        <div className="absolute top-4 right-5 z-50">
          <span className="text-[10px] font-bold" style={{ color: '#374151' }}>{stepNum} / {TOTAL_STEPS}</span>
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={String(step)} custom={dir}
          variants={step === 'welcome' || step === 'complete' ? {} : slideVariants}
          initial={step === 'welcome' || step === 'complete' ? { opacity: 0 } : 'enter'}
          animate={step === 'welcome' || step === 'complete' ? { opacity: 1 } : 'center'}
          exit={step === 'welcome' || step === 'complete' ? { opacity: 0 } : 'exit'}
          transition={slideTrans}
          className="absolute inset-0">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}