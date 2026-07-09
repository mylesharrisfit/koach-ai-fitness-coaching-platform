import React from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle2, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TodayHeroCard({ program, todayWorkout, workoutDone, onStartWorkout }) {
  const navigate = useNavigate();

  if (!program) {
    return (
      <div className="mx-5 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-1">Today's Plan</p>
        <p className="text-white font-bold text-lg">Your program is being set up 💪</p>
        <p className="text-white/40 text-sm mt-1">Your coach will assign your training plan soon.</p>
      </div>
    );
  }

  const isRestDay = !todayWorkout;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      className="mx-5 rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, rgb(var(--foreground)) 100%)', border: '1px solid rgb(var(--primary) / 0.25)' }}>
      {/* Program badge */}
      <div className="px-5 pt-4 pb-3">
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest mb-2">{program.title}</p>

        {isRestDay ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <Moon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Rest Day 🛌</p>
                <p className="text-white/50 text-xs">Recovery is part of the plan</p>
              </div>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-3">
              <p className="text-white/60 text-xs leading-relaxed">💡 Focus on hydration, sleep, and light movement today. Your muscles grow during rest.</p>
            </div>
          </>
        ) : workoutDone ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgb(var(--success) / 0.15)' }}>
                <CheckCircle2 className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-white font-bold text-lg">Workout Complete ✅</p>
                <p className="text-success text-xs font-semibold">Great work today!</p>
              </div>
            </div>
            <p className="text-white/50 text-sm">{todayWorkout.day_name} — {todayWorkout.exercises?.length || 0} exercises</p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-white font-bold text-xl leading-tight">{todayWorkout.day_name || 'Today\'s Workout'}</p>
              <p className="text-white/50 text-sm mt-0.5">
                {todayWorkout.exercises?.length || 0} exercises
                {todayWorkout.exercises?.length > 0 && ' · ~' + Math.round((todayWorkout.exercises.length * 3.5)) + ' min'}
              </p>
            </div>
            {/* Exercise preview */}
            {todayWorkout.exercises?.slice(0, 3).map((ex, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                <p className="text-white/60 text-xs">{ex.name} · {ex.sets}×{ex.reps}</p>
              </div>
            ))}
            {(todayWorkout.exercises?.length || 0) > 3 && (
              <p className="text-white/30 text-xs mt-1">+{todayWorkout.exercises.length - 3} more exercises</p>
            )}
            <button onClick={onStartWorkout}
              className="mt-4 w-full py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--primary)))', boxShadow: '0 0 20px rgb(var(--primary) / 0.4)' }}>
              <Play className="w-4 h-4" fill="white" /> Start Workout
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}