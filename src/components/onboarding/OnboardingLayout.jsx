import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';

const stagger = {
  container: {
    initial: {},
    animate: { transition: { staggerChildren: 0.08 } },
  },
  item: {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] } },
  },
};

export default function OnboardingLayout({
  eyebrow,
  headline,
  subtext,
  children,
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled = false,
  hideNext = false,
}) {
  return (
    <div className="w-full h-full flex flex-col" style={{ background: 'var(--tc-sidebar)' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, var(--tc-primary) 0%, transparent 65%)', filter: 'blur(60px)' }} />
      </div>

      {/* Back button */}
      {onBack && (
        <div className="flex-shrink-0 pt-5 px-5 relative z-10">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: 'var(--kc-555555)' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-36 pt-6 flex flex-col max-w-lg mx-auto w-full relative z-10">
        <motion.div
          className="flex flex-col gap-8 w-full"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div variants={stagger.item} className="space-y-2">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: 'var(--tc-primary)' }}>
                {eyebrow}
              </p>
            )}
            <h2
              className="font-bold text-white leading-tight"
              style={{ fontSize: 'clamp(1.75rem, 5vw, 2.5rem)', letterSpacing: '-0.025em' }}
            >
              {headline}
            </h2>
            {subtext && (
              <p className="text-sm leading-relaxed mt-1" style={{ color: 'var(--kc-7a7a7a)' }}>
                {subtext}
              </p>
            )}
          </motion.div>

          {/* Content */}
          <motion.div variants={stagger.item} className="w-full">
            {children}
          </motion.div>
        </motion.div>
      </div>

      {/* Sticky bottom CTA */}
      {!hideNext && (
        <div
          className="fixed bottom-0 left-0 right-0 px-6 pt-4 flex flex-col gap-3 z-20"
          style={{
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
            background: 'var(--tc-sidebar)',
          }}
        >
          <div className="max-w-lg mx-auto w-full">
            <motion.button
              onClick={onNext}
              disabled={nextDisabled}
              whileHover={!nextDisabled ? { scale: 1.02, boxShadow: '0 0 35px color-mix(in srgb, var(--tc-primary) 40%, transparent)' } : {}}
              whileTap={!nextDisabled ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all"
              style={{
                background: nextDisabled ? 'color-mix(in srgb, white 6%, transparent)' : 'linear-gradient(135deg, var(--tc-primary), var(--tc-primary))',
                boxShadow: nextDisabled ? 'none' : '0 0 24px color-mix(in srgb, var(--tc-primary) 25%, transparent)',
                color: nextDisabled ? 'var(--kc-555555)' : 'var(--tc-card)',
              }}
            >
              {nextLabel}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}

export { stagger };