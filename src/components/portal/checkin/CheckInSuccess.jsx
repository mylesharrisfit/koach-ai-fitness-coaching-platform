import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, MessageSquare, Flame, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

const MILESTONES = [1, 5, 10, 15, 20, 25, 50, 100];

export default function CheckInSuccess({ checkIn, totalCheckIns, streak, onDashboard, onMessage }) {
  const milestone = MILESTONES.find(m => totalCheckIns === m);

  useEffect(() => {
    // Confetti burst
    const fire = (x, angle) => confetti({
      particleCount: 60, spread: 70, origin: { x, y: 0.7 }, angle,
      colors: ['#3B82F6', '#6366F1', '#22C55E', '#F59E0B', '#EC4899'],
    });
    setTimeout(() => { fire(0.3, 120); fire(0.7, 60); }, 100);
    setTimeout(() => { fire(0.2, 130); fire(0.8, 50); }, 400);
    if (navigator.vibrate) navigator.vibrate([50, 30, 80, 30, 50]);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6"
      style={{ background: '#0A0F1A' }}>
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.25), rgba(16,185,129,0.2))', border: '2px solid rgba(34,197,94,0.4)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}>
          <span className="text-5xl">✅</span>
        </motion.div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-center space-y-2 mb-8">
        <h1 className="text-white text-3xl font-black">Check-in Submitted!</h1>
        <p className="text-white/40 text-sm">Your coach will review this soon 🎉</p>
      </motion.div>

      {/* Streak & milestone */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="w-full space-y-3 mb-8">
        {streak > 1 && (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Flame className="w-6 h-6 text-orange-400 flex-shrink-0" />
            <div>
              <p className="text-orange-400 font-bold text-sm">🔥 {streak}-week check-in streak!</p>
              <p className="text-white/30 text-xs">Keep it going — consistency is key</p>
            </div>
          </div>
        )}
        {milestone && (
          <div className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <Trophy className="w-6 h-6 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="text-indigo-400 font-bold text-sm">🏆 Amazing! {milestone} check-ins completed!</p>
              <p className="text-white/30 text-xs">You're building incredible habits</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <span className="text-xl flex-shrink-0">📋</span>
          <div>
            <p className="text-blue-400 font-bold text-sm">Total check-ins: {totalCheckIns}</p>
            <p className="text-white/30 text-xs">Great work staying accountable</p>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="w-full space-y-3">
        <button onClick={onDashboard}
          className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          <Home className="w-5 h-5" /> Back to Dashboard
        </button>
        <button onClick={onMessage}
          className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
          <MessageSquare className="w-4 h-4" /> Message My Coach
        </button>
      </motion.div>
    </div>
  );
}