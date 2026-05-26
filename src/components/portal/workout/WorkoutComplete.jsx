import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Share2, MessageSquare, Home, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WorkoutComplete({ workout, exerciseLogs, durationSeconds, onClose, onMessageCoach }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 100]);
  }, []);

  const totalSets = Object.values(exerciseLogs).reduce((s, log) =>
    s + (log.sets_completed || []).filter(s => s.completed).length, 0);
  const totalVolume = Object.values(exerciseLogs).reduce((total, log) =>
    total + (log.sets_completed || []).reduce((s, set) =>
      s + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0), 0), 0);
  const exercisesCompleted = Object.values(exerciseLogs).filter(log =>
    (log.sets_completed || []).some(s => s.completed)).length;

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;

  const stats = [
    { label: 'Duration', value: `${mins}:${String(secs).padStart(2, '0')}` },
    { label: 'Exercises', value: exercisesCompleted },
    { label: 'Sets Logged', value: totalSets },
    { label: 'Total Volume', value: totalVolume > 0 ? `${totalVolume.toLocaleString()} lbs` : '—' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto py-12 px-5"
      style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #0A0A12 100%)' }}>

      {/* Celebration */}
      <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', damping: 12 }} className="mb-4">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
          style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', boxShadow: '0 0 40px rgba(245,158,11,0.4)' }}>
          🏆
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="text-center mb-6">
        <h2 className="text-white font-bold text-3xl">Workout Complete!</h2>
        <p className="text-white/50 text-sm mt-1">{workout?.day_name} · Great work today 💪</p>
      </motion.div>

      {/* Stats card */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="w-full max-w-sm rounded-2xl p-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="grid grid-cols-2 gap-3">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <p className="text-white font-bold text-lg">{value}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Rating */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="w-full max-w-sm rounded-2xl p-4 mb-4"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/50 text-xs text-center mb-3">Rate this workout</p>
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setRating(n)}>
              <Star className={`w-7 h-7 transition-colors ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/20'}`} />
            </button>
          ))}
        </div>
        <textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="Any notes? PRs? How did it feel?"
          rows={2}
          className="w-full mt-3 px-3 py-2 rounded-xl text-sm text-white/70 bg-white/5 border border-white/08 resize-none focus:outline-none focus:border-blue-500/30 placeholder-white/20" />
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="w-full max-w-sm space-y-2.5">
        <button onClick={() => { onClose(rating, note); }}
          className="w-full py-4 rounded-xl font-bold text-base text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: '0 0 24px rgba(59,130,246,0.35)' }}>
          Save & Back to Dashboard
        </button>
        <button onClick={onMessageCoach}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white/60 flex items-center justify-center gap-2"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <MessageSquare className="w-4 h-4" /> Message Coach
        </button>
      </motion.div>
    </div>
  );
}