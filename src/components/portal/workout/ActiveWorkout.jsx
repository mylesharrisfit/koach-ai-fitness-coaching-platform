import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Pause, Play, X, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Workout timer ── */
function WorkoutTimer({ paused }) {
  const [elapsed, setElapsed] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    if (!paused) {
      ref.current = setInterval(() => setElapsed(e => e + 1), 1000);
    }
    return () => clearInterval(ref.current);
  }, [paused]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return <span className="text-white/50 text-sm font-mono tabular-nums">{m}:{s}</span>;
}

/* ── Rest timer ── */
function RestTimer({ seconds, onSkip }) {
  const [rem, setRem] = useState(seconds);
  const ref = useRef(null);
  useEffect(() => {
    ref.current = setInterval(() => setRem(r => {
      if (r <= 1) { clearInterval(ref.current); onSkip?.(); return 0; }
      return r - 1;
    }), 1000);
    return () => clearInterval(ref.current);
  }, []);
  const pct = (rem / seconds) * 100;
  const r = 44;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div className="relative" style={{ width: 110, height: 110 }}>
        <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={55} cy={55} r={r} fill="none" strokeWidth={6} stroke="rgba(255,255,255,0.06)" />
          <circle cx={55} cy={55} r={r} fill="none" strokeWidth={6} stroke="#3B82F6"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white font-bold text-2xl">{rem}s</p>
          <p className="text-white/30 text-[10px]">rest</p>
        </div>
      </div>
      <p className="text-white/50 text-sm">Rest between sets</p>
      <button onClick={onSkip} className="px-6 py-2.5 rounded-xl font-semibold text-sm text-white/60"
        style={{ background: 'rgba(255,255,255,0.08)' }}>
        Skip Rest
      </button>
    </div>
  );
}

/* ── Set row ── */
function SetRow({ setIdx, target, setLog, onUpdate }) {
  const done = !!setLog?.completed;
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-xl transition-colors',
      done ? 'bg-emerald-500/10' : 'bg-white/5')}>
      <span className={cn('w-6 text-sm font-bold text-center', done ? 'text-emerald-400' : 'text-white/30')}>{setIdx + 1}</span>
      {/* Weight */}
      <div className="flex-1 flex items-center gap-1.5">
        <button onClick={() => onUpdate('weight', Math.max(0, (setLog?.weight || 0) - 2.5))}
          className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">−</button>
        <div className="flex-1 text-center">
          <input type="number" value={setLog?.weight || ''}
            onChange={e => onUpdate('weight', Number(e.target.value))}
            placeholder="lbs"
            className="w-full bg-transparent text-center text-white font-bold text-base focus:outline-none placeholder-white/20" />
        </div>
        <button onClick={() => onUpdate('weight', (setLog?.weight || 0) + 2.5)}
          className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">+</button>
      </div>
      {/* Reps */}
      <div className="flex-1 flex items-center gap-1.5">
        <button onClick={() => onUpdate('reps', Math.max(0, (setLog?.reps || 0) - 1))}
          className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">−</button>
        <div className="flex-1 text-center">
          <input type="number" value={setLog?.reps || ''}
            onChange={e => onUpdate('reps', Number(e.target.value))}
            placeholder={target}
            className="w-full bg-transparent text-center text-white font-bold text-base focus:outline-none placeholder-white/20" />
        </div>
        <button onClick={() => onUpdate('reps', (setLog?.reps || 0) + 1)}
          className="w-8 h-8 rounded-lg bg-white/10 text-white font-bold text-sm">+</button>
      </div>
      {/* Check */}
      <button onClick={() => onUpdate('completed', !done)}
        className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all',
          done ? 'bg-emerald-500' : 'bg-white/10')}>
        <CheckCircle2 className={cn('w-5 h-5', done ? 'text-white' : 'text-white/20')} />
      </button>
    </div>
  );
}

/* ── Exercise detail panel ── */
function ExercisePanel({ exercise, exIdx, totalEx, exerciseLogs, onLogSet, onPrev, onNext }) {
  const [showNotes, setShowNotes] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const log = exerciseLogs[exIdx] || {};

  const doneSets = (log.sets_completed || []).filter(s => s.completed).length;
  const allDone = doneSets >= exercise.sets;

  const handleSetUpdate = (setIdx, field, value) => {
    onLogSet(exIdx, setIdx, field, value);
    // Auto-show rest timer after completing a set
    if (field === 'completed' && value && exercise.rest_seconds > 0) {
      setShowRest(true);
    }
    // Vibrate if available
    if (field === 'completed' && value && navigator.vibrate) {
      navigator.vibrate(60);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Exercise header */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-white/40 text-xs font-semibold">Exercise {exIdx + 1} of {totalEx}</p>
          <span className={cn('text-xs px-2.5 py-1 rounded-full font-semibold',
            allDone ? 'text-emerald-400' : 'text-blue-400')}
            style={{ background: allDone ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)' }}>
            {doneSets}/{exercise.sets} sets
          </span>
        </div>
        <h2 className="text-white font-bold text-2xl leading-tight">{exercise.name}</h2>
        <div className="flex gap-2 mt-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-white/50" style={{ background: 'rgba(255,255,255,0.07)' }}>
            {exercise.sets} sets × {exercise.reps} reps
          </span>
          {exercise.rest_seconds > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-lg font-medium text-white/50" style={{ background: 'rgba(255,255,255,0.07)' }}>
              {exercise.rest_seconds}s rest
            </span>
          )}
        </div>
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {showRest && exercise.rest_seconds > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mx-5 mb-4 rounded-2xl"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
            <RestTimer seconds={exercise.rest_seconds} onSkip={() => setShowRest(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sets */}
      <div className="px-5 flex-1 overflow-y-auto space-y-2">
        {/* Header row */}
        <div className="grid grid-cols-[24px_1fr_1fr_40px] gap-3 px-3 pb-1">
          <span className="text-[10px] text-white/20 font-bold">#</span>
          <span className="text-[10px] text-white/20 font-bold text-center">WEIGHT</span>
          <span className="text-[10px] text-white/20 font-bold text-center">REPS</span>
          <span />
        </div>
        {Array.from({ length: exercise.sets }).map((_, setIdx) => (
          <SetRow
            key={setIdx}
            setIdx={setIdx}
            target={exercise.reps}
            setLog={log.sets_completed?.[setIdx]}
            onUpdate={(field, value) => handleSetUpdate(setIdx, field, value)}
          />
        ))}

        {/* Coach notes */}
        {exercise.notes && (
          <div>
            <button onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-1.5 text-xs text-white/30 mt-3">
              {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Coach notes
            </button>
            {showNotes && (
              <div className="mt-2 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <p className="text-amber-300/60 text-xs leading-relaxed">{exercise.notes}</p>
              </div>
            )}
          </div>
        )}

        <div className="h-4" />
      </div>

      {/* Nav buttons */}
      <div className="px-5 pb-6 pt-3 flex gap-3">
        <button onClick={onPrev} disabled={exIdx === 0}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft className="w-4 h-4 text-white/50" />
          <span className="text-white/50">Prev</span>
        </button>
        <button onClick={onNext} disabled={exIdx === totalEx - 1}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: exIdx < totalEx - 1 ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <span className="text-blue-300">Next</span>
          <ArrowRight className="w-4 h-4 text-blue-300" />
        </button>
      </div>
    </div>
  );
}

/* ── Main Active Workout ── */
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
  const doneSets = Object.values(exerciseLogs).reduce((s, log) =>
    s + (log.sets_completed || []).filter(s => s.completed).length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  const currentEx = exercises[exIdx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#0A0A12' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-3 flex-shrink-0">
        <button onClick={onExit} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          <X className="w-4 h-4 text-white/60" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{workout?.day_name}</p>
          <div className="flex items-center gap-2">
            <WorkoutTimer paused={paused} />
            <span className="text-white/20 text-xs">·</span>
            <span className="text-white/40 text-xs">{exIdx + 1}/{exercises.length}</span>
          </div>
        </div>
        <button onClick={() => setPaused(v => !v)}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
          {paused ? <Play className="w-4 h-4 text-white/60" fill="currentColor" /> : <Pause className="w-4 h-4 text-white/60" />}
        </button>
        <button onClick={() => onFinish(exerciseLogs)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          Finish
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 mx-5 rounded-full overflow-hidden mb-2 flex-shrink-0">
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, #3B82F6, #22C55E)' }} />
      </div>

      {/* Exercise tabs */}
      <div className="flex gap-1 px-5 mb-2 flex-shrink-0">
        {exercises.map((_, i) => {
          const log = exerciseLogs[i] || {};
          const done = (log.sets_completed || []).filter(s => s.completed).length >= exercises[i].sets;
          return (
            <button key={i} onClick={() => setExIdx(i)}
              className="flex-1 h-1 rounded-full transition-all"
              style={{ background: done ? '#22C55E' : i === exIdx ? '#3B82F6' : 'rgba(255,255,255,0.1)' }} />
          );
        })}
      </div>

      {/* Exercise panel */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {currentEx && (
            <motion.div key={exIdx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }} className="h-full">
              <ExercisePanel
                exercise={currentEx}
                exIdx={exIdx}
                totalEx={exercises.length}
                exerciseLogs={exerciseLogs}
                onLogSet={logSet}
                onPrev={() => setExIdx(i => Math.max(0, i - 1))}
                onNext={() => setExIdx(i => Math.min(exercises.length - 1, i + 1))}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}