import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

/* ── Wake Lock ── */
function useWakeLock() {
  const ref = useRef(null);
  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then(lock => { ref.current = lock; }).catch(() => {});
    }
    return () => { ref.current?.release().catch(() => {}); };
  }, []);
}

/* ── Haptic ── */
function haptic(type = 'light') {
  if (navigator.vibrate) {
    if (type === 'light') navigator.vibrate(30);
    else if (type === 'medium') navigator.vibrate(60);
    else if (type === 'heavy') navigator.vibrate([40, 20, 40]);
    else if (type === 'success') navigator.vibrate([30, 20, 60, 20, 30]);
  }
}

/* ── Timer ── */
function WorkoutTimer({ startTime }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [startTime]);
  const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  return <span className="text-white/70 text-sm font-mono tabular-nums">{m}:{s}</span>;
}

/* ── Rest Timer Overlay ── */
function RestTimerOverlay({ seconds, nextSetInfo, onSkip, onDone }) {
  const [rem, setRem] = useState(seconds);
  const doneRef = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => {
      setRem(r => {
        if (r <= 1) {
          clearInterval(iv);
          if (!doneRef.current) { doneRef.current = true; haptic('heavy'); onDone?.(); }
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const pct = (rem / seconds) * 100;
  const r = 68; const circ = 2 * Math.PI * r;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
      style={{ background: 'rgba(5,10,20,0.88)', backdropFilter: 'blur(8px)' }}>

      <p className="text-white/50 text-xs font-black uppercase tracking-widest mb-6">Rest Time</p>
      <p className="text-white/30 text-sm font-semibold mb-8">{seconds}s prescribed</p>

      {/* Ring */}
      <div className="relative mb-8" style={{ width: 160, height: 160 }}>
        <svg width={160} height={160} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={80} cy={80} r={r} fill="none" strokeWidth={8} stroke="rgba(255,255,255,0.08)" />
          <circle cx={80} cy={80} r={r} fill="none" strokeWidth={8}
            stroke="url(#rest-grad)"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s linear' }} />
          <defs>
            <linearGradient id="rest-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="100%" stopColor="rgb(var(--ai))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white font-black" style={{ fontSize: 48, lineHeight: 1 }}>{rem}</p>
          <p className="text-white/40 text-xs font-semibold mt-1">sec</p>
        </div>
      </div>

      {nextSetInfo && (
        <div className="mb-6 px-5 py-3.5 rounded-2xl text-center"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-1">Next Up</p>
          <p className="text-white font-bold text-sm">{nextSetInfo}</p>
        </div>
      )}

      <p className="text-white/25 text-xs mb-8">Stay focused · breathe deep</p>

      <button onClick={() => { haptic('light'); onSkip(); }}
        className="px-8 py-3.5 rounded-2xl font-bold text-sm"
        style={{ border: '1.5px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)' }}>
        Skip Rest
      </button>
    </motion.div>
  );
}

/* ── End Workout Confirm ── */
function EndConfirmModal({ onConfirm, onCancel }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}>
      <motion.div initial={{ y: 200 }} animate={{ y: 0 }} exit={{ y: 200 }}
        className="w-full bg-card rounded-t-[28px] px-5 pt-5 pb-10"
        onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />
        <p className="text-foreground font-black text-xl text-center mb-2">End Workout?</p>
        <p className="text-muted-foreground text-sm text-center mb-6">Your progress will be saved.</p>
        <button onClick={onConfirm}
          className="w-full py-4 rounded-2xl font-black text-base text-white mb-3"
          style={{ background: 'linear-gradient(135deg, rgb(var(--destructive)), rgb(var(--destructive)))' }}>
          End Workout
        </button>
        <button onClick={onCancel}
          className="w-full py-4 rounded-2xl font-bold text-base text-muted-foreground bg-muted">
          Keep Going 💪
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ── Input Stepper Card ── */
function InputCard({ label, value, onChange, chips, unit, onUnitToggle }) {
  const pressRef = useRef(null);
  const inputRef = useRef(null);

  const startLongPress = (delta) => {
    let speed = 1;
    let count = 0;
    pressRef.current = setInterval(() => {
      count++;
      if (count > 10) speed = 3;
      if (count > 25) speed = 5;
      onChange(v => Math.max(0, v + delta * speed));
      haptic('light');
    }, 80);
  };
  const stopLongPress = () => clearInterval(pressRef.current);

  return (
    <div className="flex-1 bg-card rounded-[18px] p-4 flex flex-col items-center gap-1"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1.5px solid rgb(var(--muted))' }}>
      <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-1">{label}</p>

      {/* Value display */}
      <button onClick={() => inputRef.current?.focus()} className="relative">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          value={value || ''}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="text-center bg-transparent font-black focus:outline-none w-20"
          style={{ fontSize: 44, lineHeight: 1, color: 'rgb(var(--foreground))' }}
          placeholder="0"
        />
      </button>

      {/* Unit toggle */}
      {onUnitToggle && unit && (
        <button onClick={onUnitToggle}
          className="px-3 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: 'rgb(var(--accent))', color: 'rgb(var(--primary))' }}>{unit}</button>
      )}

      {/* -/+ row */}
      <div className="flex items-center gap-3 mt-1">
        <button
          onPointerDown={() => startLongPress(-1)} onPointerUp={stopLongPress} onPointerLeave={stopLongPress}
          onClick={() => { onChange(v => Math.max(0, v - 1)); haptic('light'); }}
          className="w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center"
          style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>−</button>
        <button
          onPointerDown={() => startLongPress(1)} onPointerUp={stopLongPress} onPointerLeave={stopLongPress}
          onClick={() => { onChange(v => v + 1); haptic('light'); }}
          className="w-12 h-12 rounded-2xl font-black text-xl flex items-center justify-center"
          style={{ background: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' }}>+</button>
      </div>

      {/* Quick chips */}
      <div className="flex gap-1.5 mt-1">
        {chips.map(c => (
          <button key={c} onClick={() => { onChange(v => v + c); haptic('light'); }}
            className="px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{ background: 'rgb(var(--muted))', border: '1px solid rgb(var(--border))', color: 'rgb(var(--muted-foreground))' }}>
            +{c}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Set History Row ── */
function SetHistoryRow({ setIdx, setLog, isCurrent, isUpcoming, prevBest, onEdit }) {
  const done = setLog?.completed;
  const isPR = done && prevBest && setLog.weight > prevBest;

  return (
    <motion.button layout onClick={done ? () => onEdit(setIdx) : undefined}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all"
      style={{
        background: isCurrent ? 'rgb(var(--accent))' : done ? 'rgb(var(--success))' : 'rgb(var(--background))',
        border: isCurrent ? '2px solid rgb(var(--accent))' : done ? '1px solid rgb(var(--success))' : '1px solid rgb(var(--muted))',
      }}>
      <span className="text-xs font-black w-5 text-center" style={{ color: done ? 'rgb(var(--success))' : isCurrent ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))' }}>
        {done ? '✓' : setIdx + 1}
      </span>
      <span className="flex-1 text-sm font-semibold text-left" style={{ color: done ? '#047857' : isCurrent ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))' }}>
        {done
          ? `${setLog.weight || 0} lbs × ${setLog.reps || 0} reps`
          : isCurrent
          ? 'Current set'
          : 'Upcoming'}
      </span>
      {isPR && (
        <span className="px-2 py-0.5 rounded-full text-[9px] font-black"
          style={{ background: 'rgb(var(--warning))', color: 'rgb(var(--warning))' }}>🏆 PR</span>
      )}
      {isCurrent && <span className="text-primary text-xs font-bold">→</span>}
    </motion.button>
  );
}

/* ── Muscle tag ── */
function getMuscleTag(name = '') {
  const n = name.toLowerCase();
  if (n.includes('bench') || n.includes('chest') || n.includes('fly')) return { label: 'Chest', bg: 'rgb(var(--destructive))', color: 'rgb(var(--destructive))' };
  if (n.includes('row') || n.includes('pull') || n.includes('lat')) return { label: 'Back', bg: 'rgb(var(--accent))', color: 'rgb(var(--primary))' };
  if (n.includes('shoulder') || n.includes('press') || n.includes('lateral') || n.includes('delt')) return { label: 'Shoulders', bg: 'rgb(var(--ai))', color: 'rgb(var(--ai))' };
  if (n.includes('curl') || n.includes('bicep')) return { label: 'Biceps', bg: 'rgb(var(--warning))', color: 'rgb(var(--warning))' };
  if (n.includes('tricep') || n.includes('pushdown')) return { label: 'Triceps', bg: 'rgb(var(--warning))', color: '#CA8A04' };
  if (n.includes('squat') || n.includes('leg') || n.includes('lunge') || n.includes('quad')) return { label: 'Legs', bg: 'rgb(var(--success))', color: 'rgb(var(--success))' };
  if (n.includes('glute') || n.includes('deadlift') || n.includes('rdl')) return { label: 'Glutes', bg: '#FCE7F3', color: '#DB2777' };
  if (n.includes('plank') || n.includes('ab') || n.includes('core')) return { label: 'Core', bg: 'rgb(var(--warning))', color: '#EA580C' };
  return { label: 'Compound', bg: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' };
}

/* ── Exercise Panel ── */
function ExercisePanel({ exercise, exIdx, totalEx, exerciseLogs, prevBest, onLogSet, onPrev, onNext, onFinish }) {
  const log = exerciseLogs[exIdx] || {};
  const setsDone = (log.sets_completed || []).filter(s => s.completed).length;
  const totalSets = exercise.sets || 3;
  const currentSetIdx = Math.min(setsDone, totalSets - 1);
  const allDone = setsDone >= totalSets;

  const [weight, setWeight] = useState(() => {
    const prev = log.sets_completed?.[currentSetIdx];
    return prev?.weight || (prevBest?.weight || 0);
  });
  const [reps, setReps] = useState(() => {
    const prev = log.sets_completed?.[currentSetIdx];
    return prev?.reps || (prevBest?.reps || (exercise.reps || 10));
  });
  const [showRest, setShowRest] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [logFlash, setLogFlash] = useState(false);
  const [unit, setUnit] = useState('lbs');

  const muscle = getMuscleTag(exercise.name);
  const restSec = exercise.rest_seconds || 90;

  const handleLogSet = () => {
    if (allDone) return;
    haptic('success');
    setLogFlash(true);
    setTimeout(() => setLogFlash(false), 600);
    onLogSet(exIdx, currentSetIdx, weight, reps);
    // Pre-fill next set
    setTimeout(() => {
      setWeight(w => w); // keep same weight
    }, 100);
    if (currentSetIdx < totalSets - 1) {
      setTimeout(() => setShowRest(true), 200);
    }
  };

  const nextSetInfo = currentSetIdx < totalSets - 1
    ? `Set ${currentSetIdx + 2} of ${totalSets} — try ${weight} lbs × ${reps} reps`
    : null;

  return (
    <div className="flex flex-col h-full">

      {/* Exercise header */}
      <div className="px-5 pt-4 pb-3 flex-shrink-0">
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
          Exercise {exIdx + 1} of {totalEx}
        </p>
        <h2 className="text-white font-black leading-tight" style={{ fontSize: 30 }}>{exercise.name}</h2>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: muscle.bg + '33', color: muscle.color, border: `1px solid ${muscle.bg}` }}>
            {muscle.label}
          </span>
          <span className="text-white/40 text-xs font-semibold">{totalSets} sets × {exercise.reps} reps</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/40 text-xs">{restSec}s rest</span>
        </div>

        {/* Previous best */}
        {prevBest ? (
          <div className="mt-3 px-4 py-2.5 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.07)', borderLeft: '3px solid rgba(255,255,255,0.2)' }}>
            <div>
              <p className="text-white/30 text-[10px] font-semibold">Last time</p>
              <p className="text-white font-bold text-sm">{prevBest.weight} lbs × {prevBest.reps} reps</p>
            </div>
            {prevBest.date && <p className="text-white/25 text-[10px] ml-auto">{prevBest.date}</p>}
          </div>
        ) : (
          <div className="mt-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)', borderLeft: '3px solid rgba(255,255,255,0.15)' }}>
            <p className="text-white/50 text-sm font-semibold">No previous data — crush it! 💪</p>
          </div>
        )}
      </div>

      {/* Set indicator */}
      <div className="px-5 mb-3 flex-shrink-0">
        <p className="text-[13px] font-black" style={{ color: 'rgb(var(--primary))' }}>
          {allDone ? '✓ All sets complete!' : `Set ${currentSetIdx + 1} of ${totalSets}`}
        </p>
      </div>

      {/* Input cards */}
      {!allDone && (
        <div className="px-4 mb-4 flex-shrink-0">
          <div className="flex gap-3">
            <InputCard label="Weight" value={weight} onChange={setWeight}
              chips={[2.5, 5, 10]} unit={unit} onUnitToggle={() => setUnit(u => u === 'lbs' ? 'kg' : 'lbs')} />
            <InputCard label="Reps" value={reps} onChange={setReps}
              chips={[1, 2, 5]} />
          </div>

          {/* LOG SET button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleLogSet}
            animate={logFlash ? { backgroundColor: ['rgb(var(--primary))', 'rgb(var(--success))', 'rgb(var(--primary))'] } : {}}
            transition={{ duration: 0.5 }}
            className="w-full mt-3 rounded-2xl font-black text-white flex items-center justify-center gap-2"
            style={{
              height: 60,
              fontSize: 17,
              background: logFlash ? 'rgb(var(--success))' : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))',
              boxShadow: '0 4px 20px rgb(var(--primary) / 0.4)',
            }}>
            {logFlash ? '✓ Logged!' : `LOG SET ✓`}
          </motion.button>
        </div>
      )}

      {/* Scrollable area: set history + notes */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2 pb-4">
        {/* Set history */}
        <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-2">Sets</p>
        {Array.from({ length: totalSets }).map((_, i) => {
          const setLog = log.sets_completed?.[i];
          const isCurrent = !allDone && i === currentSetIdx;
          const isUpcoming = i > currentSetIdx && !allDone;
          const prevBestWeight = prevBest?.weight || 0;
          return (
            <SetHistoryRow key={i} setIdx={i} setLog={setLog}
              isCurrent={isCurrent} isUpcoming={isUpcoming}
              prevBest={prevBestWeight}
              onEdit={(idx) => {}} />
          );
        })}

        {/* Add set */}
        <button className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{ border: '1.5px dashed rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}>
          <Plus className="w-3.5 h-3.5" /> Add Set
        </button>

        {/* Coach notes */}
        {exercise.notes && (
          <div className="mt-2">
            <button onClick={() => setShowNotes(v => !v)}
              className="flex items-center gap-2 text-white/40 text-xs font-bold">
              {showNotes ? '▲' : '▼'} Coach Notes
            </button>
            <AnimatePresence>
              {showNotes && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="mt-2 px-4 py-3 rounded-2xl"
                  style={{ background: 'rgb(var(--warning) / 0.1)', border: '1px solid rgb(var(--warning) / 0.2)' }}>
                  <p className="text-warning text-xs leading-relaxed">{exercise.notes}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="px-4 pb-8 pt-3 flex gap-3 flex-shrink-0"
        style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom) + 12px))' }}>
        <button onClick={onPrev} disabled={exIdx === 0}
          className="flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        {exIdx < totalEx - 1 ? (
          <button onClick={onNext}
            className="flex-[2] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5"
            style={{ background: allDone ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' : 'rgba(255,255,255,0.1)', color: allDone ? 'white' : 'rgba(255,255,255,0.4)', border: allDone ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
            Next Exercise <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={onFinish}
            className="flex-[2] py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, rgb(var(--success)), rgb(var(--success)))', color: 'white', boxShadow: '0 4px 16px rgba(5,150,105,0.4)' }}>
            Finish Workout 🎉
          </button>
        )}
      </div>

      {/* Rest timer overlay */}
      <AnimatePresence>
        {showRest && (
          <RestTimerOverlay
            seconds={restSec}
            nextSetInfo={nextSetInfo}
            onSkip={() => setShowRest(false)}
            onDone={() => setShowRest(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── MAIN ACTIVE WORKOUT ── */
export default function ActiveWorkout({ workout, onFinish, onExit }) {
  useWakeLock();
  const exercises = workout?.exercises || [];
  const [exIdx, setExIdx] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const startTime = useRef(Date.now());

  const logSet = useCallback((eIdx, setIdx, weight, reps) => {
    setExerciseLogs(prev => {
      const exLog = prev[eIdx] || { sets_completed: [] };
      const sets = [...(exLog.sets_completed || [])];
      sets[setIdx] = { set_number: setIdx + 1, weight, reps, completed: true };
      return { ...prev, [eIdx]: { ...exLog, sets_completed: sets } };
    });
  }, []);

  const totalSets = exercises.reduce((s, ex) => s + (ex.sets || 3), 0);
  const doneSets = Object.values(exerciseLogs).reduce((s, log) => s + (log.sets_completed || []).filter(s => s.completed).length, 0);
  const progress = totalSets > 0 ? doneSets / totalSets : 0;

  const currentEx = exercises[exIdx];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'linear-gradient(180deg, rgb(var(--foreground)) 0%, #1E1B4B 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 flex-shrink-0"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)', paddingBottom: 10 }}>
        <button onClick={() => setShowEndConfirm(true)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>
          <X className="w-5 h-5 text-white/70" />
        </button>
        <p className="flex-1 text-white font-bold text-sm truncate">{workout?.day_name}</p>
        <WorkoutTimer startTime={startTime.current} />
      </div>

      {/* Progress bar */}
      <div className="h-1 mx-4 mb-2 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: 0.5 }}
          className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), rgb(var(--ai)))' }} />
      </div>

      {/* Exercise dots */}
      <div className="flex gap-1.5 px-4 mb-3 flex-shrink-0">
        {exercises.map((_, i) => {
          const log = exerciseLogs[i] || {};
          const done = (log.sets_completed || []).filter(s => s.completed).length >= (exercises[i].sets || 3);
          return (
            <button key={i} onClick={() => setExIdx(i)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{ background: done ? 'rgb(var(--success))' : i === exIdx ? 'rgb(var(--primary))' : 'rgba(255,255,255,0.15)' }} />
          );
        })}
      </div>

      {/* Exercise content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {currentEx && (
            <motion.div key={exIdx}
              initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.22 }}>
              <ExercisePanel
                exercise={currentEx}
                exIdx={exIdx}
                totalEx={exercises.length}
                exerciseLogs={exerciseLogs}
                prevBest={null}
                onLogSet={logSet}
                onPrev={() => setExIdx(i => Math.max(0, i - 1))}
                onNext={() => { haptic('medium'); setExIdx(i => Math.min(exercises.length - 1, i + 1)); }}
                onFinish={() => onFinish(exerciseLogs)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* End confirm modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <EndConfirmModal
            onConfirm={() => { setShowEndConfirm(false); onFinish(exerciseLogs); }}
            onCancel={() => setShowEndConfirm(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}