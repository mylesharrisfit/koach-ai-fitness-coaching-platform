import React from 'react';
import { cn } from '@/lib/utils';
import { Dumbbell, Salad, Droplets, Footprints, CheckCircle2 } from 'lucide-react';

function MiniRing({ pct, color, icon: Icon, label, done }) {
  const size = 60;
  const r = 24;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct));
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6} className="text-secondary" stroke="currentColor" />
          <circle
            cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={6}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <CheckCircle2 className="w-4 h-4" style={{ color }} />
            : <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          }
        </div>
      </div>
      <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export default function DailyGoalRings({ log, onChange, completed, total, pct, streak }) {
  const allDone = completed === total;

  return (
    <div className={cn(
      'rounded-2xl p-5 transition-all',
      allDone
        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
        : 'bg-white border border-border shadow-sm'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className={cn('text-xs font-semibold uppercase tracking-wider', allDone ? 'text-white/70' : 'text-muted-foreground')}>
            Today's Goals
          </p>
          <p className={cn('font-heading font-bold text-2xl leading-none mt-1', allDone ? 'text-white' : 'text-foreground')}>
            {completed}<span className={cn('text-base font-normal', allDone ? 'text-white/60' : 'text-muted-foreground')}>/{total}</span>
          </p>
          {allDone && <p className="text-xs text-white/80 mt-1">Perfect day! 🎉</p>}
        </div>

        {/* Big progress arc */}
        <div className="relative w-20 h-20">
          {(() => {
            const size = 80, r = 34;
            const circ = 2 * Math.PI * r;
            const offset = circ * (1 - pct / 100);
            return (
              <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={7}
                  stroke={allDone ? 'rgba(255,255,255,0.25)' : 'hsl(210 40% 96%)'}
                />
                <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={7}
                  stroke={allDone ? 'white' : 'hsl(217 91% 60%)'}
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                />
              </svg>
            );
          })()}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-sm font-bold tabular-nums', allDone ? 'text-white' : 'text-foreground')}>{pct}%</span>
          </div>
        </div>
      </div>

      {/* Mini rings */}
      <div className="grid grid-cols-4 gap-2">
        <MiniRing
          pct={log.workout_done ? 1 : 0}
          color="#3b82f6" icon={Dumbbell} label="Workout"
          done={log.workout_done}
        />
        <MiniRing
          pct={(log.meals_logged || 0) / 3}
          color="#10b981" icon={Salad} label="Meals"
          done={(log.meals_logged || 0) >= 3}
        />
        <MiniRing
          pct={(log.water_glasses || 0) / 6}
          color="#06b6d4" icon={Droplets} label="Water"
          done={(log.water_glasses || 0) >= 6}
        />
        <MiniRing
          pct={(log.steps || 0) / 8000}
          color="#f59e0b" icon={Footprints} label="Steps"
          done={(log.steps || 0) >= 8000}
        />
      </div>
    </div>
  );
}