import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import KoachLogo from '@/components/brand/KoachLogo.jsx';
import canvas from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   Slide animation
───────────────────────────────────────── */
const slideVariants = {
  enter: dir => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: dir => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
};
const slideTrans = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.36 };

const TOTAL_STEPS = 5;
const STEP_ORDER = [1, 2, 3, 4, 5, 'complete'];

/* ─────────────────────────────────────────
   Shared primitives
───────────────────────────────────────── */
function Screen({ children }) {
  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A14] relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', filter: 'blur(70px)' }} />
      {children}
    </div>
  );
}

function TopBar({ step, onSkip }) {
  return (
    <div className="flex-shrink-0 relative z-20">
      {/* Progress bar */}
      <div className="h-[3px] w-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full" style={{ background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
          animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }} transition={{ duration: 0.4, ease: 'easeInOut' }} />
      </div>
      <div className="flex items-center justify-between px-5 pt-4 pb-1">
        <KoachLogo size={28} rounded="rounded-lg" glow={false} bg />
        <button onClick={onSkip} className="text-xs font-medium transition-colors"
          style={{ color: '#374151' }}
          onMouseEnter={e => e.target.style.color = '#9CA3AF'}
          onMouseLeave={e => e.target.style.color = '#374151'}>
          Skip setup
        </button>
      </div>
    </div>
  );
}

function StepLabel({ step }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: '#2563EB' }}>
      Step {step} of {TOTAL_STEPS}
    </p>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, disabled, required, autoFocus, hint, rows }) {
  const isTA = rows > 1;
  const baseClass = "w-full px-4 py-3.5 rounded-xl text-white text-sm placeholder-[#2E2E3A] bg-[#111] focus:outline-none disabled:opacity-40 transition-all";
  const style = { border: '1.5px solid rgba(255,255,255,0.07)' };
  const onFocus = e => { e.target.style.borderColor = 'rgba(37,99,235,0.55)'; };
  const onBlur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; };
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
        {label}{required && <span className="text-blue-500 ml-1">*</span>}
      </label>}
      {isTA ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={rows}
          placeholder={placeholder} style={style} onFocus={onFocus} onBlur={onBlur}
          className={`${baseClass} resize-none`} />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} autoFocus={autoFocus}
          style={style} onFocus={onFocus} onBlur={onBlur} className={baseClass} />
      )}
      {hint && <p className="text-[10px]" style={{ color: '#374151' }}>{hint}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options, required }) {
  return (
    <div className="space-y-1.5">
      {label && <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
        {label}{required && <span className="text-blue-500 ml-1">*</span>}
      </label>}
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3.5 rounded-xl text-sm bg-[#111] focus:outline-none transition-all appearance-none"
        style={{ border: '1.5px solid rgba(255,255,255,0.07)', color: value ? '#fff' : '#2E2E3A' }}>
        <option value="" disabled style={{ color: '#2E2E3A' }}>Select…</option>
        {options.map(o => (
          <option key={o.value || o} value={o.value || o} style={{ color: '#fff', background: '#111' }}>
            {o.label || o}
          </option>
        ))}
      </select>
    </div>
  );
}

function PasswordField({ value, onChange }) {
  const [show, setShow] = useState(false);
  const strength = !value ? 0 : value.length < 6 ? 1 : value.length < 10 ? 2 : /[A-Z]/.test(value) && /[0-9]/.test(value) ? 4 : 3;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#EF4444', '#F59E0B', '#10B981', '#10B981'];
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
        Password<span className="text-blue-500 ml-1">*</span>
      </label>
      <div className="relative">
        <input type={show ? 'text' : 'password'} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="Create a secure password"
          className="w-full px-4 py-3.5 pr-14 rounded-xl text-white text-sm placeholder-[#2E2E3A] bg-[#111] focus:outline-none transition-all"
          style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
          onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.55)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold" style={{ color: '#4B5563' }}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {value && (
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex gap-1 flex-1">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all"
                style={{ background: i <= strength ? colors[strength] : 'rgba(255,255,255,0.08)' }} />
            ))}
          </div>
          <span className="text-[10px] font-semibold" style={{ color: colors[strength] }}>{labels[strength]}</span>
        </div>
      )}
    </div>
  );
}

function Chip({ label, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3.5 py-2 rounded-xl text-sm font-medium transition-all"
      style={{
        background: selected ? 'rgba(37,99,235,0.12)' : 'rgba(255,255,255,0.04)',
        border: selected ? '1.5px solid rgba(37,99,235,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
        color: selected ? '#fff' : '#6B7280',
      }}>
      {label}
    </button>
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
        {loading ? 'Saving…' : label}
      </motion.button>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-sm font-medium px-5 pt-2 pb-1 relative z-10 flex-shrink-0"
      style={{ color: '#4B5563' }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
        <path d="M10 3L6 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

/* ─────────────────────────────────────────
   STEP 1 — Create Account
───────────────────────────────────────── */
function Step1Account({ data, set, onNext, onBack, onSkip }) {
  const valid = data.first_name?.trim() && data.last_name?.trim()
    && data.email?.includes('@') && (data.password || '').length >= 6;
  return (
    <Screen>
      <TopBar step={1} onSkip={onSkip} />
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-1 pb-2 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <StepLabel step={1} />
        <h2 className="text-2xl font-black text-white leading-tight">Create your account</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Get started — it only takes a minute</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10">
        <div className="space-y-3 max-w-md mx-auto w-full pb-4">
          <div className="flex gap-3">
            <div className="flex-1"><Field label="First Name" value={data.first_name} onChange={v => set('first_name', v)} placeholder="Alex" required autoFocus /></div>
            <div className="flex-1"><Field label="Last Name" value={data.last_name} onChange={v => set('last_name', v)} placeholder="Johnson" required /></div>
          </div>
          <Field label="Email Address" value={data.email} onChange={v => set('email', v)} type="email" placeholder="you@email.com" required />
          <PasswordField value={data.password} onChange={v => set('password', v)} />
          <Field label="Phone Number (optional)" value={data.phone} onChange={v => set('phone', v)} type="tel" placeholder="+1 (555) 000-0000" />
        </div>
      </div>
      <CTABtn label="Continue →" onClick={onNext} disabled={!valid} />
    </Screen>
  );
}

/* ─────────────────────────────────────────
   STEP 2 — Coaching Business
───────────────────────────────────────── */
const SPECIALTIES = [
  'Weight Loss', 'Muscle Building', 'Athletic Performance', 'General Fitness',
  'Nutrition Coaching', 'Online Coaching', 'Bodybuilding / Competition',
  'Youth Athletics', 'Senior Fitness', 'Other',
];
const EXPERIENCE_OPTS = [
  'Just starting out', '1–2 years', '3–5 years', '5–10 years', '10+ years',
];
const CLIENT_COUNT_OPTS = [
  '0 (just getting started)', '1–5', '6–15', '16–30', '30+',
];
const CURRENT_TOOLS = [
  'Spreadsheets / Google Sheets', 'Trainerize', 'Everfit', 'TrueCoach',
  'Paper / manual', 'Another app', "I'm just starting out",
];

function Step2Business({ data, set, onNext, onBack, onSkip }) {
  const specialties = data.specialties || [];
  const tools = data.current_tools || [];
  const toggleArr = (key, arr, val) => {
    set(key, arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  };
  const valid = data.business_name?.trim() && specialties.length > 0 && data.experience && data.client_count;
  return (
    <Screen>
      <TopBar step={2} onSkip={onSkip} />
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-1 pb-2 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <StepLabel step={2} />
        <h2 className="text-2xl font-black text-white leading-tight">Your coaching business</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Tell us about your practice</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10">
        <div className="space-y-5 max-w-md mx-auto w-full pb-4">
          <Field label="Business / Coaching Name" value={data.business_name} onChange={v => set('business_name', v)}
            placeholder="e.g. Myles Harris Fitness" required />

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
              Coaching Specialty<span className="text-blue-500 ml-1">*</span>
            </p>
            <p className="text-[10px]" style={{ color: '#374151' }}>Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES.map(s => (
                <Chip key={s} label={s} selected={specialties.includes(s)} onClick={() => toggleArr('specialties', specialties, s)} />
              ))}
            </div>
          </div>

          <SelectField label="Years of Experience" value={data.experience} onChange={v => set('experience', v)}
            options={EXPERIENCE_OPTS} required />

          <SelectField label="Current Client Count" value={data.client_count} onChange={v => set('client_count', v)}
            options={CLIENT_COUNT_OPTS} required />

          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>
              Where do you currently manage clients?
            </p>
            <p className="text-[10px]" style={{ color: '#374151' }}>Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {CURRENT_TOOLS.map(t => (
                <Chip key={t} label={t} selected={tools.includes(t)} onClick={() => toggleArr('current_tools', tools, t)} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <CTABtn label="Continue →" onClick={onNext} disabled={!valid} />
    </Screen>
  );
}

/* ─────────────────────────────────────────
   STEP 3 — Coaching Profile
───────────────────────────────────────── */
const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Moscow',
  'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Australia/Sydney', 'Pacific/Auckland',
];

function Step3Profile({ data, set, onNext, onBack, onSkip }) {
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    set('avatar_url', file_url);
    setUploading(false);
  };

  return (
    <Screen>
      <TopBar step={3} onSkip={onSkip} />
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-1 pb-2 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <StepLabel step={3} />
        <h2 className="text-2xl font-black text-white leading-tight">Your coaching profile</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Clients will see this on your profile</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10">
        <div className="space-y-4 max-w-md mx-auto w-full pb-4">
          {/* Photo upload */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Profile Photo (optional)</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px dashed rgba(255,255,255,0.12)' }}>
                {data.avatar_url
                  ? <img src={data.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  : <span className="text-2xl">📷</span>}
              </div>
              <div>
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.3)', color: '#93C5FD' }}>
                  {uploading ? 'Uploading…' : data.avatar_url ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-[10px] mt-1" style={{ color: '#374151' }}>You can skip and add later</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>
            </div>
          </div>

          <Field label="Short Bio" value={data.bio} onChange={v => set('bio', v)} rows={3}
            placeholder="Tell clients about yourself and your coaching style…" />

          <Field label="Certifications" value={data.certifications} onChange={v => set('certifications', v)}
            placeholder="e.g. NASM CPT, ACE, ISSA, CrossFit L2…" />

          <Field label="Instagram Handle (optional)" value={data.instagram} onChange={v => set('instagram', v)}
            placeholder="@yourhandle" />

          <Field label="Website (optional)" value={data.website} onChange={v => set('website', v)}
            type="url" placeholder="https://yourwebsite.com" />

          <SelectField label="Timezone" value={data.timezone} onChange={v => set('timezone', v)}
            options={TIMEZONES.map(tz => ({ value: tz, label: tz.replace('_', ' ') }))} />
        </div>
      </div>
      <CTABtn label="Continue →" onClick={onNext} />
    </Screen>
  );
}

/* ─────────────────────────────────────────
   STEP 4 — Business Setup
───────────────────────────────────────── */
function Step4Business({ data, set, onNext, onBack, onSkip }) {
  const paymentMethod = data.payment_method || '';
  return (
    <Screen>
      <TopBar step={4} onSkip={onSkip} />
      <BackBtn onClick={onBack} />
      <div className="px-5 pt-1 pb-2 flex-shrink-0 max-w-md mx-auto w-full relative z-10">
        <StepLabel step={4} />
        <h2 className="text-2xl font-black text-white leading-tight">Set up your business</h2>
        <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Payments and packages</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-2 relative z-10">
        <div className="space-y-5 max-w-md mx-auto w-full pb-4">
          {/* Monthly rate */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>Monthly Rate per Client</p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold" style={{ color: '#4B5563' }}>$</span>
              <input type="number" value={data.monthly_rate || ''} onChange={e => set('monthly_rate', e.target.value)}
                placeholder="150"
                className="w-full pl-8 pr-16 py-3.5 rounded-xl text-white text-sm bg-[#111] focus:outline-none transition-all"
                style={{ border: '1.5px solid rgba(255,255,255,0.07)' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(37,99,235,0.55)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; }} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#4B5563' }}>/mo</span>
            </div>
            <button type="button" onClick={() => set('monthly_rate', '')}
              className="text-xs underline underline-offset-2 transition-colors" style={{ color: '#374151' }}>
              I'll set this up later
            </button>
          </div>

          {/* Packages toggle */}
          <div className="flex items-center justify-between py-3 px-4 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.06)' }}>
            <div>
              <p className="text-sm font-semibold text-white">Offer different packages?</p>
              <p className="text-[11px]" style={{ color: '#4B5563' }}>E.g. 1-month, 3-month, custom</p>
            </div>
            <button type="button" onClick={() => set('has_packages', !data.has_packages)}
              className="w-11 h-6 rounded-full transition-all relative flex-shrink-0"
              style={{ background: data.has_packages ? '#2563EB' : 'rgba(255,255,255,0.1)' }}>
              <motion.div className="w-4 h-4 rounded-full bg-white absolute top-1"
                animate={{ left: data.has_packages ? '24px' : '4px' }} transition={{ type: 'spring', stiffness: 400 }} />
            </button>
          </div>
          {data.has_packages && (
            <p className="text-xs px-1" style={{ color: '#6B7280' }}>
              ✓ You can set up packages and pricing tiers after signup in your Settings.
            </p>
          )}

          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: '#4B5563' }}>How do you want to get paid?</p>
            {[
              { value: 'stripe', label: '⚡ Stripe', sub: 'Recommended — automatic billing, receipts, payment tracking' },
              { value: 'manual', label: '💸 Manual', sub: 'Venmo, Zelle, cash — you collect payments yourself' },
              { value: 'later', label: '🕐 Set up later', sub: "I'll configure this after I get started" },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => set('payment_method', opt.value)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all"
                style={{
                  background: paymentMethod === opt.value ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.03)',
                  border: paymentMethod === opt.value ? '1.5px solid rgba(37,99,235,0.55)' : '1.5px solid rgba(255,255,255,0.07)',
                }}>
                <div className="w-4 h-4 rounded-full mt-0.5 flex-shrink-0 flex items-center justify-center"
                  style={{ border: `2px solid ${paymentMethod === opt.value ? '#2563EB' : 'rgba(255,255,255,0.15)'}`, background: paymentMethod === opt.value ? '#2563EB' : 'transparent' }}>
                  {paymentMethod === opt.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#4B5563' }}>{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      <CTABtn label="Continue →" onClick={onNext} />
    </Screen>
  );
}

/* ─────────────────────────────────────────
   STEP 5 — All Set / Complete
───────────────────────────────────────── */
const CHECKLIST = [
  { label: 'Account created', done: true },
  { label: 'Add your first client', done: false },
  { label: 'Build your first program', done: false },
  { label: 'Connect Stripe payments', done: false },
  { label: 'Customize your profile', done: false },
];

function StepComplete({ firstName, loading }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const end = Date.now() + 2500;
    const frame = () => {
      canvas({ particleCount: 7, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#2563EB', '#7C3AED', '#10B981', '#F59E0B'] });
      canvas({ particleCount: 7, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#2563EB', '#7C3AED', '#10B981', '#F59E0B'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [loading]);

  const go = (path) => {
    localStorage.setItem('koach_onboarding_complete', '1');
    localStorage.setItem('koach_banner_dismissed', '0');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0A0A14] px-6 overflow-y-auto">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none opacity-[0.07]"
        style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', filter: 'blur(80px)' }} />

      <motion.div className="flex flex-col items-center gap-7 text-center w-full max-w-sm relative z-10 py-12"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}>

        <motion.div variants={{ hidden: { scale: 0, opacity: 0 }, show: { scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 200, delay: 0.1 } } }}>
          <KoachLogo size={72} rounded="rounded-2xl" glow bg />
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#10B981' }}>Welcome aboard 🎉</p>
          <h2 className="text-4xl font-black text-white" style={{ letterSpacing: '-0.03em' }}>
            Welcome to KOACH AI,<br />{firstName || 'Coach'}!
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Your coaching OS is ready — let's build something great.
          </p>
        </motion.div>

        {/* Checklist */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
          className="w-full rounded-2xl overflow-hidden text-left"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-xs font-bold text-white">Quick start checklist</p>
          </div>
          <div className="px-4 py-3 space-y-3">
            {CHECKLIST.map(({ label, done }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ background: done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${done ? '#10B981' : 'rgba(255,255,255,0.1)'}` }}>
                  {done ? <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6L5 9L10 3" stroke="#10B981" strokeWidth="2" strokeLinecap="round" /></svg>
                    : <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }} />}
                </div>
                <span className="text-sm" style={{ color: done ? '#fff' : '#6B7280' }}>{label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="w-full space-y-3">
          <motion.button onClick={() => go('/')} type="button"
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-white font-bold text-base"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 0 32px rgba(37,99,235,0.35)' }}>
            Go to Dashboard →
          </motion.button>
          <button onClick={() => go('/')} className="text-xs w-full text-center transition-colors"
            style={{ color: '#374151' }}>
            Complete setup later
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function ClientInviteJoin() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState({});
  const [saving, setSaving] = useState(false);

  const set = useCallback((k, v) => setData(d => ({ ...d, [k]: v })), []);

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx < STEP_ORDER.length - 1) { setDir(1); setStep(STEP_ORDER[idx + 1]); }
  };
  const goBack = () => {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) { setDir(-1); setStep(STEP_ORDER[idx - 1]); }
  };
  const onSkip = () => {
    localStorage.setItem('koach_onboarding_complete', '1');
    navigate('/');
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // Save profile data to user record
      const updateData = {
        onboarding_complete: true,
        business_name: data.business_name,
        coaching_specialties: data.specialties,
        coaching_experience: data.experience,
        current_client_count: data.client_count,
        bio: data.bio,
        certifications: data.certifications,
        instagram: data.instagram,
        website: data.website,
        timezone: data.timezone,
        monthly_rate: data.monthly_rate ? Number(data.monthly_rate) : undefined,
        payment_method: data.payment_method,
        phone: data.phone,
        avatar_url: data.avatar_url,
      };
      await base44.auth.updateMe(updateData);

      // Save to CoachSettings if possible
      try {
        const existing = await base44.entities.CoachSettings.list();
        const settingsData = {
          zapier_connected: false,
          google_calendar_connected: false,
        };
        if (existing.length > 0) {
          await base44.entities.CoachSettings.update(existing[0].id, settingsData);
        } else {
          await base44.entities.CoachSettings.create(settingsData);
        }
      } catch (_) { /* silent */ }

      goNext();
    } catch (e) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const sharedProps = { data, set, onNext: goNext, onBack: goBack, onSkip };

  const renderStep = () => {
    if (step === 'complete') return <StepComplete firstName={data.first_name} loading={saving} />;
    switch (step) {
      case 1: return <Step1Account {...sharedProps} />;
      case 2: return <Step2Business {...sharedProps} />;
      case 3: return <Step3Profile {...sharedProps} />;
      case 4: return <Step4Business {...sharedProps} onNext={handleFinish} loading={saving} />;
      default: return null;
    }
  };

  if (step === 'complete') {
    return (
      <AnimatePresence>
        <motion.div key="complete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0">
          <StepComplete firstName={data.first_name} loading={saving} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ background: '#0A0A14' }}>
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div key={step} custom={dir}
          variants={slideVariants}
          initial="enter" animate="center" exit="exit"
          transition={slideTrans}
          className="absolute inset-0">
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}