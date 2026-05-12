import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CLIENT_ITEMS = [
  { label: 'Training Plan', icon: '🏋️', delay: 0 },
  { label: 'Nutrition Plan', icon: '🥗', delay: 0.6 },
  { label: 'Hydration Goals', icon: '💧', delay: 1.2 },
  { label: 'Recovery Targets', icon: '⚡', delay: 1.8 },
  { label: 'Habit System', icon: '🔄', delay: 2.4 },
];

const COACH_ITEMS = [
  { label: 'Client Dashboard', icon: '👥', delay: 0 },
  { label: 'Check-in System', icon: '📋', delay: 0.6 },
  { label: 'Automation Rules', icon: '⚡', delay: 1.2 },
  { label: 'Nutrition Templates', icon: '🥗', delay: 1.8 },
  { label: 'Revenue Overview', icon: '📈', delay: 2.4 },
];

function GenerationCard({ item, onComplete }) {
  const [status, setStatus] = useState('waiting'); // waiting | loading | done

  useEffect(() => {
    const t1 = setTimeout(() => setStatus('loading'), item.delay * 1000);
    const t2 = setTimeout(() => { setStatus('done'); onComplete?.(); }, (item.delay + 0.9) * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: status === 'waiting' ? 0.2 : 1, x: 0 }}
      transition={{ delay: item.delay * 0.8, duration: 0.4 }}
      className="flex items-center gap-4 p-4 rounded-2xl transition-all duration-300"
      style={{
        background: status === 'done' ? 'rgba(34,197,94,0.06)' : status === 'loading' ? 'rgba(59,130,246,0.06)' : '#161616',
        border: status === 'done' ? '1px solid rgba(34,197,94,0.2)' : status === 'loading' ? '1px solid rgba(59,130,246,0.2)' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-2xl">{item.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: status === 'waiting' ? '#3A3A3A' : '#fff' }}>
          {item.label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#7A7A7A' }}>
          {status === 'done' ? 'Ready' : status === 'loading' ? 'Building...' : 'Waiting'}
        </p>
      </div>
      <div className="w-6 h-6 flex items-center justify-center">
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
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: '#22C55E' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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
  const lastDelay = items[items.length - 1].delay;
  const allDone = doneCount >= items.length;

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(onNext, 1200);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-6" style={{ background: '#0A0A0A' }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          className="w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <p className="text-xs uppercase tracking-[0.2em] font-semibold" style={{ color: '#3B82F6' }}>
            AI Engine
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
            style={{ background: 'linear-gradient(90deg, #3B82F6, #60A5FA)' }}
            initial={{ width: '0%' }}
            animate={{ width: allDone ? '100%' : `${(doneCount / items.length) * 90}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Cards */}
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <GenerationCard key={i} item={item} onComplete={() => setDoneCount(c => c + 1)} />
          ))}
        </div>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>
              ✓ Your system is ready
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}