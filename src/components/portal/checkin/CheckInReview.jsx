import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Send, Loader2 } from 'lucide-react';

const MOOD_EMOJI = { stressed: '😫', tired: '😕', okay: '😐', good: '🙂', great: '😄' };

function formatAnswer(q, val) {
  if (val === null || val === undefined || val === '') return '—';
  if (q.type === 'mood') return `${MOOD_EMOJI[val] || ''} ${val}`;
  if (q.type === 'yes_no') return val === 'yes' ? '✅ Yes' : '❌ No';
  if (q.type === 'scale' || q.type === 'number') return String(val);
  if (q.type === 'multiple_choice' && Array.isArray(val)) return val.join(', ');
  if (q.type === 'measurements' && typeof val === 'object') {
    return Object.entries(val).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(' · ');
  }
  if (q.type === 'photo' && typeof val === 'object') {
    const count = Object.keys(val).filter(k => val[k]).length;
    return `${count} photo${count !== 1 ? 's' : ''} uploaded`;
  }
  return String(val);
}

export default function CheckInReview({ questions, answers, onEdit, onSubmit, submitting, onBack }) {
  const answeredCount = questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: '#0A0F1A' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-4 flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background: 'rgba(255,255,255,0.07)' }}>
          <ArrowLeft className="w-4 h-4 text-white/50" />
        </button>
        <div className="flex-1">
          <h2 className="text-white font-bold text-lg">Review Answers</h2>
          <p className="text-white/30 text-xs">{answeredCount}/{questions.length} answered</p>
        </div>
      </div>

      {/* Answers list */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {questions.map((q, i) => {
          const val = answers[q.id];
          const isEmpty = val === undefined || val === '' || val === null;
          return (
            <motion.div key={q.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-start gap-3 p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${isEmpty ? 'rgba(255,255,255,0.06)' : 'rgba(59,130,246,0.15)'}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-0.5">{q.label}</p>
                <p className="text-white font-semibold text-sm" style={{ color: isEmpty ? 'rgba(255,255,255,0.2)' : 'white' }}>
                  {isEmpty ? 'Skipped' : formatAnswer(q, val)}
                </p>
              </div>
              <button onClick={() => onEdit(i)}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Edit2 className="w-3.5 h-3.5 text-blue-400" />
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Submit */}
      <div className="flex-shrink-0 px-5 py-4 space-y-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <button onClick={onSubmit} disabled={submitting}
          className="w-full py-4 rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)', boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Check-in</>}
        </button>
        <p className="text-white/20 text-xs text-center">Your coach will be notified immediately</p>
      </div>
    </div>
  );
}