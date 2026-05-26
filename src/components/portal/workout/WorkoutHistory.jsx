import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { ChevronRight, ChevronDown } from 'lucide-react';

function SessionDetail({ session }) {
  const [open, setOpen] = useState(false);
  const volume = (session.exercise_logs || []).reduce((total, ex) => {
    return total + (ex.sets_completed || []).reduce((s, set) => {
      return s + (set.completed ? (set.weight || 0) * (set.reps || 0) : 0);
    }, 0);
  }, 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(v => !v)}>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{session.workout_day_name || 'Workout'}</p>
          <p className="text-white/30 text-[10px] mt-0.5">
            {session.completed_at ? format(parseISO(session.completed_at), 'EEE, MMM d') : ''}
            {session.duration_minutes ? ` · ${session.duration_minutes} min` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {volume > 0 && <span className="text-white/40 text-xs">{(volume).toLocaleString()} lbs</span>}
          {open ? <ChevronDown className="w-4 h-4 text-white/30" /> : <ChevronRight className="w-4 h-4 text-white/30" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-white/5 px-4 pb-4 space-y-2 pt-3">
          {(session.exercise_logs || []).map((ex, i) => {
            const doneSets = (ex.sets_completed || []).filter(s => s.completed);
            if (!doneSets.length) return null;
            return (
              <div key={i} className="flex items-start gap-2">
                <p className="text-white/60 text-xs font-semibold flex-1">{ex.exercise_name}</p>
                <div className="text-right">
                  {doneSets.map((s, si) => (
                    <p key={si} className="text-white/30 text-[10px]">
                      {s.weight ? `${s.weight} lbs × ` : ''}{s.reps} reps
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
          {session.session_note && (
            <p className="text-white/40 text-xs italic mt-2">"{session.session_note}"</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorkoutHistory({ sessions }) {
  if (!sessions?.length) {
    return (
      <div className="mx-4 py-12 text-center">
        <p className="text-white/20 text-4xl mb-3">🏋️</p>
        <p className="text-white/40 font-semibold text-sm">No workouts logged yet</p>
        <p className="text-white/20 text-xs mt-1">Complete your first workout to see history here</p>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-2.5">
      {sessions.map((s, i) => (
        <motion.div key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
          <SessionDetail session={s} />
        </motion.div>
      ))}
    </div>
  );
}