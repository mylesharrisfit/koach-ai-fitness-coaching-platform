import React, { useMemo } from 'react';
import { differenceInWeeks, format } from 'date-fns';
import { Dumbbell, ArrowRight } from 'lucide-react';

export default function ProgramProgressCard({ program, workoutSessions, client }) {
  const stats = useMemo(() => {
    const totalWorkouts = (program.workouts || []).length;
    const totalWeeks = program.duration_weeks || 12;
    const startDate = client?.start_date ? new Date(client.start_date) : null;
    const currentWeek = startDate ? Math.min(totalWeeks, differenceInWeeks(new Date(), startDate) + 1) : 1;
    const pct = Math.round((currentWeek / totalWeeks) * 100);
    const completed = workoutSessions.length;

    // Estimated completion
    const estCompDate = startDate
      ? new Date(startDate.getTime() + totalWeeks * 7 * 24 * 60 * 60 * 1000)
      : null;

    return { totalWorkouts, totalWeeks, currentWeek, pct, completed, estCompDate };
  }, [program, workoutSessions, client]);

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-white font-bold text-sm mb-3">📅 My Program</p>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)' }}>
          <Dumbbell className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <p className="text-white font-bold">{program.title}</p>
          <p className="text-white/30 text-xs capitalize">{program.difficulty} · {program.category?.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white/40 text-xs">Week {stats.currentWeek} of {stats.totalWeeks}</span>
        <span className="text-white/60 text-xs font-bold">{stats.pct}%</span>
      </div>
      <div className="h-2 rounded-full mb-3" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div className="h-full rounded-full transition-all"
          style={{ width: `${stats.pct}%`, background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }} />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(59,130,246,0.08)' }}>
          <p className="text-blue-400 font-bold text-lg">{stats.completed}</p>
          <p className="text-white/30 text-[9px]">Workouts Done</p>
        </div>
        <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(124,58,237,0.08)' }}>
          <p className="text-purple-400 font-bold text-lg">{stats.totalWeeks - stats.currentWeek + 1}</p>
          <p className="text-white/30 text-[9px]">Weeks Left</p>
        </div>
      </div>

      {stats.estCompDate && (
        <p className="text-white/30 text-[10px] text-center">
          Est. completion: {format(stats.estCompDate, 'MMMM d, yyyy')}
        </p>
      )}
    </div>
  );
}