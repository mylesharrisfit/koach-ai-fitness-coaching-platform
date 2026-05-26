import React from 'react';
import { motion } from 'framer-motion';

export default function ProfileQuickStats({ workouts, checkIns, streak, achievements, onNavigate }) {
  const stats = [
    { label: 'Workouts', value: workouts, emoji: '💪', path: '/portal/workouts' },
    { label: 'Check-ins', value: checkIns, emoji: '📋', path: '/portal/checkin' },
    { label: 'Streak', value: `${streak}d`, emoji: '🔥', path: '/portal/progress' },
    { label: 'Awards', value: achievements, emoji: '🏆', path: '/portal/progress' },
  ];

  return (
    <div className="px-5 mb-5">
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => (
          <motion.button key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(s.path)}
            className="flex flex-col items-center py-3 px-2 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            whileTap={{ scale: 0.95 }}>
            <span className="text-lg mb-1">{s.emoji}</span>
            <p className="text-white font-bold text-base leading-none">{s.value}</p>
            <p className="text-white/30 text-[9px] mt-0.5">{s.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}