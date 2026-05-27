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
    <div className="px-5 py-4 bg-white" style={{ borderBottom: '1px solid #F1F5F9' }}>
      <div className="grid grid-cols-4 gap-2">
        {stats.map((s, i) => (
          <motion.button key={s.label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            onClick={() => onNavigate(s.path)}
            className="flex flex-col items-center py-3 px-2 rounded-2xl bg-white"
            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}
            whileTap={{ scale: 0.95 }}>
            <span className="text-lg mb-1">{s.emoji}</span>
            <p className="text-slate-900 font-black text-base leading-none">{s.value}</p>
            <p className="text-slate-400 text-[9px] mt-0.5 font-semibold">{s.label}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}