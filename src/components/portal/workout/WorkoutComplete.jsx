import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Salad } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* Simple confetti burst using canvas */
function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: ['rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--warning))', 'rgb(var(--destructive))', 'rgb(var(--success))', '#EC4899'][Math.floor(Math.random() * 6)],
      size: 5 + Math.random() * 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    }));
    let raf;
    let alive = true;
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.spin; p.vy += 0.06;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; p.vy = 2 + Math.random() * 4; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    const timer = setTimeout(() => { alive = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 4000);
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-[51] pointer-events-none" />;
}

export default function WorkoutComplete({ workout, exerciseLogs, durationSeconds, onClose, onMessageCoach }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 80, 30, 120]);
  }, []);

  const totalSets = Object.values(exerciseLogs).reduce((s, log) =>
    s + (log.sets_completed || []).filter(s => s.completed).length, 0);
  const totalVolume = Object.values(exerciseLogs).reduce((total, log) =>
    total + (log.sets_completed || []).reduce((s, set) =>
      s + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0), 0), 0);
  const exercisesCompleted = Object.values(exerciseLogs).filter(log =>
    (log.sets_completed || []).some(s => s.completed)).length;
  const totalExercises = workout?.exercises?.length || exercisesCompleted;

  const mins = Math.floor(durationSeconds / 60);
  const secs = durationSeconds % 60;
  const durationStr = mins > 0 ? `${mins} min${mins !== 1 ? 's' : ''}` : `${secs}s`;

  const stats = [
    { label: 'Duration',    value: durationStr,          emoji: '⏱️' },
    { label: 'Exercises',   value: `${exercisesCompleted}/${totalExercises}`, emoji: '💪' },
    { label: 'Sets Logged', value: totalSets,             emoji: '📋' },
    { label: 'Volume',      value: totalVolume > 0 ? `${totalVolume.toLocaleString()} lbs` : '—', emoji: '⚖️' },
  ];

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-50 overflow-y-auto"
        style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #1E0A35 50%, #0A0F1E 100%)' }}>
        <div className="px-5 pt-16 pb-16 flex flex-col items-center">

          {/* Checkmark animation */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14, delay: 0.1 }}
            className="mb-5">
            <div className="w-24 h-24 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))', boxShadow: '0 0 60px rgba(16,185,129,0.4)' }}>
              <svg viewBox="0 0 52 52" className="w-12 h-12">
                <motion.path
                  fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
                  d="M14 27l10 10 14-18"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-center mb-8">
            <h2 className="text-white font-black" style={{ fontSize: 32 }}>Workout Complete! 🎉</h2>
            <p className="text-white/50 text-sm mt-2 font-semibold">{workout?.day_name} · {durationStr}</p>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="w-full rounded-[20px] p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-4 text-center">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              {stats.map(({ label, value, emoji }) => (
                <div key={label} className="text-center py-4 px-3 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <p className="text-2xl mb-1">{emoji}</p>
                  <p className="text-white font-black text-xl leading-none">{value}</p>
                  <p className="text-white/30 text-[10px] mt-1 font-semibold uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rating */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="w-full rounded-[20px] p-5 mb-5"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/50 text-sm font-bold text-center mb-4">How was this workout?</p>
            <div className="flex justify-center gap-3 mb-4">
              {[1, 2, 3, 4, 5].map(n => (
                <motion.button key={n} whileTap={{ scale: 0.85 }} onClick={() => setRating(n)}>
                  <Star className={`w-9 h-9 transition-all ${n <= rating ? 'text-warning fill-warning' : 'text-white/15'}`} />
                </motion.button>
              ))}
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Add any notes... PRs? How did it feel?"
              rows={2}
              className="w-full px-4 py-3 rounded-2xl text-sm text-white/70 resize-none focus:outline-none placeholder-white/20"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16 }} />
          </motion.div>

          {/* Actions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="w-full space-y-3">
            <button onClick={() => onClose(rating, note)}
              className="w-full py-4 rounded-2xl font-black text-base text-white"
              style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', boxShadow: '0 4px 24px rgba(37,99,235,0.4)' }}>
              Save &amp; Return Home
            </button>
            <button onClick={onMessageCoach}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              <MessageSquare className="w-4 h-4" /> Message Coach About This Workout
            </button>
            <button onClick={() => { onClose(rating, note); navigate('/portal/nutrition'); }}
              className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              <Salad className="w-4 h-4" /> Log Nutrition
            </button>
          </motion.div>
        </div>
      </div>
    </>
  );
}