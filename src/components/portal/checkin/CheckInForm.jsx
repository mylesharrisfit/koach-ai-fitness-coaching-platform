import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { X, ArrowLeft, ArrowRight, Camera, Check } from 'lucide-react';
import CheckInQuestionWeight from './questions/CheckInQuestionWeight';
import CheckInQuestionScale from './questions/CheckInQuestionScale';
import CheckInQuestionMood from './questions/CheckInQuestionMood';
import CheckInQuestionChoice from './questions/CheckInQuestionChoice';
import CheckInQuestionYesNo from './questions/CheckInQuestionYesNo';
import CheckInQuestionText from './questions/CheckInQuestionText';
import CheckInQuestionMeasurements from './questions/CheckInQuestionMeasurements';
import CheckInQuestionPhoto from './questions/CheckInQuestionPhoto';
import CheckInReview from './CheckInReview';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const DRAFT_KEY = 'checkin_draft';

// Default questions if no custom form is assigned
const DEFAULT_QUESTIONS = [
  { id: 'weight', type: 'number', label: 'Current Weight', preset_key: 'weight' },
  { id: 'mood', type: 'mood', label: 'How are you feeling overall?' },
  { id: 'energy_level', type: 'scale', label: 'Energy Level', preset_key: 'energy_level' },
  { id: 'stress_level', type: 'scale', label: 'Stress Level', preset_key: 'stress_level' },
  { id: 'sleep_hours', type: 'number', label: 'Hours of Sleep Last Night', preset_key: 'sleep_hours' },
  { id: 'compliance_training', type: 'scale', label: 'Training Compliance This Week', preset_key: 'compliance_training' },
  { id: 'compliance_nutrition', type: 'scale', label: 'Nutrition Compliance This Week', preset_key: 'compliance_nutrition' },
  { id: 'notes', type: 'text_long', label: 'Wins, struggles, or anything else for your coach?' },
];

function getEstimatedTime(totalQ, currentQ) {
  const remaining = totalQ - currentQ;
  if (remaining <= 2) return '< 1 min left';
  return `~${Math.ceil(remaining * 0.25)} min left`;
}

export default function CheckInForm({ client, lastCheckIn, totalCheckIns, onSubmitted, onExit }) {
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [answers, setAnswers] = useState({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [direction, setDirection] = useState(1);
  const touchStartX = useRef(null);

  // Load draft
  useEffect(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (draft?.clientId === client?.id && draft.answers) {
        setAnswers(draft.answers);
        if (draft.currentIdx) setCurrentIdx(draft.currentIdx);
      }
    } catch {}
  }, [client?.id]);

  // Load assigned form questions
  useEffect(() => {
    if (!client?.id) return;
    (async () => {
      try {
        const forms = await base44.entities.CheckInForm.filter({ assign_to: 'all', is_active: true }, '-created_date', 1);
        if (forms[0]?.questions?.length > 0) setQuestions(forms[0].questions);
      } catch {}
    })();
  }, [client?.id]);

  // Save draft
  useEffect(() => {
    if (!client?.id || Object.keys(answers).length === 0) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ clientId: client.id, answers, currentIdx }));
  }, [answers, currentIdx, client?.id]);

  const currentQ = questions[currentIdx];
  const progress = ((currentIdx + 1) / questions.length) * 100;

  const setAnswer = (val) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
    // Auto-advance for mood and yes_no after short delay
    if (['mood', 'yes_no'].includes(currentQ.type) && currentIdx < questions.length - 1) {
      setTimeout(() => goNext(), 400);
    }
  };

  const goNext = () => {
    if (currentIdx < questions.length - 1) {
      setDirection(1);
      setCurrentIdx(i => i + 1);
      if (navigator.vibrate) navigator.vibrate(30);
    } else {
      setShowReview(true);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setDirection(-1);
      setCurrentIdx(i => i - 1);
    }
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) { diff > 0 ? goNext() : goPrev(); }
    touchStartX.current = null;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        client_id: client.id,
        client_name: client.name,
        date: TODAY,
        review_status: 'pending',
      };
      // Map answers to entity fields
      if (answers.weight) payload.weight = parseFloat(answers.weight);
      if (answers.mood) payload.mood = answers.mood;
      if (answers.energy_level) payload.energy_level = parseFloat(answers.energy_level);
      if (answers.stress_level) payload.stress_level = parseFloat(answers.stress_level);
      if (answers.sleep_hours) payload.sleep_hours = parseFloat(answers.sleep_hours);
      if (answers.compliance_training) payload.compliance_training = parseFloat(answers.compliance_training);
      if (answers.compliance_nutrition) payload.compliance_nutrition = parseFloat(answers.compliance_nutrition);
      if (answers.notes) payload.notes = answers.notes;
      if (answers.photo_urls) payload.photo_urls = answers.photo_urls;
      if (answers.measurements) payload.measurements = answers.measurements;
      if (answers.body_fat_pct) payload.body_fat_pct = parseFloat(answers.body_fat_pct);
      // Catch-all custom answers in notes
      const customKeys = Object.keys(answers).filter(k =>
        !['weight','mood','energy_level','stress_level','sleep_hours','compliance_training','compliance_nutrition','notes','photo_urls','measurements','body_fat_pct'].includes(k)
      );
      if (customKeys.length > 0 && !payload.notes) {
        payload.notes = customKeys.map(k => {
          const q = questions.find(q => q.id === k);
          return `${q?.label || k}: ${answers[k]}`;
        }).join('\n');
      }

      const result = await base44.entities.CheckIn.create(payload);
      localStorage.removeItem(DRAFT_KEY);
      onSubmitted(result);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (showReview) {
    return (
      <CheckInReview
        questions={questions}
        answers={answers}
        onEdit={(qIdx) => { setShowReview(false); setCurrentIdx(qIdx); }}
        onSubmit={handleSubmit}
        submitting={submitting}
        onBack={() => setShowReview(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0A0F1A' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onExit} className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{ background: 'rgba(255,255,255,0.07)' }}>
            <X className="w-4 h-4 text-white/50" />
          </button>
          <div className="text-center">
            <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">
              {format(new Date(), 'MMM d, yyyy')}
            </p>
            <p className="text-white text-sm font-bold">Weekly Check-in</p>
          </div>
          <div className="text-right">
            <p className="text-white/30 text-[10px]">{getEstimatedTime(questions.length, currentIdx)}</p>
            <p className="text-white/20 text-[10px]">{currentIdx + 1}/{questions.length}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div className="h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            style={{ background: 'linear-gradient(90deg, #3B82F6, #6366F1)' }} />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto px-5 pb-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div key={currentIdx}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="pt-4">
            <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Question {currentIdx + 1}</p>
            <h2 className="text-white text-xl font-bold mb-6 leading-tight">{currentQ.label}</h2>

            {currentQ.type === 'number' && currentQ.preset_key === 'weight' && (
              <CheckInQuestionWeight
                value={answers[currentQ.id]}
                onChange={setAnswer}
                lastValue={lastCheckIn?.weight}
              />
            )}
            {currentQ.type === 'number' && currentQ.preset_key !== 'weight' && (
              <CheckInQuestionScale
                value={answers[currentQ.id]}
                onChange={setAnswer}
                min={0} max={24}
                label={currentQ.label}
                isNumber
              />
            )}
            {currentQ.type === 'scale' && (
              <CheckInQuestionScale
                value={answers[currentQ.id]}
                onChange={setAnswer}
                lastValue={lastCheckIn?.[currentQ.preset_key]}
                label={currentQ.label}
              />
            )}
            {currentQ.type === 'mood' && (
              <CheckInQuestionMood value={answers[currentQ.id]} onChange={setAnswer} />
            )}
            {(currentQ.type === 'multiple_choice') && (
              <CheckInQuestionChoice
                value={answers[currentQ.id]}
                onChange={setAnswer}
                options={currentQ.options || []}
                multi={false}
              />
            )}
            {currentQ.type === 'yes_no' && (
              <CheckInQuestionYesNo value={answers[currentQ.id]} onChange={setAnswer} />
            )}
            {(currentQ.type === 'text_short' || currentQ.type === 'text_long') && (
              <CheckInQuestionText
                value={answers[currentQ.id]}
                onChange={setAnswer}
                multiline={currentQ.type === 'text_long'}
                placeholder={currentQ.label}
              />
            )}
            {currentQ.type === 'measurements' && (
              <CheckInQuestionMeasurements
                value={answers[currentQ.id]}
                onChange={setAnswer}
                lastMeasurements={lastCheckIn?.measurements}
              />
            )}
            {currentQ.type === 'photo' && (
              <CheckInQuestionPhoto value={answers[currentQ.id]} onChange={setAnswer} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 px-5 py-4 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button onClick={goPrev} disabled={currentIdx === 0}
          className="w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <button onClick={goNext}
          className="flex-1 h-12 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
          style={{ background: currentIdx === questions.length - 1 ? 'linear-gradient(135deg, #22C55E, #16A34A)' : 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
          {currentIdx === questions.length - 1 ? (
            <><Check className="w-4 h-4" /> Review Answers</>
          ) : (
            <>Next <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );
}