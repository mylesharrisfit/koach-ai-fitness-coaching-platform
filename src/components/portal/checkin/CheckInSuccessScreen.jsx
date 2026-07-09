import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Home } from 'lucide-react';

function Confetti() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 100,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 3,
      color: ['rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--warning))', 'rgb(var(--success))'][Math.floor(Math.random() * 4)],
      size: 5 + Math.random() * 5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
    }));
    let raf, alive = true;
    const draw = () => {
      if (!alive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.angle += p.spin; p.vy += 0.05;
        if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; p.vy = 2 + Math.random() * 3; }
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
    const timer = setTimeout(() => { alive = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }, 3500);
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(timer); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-[51] pointer-events-none" />;
}

export default function CheckInSuccessScreen({ streak, onHome, onMessage }) {
  useEffect(() => {
    if (navigator.vibrate) navigator.vibrate([50, 30, 80, 30, 120]);
  }, []);

  return (
    <>
      <Confetti />
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0A0F1E 0%, #1E0A35 50%, #0A0F1E 100%)' }}>

        {/* Checkmark */}
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className="mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))', boxShadow: '0 0 60px rgb(var(--success) / 0.4)' }}>
            <svg viewBox="0 0 52 52" className="w-14 h-14">
              <motion.path fill="none" stroke="white" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
                d="M14 27l10 10 14-18"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }} />
            </svg>
          </div>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="text-white font-black text-center" style={{ fontSize: 32 }}>
          Check-in Submitted! 🎉
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="text-white/50 text-base mt-2">Your coach will review this soon</motion.p>

        {/* Streak badge */}
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
          className="mt-8 rounded-2xl p-6 text-center"
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', minWidth: 240 }}>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider mb-2">Check-in Streak</p>
          <p className="text-white font-black" style={{ fontSize: 40 }}>🔥 {streak}</p>
          <p className="text-white/50 text-sm mt-1">Week{streak !== 1 ? 's' : ''} in a row!</p>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="w-full px-5 mt-12 space-y-3" style={{ maxWidth: 400, paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}>
          <button onClick={onMessage}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 text-white"
            style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', boxShadow: '0 4px 20px rgb(var(--primary) / 0.3)' }}>
            <MessageSquare className="w-5 h-5" />
            Message Your Coach
          </button>
          <button onClick={onHome}
            className="w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
            <Home className="w-5 h-5" />
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    </>
  );
}