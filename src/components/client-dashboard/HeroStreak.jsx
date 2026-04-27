import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

const MESSAGES = [
  [0,   "Start your streak today 💪"],
  [1,   "Day 1 — every legend starts here 🔥"],
  [3,   "{n} days in — keep going! 🔥"],
  [7,   "{n} days on fire! 🔥🔥"],
  [14,  "{n} days — unstoppable! 🔥🔥🔥"],
  [30,  "{n} days — absolute beast mode 🏆"],
];

function getMessage(streak) {
  let msg = MESSAGES[0][1];
  for (const [min, m] of MESSAGES) {
    if (streak >= min) msg = m;
  }
  return msg.replace('{n}', streak);
}

export default function HeroStreak({ streak = 0, recentLogs = [] }) {
  const msg = getMessage(streak);
  // last 7 days dots
  const dots = Array.from({ length: 7 }, (_, i) => {
    const log = recentLogs[6 - i];
    const active = log && (log.workout_done || log.meals_logged >= 2 || log.water_glasses >= 4);
    return active;
  });

  return (
    <div className={cn(
      'rounded-2xl px-5 py-4 flex items-center gap-4',
      streak >= 7
        ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white'
        : streak > 0
        ? 'bg-orange-50 border border-orange-100'
        : 'bg-secondary/50 border border-border'
    )}>
      {/* Flame */}
      <div className="relative shrink-0">
        <Flame className={cn('w-9 h-9', streak >= 7 ? 'text-white' : streak > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
        {streak >= 14 && <Flame className="w-5 h-5 text-yellow-200 absolute -top-1.5 -right-1.5" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={cn('font-heading font-black text-3xl leading-none tabular-nums',
            streak >= 7 ? 'text-white' : streak > 0 ? 'text-orange-500' : 'text-muted-foreground')}>
            {streak}
          </span>
          <span className={cn('text-xs font-semibold', streak >= 7 ? 'text-white/70' : 'text-muted-foreground')}>
            day streak
          </span>
        </div>
        <p className={cn('text-xs mt-1 truncate', streak >= 7 ? 'text-white/80' : 'text-muted-foreground')}>
          {msg}
        </p>
      </div>

      {/* Last 7 day dots */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <p className={cn('text-[9px] font-medium', streak >= 7 ? 'text-white/50' : 'text-muted-foreground')}>
          7 days
        </p>
        <div className="flex gap-1">
          {dots.map((on, i) => (
            <div key={i} className={cn(
              'w-2.5 h-2.5 rounded-full',
              on
                ? streak >= 7 ? 'bg-white' : 'bg-orange-400'
                : streak >= 7 ? 'bg-white/20' : 'bg-border'
            )} />
          ))}
        </div>
      </div>
    </div>
  );
}