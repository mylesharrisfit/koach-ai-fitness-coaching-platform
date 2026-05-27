import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Moon, ChevronDown, ChevronUp, Check } from 'lucide-react';

const MUSCLE_COLORS = {
  chest: { bg: '#FEE2E2', text: '#DC2626' },
  back: { bg: '#DBEAFE', text: '#1D4ED8' },
  shoulders: { bg: '#EDE9FE', text: '#7C3AED' },
  arms: { bg: '#FEF3C7', text: '#D97706' },
  biceps: { bg: '#FEF3C7', text: '#D97706' },
  triceps: { bg: '#FEF9C3', text: '#CA8A04' },
  legs: { bg: '#D1FAE5', text: '#059669' },
  glutes: { bg: '#FCE7F3', text: '#DB2777' },
  core: { bg: '#FFEDD5', text: '#EA580C' },
  cardio: { bg: '#CFFAFE', text: '#0891B2' },
};

function getMuscleTag(name = '') {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('pec') || n.includes('fly')) return 'Chest';
  if (n.includes('row') || n.includes('pull') || n.includes('lat') || n.includes('back')) return 'Back';
  if (n.includes('shoulder') || n.includes('press') || n.includes('lateral') || n.includes('delt')) return 'Shoulders';
  if (n.includes('curl') || n.includes('bicep')) return 'Biceps';
  if (n.includes('tricep') || n.includes('pushdown') || n.includes('extension')) return 'Triceps';
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('quad') || n.includes('hamstring')) return 'Legs';
  if (n.includes('glute') || n.includes('hip') || n.includes('rdl') || n.includes('deadlift')) return 'Glutes';
  if (n.includes('plank') || n.includes('ab') || n.includes('crunch') || n.includes('core')) return 'Core';
  if (n.includes('run') || n.includes('bike') || n.includes('cardio') || n.includes('jump')) return 'Cardio';
  return 'Arms';
}

function getEquipment(exercises = []) {
  const eq = new Set();
  exercises.forEach(ex => {
    const n = (ex.name || '').toLowerCase();
    if (n.includes('barbell') || n.includes('bench') || n.includes('squat bar')) eq.add('Barbell');
    else if (n.includes('dumbbell') || n.includes('db ') || n.includes('curl') || n.includes('lateral')) eq.add('Dumbbells');
    if (n.includes('cable') || n.includes('pulldown') || n.includes('pushdown')) eq.add('Cable Machine');
    if (n.includes('bodyweight') || n.includes('push-up') || n.includes('plank') || n.includes('pull-up')) eq.add('Bodyweight');
  });
  return [...eq].slice(0, 3);
}

function ExerciseRow({ ex, idx }) {
  const muscle = getMuscleTag(ex.name);
  const key = muscle.toLowerCase();
  const color = MUSCLE_COLORS[key] || { bg: '#F1F5F9', text: '#64748B' };
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-black text-slate-500 bg-slate-100">{idx + 1}</div>
      <p className="flex-1 text-slate-800 font-semibold text-sm truncate">{ex.name}</p>
      <span className="text-slate-400 text-xs font-semibold whitespace-nowrap">{ex.sets}×{ex.reps}</span>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
        style={{ background: color.bg, color: color.text }}>{muscle}</span>
    </div>
  );
}

export default function WorkoutCard({ workout, isToday, dayDate, isDone, onStart }) {
  const [showAll, setShowAll] = useState(false);

  if (!workout || workout.day_name?.toLowerCase().includes('rest')) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mx-4 bg-white rounded-[20px] overflow-hidden"
        style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
        <div className="p-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-4 text-4xl">🛌</div>
          <p className="text-slate-900 font-black text-2xl">Rest Day</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Recovery is where the gains happen</p>
          <div className="grid grid-cols-2 gap-2">
            {['💧 Stay hydrated', '😴 8 hours sleep', '🧘 Light stretching', '🥗 Hit your macros'].map((tip, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-slate-600 text-xs font-semibold">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  const exercises = workout.exercises || [];
  const estMin = Math.max(25, Math.round(exercises.reduce((t, ex) => t + (ex.sets || 3) * 2.5, 0)));
  const equipment = getEquipment(exercises);
  const previewExs = showAll ? exercises : exercises.slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-4 bg-white rounded-[20px] overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #F1F5F9' }}>

      {/* Gradient header */}
      <div className="p-5" style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #7C3AED 100%)' }}>
        {isDone && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3"
            style={{ background: 'rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
            <Check className="w-3 h-3" strokeWidth={3} /> Completed Today
          </span>
        )}
        <h2 className="text-white font-black text-2xl leading-tight">{workout.day_name}</h2>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          <span className="text-white/70 text-sm font-semibold">{exercises.length} exercises</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="text-white/70 text-sm font-semibold">~{estMin} min</span>
          {equipment.length > 0 && <>
            <span className="text-white/30 text-sm">·</span>
            <span className="text-white/70 text-sm font-semibold">{equipment[0]}</span>
          </>}
        </div>
      </div>

      {/* Exercise list */}
      <div className="px-5 pt-3">
        {previewExs.map((ex, i) => <ExerciseRow key={i} ex={ex} idx={i} />)}
        {exercises.length > 3 && (
          <button onClick={() => setShowAll(v => !v)}
            className="w-full py-3 flex items-center justify-center gap-1.5 text-sm font-bold text-blue-600">
            {showAll ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> +{exercises.length - 3} more exercises</>}
          </button>
        )}
      </div>

      {/* Start button */}
      <div className="px-5 pb-5 pt-2">
        <button onClick={onStart}
          className="w-full flex items-center justify-center gap-2 font-black text-base text-white rounded-2xl transition-transform active:scale-[0.97]"
          style={{ height: 56, background: isDone ? 'linear-gradient(135deg, #059669, #10B981)' : 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: isDone ? '0 4px 16px rgba(5,150,105,0.3)' : '0 4px 20px rgba(37,99,235,0.35)' }}>
          <Play className="w-5 h-5 fill-white" />
          {isDone ? 'Do Again' : isToday ? 'Start Workout' : 'Preview Workout'}
        </button>
      </div>
    </motion.div>
  );
}