import React from 'react';
import ReactDOM from 'react-dom';
import { X, Sparkles, Dumbbell, Salad, Target, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

const BENEFITS = [
  {
    icon: Dumbbell,
    color: 'var(--tc-primary)',
    bg: 'color-mix(in srgb, var(--tc-primary) 12%, transparent)',
    title: 'Tailored training program',
    desc: 'AI builds a full starting program matched to the client\'s goal, experience, and schedule.',
  },
  {
    icon: Salad,
    color: 'var(--tc-success)',
    bg: 'color-mix(in srgb, var(--tc-success) 12%, transparent)',
    title: 'Personalised meal plan',
    desc: 'A structured nutrition plan aligned with their macros, diet style, and calorie target.',
  },
  {
    icon: Target,
    color: 'var(--tc-ai)',
    bg: 'color-mix(in srgb, var(--tc-ai) 12%, transparent)',
    title: 'Built from their real data',
    desc: 'Uses the client\'s goals, weight, height, and questionnaire answers — not a generic template.',
  },
  {
    icon: ShieldCheck,
    color: 'var(--tc-warning)',
    bg: 'color-mix(in srgb, var(--tc-warning) 12%, transparent)',
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
      <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, black 65%, transparent)', backdropFilter: 'blur(4px)' }} />

      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: 'var(--tc-sidebar)', maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
          style={{ background: 'color-mix(in srgb, white 8%, transparent)', color: 'color-mix(in srgb, white 50%, transparent)' }}
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── HEADER (fixed) ── */}
        <div className="relative px-7 pt-8 pb-6 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--tc-foreground) 0%, var(--kc-1a2744) 100%)', flexShrink: 0 }}>
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, var(--tc-ai), transparent 70%)' }} />
          <div className="absolute -bottom-10 -left-6 w-36 h-36 rounded-full opacity-15"
            style={{ background: 'radial-gradient(circle, var(--tc-primary), transparent 70%)' }} />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-4"
            style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--tc-primary) 30%, transparent), color-mix(in srgb, var(--tc-ai) 30%, transparent))', border: '1px solid color-mix(in srgb, var(--tc-ai) 40%, transparent)' }}>
            <Sparkles className="w-3 h-3" style={{ color: 'var(--tc-ai)' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--tc-ai)' }}>Pro &amp; Elite Feature</span>
          </div>

          <h2 className="text-2xl font-bold text-white leading-tight mb-2">
            Onboard any client<br />in minutes with AI
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'color-mix(in srgb, white 55%, transparent)' }}>
            Generate a fully personalised starting training program and meal plan — tailored to your client's goals and profile — in one guided flow.
          </p>
        </div>

        {/* ── SCROLLABLE MIDDLE ── */}
        <div style={{ flex: '1 1 0', overflowY: 'auto', minHeight: 0 }}>
          {/* Benefits */}
          <div className="px-7 py-5 space-y-3" style={{ background: 'var(--tc-sidebar)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'color-mix(in srgb, white 30%, transparent)' }}>What you get</p>
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
                    <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'color-mix(in srgb, white 45%, transparent)' }}>{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* How it works */}
          <div className="px-7 py-5" style={{ background: 'var(--tc-sidebar)', borderTop: '1px solid color-mix(in srgb, white 6%, transparent)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'color-mix(in srgb, white 30%, transparent)' }}>How it works</p>
            <div className="flex items-start gap-0">
              {STEPS.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center text-center relative">
                  {i < STEPS.length - 1 && (
                    <div className="absolute top-4 left-1/2 right-0 h-px"
                      style={{ background: 'linear-gradient(90deg, color-mix(in srgb, var(--tc-primary) 50%, transparent), color-mix(in srgb, var(--tc-primary) 10%, transparent))' }} />
                  )}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 mb-2"
                    style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))', color: 'var(--tc-card)' }}>
                    {s.n}
                  </div>
                  <p className="text-[11px] font-semibold text-white leading-tight px-1">{s.label}</p>
                  <p className="text-[9px] mt-0.5 px-1 leading-tight" style={{ color: 'color-mix(in srgb, white 35%, transparent)' }}>{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER (fixed) ── */}
        <div className="px-7 py-5 space-y-3" style={{ background: 'var(--tc-sidebar)', borderTop: '1px solid color-mix(in srgb, white 6%, transparent)', flexShrink: 0 }}>
          {canUse ? (
            <button
              onClick={onGetStarted}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' }}
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
                style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' }}
              >
                <Zap className="w-4 h-4" />
                Upgrade to Pro
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-center text-[10px]" style={{ color: 'color-mix(in srgb, white 30%, transparent)' }}>
                Available on Pro and Elite plans
              </p>
            </>
          )}
          {canUse && (
            <p className="text-center text-[10px]" style={{ color: 'color-mix(in srgb, white 30%, transparent)' }}>
              Nothing is saved until you review and approve
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}