import React, { useState } from 'react';
import { Dumbbell, ChevronDown, ChevronUp, CheckCircle2, Circle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TodayWorkout({ workout, program, done, onToggle }) {
  const [expanded, setExpanded] = useState(false);

  const exercises = workout?.exercises || [];
  const isRestDay = !workout || workout.day_name?.toLowerCase().includes('rest');

  return (
    <div className={cn(
      'rounded-2xl border overflow-hidden transition-all',
      done ? 'bg-blue-50 border-blue-100' : 'bg-white border-border shadow-sm'
    )}>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
            done ? 'bg-primary' : 'bg-blue-50'
          )}>
            {done
              ? <CheckCircle2 className="w-6 h-6 text-white" />
              : <Dumbbell className="w-5 h-5 text-blue-500" />
            }
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Today's Workout
            </p>
            <p className="font-heading font-bold text-base text-foreground leading-snug mt-0.5">
              {isRestDay
                ? 'Rest Day 😴'
                : workout?.day_name || program?.title || 'Your Workout'}
            </p>
            {program && !isRestDay && (
              <p className="text-xs text-muted-foreground mt-0.5">{program.title}</p>
            )}
          </div>

          {/* Complete toggle */}
          {!isRestDay && (
            <button
              onClick={onToggle}
              className={cn(
                'shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all',
                done
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100'
              )}
            >
              {done ? '✓ Done' : 'Log it'}
            </button>
          )}
        </div>

        {/* Exercise count + expand */}
        {!isRestDay && exercises.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Play className="w-3 h-3" />
            <span>{exercises.length} exercise{exercises.length !== 1 ? 's' : ''}</span>
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Exercise list */}
      {expanded && exercises.length > 0 && (
        <div className="border-t border-blue-100 divide-y divide-blue-50">
          {exercises.map((ex, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{ex.name}</p>
                {(ex.sets || ex.reps) && (
                  <p className="text-xs text-muted-foreground">
                    {ex.sets && `${ex.sets} sets`}{ex.sets && ex.reps && ' · '}{ex.reps && `${ex.reps} reps`}
                    {ex.rest_seconds && ` · ${ex.rest_seconds}s rest`}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No program assigned */}
      {!program && !isRestDay && (
        <div className="px-5 pb-4">
          <p className="text-xs text-muted-foreground italic">No program assigned yet — check with your coach.</p>
        </div>
      )}
    </div>
  );
}