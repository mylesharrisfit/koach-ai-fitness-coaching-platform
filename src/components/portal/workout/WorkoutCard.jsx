import React from 'react';
import { motion } from 'framer-motion';
import { Play, Moon, Check } from 'lucide-react';

function getEquipment(exercises) {
  const eq = new Set();
  (exercises || []).forEach(ex => {
    if (ex.name?.toLowerCase().includes('barbell') || ex.name?.toLowerCase().includes('squat') || ex.name?.toLowerCase().includes('bench')) eq.add('Barbell');
    if (ex.name?.toLowerCase().includes('dumbbell') || ex.name?.toLowerCase().includes('curl')) eq.add('Dumbbells');
    if (ex.name?.toLowerCase().includes('cable') || ex.name?.toLowerCase().includes('pulldown')) eq.add('Cable');
    if (ex.name?.toLowerCase().includes('bodyweight') || ex.name?.toLowerCase().includes('push-up') || ex.name?.toLowerCase().includes('plank')) eq.add('Bodyweight');
  });
  return [...eq].slice(0, 4);
}

export default function WorkoutCard({ workout, isToday, dayDate, isDone, onStart }) {
  if (!workout) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 bg-white p-6 rounded-3xl text-center"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
          <Moon className="w-7 h-7 text-slate-400" />
        </div>
        <p className="text-slate-800 font-bold text-lg">Rest Day 🛌</p>
        <p className="text-slate-500 text-sm mt-1 mb-4">Recovery is part of the process</p>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2">
          {['💧 Stay hydrated — aim for 8+ glasses', '😴 Prioritize 7–9 hours of sleep', '🧘 Light stretching or mobility work', '🍽️ Keep nutrition on point'].map((tip, i) => (
            <p key={i} className="text-slate-500 text-xs">{tip}</p>
          ))}
        </div>
      </motion.div>
    );
  }

  const exercises = workout.exercises || [];
  const estMin = Math.round(exercises.length * 3.5);
  const equipment = getEquipment(exercises);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 rounded-3xl overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.25)' }}>
      <div className="p-5" style={{ background: 'rgba(0,0,0,0.12)' }}>
        <div className="flex items-start justify-between mb-4">
          <div>
            {isDone && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mb-2"
                style={{ background: 'rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                <Check className="w-3 h-3" strokeWidth={3} /> Done
              </span>
            )}
            <p className="text-white font-black text-2xl leading-tight">{workout.day_name}</p>
            <p className="text-white/60 text-sm mt-0.5">{exercises.length} exercises · ~{estMin} min</p>
          </div>
        </div>

        {equipment.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {equipment.map(eq => (
              <span key={eq} className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white/70"
                style={{ background: 'rgba(255,255,255,0.15)' }}>{eq}</span>
            ))}
          </div>
        )}

        <div className="space-y-2 mb-4">
          {exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,255,255,0.2)' }}>
                <span className="text-white text-[9px] font-bold">{i + 1}</span>
              </div>
              <p className="text-white/80 text-sm flex-1 truncate">{ex.name}</p>
              <p className="text-white/50 text-xs">{ex.sets}×{ex.reps}</p>
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-white/40 text-xs ml-7">+{exercises.length - 3} more exercises</p>
          )}
        </div>

        <button onClick={onStart}
          className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all"
          style={{ background: 'rgba(255,255,255,0.95)', color: '#2563EB', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
          <Play className="w-5 h-5" fill="#2563EB" />
          {isDone ? 'Do Again' : isToday ? 'Start Workout' : 'Preview Workout'}
        </button>
      </div>
    </motion.div>
  );
}