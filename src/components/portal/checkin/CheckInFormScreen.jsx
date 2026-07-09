import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, ChevronLeft, ChevronRight } from 'lucide-react';

/* Weight question */
function WeightQuestion({ question, value, onChange, lastValue }) {
  const [unit, setUnit] = useState('lbs');
  const trend = lastValue && value ? value - lastValue : null;
  const trendColor = trend > 0 ? 'rgb(var(--destructive))' : trend < 0 ? 'rgb(var(--success))' : 'rgb(var(--muted-foreground))';
  const trendEmoji = trend > 0 ? '↑' : trend < 0 ? '↓' : '→';

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-white font-black text-2xl text-center mb-8">{question.label}</h2>
      {lastValue && (
        <p className="text-white/40 text-sm mb-4">Last week: {lastValue} {unit}</p>
      )}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => onChange(Math.max(0, value - 1))}
          className="w-14 h-14 rounded-2xl font-black text-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>−</button>
        <input type="number" value={value || ''} onChange={e => onChange(parseFloat(e.target.value) || 0)}
          className="w-24 text-center bg-transparent font-black focus:outline-none"
          style={{ fontSize: 56, color: 'rgb(var(--card))', lineHeight: 1 }}
          placeholder="0" />
        <button onClick={() => onChange(value + 1)}
          className="w-14 h-14 rounded-2xl font-black text-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.1)' }}>+</button>
      </div>
      <button onClick={() => setUnit(u => u === 'lbs' ? 'kg' : 'lbs')}
        className="px-4 py-1.5 rounded-full text-xs font-bold mb-6"
        style={{ background: 'rgba(59,130,246,0.2)', color: 'rgb(var(--primary))' }}>{unit}</button>
      {trend !== null && (
        <p className="text-sm font-semibold" style={{ color: trendColor }}>
          {trendEmoji} {Math.abs(trend).toFixed(1)} {unit} from last week
        </p>
      )}
    </div>
  );
}

/* Scale question (1-10) */
function ScaleQuestion({ question, value, onChange }) {
  const emojis = ['😫', '😕', '😐', '🙂', '😄'];
  const labels = ['Terrible', 'Poor', 'Okay', 'Good', 'Excellent'];
  const idx = Math.floor((value - 1) / 2);
  const color = value <= 3 ? 'rgb(var(--destructive))' : value <= 6 ? 'rgb(var(--warning))' : 'rgb(var(--success))';

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-white font-black text-2xl text-center mb-2">{question.label}</h2>
      <div className="flex gap-4 mb-8 mt-4">
        <span className="text-3xl">😫</span>
        <div className="flex-1">
          <input type="range" min="1" max="10" value={value || 5}
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none"
            style={{
              background: `linear-gradient(to right, rgb(var(--destructive)) 0%, rgb(var(--warning)) 50%, rgb(var(--success)) 100%)`,
              WebkitAppearance: 'slider-horizontal',
            }} />
        </div>
        <span className="text-3xl">😄</span>
      </div>
      <p className="font-black text-center" style={{ fontSize: 64, color, lineHeight: 1, marginBottom: 8 }}>
        {value || 5}
      </p>
      <p className="text-white/50 text-sm font-semibold">{labels[Math.floor((value || 5 - 1) / 2)]}</p>
    </div>
  );
}

/* Mood selector */
function MoodQuestion({ question, value, onChange }) {
  const moods = ['😫', '😕', '😐', '🙂', '😄'];
  const moodLabels = { 'stressed': 0, 'tired': 1, 'okay': 2, 'good': 3, 'great': 4 };
  const selectedIdx = moodLabels[value] ?? 2;

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-white font-black text-2xl text-center mb-8">{question.label}</h2>
      <div className="flex gap-4">
        {moods.map((emoji, i) => (
          <motion.button
            key={i}
            whileTap={{ scale: i === selectedIdx ? 1.15 : 0.9 }}
            onClick={() => onChange(Object.keys(moodLabels)[Object.values(moodLabels).indexOf(i)])}
            className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl transition-all"
            style={{
              background: i === selectedIdx ? 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))' : 'rgb(var(--card))',
              border: i === selectedIdx ? '3px solid white' : '2px solid rgb(var(--border))',
              boxShadow: i === selectedIdx ? '0 0 20px rgba(37,99,235,0.4)' : 'none',
            }}>
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* Multiple choice */
function MultipleChoiceQuestion({ question, value, onChange }) {
  const isMulti = question.options?.length > 2;

  return (
    <div>
      <h2 className="text-white font-black text-2xl text-center mb-6">{question.label}</h2>
      <div className="space-y-3">
        {question.options?.map((opt, i) => {
          const selected = isMulti ? (value || []).includes(opt) : value === opt;
          return (
            <motion.button
              key={i}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (isMulti) {
                  const arr = value || [];
                  onChange(arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt]);
                } else {
                  onChange(opt);
                }
              }}
              className="w-full py-4 rounded-2xl text-center font-bold text-white transition-all"
              style={{
                background: selected
                  ? 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(99,102,241,0.2))'
                  : 'rgba(255,255,255,0.05)',
                border: selected ? '2px solid rgb(var(--primary))' : '1px solid rgba(255,255,255,0.1)',
                boxShadow: selected ? '0 0 16px rgba(37,99,235,0.2)' : 'none',
              }}>
              {selected && <span className="mr-2">✓</span>}
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* Yes/No */
function YesNoQuestion({ question, value, onChange }) {
  return (
    <div>
      <h2 className="text-white font-black text-2xl text-center mb-8">{question.label}</h2>
      <div className="flex gap-4">
        {[
          { label: 'Yes ✓', val: true, color: 'rgb(var(--success))' },
          { label: 'No ✗', val: false, color: 'rgb(var(--destructive))' },
        ].map(btn => (
          <motion.button
            key={btn.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(btn.val)}
            className="flex-1 py-12 rounded-2xl font-black text-base transition-all"
            style={{
              background: value === btn.val ? btn.color : 'rgba(255,255,255,0.05)',
              color: value === btn.val ? 'white' : 'rgba(255,255,255,0.5)',
              border: value === btn.val ? 'none' : '1px solid rgba(255,255,255,0.1)',
            }}>
            {btn.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* Text input */
function TextQuestion({ question, value, onChange }) {
  const isLong = question.type === 'text_long';
  return (
    <div>
      <h2 className="text-white font-black text-2xl text-center mb-6">{question.label}</h2>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={question.label}
        rows={isLong ? 6 : 2}
        className="w-full px-4 py-3 rounded-2xl text-white resize-none focus:outline-none placeholder-white/20"
        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 16 }} />
      <p className="text-white/30 text-xs mt-2">{(value || '').length} characters</p>
    </div>
  );
}

/* Main form screen */
export default function CheckInFormScreen({ form, responses, onResponseChange, onExit, onReview, currentQ = 0 }) {
  const questions = form?.questions || [];
  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = ((currentQ + 1) / totalQ) * 100;
  const value = responses[q?.id] || null;

  const goNext = () => {
    if (currentQ < totalQ - 1) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onReview();
    }
  };

  const goPrev = () => {
    if (currentQ > 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (!q) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-sidebar via-sidebar to-sidebar"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 80px)' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0">
        <button onClick={onExit} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <p className="text-white/40 text-xs font-semibold">Question {currentQ + 1} of {totalQ}</p>
        <button onClick={onExit} className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <Save className="w-3.5 h-3.5 inline mr-1" /> Draft
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/10 mx-5 rounded-full overflow-hidden flex-shrink-0">
        <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, rgb(var(--primary)), rgb(var(--ai)))' }} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-12 flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.div key={currentQ} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.2 }} className="w-full max-w-md">
            {q.type === 'number' && <WeightQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
            {q.type === 'scale' && <ScaleQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
            {q.type === 'mood' && <MoodQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
            {q.type === 'multiple_choice' && <MultipleChoiceQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
            {q.type === 'yes_no' && <YesNoQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
            {(q.type === 'text_short' || q.type === 'text_long') && <TextQuestion question={q} value={value} onChange={v => onResponseChange(q.id, v)} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer navigation */}
      <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button onClick={goPrev} disabled={currentQ === 0}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={goNext}
          className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white"
          style={{ background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', boxShadow: '0 4px 16px rgba(37,99,235,0.3)' }}>
          {currentQ === totalQ - 1 ? 'Review' : 'Next'} <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}