import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react';

export default function CheckInReview({ form, responses, onBack, onSubmit, submitting, lastCheckIn }) {
  const scrollRef = useRef(null);

  const getDisplayValue = (q, val) => {
    if (q.type === 'mood') return { 'stressed': '😫 Stressed', 'tired': '😕 Tired', 'okay': '😐 Okay', 'good': '🙂 Good', 'great': '😄 Great' }[val] || '—';
    if (q.type === 'scale') return `${val}/10`;
    if (q.type === 'yes_no') return val ? 'Yes' : 'No';
    if (Array.isArray(val)) return val.join(', ');
    return val || '—';
  };

  const weight = responses[form?.questions?.find(q => q.type === 'number')?.id];
  const mood = responses[form?.questions?.find(q => q.type === 'mood')?.id];
  const trend = lastCheckIn?.weight && weight ? weight - lastCheckIn.weight : null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950"
      style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <ArrowLeft className="w-5 h-5 text-white/60" />
        </button>
        <h2 className="text-white font-black text-lg">Review Your Answers</h2>
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-28 space-y-3">
        {/* Key highlights */}
        {weight && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-5 mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p className="text-white/50 text-xs font-bold mb-2">Weight Change</p>
            <div className="flex items-center gap-3">
              <p className="text-white font-black text-2xl">{weight} lbs</p>
              {trend !== null && (
                <span style={{ color: trend > 0 ? '#EF4444' : '#22C55E' }} className="font-bold">
                  {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)} lbs
                </span>
              )}
            </div>
          </motion.div>
        )}

        {mood && (
          <div className="rounded-2xl p-5 mb-4 flex items-center gap-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <p className="text-4xl">{{ 'stressed': '😫', 'tired': '😕', 'okay': '😐', 'good': '🙂', 'great': '😄' }[mood]}</p>
            <div>
              <p className="text-white/50 text-xs font-bold">Overall Mood</p>
              <p className="text-white font-bold text-lg">{({ 'stressed': 'Stressed', 'tired': 'Tired', 'okay': 'Okay', 'good': 'Good', 'great': 'Great' }[mood])}</p>
            </div>
          </div>
        )}

        {/* All questions */}
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider mt-6 mb-2">All Answers</p>
        {form?.questions?.map((q, i) => {
          const val = responses[q.id];
          const hasVal = val !== null && val !== undefined && val !== '';
          return (
            <motion.div key={q.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4 flex items-start justify-between"
              style={{ background: hasVal ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)', border: hasVal ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex-1">
                <p className="text-white/50 text-xs font-semibold">{q.label}</p>
                <p className="text-white font-bold text-sm mt-1">{getDisplayValue(q, val)}</p>
              </div>
              {hasVal && <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />}
            </motion.div>
          );
        })}
      </div>

      {/* Submit button */}
      <div className="px-5 py-4 flex-shrink-0" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <button onClick={onSubmit} disabled={submitting}
          className="w-full py-4 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2"
          style={{ background: submitting ? '#64748B' : 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: !submitting ? '0 4px 20px rgba(37,99,235,0.4)' : 'none', transition: 'all 0.3s' }}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Submit Check-in 🎉
            </>
          )}
        </button>
        <button onClick={onBack} disabled={submitting} className="w-full mt-2 py-3 text-white/50 font-semibold text-sm">
          Edit Answers
        </button>
      </div>
    </div>
  );
}