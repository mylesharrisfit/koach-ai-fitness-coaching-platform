import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, TrendingUp } from 'lucide-react';
import KoachLogo from '@/components/brand/KoachLogo';
import { useAuth } from '@/lib/AuthContext';

const features = [
  { icon: Users, label: 'Client Management' },
  { icon: Zap, label: 'AI Automations' },
  { icon: TrendingUp, label: 'Business Analytics' },
];

export default function WelcomeScreen({ onNext }) {
  const { navigateToLogin } = useAuth();
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden" style={{ background: 'var(--tc-sidebar)' }}>
      {/* Cinematic ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-[0.12]"
          style={{ background: 'radial-gradient(ellipse, var(--tc-primary) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] opacity-[0.05]"
          style={{ background: 'radial-gradient(ellipse, var(--tc-primary) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Logo */}
        <motion.div
          variants={{ hidden: { opacity: 0, scale: 0.7 }, show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.32, 0.72, 0, 1] } } }}
        >
          <KoachLogo size={72} rounded="rounded-2xl" glow bg />
        </motion.div>

        {/* Headline */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 28 }, show: { opacity: 1, y: 0, transition: { duration: 0.65 } } }}
          className="space-y-4"
        >
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold" style={{ color: 'var(--tc-primary)' }}>
            KOACH AI · Coaching OS
          </p>
          <h1 className="font-bold text-white leading-[1.05]"
            style={{ fontSize: 'clamp(2.4rem, 9vw, 3.8rem)', letterSpacing: '-0.035em' }}>
            Build your<br />coaching system.
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'var(--kc-6b6b6b)' }}>
            The AI operating system built for modern fitness coaches. Automate clients, nutrition, programming, and revenue — in one platform.
          </p>
        </motion.div>

        {/* Feature row */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="flex items-center justify-center gap-6"
        >
          {features.map((feat) => {
            const FeatIcon = feat.icon;
            return (
            <div key={feat.label} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'color-mix(in srgb, var(--tc-primary) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--tc-primary) 20%, transparent)' }}>
                <FeatIcon className="w-4 h-4" style={{ color: 'var(--tc-primary)' }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: 'var(--kc-555555)' }}>{feat.label}</span>
            </div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
          className="w-full space-y-3"
        >
          <motion.button
            onClick={onNext}
            whileHover={{ scale: 1.02, boxShadow: '0 0 40px color-mix(in srgb, var(--tc-primary) 50%, transparent)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-primary-foreground font-bold text-base flex items-center justify-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-primary))', boxShadow: '0 0 28px color-mix(in srgb, var(--tc-primary) 30%, transparent)' }}
          >
            Start Free Trial
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <p className="text-xs" style={{ color: 'var(--kc-3a3a3a)' }}>
            Card required · No charge for 30 days · Cancel anytime
          </p>
          <button
            onClick={() => navigateToLogin()}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: 'transparent', border: '1.5px solid color-mix(in srgb, white 8%, transparent)', color: 'var(--kc-666666)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, white 20%, transparent)'; e.currentTarget.style.color = 'var(--kc-999999)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'color-mix(in srgb, white 8%, transparent)'; e.currentTarget.style.color = 'var(--kc-666666)'; }}
          >
            Already have an account? Log In
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}