import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

const stagger = {
  container: { animate: { transition: { staggerChildren: 0.1 } } },
  item: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } },
  },
};

export default function WelcomeScreen({ onNext }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6" style={{ background: '#0A0A0A' }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none overflow-hidden">
        <div
          className="w-[600px] h-[400px] opacity-[0.07]"
          style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, transparent 70%)', filter: 'blur(40px)', transform: 'translateY(30%)' }}
        />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-md text-center flex flex-col items-center gap-8"
        variants={stagger.container}
        initial="initial"
        animate="animate"
      >
        <motion.div variants={stagger.item} className="space-y-4">
          <p className="text-xs uppercase tracking-[0.25em]" style={{ color: '#3B82F6' }}>
            Welcome
          </p>
          <h1 className="text-5xl font-bold text-white leading-tight" style={{ letterSpacing: '-0.03em' }}>
            Let's build<br />your system.
          </h1>
          <p className="text-base" style={{ color: '#7A7A7A' }}>
            Training. Nutrition. Recovery. Performance.
          </p>
        </motion.div>

        {/* Feature pills */}
        <motion.div variants={stagger.item} className="flex flex-wrap justify-center gap-2">
          {['AI-Powered', 'Personalized', 'Elite-Grade', 'Science-Backed'].map(tag => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              {tag}
            </span>
          ))}
        </motion.div>

        <motion.button
          variants={stagger.item}
          onClick={onNext}
          whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(59,130,246,0.4)' }}
          whileTap={{ scale: 0.98 }}
          className="w-full max-w-xs flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-semibold text-base transition-all"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 20px rgba(59,130,246,0.25)' }}
        >
          Get Started
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <motion.p variants={stagger.item} className="text-xs" style={{ color: '#3A3A3A' }}>
          Takes less than 3 minutes
        </motion.p>
      </motion.div>
    </div>
  );
}