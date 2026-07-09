import React from 'react';
import { Dumbbell, CheckCircle2, Clock, ChevronRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function TodayWorkout({ workout, program, done, onToggle }) {
  const navigate = useNavigate();
  const exercises = workout?.exercises || [];
  const isRestDay = !workout || workout.day_name?.toLowerCase().includes('rest');
  const preview = exercises.slice(0, 3);
  const estMinutes = exercises.length > 0 ? exercises.length * 4 : null;

  const dayIndex = program?.workouts
    ? program.workouts.findIndex(w => w.day_name === workout?.day_name) + 1
    : null;
  const totalDays = program?.workouts?.length || 0;
  const progressPct = dayIndex && totalDays ? Math.round((dayIndex / totalDays) * 100) : 0;

  if (isRestDay && !program) return null;

  return (
    <div className={cn(
      'bg-card rounded-2xl border shadow-sm overflow-hidden',
      done ? 'border-success' : 'border-border'
    )}>
      {/* Done banner */}
      {done && (
        <div className="bg-success/10 px-5 py-2.5 flex items-center gap-2 border-b border-success">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-sm font-semibold text-success">Workout complete — great work! 🎉</span>
        </div>
      )}

      <div className="p-5">
        {/* Program pill */}
        {program?.title && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent mb-3">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-semibold text-primary">{program.title}</span>
          </div>
        )}

        {/* Workout name + time */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-foreground leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {isRestDay ? '😴 Rest Day' : (workout?.day_name || 'Today\'s Workout')}
            </h3>
            {isRestDay && (
              <p className="text-sm text-muted-foreground mt-1">Recovery is part of the process.</p>
            )}
          </div>
          {estMinutes && !isRestDay && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-muted flex-shrink-0">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">~{estMinutes}m</span>
            </div>
          )}
        </div>

        {/* Day progress bar */}
        {dayIndex && totalDays > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground font-medium">Day {dayIndex} of {totalDays}</span>
              <span className="text-xs font-bold text-foreground">{progressPct}% through program</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}

        {/* Exercise preview */}
        {!isRestDay && preview.length > 0 && (
          <div className="space-y-2 mb-4">
            {preview.map((ex, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-muted text-foreground text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-foreground font-medium">{ex.name}</span>
                {(ex.sets || ex.reps) && (
                  <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-md">
                    {ex.sets && `${ex.sets}×`}{ex.reps}
                  </span>
                )}
              </div>
            ))}
            {exercises.length > 3 && (
              <p className="text-xs text-muted-foreground pl-9 font-medium">+{exercises.length - 3} more exercises</p>
            )}
          </div>
        )}

        {!program && !isRestDay && (
          <p className="text-sm text-muted-foreground italic mb-4">No program assigned yet — your coach will add one soon.</p>
        )}

        {/* Action buttons */}
        {!isRestDay && (
          <div className="flex gap-2">
            <button
              onClick={onToggle}
              className={cn(
                'flex-1 h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2',
                done
                  ? 'bg-success/10 text-success border border-success'
                  : 'text-white shadow-sm hover:shadow-md active:scale-[0.98]'
              )}
              style={!done ? { background: 'var(--tc-sidebar)' } : {}}
            >
              {done
                ? <><CheckCircle2 className="w-4 h-4" /> Workout Logged</>
                : <>Start Workout <ChevronRight className="w-4 h-4" /></>
              }
            </button>
            {program && (
              <button
                onClick={() => navigate('/workout')}
                className="w-12 h-12 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:border-foreground hover:text-foreground transition-all"
              >
                <Dumbbell className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}