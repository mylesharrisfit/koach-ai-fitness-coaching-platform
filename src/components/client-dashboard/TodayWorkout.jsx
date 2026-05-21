import React from 'react';
import { Dumbbell, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function TodayWorkout({ workout, program, done, onToggle }) {
  const navigate = useNavigate();
  const exercises = workout?.exercises || [];
  const isRestDay = !workout || workout.day_name?.toLowerCase().includes('rest');
  const preview = exercises.slice(0, 3);

  const dayIndex = program?.workouts ? program.workouts.findIndex(w => w.day_name === workout?.day_name) + 1 : null;
  const totalDays = program?.workouts?.length || 0;

  // Estimate duration: ~4 min per exercise
  const estMinutes = exercises.length > 0 ? exercises.length * 4 : null;

  return (
    <div className={cn('bg-white border rounded-xl p-4', done ? 'border-[#BBF7D0]' : 'border-[#E5E7EB]')}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            done ? 'bg-[#DCFCE7]' : 'bg-[#F3F4F6]')}>
            {done
              ? <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
              : <Dumbbell className="w-5 h-5 text-[#6B7280]" />
            }
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">{program?.title || "Today's Workout"}</p>
            <p className="text-base font-semibold text-[#111827] leading-tight">
              {isRestDay ? 'Rest Day' : (workout?.day_name || 'Your Workout')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {estMinutes && (
            <div className="flex items-center gap-1 text-xs text-[#6B7280]">
              <Clock className="w-3 h-3" />
              {estMinutes}m
            </div>
          )}
          {dayIndex && totalDays > 0 && (
            <span className="text-xs text-[#9CA3AF]">Day {dayIndex}/{totalDays}</span>
          )}
        </div>
      </div>

      {/* Exercise preview */}
      {!isRestDay && preview.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {preview.map((ex, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <span className="w-5 h-5 rounded-full bg-[#F3F4F6] text-[#374151] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-[#374151] flex-1">{ex.name}</span>
              {(ex.sets || ex.reps) && (
                <span className="text-xs text-[#9CA3AF]">
                  {ex.sets && `${ex.sets}×`}{ex.reps}
                </span>
              )}
            </div>
          ))}
          {exercises.length > 3 && (
            <p className="text-xs text-[#9CA3AF] pl-7">+{exercises.length - 3} more exercises</p>
          )}
        </div>
      )}

      {!program && !isRestDay && (
        <p className="text-xs text-[#9CA3AF] mb-3 italic">No program assigned — check with your coach.</p>
      )}

      {!isRestDay && (
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className={cn('flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors',
              done
                ? 'bg-[#DCFCE7] text-[#16A34A]'
                : 'bg-[#111827] text-white hover:bg-[#1F2937]'
            )}
          >
            {done ? 'Workout Logged' : 'Start Workout'}
          </button>
          {program && (
            <button
              onClick={() => navigate('/workout')}
              className="w-10 h-10 rounded-lg border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] hover:border-[#111827] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}