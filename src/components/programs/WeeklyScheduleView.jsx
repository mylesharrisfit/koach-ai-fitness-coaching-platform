import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Clock, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_COLORS = {
  strength: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
  hypertrophy: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
  fat_loss: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
  athletic: 'bg-accent/10 text-accent border-accent/20',
  mobility: 'bg-chart-2/10 text-chart-2 border-chart-2/20',
  custom: 'bg-primary/10 text-primary border-primary/20',
};

const MUSCLE_GROUP_COLORS = {
  chest: '#4f8ef7',
  back: '#3dbd8a',
  shoulders: '#a875e8',
  biceps: '#4f8ef7',
  triceps: '#4f8ef7',
  legs: '#f45b5b',
  glutes: '#f45b5b',
  core: '#f5a623',
  full_body: '#3dbd8a',
  cardio: '#3dbd8a',
};

function getMuscleGroupSummary(exercises) {
  const groups = {};
  exercises.forEach(ex => {
    if (ex.name) {
      const g = ex._library_exercise?.muscle_group || 'other';
      groups[g] = (groups[g] || 0) + 1;
    }
  });
  return Object.entries(groups).sort((a, b) => b[1] - a[1]).slice(0, 3);
}

function getTotalVolume(exercises) {
  return exercises.reduce((sum, ex) => {
    const sets = Number(ex.sets) || 0;
    const reps = parseInt(ex.reps) || 0;
    return sum + sets * reps;
  }, 0);
}

export default function WeeklyScheduleView({ open, onClose, workouts, meta }) {
  if (!open) return null;

  const weeksToShow = Math.min(Number(meta.duration_weeks) || 4, 4);

  // Distribute workouts across week
  const daysPerWeek = Number(meta.days_per_week) || workouts.length;
  const workoutsPerWeek = workouts.slice(0, daysPerWeek);

  // Total program stats
  const totalExercises = workouts.reduce((sum, w) => sum + (w.exercises?.filter(e => e.name)?.length || 0), 0);
  const totalSets = workouts.reduce((sum, w) => sum + w.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0), 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Weekly Schedule — {meta.title || 'Program'}</DialogTitle>
        </DialogHeader>

        {/* Program stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Duration', value: `${meta.duration_weeks} weeks` },
            { label: 'Training Days', value: workouts.length },
            { label: 'Total Exercises', value: totalExercises },
            { label: 'Weekly Sets', value: totalSets },
          ].map(stat => (
            <div key={stat.label} className="bg-secondary/40 rounded-xl p-3 text-center">
              <p className="text-lg font-heading font-bold">{stat.value}</p>
              <p className="text-[10px] text-[#374151] uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Weekly grid */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#374151] mb-3">Week Structure</p>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day, idx) => {
              const workout = workoutsPerWeek[idx] || null;
              return (
                <div key={day} className={cn(
                  "rounded-xl border min-h-[100px] p-2 transition-all",
                  workout ? "bg-card border-border" : "bg-secondary/20 border-dashed border-border/40"
                )}>
                  <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2",
                    workout ? "text-[#374151]" : "text-[#374151]/40"
                  )}>{day}</p>
                  {workout ? (
                    <div>
                      <p className="text-xs font-semibold truncate">{workout.day_name}</p>
                      <p className="text-[10px] text-[#374151] mt-0.5">{workout.exercises.filter(e => e.name).length} exercises</p>
                      <div className="mt-2 space-y-0.5">
                        {getMuscleGroupSummary(workout.exercises).map(([group, count]) => (
                          <div key={group} className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: MUSCLE_GROUP_COLORS[group] || '#888' }} />
                            <span className="text-[9px] text-[#374151] truncate">{group.replace('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#374151]/40 text-center mt-4">Rest</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Day-by-day breakdown */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#374151] mb-3">Day-by-Day Breakdown</p>
          <div className="space-y-3">
            {workouts.map((workout, idx) => (
              <div key={idx} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3 bg-secondary/30 border-b border-border">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{workout.day_name}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#374151]">
                    <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{workout.exercises.filter(e => e.name).length} exercises</span>
                    <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />{workout.exercises.reduce((s, e) => s + (Number(e.sets) || 0), 0)} sets</span>
                  </div>
                </div>
                <div className="divide-y divide-border/50">
                  {workout.exercises.filter(e => e.name).map((ex, eIdx) => (
                    <div key={eIdx} className="flex items-center gap-3 px-4 py-2">
                      {ex.superset_group && (
                        <span className="text-[10px] font-bold text-chart-3 w-4 text-center">{ex.superset_group}</span>
                      )}
                      <p className="text-sm flex-1">{ex.name}</p>
                      <div className="flex items-center gap-3 text-xs text-[#374151]">
                        <span>{ex.sets} × {ex.reps}</span>
                        {ex.rpe && <span className="text-chart-4">RPE {ex.rpe}</span>}
                        {ex.load_pct && <span className="text-accent">{ex.load_pct}% 1RM</span>}
                        {ex.tempo && <span className="text-[#374151] font-mono">{ex.tempo}</span>}
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{ex.rest_seconds}s</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}