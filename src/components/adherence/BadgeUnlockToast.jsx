import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import confetti from 'canvas-confetti';

export default function BadgeUnlockToast({ badgeKey, clientName, onClose }) {
  const cfg = BADGE_CONFIG[badgeKey];
  const tier = cfg ? TIER_STYLES[cfg.tier] : null;

  useEffect(() => {
    if (!cfg) return;
    // Confetti burst
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: [tier.accent, 'rgb(var(--card))', tier.bg],
    });
    // Mobile vibration
    if (navigator.vibrate) navigator.vibrate([80, 40, 120]);
    const t = setTimeout(onClose, 3800);
    return () => clearTimeout(t);
  }, []);

  if (!cfg || !tier) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <div
          className="pointer-events-auto flex flex-col items-center gap-4 p-8 rounded-3xl text-center"
          style={{
            background: `radial-gradient(ellipse at 30% 20%, ${tier.bg}f0 0%, ${tier.bg} 100%)`,
            border: `1.5px solid ${tier.accent}`,
            boxShadow: `0 0 60px 16px ${tier.glow}, 0 20px 60px rgba(0,0,0,0.7)`,
            minWidth: 260,
          }}
          onClick={onClose}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: tier.accent }}>
            Achievement Unlocked
          </p>
          <motion.span
            className="text-6xl leading-none"
            animate={{ scale: [0.5, 1.25, 1], rotate: [0, -8, 8, 0] }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            {cfg.emoji}
          </motion.span>
          <div>
            <p className="text-xl font-black" style={{ color: tier.text }}>{cfg.label}</p>
            <p className="text-sm mt-1" style={{ color: `${tier.accent}99` }}>{cfg.desc}</p>
          </div>
          {clientName && (
            <p className="text-xs" style={{ color: `${tier.accent}70` }}>Awarded to {clientName}</p>
          )}
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: `${tier.accent}22`, color: tier.accent, border: `1px solid ${tier.accent}44` }}
          >
            {tier.label}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}