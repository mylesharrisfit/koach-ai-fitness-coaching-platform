import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  { label: 'AI Client Management',  icon: '👥', activateAt: 0.6 },
  { label: 'Workout Engine',        icon: '🏋️', activateAt: 1.2 },
  { label: 'Nutrition System',      icon: '🥗', activateAt: 1.8 },
  { label: 'Automation Hub',        icon: '⚡', activateAt: 2.4 },
  { label: 'Check-in AI',           icon: '📋', activateAt: 3.0 },
  { label: 'Analytics Dashboard',   icon: '📊', activateAt: 3.6 },
  { label: 'Client Portal',         icon: '🚪', activateAt: 4.2 },
];

// Last item finishes at 4.2s. We wait ~1s then redirect = ~5.5s total.
const REDIRECT_AT = 5600;
const FAILSAFE_AT = 8000; // hard cap — redirect no matter what

export default function CoachGenerationScreen({ onNext }) {
  const [statuses, setStatuses] = useState(ITEMS.map(() => 'waiting'));
  const [allDone, setAllDone]   = useState(false);
  const [exiting, setExiting]   = useState(false);
  const timers = useRef([]);

  const doRedirect = () => {
    setAllDone(true);
    setExiting(true);
    // Give the "OS is live" message 900ms, then navigate into the real dashboard
    const t = setTimeout(() => {
      localStorage.setItem('koach_onboarding_complete', '1');
      // Use window.location for a hard navigation so auth session & layout fully reinitialize
      window.location.replace('/');
    }, 900);
    timers.current.push(t);
  };

  useEffect(() => {
    // Activate each card sequentially
    ITEMS.forEach((item, idx) => {
      // loading state
      const tLoad = setTimeout(() => {
        setStatuses(prev => {
          const next = [...prev];
          next[idx] = 'loading';
          return next;
        });
      }, (item.activateAt - 0.5) * 1000);

      // done state
      const tDone = setTimeout(() => {
        setStatuses(prev => {
          const next = [...prev];
          next[idx] = 'done';
          return next;
        });
      }, item.activateAt * 1000);

      timers.current.push(tLoad, tDone);
    });

    // Primary redirect timer
    const tRedirect = setTimeout(doRedirect, REDIRECT_AT);
    // Failsafe redirect
    const tFailsafe = setTimeout(doRedirect, FAILSAFE_AT);
    timers.current.push(tRedirect, tFailsafe);

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const doneCount = statuses.filter(s => s === 'done').length;
  const progress  = doneCount / ITEMS.length;

  return (
    <motion.div
      className="w-full h-full flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{ background: 'rgb(var(--sidebar))' }}
      animate={exiting ? { opacity: 0, filter: 'blur(12px)', scale: 1.04 } : { opacity: 1, filter: 'blur(0px)', scale: 1 }}
      transition={{ duration: 0.75, ease: [0.32, 0.72, 0, 1] }}
    >
      {/* Cinematic ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <motion.div
          className="w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-7">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-2"
        >
          <p className="text-[11px] uppercase tracking-[0.28em] font-bold" style={{ color: 'rgb(var(--primary))' }}>
            KOACH AI Engine
          </p>
          <AnimatePresence mode="wait">
            {allDone ? (
              <motion.h2
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold"
                style={{ color: 'rgb(var(--success))', letterSpacing: '-0.025em' }}
              >
                Your coaching OS is live.
              </motion.h2>
            ) : (
              <motion.h2
                key="building"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-bold text-white"
                style={{ letterSpacing: '-0.025em' }}
              >
                Building your coaching<br />system…
              </motion.h2>
            )}
          </AnimatePresence>
          <p className="text-sm" style={{ color: '#5A5A5A' }}>
            {allDone ? 'Entering your platform…' : 'Personalizing your AI infrastructure'}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), rgb(var(--primary)))' }}
            animate={{ width: `${allDone ? 100 : progress * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Module cards */}
        <div className="space-y-2">
          {ITEMS.map((item, i) => {
            const status = statuses[i];
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{
                  opacity: status === 'waiting' ? 0.2 : 1,
                  x: 0,
                }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-4 px-5 py-3.5 rounded-2xl"
                style={{
                  background: status === 'done'
                    ? 'rgba(34,197,94,0.06)'
                    : status === 'loading'
                    ? 'rgba(59,130,246,0.08)'
                    : 'rgba(255,255,255,0.02)',
                  border: status === 'done'
                    ? '1px solid rgba(34,197,94,0.22)'
                    : status === 'loading'
                    ? '1px solid rgba(59,130,246,0.28)'
                    : '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.4s, border 0.4s',
                }}
              >
                <span className="text-xl w-7 flex-shrink-0 text-center">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: status === 'waiting' ? '#333' : 'rgb(var(--card))' }}>
                    {item.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{
                    color: status === 'done' ? 'rgba(34,197,94,0.75)' : status === 'loading' ? 'rgba(59,130,246,0.75)' : '#3A3A3A',
                  }}>
                    {status === 'done' ? 'Activated' : status === 'loading' ? 'Initializing…' : 'Queued'}
                  </p>
                </div>
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {status === 'loading' && (
                    <motion.div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: 'rgb(var(--primary))', borderTopColor: 'transparent' }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.65, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  {status === 'done' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 350, damping: 18 }}
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
          })}
        </div>
      </div>
    </motion.div>
  );
}