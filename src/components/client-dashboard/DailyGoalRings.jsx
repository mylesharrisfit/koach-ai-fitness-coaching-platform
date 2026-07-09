import React from 'react';
import { Dumbbell, Salad, Droplets, Footprints, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const GOALS = [
  { key: 'workout', icon: Dumbbell, label: 'Workout' },
  { key: 'meals',   icon: Salad,    label: 'Meals' },
  { key: 'water',   icon: Droplets, label: 'Water' },
  { key: 'steps',   icon: Footprints, label: 'Steps' },
];

export default function DailyGoalRings({ log, completed, total, pct }) {
  const size = 96, r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct / 100);

  const doneMap = {
    workout: log.workout_done,
    meals:   (log.meals_logged || 0) >= 3,
    water:   (log.water_glasses || 0) >= 6,
    steps:   (log.steps || 0) >= 8000,
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-5">
        {/* Big ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={8} stroke="color-mix(in srgb, black 6%, transparent)" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={8}
              stroke="var(--tc-primary)"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground leading-none">{pct}%</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">today</span>
          </div>
        </div>

        {/* 2x2 goal grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {GOALS.map(g => {
            const Icon = g.icon;
            const done = doneMap[g.key];
            return (
              <div key={g.key} className="flex items-center gap-2">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  done ? 'bg-success/10' : 'bg-muted')}>
                  {done
                    ? <Check className="w-3.5 h-3.5 text-success" />
                    : <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  }
                </div>
                <span className="text-xs text-foreground">{g.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-muted flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Goals completed</p>
        <span className="text-sm font-bold text-foreground">{completed}/{total}</span>
      </div>
    </div>
  );
}