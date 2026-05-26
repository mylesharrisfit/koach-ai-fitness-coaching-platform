import React from 'react';
import { ChevronRight } from 'lucide-react';
import { differenceInDays, parseISO } from 'date-fns';

export default function WorkoutProgramHeader({ program, client }) {
  if (!program) return null;

  const totalWeeks = program.duration_weeks || 12;
  const start = client?.start_date ? new Date(client.start_date) : new Date();
  const weeksPassed = Math.min(Math.max(0, Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000))), totalWeeks);
  const pct = Math.round((weeksPassed / totalWeeks) * 100);
  const daysLeft = client?.start_date
    ? Math.max(0, differenceInDays(new Date(client.start_date), new Date()) + totalWeeks * 7)
    : null;

  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="mx-4 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: 68, height: 68 }}>
          <svg width={68} height={68} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={34} cy={34} r={r} fill="none" strokeWidth={5} stroke="rgba(255,255,255,0.08)" />
            <circle cx={34} cy={34} r={r} fill="none" strokeWidth={5}
              stroke="url(#hdrRing)" strokeDasharray={circ} strokeDashoffset={offset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
            <defs>
              <linearGradient id="hdrRing" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-white font-bold text-sm leading-none">{pct}%</p>
          </div>
        </div>
        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base leading-tight truncate">{program.title}</p>
          <p className="text-white/40 text-xs mt-0.5">Week {weeksPassed} of {totalWeeks}</p>
          {daysLeft !== null && <p className="text-white/30 text-[10px] mt-0.5">{daysLeft} days remaining</p>}
          {/* Progress bar */}
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden w-full">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}