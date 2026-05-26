import React from 'react';

export default function ProgramRing({ program, startDate }) {
  if (!program) return null;

  const totalWeeks = program.duration_weeks || 12;
  const start = startDate ? new Date(startDate) : new Date();
  const weeksPassed = Math.min(Math.max(0, Math.floor((new Date() - start) / (7 * 24 * 60 * 60 * 1000))), totalWeeks);
  const pct = Math.round((weeksPassed / totalWeeks) * 100);
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  return (
    <div className="mx-5 p-4 rounded-2xl flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Ring */}
      <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
        <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={40} cy={40} r={r} fill="none" strokeWidth={6} stroke="rgba(255,255,255,0.06)" />
          <circle cx={40} cy={40} r={r} fill="none" strokeWidth={6}
            stroke="url(#ringGrad)" strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-white font-bold text-base leading-none">{pct}%</p>
          <p className="text-white/30 text-[8px] mt-0.5">done</p>
        </div>
      </div>
      <div>
        <p className="text-white font-bold text-sm">{program.title}</p>
        <p className="text-white/40 text-xs mt-0.5">Week {weeksPassed} of {totalWeeks}</p>
        <div className="mt-1.5 w-32 h-1 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3B82F6, #8B5CF6)' }} />
        </div>
      </div>
    </div>
  );
}