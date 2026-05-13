import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: '#0A0A0A' }}>
      {/* Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 flex flex-col items-center gap-5"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-2"
          style={{
            background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
            boxShadow: '0 0 50px rgba(59,130,246,0.4), 0 0 100px rgba(59,130,246,0.15)',
          }}
        >
          <svg width="36" height="36" viewBox="0 0 16 16" fill="none">
            <path d="M4 3L4 13M4 8L10 3M4 8L10 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>

        {/* App name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="text-center"
        >
          <h1
            className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.18em' }}
          >
            KOACH AI
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-sm tracking-[0.15em] uppercase"
            style={{ color: '#7A7A7A', letterSpacing: '0.2em' }}
          >
            AI Coaching Operating System
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Bottom loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5"
      >
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-1 rounded-full"
            style={{ background: '#3B82F6' }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </motion.div>
    </div>
  );
}