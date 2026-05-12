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
    <div className="w-full h-full flex flex-col" style={{ background: '#0A0A0A' }}>
      {/* Back button */}
      {onBack && (
        <div className="flex-shrink-0 pt-safe px-4 pt-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#7A7A7A' }}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-32 pt-8 flex flex-col max-w-lg mx-auto w-full">
        <motion.div
          className="flex flex-col gap-8 w-full"
          variants={stagger.container}
          initial="initial"
          animate="animate"
        >
          {/* Header */}
          <motion.div variants={stagger.item} className="space-y-2">
            {eyebrow && (
              <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: '#3B82F6' }}>
                {eyebrow}
              </p>
            )}
            <h2 className="text-3xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {headline}
            </h2>
            {subtext && (
              <p className="text-sm leading-relaxed" style={{ color: '#7A7A7A' }}>
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
          className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 flex flex-col gap-3"
          style={{
            background: 'linear-gradient(to top, #0A0A0A 60%, transparent)',
            paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="max-w-lg mx-auto w-full">
            <motion.button
              onClick={onNext}
              disabled={nextDisabled}
              whileHover={!nextDisabled ? { scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.35)' } : {}}
              whileTap={!nextDisabled ? { scale: 0.98 } : {}}
              className="w-full py-4 rounded-2xl text-white font-semibold text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: nextDisabled ? '#222' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
                boxShadow: nextDisabled ? 'none' : '0 0 20px rgba(59,130,246,0.2)',
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