import React from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Dumbbell, Salad, Target, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

const BENEFITS = [
  {
    icon: Dumbbell,
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    title: 'Tailored training program',
    desc: 'AI builds a full starting program matched to the client\'s goal, experience, and schedule.',
  },
  {
    icon: Salad,
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    title: 'Personalised meal plan',
    desc: 'A structured nutrition plan aligned with their macros, diet style, and calorie target.',
  },
  {
    icon: Target,
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    title: 'Built from their real data',
    desc: 'Uses the client\'s goals, weight, height, and questionnaire answers — not a generic template.',
  },
  {
    icon: ShieldCheck,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    title: 'You approve before anything goes live',
    desc: 'Full review screen — edit, tweak, or cancel. Nothing saves until you click Approve.',
  },
];

const STEPS = [
  { n: '1', label: 'Pick a client', sub: 'Choose any existing client' },
  { n: '2', label: 'Quick questionnaire', sub: 'Training split, diet style, equipment' },
  { n: '3', label: 'AI generates the plan', sub: 'Program + meal plan in seconds' },
  { n: '4', label: 'You review & approve', sub: 'Edit anything, then save' },
];

export default function AIOnboardingOverviewModal({ canUse, onGetStarted, onUpgrade, onClose }) {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />

      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0E1525' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Hero */}
        <div className="relative px-7 pt-8 pb-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0E1525 0%, #1a2744 100%)' }}>
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #7C3AED, transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }} />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(124,58,237,0.3))', border: '1px solid rgba(124,58,237,0.4)' }}>
            <Sparkles className="w-3 h-3" style={{ color: '#A78BFA' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#A78BFA' }}>Pro &amp; Elite Feature</span>
          </div>

          <h2 className="text-2xl font-bold text-white leading-tight mb-2">
            Onboard any client<br />in minutes with AI
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Generate a fully personalised starting training program and meal plan — tailored to your client's goals and profile — in one guided flow.
          </p>
        </div>

        {/* Benefits */}
        <div className="px-7 py-5 space-y-3" style={{ background: '#111827' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>What you get</p>
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: b.bg }}>
                  <Icon className="w-4 h-4" style={{ color: b.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{b.title}</p>
                  <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* How it works */}
        <div className="px-7 py-5" style={{ background: '#0E1525', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>How it works</p>
          <div className="flex items-start gap-0">
            {STEPS.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center text-center relative">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-4 left-1/2 right-0 h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.5), rgba(37,99,235,0.1))' }} />
                )}
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 mb-2"
                  style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: '#fff' }}>
                  {s.n}
                </div>
                <p className="text-[11px] font-semibold text-white leading-tight px-1">{s.label}</p>
                <p className="text-[9px] mt-0.5 px-1 leading-tight" style={{ color: 'rgba(255,255,255,0.35)' }}>{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-7 py-5 space-y-3" style={{ background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {canUse ? (
            <button
              onClick={onGetStarted}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
            >
              <Sparkles className="w-4 h-4" />
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <>
              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Available on Pro and Elite plans
              </p>
            </>
          )}
          {canUse && (
            <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nothing is saved until you review and approve
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}