import React from 'react';
import { Footprints, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const QUICK_ADDS = [1000, 2500, 5000];

export default function StepGoal({ steps = 0, goal = 10000, onChange }) {
  const pct = Math.min(100, (steps / goal) * 100);
  const done = steps >= goal;
  const remaining = Math.max(0, goal - steps);

  // Milestone markers
  const milestones = [25, 50, 75, 100];

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden shadow-sm transition-all',
      done ? 'bg-amber-50 border-amber-100' : 'bg-white border-border'
    )}>
      <div className="px-5 py-4">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            done ? 'bg-amber-400' : 'bg-amber-50'
          )}>
            <Footprints className={cn('w-5 h-5', done ? 'text-white' : 'text-amber-500')} />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Step Goal</p>
            <p className="font-heading font-bold text-base text-foreground">
              {steps.toLocaleString()}
              <span className="text-sm font-normal text-muted-foreground"> / {goal.toLocaleString()}</span>
            </p>
          </div>
          {done
            ? <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-400 rounded-full">
                <Zap className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white">Goal met!</span>
              </div>
            : <div className="text-right shrink-0">
                <p className="text-sm font-bold text-amber-500">{Math.round(pct)}%</p>
                <p className="text-[10px] text-muted-foreground">{remaining.toLocaleString()} left</p>
              </div>
          }
        </div>

        {/* Progress bar with milestones */}
        <div className="relative h-3 bg-secondary rounded-full overflow-visible mb-3">
          <div
            className="h-full bg-amber-400 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
          {milestones.map(m => (
            <div
              key={m}
              className={cn(
                'absolute top-0 bottom-0 w-px',
                pct >= m ? 'bg-amber-600/30' : 'bg-border'
              )}
              style={{ left: `${m}%` }}
            />
          ))}
        </div>

        {/* Milestone labels */}
        <div className="flex justify-between text-[9px] text-muted-foreground mb-4 px-0.5">
          {milestones.map(m => (
            <span key={m} className={cn(pct >= m && 'text-amber-500 font-semibold')}>
              {(goal * m / 100 / 1000).toFixed(0)}k
            </span>
          ))}
        </div>

        {/* Quick add */}
        <div className="flex gap-2">
          {QUICK_ADDS.map(n => (
            <button
              key={n}
              onClick={() => onChange(steps + n)}
              className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 transition-colors active:scale-95"
            >
              +{n.toLocaleString()}
            </button>
          ))}
          <button
            onClick={() => onChange(0)}
            className="px-3 py-2.5 text-xs rounded-xl bg-secondary/60 text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}