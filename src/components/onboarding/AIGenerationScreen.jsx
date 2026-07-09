import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CLIENT_ITEMS = [
  { label: 'Analyzing your profile',   icon: '🧠', delay: 0 },
  { label: 'Building training plan',   icon: '🏋️', delay: 0.7 },
  { label: 'Designing nutrition plan', icon: '🥗', delay: 1.4 },
  { label: 'Setting recovery targets', icon: '⚡', delay: 2.1 },
  { label: 'Calibrating habit system', icon: '🔄', delay: 2.8 },
];

const COACH_ITEMS = [
  { label: 'Setting up client dashboard',  icon: '👥', delay: 0 },
  { label: 'Building check-in system',     icon: '📋', delay: 0.7 },
  { label: 'Configuring automations',      icon: '⚡', delay: 1.4 },
  { label: 'Creating nutrition templates', icon: '🥗', delay: 2.1 },
  { label: 'Activating AI coaching tools', icon: '🤖', delay: 2.8 },
];

function GenerationCard({ item }) {
  const [status, setStatus] = useState('waiting');

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('loading'), item.delay * 1000);
    const t2 = setTimeout(() => setStatus('done'), (item.delay + 0.8) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: status === 'waiting' ? 0.22 : 1, y: 0 }}
      transition={{ delay: item.delay * 0.6, duration: 0.4 }}
      className="flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-500"
      style={{
        background: status === 'done'
          ? 'rgb(var(--success) / 0.06)'
          : status === 'loading'
          ? 'rgb(var(--primary) / 0.07)'
          : 'rgba(255,255,255,0.03)',
        border: status === 'done'
          ? '1.5px solid rgb(var(--success) / 0.25)'
          : status === 'loading'
          ? '1.5px solid rgb(var(--primary) / 0.25)'
          : '1.5px solid rgba(255,255,255,0.06)',
      }}
    >
      <span className="text-xl">{item.icon}</span>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: status === 'waiting' ? '#3A3A3A' : 'rgb(var(--card))' }}>
          {item.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: status === 'done' ? 'rgb(var(--success) / 0.8)' : '#5A5A5A' }}>
          {status === 'done' ? 'Complete' : status === 'loading' ? 'Processing...' : 'Queued'}
        </p>
      </div>
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {status === 'loading' && (
          <motion.div
            className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: 'rgb(var(--primary))', borderTopColor: 'transparent' }}
            animate={{ rotate: 360 }}
            transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {status === 'done' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: 'rgb(var(--success))' }}
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

export default function AIGenerationScreen({ onNext, role = 'client' }) {
  const items = role === 'coach' ? COACH_ITEMS : CLIENT_ITEMS;
  const [doneCount, setDoneCount] = useState(0);
  const totalDuration = (items[items.length - 1].delay + 0.8) * 1000;

  useEffect(() => {
    items.forEach((item) => {
      const t = setTimeout(() => setDoneCount(c => c + 1), (item.delay + 0.8) * 1000);
      return () => clearTimeout(t);
    });
  }, []);

  const allDone = doneCount >= items.length;

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(onNext, 1400);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6" style={{ background: 'rgb(var(--sidebar))' }}>
      {/* Pulsing glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          className="w-[700px] h-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgb(var(--primary) / 0.09) 0%, transparent 65%)', filter: 'blur(60px)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-3"
        >
          <p className="text-xs uppercase tracking-[0.22em] font-bold" style={{ color: 'rgb(var(--primary))' }}>
            KOACH AI Engine
          </p>
          <h2 className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            Building your system…
          </h2>
          <p className="text-sm" style={{ color: '#7A7A7A' }}>
            Personalizing everything based on your profile
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), rgb(var(--primary)))' }}
            initial={{ width: '0%' }}
            animate={{ width: allDone ? '100%' : `${(doneCount / items.length) * 92}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Cards */}
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <GenerationCard key={i} item={item} />
          ))}
        </div>

        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center py-2"
            >
              <p className="text-sm font-semibold" style={{ color: 'rgb(var(--success))' }}>
                ✓ Your system is ready
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}