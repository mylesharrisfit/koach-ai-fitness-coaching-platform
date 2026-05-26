import React from 'react';
import { motion } from 'framer-motion';
import { Play, Moon } from 'lucide-react';
import { isSameDay, subDays, format } from 'date-fns';

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
    // Rest day
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 p-5 rounded-2xl text-center"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
          <Moon className="w-6 h-6 text-white/30" />
        </div>
        <p className="text-white font-bold text-lg">Rest Day 🛌</p>
        <p className="text-white/40 text-sm mt-1">Recovery is part of the process</p>
        <div className="mt-4 p-3 rounded-xl text-left space-y-1.5" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {['💧 Stay hydrated — aim for 8+ glasses', '😴 Prioritize 7-9 hours of sleep', '🧘 Light stretching or mobility work', '🍽️ Keep nutrition on point'].map((tip, i) => (
            <p key={i} className="text-white/40 text-xs">{tip}</p>
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
      className="mx-4 rounded-2xl overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #1E3A5F 0%, #111827 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white font-bold text-xl leading-tight">{workout.day_name}</p>
            <p className="text-white/40 text-sm mt-0.5">{exercises.length} exercises · ~{estMin} min</p>
          </div>
          {isDone && (
            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#4ADE80' }}>
              ✓ Done
            </span>
          )}
        </div>

        {/* Equipment */}
        {equipment.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-4">
            {equipment.map(eq => (
              <span key={eq} className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white/50"
                style={{ background: 'rgba(255,255,255,0.07)' }}>{eq}</span>
            ))}
          </div>
        )}

        {/* Exercise preview */}
        <div className="space-y-2 mb-4">
          {exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-white/40 text-[9px] font-bold">{i + 1}</span>
              </div>
              <p className="text-white/60 text-sm flex-1 truncate">{ex.name}</p>
              <p className="text-white/30 text-xs">{ex.sets}×{ex.reps}</p>
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-white/30 text-xs ml-7">+{exercises.length - 3} more exercises</p>
          )}
        </div>

        {/* Start button */}
        <button onClick={onStart}
          className="w-full py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2"
          style={{ background: isDone ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)', boxShadow: isDone ? 'none' : '0 0 24px rgba(59,130,246,0.35)' }}>
          <Play className="w-5 h-5" fill="white" />
          {isDone ? 'Do Again' : isToday ? 'Start Workout' : 'Preview Workout'}
        </button>
      </div>
    </motion.div>
  );
}