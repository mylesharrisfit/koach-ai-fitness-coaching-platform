import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import {
  ClipboardList, CheckCircle2, AlertTriangle, Clock, ChevronRight,
  ChevronLeft, X, Camera, Upload, Star, RotateCcw, Send, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ── helpers ── */
const TODAY = format(new Date(), 'yyyy-MM-dd');

function getDueStatus(checkIns) {
  if (!checkIns.length) return { status: 'due', daysOverdue: 0, daysUntil: 0 };
  const last = checkIns.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const nextDue = addDays(parseISO(last.date), 7);
  const diff = differenceInDays(nextDue, new Date());
  if (last.date === TODAY) return { status: 'submitted_today', lastCheckIn: last };
  if (diff < 0) return { status: 'overdue', daysOverdue: Math.abs(diff) };
  if (diff === 0) return { status: 'due', daysUntil: 0 };
  return { status: 'upcoming', daysUntil: diff };
}

/* ── Question renderers ── */
function WeightInput({ question, value, onChange, lastValue }) {
  const [unit, setUnit] = useState('lbs');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setUnit('lbs')}
          className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: unit === 'lbs' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)', color: unit === 'lbs' ? '#3B82F6' : 'rgba(255,255,255,0.4)' }}>
          lbs
        </button>
        <button onClick={() => setUnit('kg')}
          className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
          style={{ background: unit === 'kg' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.07)', color: unit === 'kg' ? '#3B82F6' : 'rgba(255,255,255,0.4)' }}>
          kg
        </button>
      </div>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
        placeholder="0.0"
        className="w-full text-center text-5xl font-bold bg-transparent text-white border-0 outline-none placeholder-white/20"
      />
      <p className="text-center text-white/30 text-xs">{unit}</p>
      {lastValue && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-white/40 text-xs">Last week: <span className="text-white/70 font-semibold">{lastValue} {unit}</span></span>
          {value && value < lastValue && <span className="text-emerald-400 text-xs font-bold">↓ {(lastValue - value).toFixed(1)}</span>}
          {value && value > lastValue && <span className="text-red-400 text-xs font-bold">↑ {(value - lastValue).toFixed(1)}</span>}
        </div>
      )}
    </div>
  );
}

function ScaleInput({ question, value, onChange }) {
  const emojis = { 1: '😩', 3: '😕', 5: '😐', 7: '🙂', 10: '😄' };
  const getColor = (v) => {
    if (v <= 3) return '#EF4444';
    if (v <= 5) return '#F59E0B';
    if (v <= 7) return '#3B82F6';
    return '#22C55E';
  };
  const current = value || 5;
  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div key={current} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-6xl mb-2">
          {emojis[1 + Math.round((current - 1) / 9 * 4)] || '😐'}
        </motion.div>
        <p className="text-5xl font-bold" style={{ color: getColor(current) }}>{current}</p>
        <p className="text-white/40 text-sm mt-1">{question.label}</p>
      </div>
      <input
        type="range" min="1" max="10" value={current}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
        style={{ accentColor: getColor(current) }}
      />
      <div className="flex justify-between text-white/25 text-xs">
        <span>1 — Very Low</span><span>10 — Excellent</span>
      </div>
    </div>
  );
}

function MoodSelector({ value, onChange }) {
  const moods = [
    { key: 'stressed', emoji: '😫', label: 'Stressed' },
    { key: 'tired', emoji: '😕', label: 'Tired' },
    { key: 'okay', emoji: '😐', label: 'Okay' },
    { key: 'good', emoji: '🙂', label: 'Good' },
    { key: 'great', emoji: '😄', label: 'Great' },
  ];
  return (
    <div className="flex justify-center gap-3">
      {moods.map(m => (
        <motion.button key={m.key} whileTap={{ scale: 0.85 }}
          onClick={() => onChange(m.key)}
          className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all"
          style={{
            background: value === m.key ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
            border: `2px solid ${value === m.key ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
            transform: value === m.key ? 'scale(1.15)' : 'scale(1)',
          }}>
          <span className="text-3xl">{m.emoji}</span>
          <span className="text-[9px] text-white/40 font-semibold">{m.label}</span>
        </motion.button>
      ))}
    </div>
  );
}

function MultipleChoice({ question, value, onChange }) {
  const isMulti = question.type === 'multiple_choice_multi';
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const toggle = (opt) => {
    if (isMulti) {
      const next = selected.includes(opt) ? selected.filter(o => o !== opt) : [...selected, opt];
      onChange(next);
    } else {
      onChange(opt);
    }
  };
  return (
    <div className="space-y-3">
      {(question.options || []).map(opt => {
        const active = isMulti ? selected.includes(opt) : value === opt;
        return (
          <motion.button key={opt} whileTap={{ scale: 0.97 }} onClick={() => toggle(opt)}
            className="w-full p-4 rounded-2xl text-left font-semibold text-sm transition-all"
            style={{
              background: active ? 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))' : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${active ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: active ? '#93C5FD' : 'rgba(255,255,255,0.6)',
            }}>
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-4 justify-center">
      {[{ v: true, label: 'Yes', color: '#22C55E' }, { v: false, label: 'No', color: '#EF4444' }].map(({ v, label, color }) => (
        <motion.button key={label} whileTap={{ scale: 0.93 }} onClick={() => onChange(v)}
          className="flex-1 py-5 rounded-2xl text-xl font-bold transition-all"
          style={{
            background: value === v ? `${color}20` : 'rgba(255,255,255,0.06)',
            border: `2px solid ${value === v ? color : 'rgba(255,255,255,0.1)'}`,
            color: value === v ? color : 'rgba(255,255,255,0.4)',
          }}>
          {label}
        </motion.button>
      ))}
    </div>
  );
}

function TextInput({ question, value, onChange }) {
  return (
    <div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={question.placeholder || 'Write your answer here...'}
        rows={5}
        className="w-full px-4 py-3 rounded-2xl text-white text-sm resize-none focus:outline-none"
        style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
      />
      <p className="text-white/20 text-xs mt-1 text-right">{(value || '').length} characters</p>
    </div>
  );
}

function MeasurementsInput({ value = {}, onChange, lastValues = {} }) {
  const fields = ['chest', 'waist', 'hips', 'arms', 'thighs'];
  const update = (field, v) => onChange({ ...value, [field]: v ? Number(v) : null });
  return (
    <div className="space-y-3">
      {fields.map(f => (
        <div key={f} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <span className="text-white/50 text-sm capitalize w-16">{f}</span>
          <input
            type="number"
            value={value[f] || ''}
            onChange={e => update(f, e.target.value)}
            placeholder="—"
            className="flex-1 bg-transparent text-white text-sm text-right outline-none"
          />
          <span className="text-white/30 text-xs">in</span>
          {lastValues[f] && value[f] && (
            <span className={`text-xs font-bold ${value[f] < lastValues[f] ? 'text-emerald-400' : 'text-red-400'}`}>
              {value[f] < lastValues[f] ? '↓' : '↑'}{Math.abs(value[f] - lastValues[f]).toFixed(1)}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function PhotoUpload({ value = {}, onChange }) {
  const angles = ['front', 'side', 'back'];
  const handleFile = (angle, file) => {
    const reader = new FileReader();
    reader.onload = e => onChange({ ...value, [angle]: e.target.result });
    reader.readAsDataURL(file);
  };
  return (
    <div className="space-y-4">
      <p className="text-white/30 text-xs text-center">🔒 Photos are only visible to your coach</p>
      <div className="grid grid-cols-3 gap-3">
        {angles.map(angle => (
          <label key={angle} className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px dashed rgba(255,255,255,0.15)' }}>
            {value[angle] ? (
              <>
                <img src={value[angle]} alt={angle} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <RotateCcw className="w-5 h-5 text-white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <Camera className="w-5 h-5 text-white/30" />
                <span className="text-white/25 text-[9px] capitalize">{angle}</span>
              </div>
            )}
            <input type="file" accept="image/*" capture="environment" className="hidden"
              onChange={e => e.target.files[0] && handleFile(angle, e.target.files[0])} />
          </label>
        ))}
      </div>
    </div>
  );
}

/* ── DEFAULT QUESTIONS ── */
const DEFAULT_QUESTIONS = [
  { id: 'weight', type: 'number', label: 'Current Weight', preset_key: 'weight' },
  { id: 'mood', type: 'mood', label: 'How are you feeling overall?' },
  { id: 'energy_level', type: 'scale', label: 'Energy Level', options: [] },
  { id: 'sleep_hours', type: 'number', label: 'Hours of Sleep Last Night' },
  { id: 'compliance_training', type: 'scale', label: 'Training Compliance (how closely did you follow your program?)', options: [] },
  { id: 'compliance_nutrition', type: 'scale', label: 'Nutrition Compliance', options: [] },
  { id: 'notes', type: 'text_long', label: 'Wins, struggles, or anything you want to share?', placeholder: 'Share any wins, struggles, questions, or highlights from this week...' },
  { id: 'photos', type: 'photo', label: 'Progress Photos (optional)' },
];

/* ── CHECK-IN FORM ── */
function CheckInForm({ client, checkIns, onDone, onExit }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const questions = DEFAULT_QUESTIONS;
  const q = questions[step];
  const lastCI = checkIns[0];
  const progress = ((step) / questions.length) * 100;

  const handleNext = () => {
    if (step < questions.length - 1) setStep(s => s + 1);
    else handleSubmit();
  };
  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload = {
      client_id: client.id,
      client_name: client.name,
      date: TODAY,
      review_status: 'pending',
    };
    // Map answers to entity fields
    if (answers.weight) payload.weight = Number(answers.weight);
    if (answers.mood) payload.mood = answers.mood;
    if (answers.energy_level) payload.energy_level = answers.energy_level;
    if (answers.compliance_training) payload.compliance_training = answers.compliance_training * 10;
    if (answers.compliance_nutrition) payload.compliance_nutrition = answers.compliance_nutrition * 10;
    if (answers.sleep_hours) payload.sleep_hours = Number(answers.sleep_hours);
    if (answers.notes) payload.notes = answers.notes;
    if (answers.measurements) payload.measurements = answers.measurements;

    await base44.entities.CheckIn.create(payload);
    queryClient.invalidateQueries({ queryKey: ['portal-checkins'] });
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    const streakCount = checkIns.length + 1;
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center pb-20">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
          className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
          style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)' }}>
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-white text-2xl font-bold mb-2">Check-in Submitted! 🎉</h2>
          <p className="text-white/50 text-sm mb-6">Your coach will review this soon.</p>
          <div className="p-4 rounded-2xl mb-8" style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.2)' }}>
            <p className="text-orange-300 font-bold text-lg">🔥 {streakCount} week check-in streak!</p>
            {streakCount === 10 && <p className="text-orange-200 text-sm mt-1">Amazing! You've completed 10 check-ins! 🏆</p>}
          </div>
          <div className="flex gap-3">
            <button onClick={onExit}
              className="flex-1 py-3.5 rounded-2xl text-white/60 font-semibold text-sm"
              style={{ background: 'rgba(255,255,255,0.07)' }}>
              Back to Dashboard
            </button>
            <button onClick={() => onDone('messages')}
              className="flex-1 py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
              <MessageSquare className="w-4 h-4" /> Message Coach
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const setAnswer = (v) => setAnswers(prev => ({ ...prev, [q.id]: v }));
  const currentAnswer = answers[q.id];
  const canProceed = q.type === 'photo' || currentAnswer !== undefined;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="text-white/40 text-xs font-semibold">Save & Exit</button>
          <span className="text-white/30 text-xs">{step + 1} of {questions.length}</span>
          <span className="text-white/30 text-xs">~{Math.max(1, Math.ceil((questions.length - step) * 0.25))} min left</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <motion.div animate={{ width: `${progress}%` }} className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }} />
        </div>
        <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mt-4">Weekly Check-in</p>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <h2 className="text-white text-xl font-bold mb-6 mt-2">{q.label}</h2>
            {q.type === 'number' && q.preset_key === 'weight' && (
              <WeightInput question={q} value={currentAnswer} onChange={setAnswer} lastValue={lastCI?.weight} />
            )}
            {q.type === 'scale' && <ScaleInput question={q} value={currentAnswer} onChange={setAnswer} />}
            {q.type === 'mood' && <MoodSelector value={currentAnswer} onChange={setAnswer} />}
            {q.type === 'multiple_choice' && <MultipleChoice question={q} value={currentAnswer} onChange={setAnswer} />}
            {q.type === 'yes_no' && <YesNo value={currentAnswer} onChange={setAnswer} />}
            {(q.type === 'text_long' || q.type === 'text_short') && (
              <TextInput question={q} value={currentAnswer} onChange={setAnswer} />
            )}
            {q.type === 'measurements' && (
              <MeasurementsInput value={currentAnswer} onChange={setAnswer}
                lastValues={lastCI?.measurements || {}} />
            )}
            {q.type === 'photo' && <PhotoUpload value={currentAnswer} onChange={setAnswer} />}
            {q.type === 'number' && !q.preset_key && (
              <input type="number" value={currentAnswer || ''} onChange={e => setAnswer(e.target.value)}
                placeholder="Enter value..."
                className="w-full text-center text-4xl font-bold bg-transparent text-white border-0 outline-none placeholder-white/20" />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 px-5 py-4 flex gap-3"
        style={{ background: 'rgba(10,15,26,0.97)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {step > 0 && (
          <button onClick={handleBack}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <ChevronLeft className="w-5 h-5 text-white/60" />
          </button>
        )}
        <button onClick={handleNext} disabled={!canProceed || submitting}
          className="flex-1 py-3.5 rounded-2xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-40 transition-opacity"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          {submitting ? 'Submitting...' : step === questions.length - 1 ? 'Submit Check-in ✓' : 'Next'}
          {!submitting && step < questions.length - 1 && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

/* ── CHECK-IN HISTORY ITEM ── */
function CheckInHistoryItem({ ci, onClick }) {
  const statusColor = ci.review_status === 'reviewed' ? '#22C55E' : ci.review_status === 'flagged' ? '#F59E0B' : 'rgba(255,255,255,0.2)';
  const statusLabel = ci.review_status === 'reviewed' ? 'Reviewed ✓' : ci.review_status === 'flagged' ? 'Flagged' : 'Pending';
  return (
    <motion.button whileTap={{ scale: 0.98 }} onClick={onClick}
      className="w-full p-4 rounded-2xl text-left" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-semibold text-sm">{format(parseISO(ci.date), 'MMMM d, yyyy')}</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${statusColor}15`, color: statusColor }}>
          {statusLabel}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-white/40">
        {ci.weight && <span>⚖️ {ci.weight} lbs</span>}
        {ci.mood && <span className="capitalize">{ci.mood === 'great' ? '😄' : ci.mood === 'good' ? '🙂' : ci.mood === 'okay' ? '😐' : '😕'} {ci.mood}</span>}
        {ci.energy_level && <span>⚡ Energy {ci.energy_level}/10</span>}
      </div>
      {ci.coach_notes && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <p className="text-white/30 text-xs line-clamp-1">💬 Coach: {ci.coach_notes}</p>
        </div>
      )}
      <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
    </motion.button>
  );
}

/* ── CHECK-IN DETAIL VIEW ── */
function CheckInDetail({ ci, onBack }) {
  return (
    <div className="px-5 pt-12 pb-28 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ChevronLeft className="w-4 h-4 text-white/70" />
        </button>
        <div>
          <p className="text-white/40 text-xs">Check-in</p>
          <p className="text-white font-bold">{format(parseISO(ci.date), 'MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {ci.weight && <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-blue-400 text-lg font-bold">{ci.weight} lbs</p>
          <p className="text-white/40 text-xs">Weight</p>
        </div>}
        {ci.energy_level && <div className="p-3 rounded-xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <p className="text-emerald-400 text-lg font-bold">{ci.energy_level}/10</p>
          <p className="text-white/40 text-xs">Energy</p>
        </div>}
        {ci.compliance_training && <div className="p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)' }}>
          <p className="text-purple-400 text-lg font-bold">{ci.compliance_training}%</p>
          <p className="text-white/40 text-xs">Training</p>
        </div>}
        {ci.compliance_nutrition && <div className="p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <p className="text-amber-400 text-lg font-bold">{ci.compliance_nutrition}%</p>
          <p className="text-white/40 text-xs">Nutrition</p>
        </div>}
      </div>

      {ci.notes && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <p className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider">Your Notes</p>
          <p className="text-white/70 text-sm leading-relaxed">{ci.notes}</p>
        </div>
      )}

      {ci.coach_notes && (
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <p className="text-blue-400 text-xs mb-2 font-semibold uppercase tracking-wider">💬 Coach Response</p>
          <p className="text-white/80 text-sm leading-relaxed">{ci.coach_notes}</p>
        </div>
      )}

      {!ci.coach_notes && (
        <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <Clock className="w-8 h-8 text-white/15 mx-auto mb-2" />
          <p className="text-white/30 text-sm">Waiting for coach response</p>
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PortalCheckIn({ user }) {
  const [mode, setMode] = useState('home'); // home | form | detail
  const [selectedCI, setSelectedCI] = useState(null);
  const navigate = useNavigate();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-ci', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins-ci', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 30),
    enabled: !!myClient?.id,
  });

  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const dueStatus = getDueStatus(sorted);

  if (mode === 'form' && myClient) {
    return (
      <CheckInForm
        client={myClient}
        checkIns={sorted}
        onExit={() => setMode('home')}
        onDone={(dest) => dest === 'messages' ? navigate('/portal/messages') : setMode('home')}
      />
    );
  }

  if (mode === 'detail' && selectedCI) {
    return <CheckInDetail ci={selectedCI} onBack={() => setMode('home')} />;
  }

  return (
    <div className="px-5 pt-12 pb-28 space-y-5">
      {/* Header */}
      <div>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Check-Ins</p>
        <h1 className="text-white text-xl font-bold mt-0.5">Weekly Check-in</h1>
      </div>

      {/* Status Card */}
      {dueStatus.status === 'due' || dueStatus.status === 'overdue' ? (
        <motion.div
          animate={dueStatus.status === 'due' ? { boxShadow: ['0 0 0 0 rgba(59,130,246,0)', '0 0 0 12px rgba(59,130,246,0.15)', '0 0 0 0 rgba(59,130,246,0)'] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="p-5 rounded-2xl"
          style={{
            background: dueStatus.status === 'overdue' ? 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))' : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))',
            border: `1.5px solid ${dueStatus.status === 'overdue' ? 'rgba(239,68,68,0.3)' : 'rgba(59,130,246,0.3)'}`,
          }}>
          <div className="flex items-start gap-3 mb-4">
            {dueStatus.status === 'overdue'
              ? <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              : <ClipboardList className="w-6 h-6 text-blue-400 flex-shrink-0" />
            }
            <div>
              <p className="text-white font-bold text-base">
                {dueStatus.status === 'overdue' ? `Check-in Overdue (${dueStatus.daysOverdue}d)` : 'Check-in Due Today!'}
              </p>
              <p className="text-white/50 text-xs mt-0.5">Takes just 2 minutes to complete</p>
            </div>
          </div>
          <button onClick={() => setMode('form')}
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm"
            style={{ background: dueStatus.status === 'overdue' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
            {dueStatus.status === 'overdue' ? 'Submit Now →' : 'Start Now →'}
          </button>
        </motion.div>
      ) : dueStatus.status === 'submitted_today' ? (
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-white font-bold">Check-in Submitted ✓</p>
              <p className="text-white/40 text-xs">Your coach will review soon</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-white/30 flex-shrink-0" />
            <div>
              <p className="text-white font-semibold">Next check-in in {dueStatus.daysUntil} day{dueStatus.daysUntil !== 1 ? 's' : ''}</p>
              <p className="text-white/40 text-xs">Keep up the great work!</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {sorted.length > 0 && (
        <div>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-3">History</p>
          <div className="space-y-2">
            {sorted.map(ci => (
              <div key={ci.id} className="relative">
                <CheckInHistoryItem ci={ci} onClick={() => { setSelectedCI(ci); setMode('detail'); }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {sorted.length === 0 && dueStatus.status !== 'due' && dueStatus.status !== 'overdue' && (
        <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <ClipboardList className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-white/40 text-sm font-semibold">No check-ins yet</p>
          <p className="text-white/20 text-xs mt-1">Your first check-in will appear here</p>
        </div>
      )}
    </div>
  );
}