import React, { useState } from 'react';
import { ChevronDown, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProgramWeeklyScheduleTab({ program }) {
  const [expandedWeeks, setExpandedWeeks] = useState(new Set([0]));
  const [expandedDays, setExpandedDays] = useState(new Set());

  const toggleWeek = (weekIdx) => {
    const newSet = new Set(expandedWeeks);
    if (newSet.has(weekIdx)) newSet.delete(weekIdx);
    else newSet.add(weekIdx);
    setExpandedWeeks(newSet);
  };

  const toggleDay = (dayKey) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(dayKey)) newSet.delete(dayKey);
    else newSet.add(dayKey);
    setExpandedDays(newSet);
  };

  const expandAll = () => {
    const allWeeks = new Set(Array.from({ length: program.duration_weeks || 1 }, (_, i) => i));
    const allDays = new Set(
      program.workouts?.map((_, idx) => `day-${idx}`) || []
    );
    setExpandedWeeks(allWeeks);
    setExpandedDays(allDays);
  };

  const collapseAll = () => {
    setExpandedWeeks(new Set());
    setExpandedDays(new Set());
  };

  // Group workouts by week (simplified: repeat same workouts across weeks)
  const weekCount = program.duration_weeks || 1;
  const workoutsPerWeek = program.workouts || [];
  const restDaysPerWeek = 7 - (program.days_per_week || 0);

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Expand/Collapse All */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={expandAll} className="text-xs">
          Expand All
        </Button>
        <Button size="sm" variant="outline" onClick={collapseAll} className="text-xs">
          Collapse All
        </Button>
      </div>

      {/* Weeks */}
      <div className="space-y-3">
        {Array.from({ length: weekCount }).map((_, weekIdx) => {
          const isExpanded = expandedWeeks.has(weekIdx);
          const weekNum = weekIdx + 1;

          return (
            <div key={weekIdx} className="border border-border rounded-lg overflow-hidden">
              {/* Week Header */}
              <button
                onClick={() => toggleWeek(weekIdx)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-background hover:bg-muted transition-colors"
              >
                <ChevronDown
                  className={cn('w-4 h-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')}
                />
                <span className="font-semibold text-foreground">Week {weekNum}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {workoutsPerWeek.length} workouts + {restDaysPerWeek} rest day{restDaysPerWeek !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Week Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 py-4 space-y-3 bg-card border-t border-border">
                      {/* Training Days */}
                      {workoutsPerWeek.map((workout, dayIdx) => {
                        const dayKey = `day-${dayIdx}`;
                        const isDayExpanded = expandedDays.has(dayKey);
                        const exerciseCount = workout.exercises?.length || 0;
                        const estDuration = Math.round(exerciseCount * 5 + (workout.exercises?.reduce((sum, e) => sum + (e.sets || 3) * ((e.rest_seconds || 60) / 60), 0) || 30));

                        return (
                          <div key={dayIdx} className="border border-border rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleDay(dayKey)}
                              className="w-full flex items-center gap-3 px-3 py-3 bg-accent hover:bg-accent transition-colors"
                            >
                              <ChevronDown
                                className={cn('w-4 h-4 text-primary transition-transform', isDayExpanded && 'rotate-180')}
                              />
                              <div className="text-left flex-1 min-w-0">
                                <div className="font-semibold text-primary text-sm">
                                  {workout.day_name || `Day ${dayIdx + 1}`}
                                </div>
                                <div className="text-xs text-primary">
                                  {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''} • ~{estDuration}m
                                </div>
                              </div>
                            </button>

                            {/* Exercises List */}
                            <AnimatePresence>
                              {isDayExpanded && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: 'auto' }}
                                  exit={{ height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 py-3 space-y-2 bg-card border-t border-accent">
                                    {workout.exercises?.map((exercise, exIdx) => (
                                      <div key={exIdx} className="text-sm pb-2 border-b border-muted last:border-0">
                                        <div className="flex items-start gap-2 mb-1">
                                          <span className="font-semibold text-foreground flex-1">{exercise.name}</span>
                                          {exercise.notes && (
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Info className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 cursor-help mt-0.5" />
                                                </TooltipTrigger>
                                                <TooltipContent side="left" className="max-w-xs text-xs">
                                                  {exercise.notes}
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          )}
                                        </div>
                                        <div className="text-xs text-muted-foreground space-y-0.5">
                                          <div>
                                            <strong>{exercise.sets}</strong> x <strong>{exercise.reps || '8-10'}</strong>
                                            {exercise.rest_seconds && ` • ${exercise.rest_seconds}s rest`}
                                          </div>
                                          {exercise.rpe && <div>RPE: {exercise.rpe}</div>}
                                          {exercise.tempo && <div>Tempo: {exercise.tempo}</div>}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* Rest Days */}
                      {restDaysPerWeek > 0 && (
                        <div className="flex items-center gap-3 px-3 py-3 bg-success/10 rounded-lg border border-success">
                          <span className="text-xl">🛌</span>
                          <div>
                            <div className="font-semibold text-success text-sm">
                              Rest Day{restDaysPerWeek !== 1 ? 's' : ''}
                            </div>
                            <div className="text-xs text-success">{restDaysPerWeek} day{restDaysPerWeek !== 1 ? 's' : ''} per week</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}