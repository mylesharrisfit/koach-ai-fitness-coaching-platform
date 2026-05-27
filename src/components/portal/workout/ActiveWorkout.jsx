import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pause, Play, X, CheckCircle2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function WorkoutTimer({ paused }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!paused) ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(ref.current);
  }, [paused]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return <span className="text-slate-500 text-sm font-mono tabular-nums">{m}:{s}</span>;
}

function RestTimer({ seconds, onSkip }) {
  const [rem, setRem] = useState(seconds);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => setRem(r => { if (r <= 1) { clearInterval(ref.current); onSkip?.(); return 0; } return r - 1; }), 1000);
    return () => clearInterval(ref.current);
  }, []);
  const pct = (rem / seconds) * 100;
  const r = 44; const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative" style={{ width: 110, height: 110 }}>
        <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={55} cy={55} r={r} fill="none" strokeWidth={6} stroke="#EFF6FF" />
          <circle cx={55} cy={55} r={r} fill="none" strokeWidth={6} stroke="#2563EB"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-slate-800 font-black text-2xl">{rem}s</p>
          <p className="text-slate-400 text-[10px]">rest</p>
        </div>
      </div>
      <p className="text-slate-500 text-sm font-semibold">Rest between sets — you earned it! 💪</p>
      <button onClick={onSkip} className="px-6 py-2.5 rounded-2xl font-bold text-sm text-slate-600 bg-slate-100 border border-slate-200">
        Skip Rest
      </button>
    </div>
  );
}

function SetRow({ setIdx, target, setLog, onUpdate }) {
  const done = !!setLog?.completed;
  return (
    <motion.div layout className={cn('flex items-center gap-3 p-3 rounded-2xl transition-all border',
      done ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100')}>
      <span className={cn('w-6 text-sm font-black text-center', done ? 'text-emerald-500' : 'text-slate-400')}>{setIdx + 1}</span>
      <div className="flex-1 flex items-center gap-1.5">
        <button onClick={() => onUpdate('weight', Math.max(0, (setLog?.weight || 0) - 2.5))}
          className="w-9 h-9 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 shadow-sm">−</button>
        <div className="flex-1 text-center">
          <input type="number" value={setLog?.weight || ''}
            onChange={e => onUpdate('weight', Number(e.target.value))}
            placeholder="lbs"
            className="w-full bg-transparent text-center text-slate-800 font-black text-base focus:outline-none placeholder-slate-300" />
        </div>
        <button onClick={() => onUpdate('weight', (setLog?.weight || 0) + 2.5)}
          className="w-9 h-9 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 shadow-sm">+</button>
      </div>
      <div className="flex-1 flex items-center gap-1.5">
        <button onClick={() => onUpdate('reps', Math.max(0, (setLog?.reps || 0) - 1))}
          className="w-9 h-9 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 shadow-sm">−</button>
        <div className="flex-1 text-center">
          <input type="number" value={setLog?.reps || ''}
            onChange={e => onUpdate('reps', Number(e.target.value))}
            placeholder={target}
            className="w-full bg-transparent text-center text-slate-800 font-black text-base focus:outline-none placeholder-slate-300" />
        </div>
        <button onClick={() => onUpdate('reps', (setLog?.reps || 0) + 1)}
          className="w-9 h-9 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-600 shadow-sm">+</button>
      </div>
      <button onClick={() => onUpdate('completed', !done)}
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all border',
          done ? 'border-transparent' : 'border-slate-200 bg-white')}
        style={done ? { background: 'linear-gradient(135deg, #2563EB, #7C3AED)' } : {}}>
        <Check className={cn('w-5 h-5', done ? 'text-white' : 'text-slate-300')} strokeWidth={3} />
      </button>
    </motion.div>
  );
}

function ExercisePanel({ exercise, exIdx, totalEx, exerciseLogs, onLogSet, onPrev, onNext }) {
  const [showNotes, setShowNotes] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const log = exerciseLogs[exIdx] || {};
  const doneSets = (log.sets_completed || []).filter(s => s.completed).length;
  const allDone = doneSets >= exercise.sets;

  const handleSetUpdate = (setIdx, field, value) => {
    onLogSet(exIdx, setIdx, field, value);
    if (field === 'completed' && value && exercise.rest_seconds > 0) setShowRest(true);
    if (field === 'completed' && value && navigator.vibrate) navigator.vibrate(60);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wide">Exercise {exIdx + 1} of {totalEx}</p>
          <span className={cn('text-xs px-3 py-1 rounded-full font-bold border',
            allDone ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-blue-600 bg-blue-50 border-blue-100')}>
            {doneSets}/{exercise.sets} sets
          </span>
        </div>
        <h2 className="text-slate-900 font-black text-2xl leading-tight">{exercise.name}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="text-xs px-3 py-1 rounded-xl font-semibold text-slate-600 bg-slate-100 border border-slate-200">
            {exercise.sets} sets × {exercise.reps} reps
          </span>
          {exercise.rest_seconds > 0 && (
            <span className="text-xs px-3 py-1 rounded-xl font-semibold text-slate-600 bg-slate-100 border border-slate-200">
              {exercise.rest_seconds}s rest
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showRest && exercise.rest_seconds > 0 && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mx-5 mb-4 rounded-3xl bg-blue-50 border border-blue-100">
            <RestTimer seconds={exercise.rest_seconds} onSkip={() => setShowRest(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 flex-1 overflow-y-auto space-y-2">
        <div className="grid grid-cols-[24px_1fr_1fr_40px] gap-3 px-3 pb-1">
          <span className="text-[10px] text-slate-400 font-bold">#</span>
          <span className="text-[10px] text-slate-400 font-bold text-center">WEIGHT</span>
          <span className="text-[10px] text-slate-400 font-bold text-center">REPS</span>
          <span />
        </div>
        {Array.from({ length: exercise.sets }).map((_, setIdx) => (
          <SetRow key={setIdx} setIdx={setIdx} target={exercise.reps}
            setLog={log.sets_completed?.[setIdx]}
            onUpdate={(field, value) => handleSetUpdate(setIdx, field, value)} />
        ))}

        {exercise.notes && (
          <div>
            <button onClick={() => setShowNotes(v => !v)} className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
              {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Coach notes
            </button>
            {showNotes && (
              <div className="mt-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <p className="text-amber-700 text-xs leading-relaxed">{exercise.notes}</p>
              </div>
            )}
          </div>
        )}
        <div className="h-4" />
      </div>

      <div className="px-5 pb-6 pt-3 flex gap-3">
        <button onClick={onPrev} disabled={exIdx === 0}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-slate-100 border border-slate-200 text-slate-600 disabled:opacity-30">
          <ArrowLeft className="w-4 h-4" /> Prev
        </button>
        <button onClick={onNext} disabled={exIdx === totalEx - 1}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: exIdx < totalEx - 1 ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#F1F5F9', color: exIdx < totalEx - 1 ? 'white' : '#94A3B8', border: 'none' }}>
          Next <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function ActiveWorkout({ workout, onFinish, onExit }) {
  const exercises = workout?.exercises || [];
  const [exIdx, setExIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState({});

  const logSet = (eIdx, setIdx, field, value) => {
    setExerciseLogs(prev => {
      const exLog = prev[eIdx] || { sets_completed: [] };
      const sets = [...(exLog.sets_completed || [])];
      if (!sets[setIdx]) sets[setIdx] = { set_number: setIdx + 1, weight: 0, reps: 0, completed: false };
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      return { ...prev, [eIdx]: { ...exLog, sets_completed: sets } };
    });
  };

  const totalSets = exercises.reduce((s, ex) => s + (ex.sets || 0), 0);
  const doneSets = Object.values(exerciseLogs).reduce((s, log) => s + (log.sets_completed || []).filter(s => s.completed).length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;
  const currentEx = exercises[exIdx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-3 flex-shrink-0 border-b border-slate-100">
        <button onClick={onExit} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 font-black text-sm truncate">{workout?.day_name}</p>
          <div className="flex items-center gap-2">
            <WorkoutTimer paused={paused} />
            <span className="text-slate-300 text-xs">·</span>
            <span className="text-slate-400 text-xs">{exIdx + 1}/{exercises.length}</span>
          </div>
        </div>
        <button onClick={() => setPaused(v => !v)} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          {paused ? <Play className="w-4 h-4 text-slate-500" fill="currentColor" /> : <Pause className="w-4 h-4 text-slate-500" />}
        </button>
        <button onClick={() => onFinish(exerciseLogs)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
          Finish
        </button>
      </div>

      <div className="h-1.5 bg-slate-100 mx-5 rounded-full overflow-hidden my-2 flex-shrink-0">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED)' }} />
      </div>

      <div className="flex gap-1.5 px-5 mb-2 flex-shrink-0">
        {exercises.map((_, i) => {
          const log = exerciseLogs[i] || {};
          const done = (log.sets_completed || []).filter(s => s.completed).length >= exercises[i].sets;
          return (
            <button key={i} onClick={() => setExIdx(i)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: done ? '#10B981' : i === exIdx ? '#2563EB' : '#E2E8F0' }} />
          );
        })}
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentEx && (
            <motion.div key={exIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }} className="h-full">
              <ExercisePanel exercise={currentEx} exIdx={exIdx} totalEx={exercises.length}
                exerciseLogs={exerciseLogs} onLogSet={logSet}
                onPrev={() => setExIdx(i => Math.max(0, i - 1))}
                onNext={() => setExIdx(i => Math.min(exercises.length - 1, i + 1))} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}