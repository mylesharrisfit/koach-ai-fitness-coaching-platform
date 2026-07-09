import React from 'react';
import { motion } from 'framer-motion';

export default function WorkoutProgramHeader({ program, client, sessions = [] }) {
  if (!program) return null;

  const totalWeeks = program.duration_weeks || 12;
  const start = client?.start_date ? new Date(client.start_date) : new Date();
  const weeksPassed = Math.min(Math.max(1, Math.ceil((new Date() - start) / (7 * 24 * 60 * 60 * 1000))), totalWeeks);
  const pct = Math.round((weeksPassed / totalWeeks) * 100);
  
  // Count actual workout days in the program (excluding rest days)
  const allWorkouts = program.workouts || [];
  const totalWorkouts = allWorkouts.filter(w => !w.day_name?.toLowerCase().includes('rest')).length;
  
  // Completed = actual workout sessions logged
  const completed = sessions.length;
  
  // Remaining = total workouts - completed, never below 0
  const remaining = Math.max(0, totalWorkouts - completed);

  return (
    <div className="mx-4 rounded-[20px] overflow-hidden"
      style={{ background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--ai)) 100%)', boxShadow: '0 6px 28px rgba(37,99,235,0.3)' }}>
      <div className="p-5" style={{ background: 'rgba(0,0,0,0.1)' }}>
        {/* Program name */}
        <p className="text-white/50 text-[10px] font-black uppercase tracking-widest mb-1">Current Program</p>
        <h2 className="text-white font-black text-xl leading-tight">{program.title}</h2>

        {/* Week progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/70 text-xs font-semibold">Week {weeksPassed} of {totalWeeks}</p>
            <p className="text-white/50 text-xs">{pct}% complete</p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: 'rgba(255,255,255,0.85)' }} />
          </div>
        </div>

        {/* Stats */}
        <p className="text-white/50 text-xs mt-3 font-semibold">
          {completed} workout{completed !== 1 ? 's' : ''} completed · {remaining} remaining
        </p>
      </div>
    </div>
  );
}