import React from 'react';
import { CheckCircle2, Circle, Dumbbell, Salad, Droplets, Footprints } from 'lucide-react';
// Icon is used dynamically via destructuring in GOAL_ROWS — no additional import needed
import { cn } from '@/lib/utils';

const GOAL_ROWS = [
  {
    key: 'workout',
    icon: Dumbbell,
    label: 'Workout',
    getStatus: (log) => ({ done: log.workout_done, text: log.workout_done ? 'Completed' : 'Not logged' }),
  },
  {
    key: 'meals',
    icon: Salad,
    label: 'Meals logged',
    getStatus: (log) => ({ done: (log.meals_logged || 0) >= 3, text: `${log.meals_logged || 0} / 3 meals` }),
  },
  {
    key: 'water',
    icon: Droplets,
    label: 'Water intake',
    getStatus: (log) => ({ done: (log.water_glasses || 0) >= 6, text: `${log.water_glasses || 0} / 8 glasses` }),
  },
  {
    key: 'steps',
    icon: Footprints,
    label: 'Steps',
    getStatus: (log) => ({ done: (log.steps || 0) >= 8000, text: `${(log.steps || 0).toLocaleString()} / 10,000` }),
  },
];

export default function TodayProgressCard({ log, completed, total, pct }) {
  const size = 120;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);
  const allDone = completed === total;

  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Today's Progress</p>

      <div className="flex items-center gap-5 mb-5">
        {/* Big ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={10}
              stroke={allDone ? 'color-mix(in srgb, var(--tc-success) 12%, transparent)' : 'color-mix(in srgb, var(--tc-primary) 8%, transparent)'} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={10}
              stroke={allDone ? 'var(--tc-success)' : 'var(--tc-primary)'}
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {allDone
              ? <span className="text-3xl">🎉</span>
              : <>
                  <span className="text-3xl font-bold leading-none" style={{ color: 'var(--tc-foreground)', letterSpacing: '-0.04em' }}>{pct}%</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5 font-medium">today</span>
                </>
            }
          </div>
        </div>

        {/* Summary text */}
        <div className="flex-1">
          {allDone ? (
            <>
              <p className="text-base font-bold text-foreground leading-tight">All goals crushed! 💪</p>
              <p className="text-sm text-muted-foreground mt-1">You're on a roll. Keep the streak alive.</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-foreground leading-tight">
                {completed} of {total} goals done
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {total - completed} left to complete today
              </p>
            </>
          )}

          {/* Mini progress dots */}
          <div className="flex gap-1.5 mt-3">
            {Array.from({ length: total }, (_, i) => (
              <div key={i} className="h-2 flex-1 rounded-full transition-all"
                style={{ background: i < completed ? (allDone ? 'var(--tc-success)' : 'var(--tc-primary)') : 'var(--tc-muted)' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Goal rows */}
      <div className="space-y-2">
        {GOAL_ROWS.map(({ key, icon: Icon, label, getStatus }) => {
          const { done, text } = getStatus(log);
          return (
            <div key={key} className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all',
              done ? 'bg-success/10' : 'bg-background'
            )}>
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                done ? 'bg-success/10' : 'bg-card border border-border')}>
                <Icon className={cn('w-3.5 h-3.5', done ? 'text-success' : 'text-muted-foreground')} />
              </div>
              <span className={cn('flex-1 text-sm font-medium', done ? 'text-success line-through decoration-success' : 'text-foreground')}>
                {label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className={cn('text-xs font-semibold', done ? 'text-success' : 'text-muted-foreground')}>{text}</span>
                {done
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : <Circle className="w-4 h-4 text-muted-foreground" />
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}