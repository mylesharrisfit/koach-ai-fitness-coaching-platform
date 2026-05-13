import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { label: 'AI Client Management',  icon: '👥', delay: 0 },
  { label: 'Workout Engine',        icon: '🏋️', delay: 0.6 },
  { label: 'Nutrition System',      icon: '🥗', delay: 1.2 },
  { label: 'Automation Hub',        icon: '⚡', delay: 1.8 },
  { label: 'Check-in AI',           icon: '📋', delay: 2.4 },
  { label: 'Analytics Dashboard',   icon: '📊', delay: 3.0 },
  { label: 'Client Portal',         icon: '🚪', delay: 3.6 },
];

function BuildCard({ item }) {
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('loading'), item.delay * 1000);
    const t2 = setTimeout(() => setStatus('done'), (item.delay + 0.7) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{
        opacity: status === 'waiting' ? 0.18 : 1,
        x: 0,
      }}
      transition={{ delay: item.delay * 0.5, duration: 0.4 }}
      className="flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-500"
      style={{
        background: status === 'done'
          ? 'rgba(34,197,94,0.05)'
          : status === 'loading'
          ? 'rgba(59,130,246,0.07)'
          : 'rgba(255,255,255,0.02)',
        border: status === 'done'
          ? '1px solid rgba(34,197,94,0.2)'
          : status === 'loading'
          ? '1px solid rgba(59,130,246,0.25)'
          : '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span className="text-xl w-7 flex-shrink-0 text-center">{item.icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: status === 'waiting' ? '#2A2A2A' : '#fff' }}>
          {item.label}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: status === 'done' ? 'rgba(34,197,94,0.7)' : '#444' }}>
          {status === 'done' ? 'Activated' : status === 'loading' ? 'Building...' : 'Queued'}
        </p>
      </div>
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {status === 'loading' && (
          <motion.div
            className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 320, damping: 16 }}
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#22C55E' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function CoachGenerationScreen({ onNext }) {
  const [doneCount, setDoneCount] = useState(0);
  const totalItems = ITEMS.length;

  useEffect(() => {
    ITEMS.forEach(item => {
      const t = setTimeout(() => setDoneCount(c => c + 1), (item.delay + 0.7) * 1000);
      return () => clearTimeout(t);
    });
  }, []);

  const allDone = doneCount >= totalItems;

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(onNext, 1600);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  const progress = Math.min(1, doneCount / totalItems);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: '#0A0A0A' }}>
      {/* Cinematic glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          className="w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)', filter: 'blur(80px)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: '#3B82F6' }}>
            KOACH AI Engine
          </p>
          <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.025em' }}>
            Building your coaching<br />system…
          </h2>
          <p className="text-sm" style={{ color: '#5A5A5A' }}>
            Personalizing your AI infrastructure
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Cards */}
        <div className="space-y-2">
          {ITEMS.map((item, i) => (
            <BuildCard key={i} item={item} />
          ))}
        </div>

        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <p className="text-sm font-bold" style={{ color: '#22C55E' }}>
                ✓ Your coaching OS is live
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}