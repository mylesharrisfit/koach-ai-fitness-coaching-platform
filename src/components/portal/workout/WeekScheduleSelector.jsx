import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday

export default function WeekScheduleSelector({ program, workoutSessions, selectedDay, onSelectDay }) {
  const workouts = program?.workouts || [];
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatus = (day, dayIdx) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isToday = isSameDay(day, today);
    const isPast = day < today && !isToday;
    const done = workoutSessions?.some(s => s.completed_at?.startsWith(dateStr));
    if (done) return 'done';
    if (isPast) return 'missed';
    if (isToday) return 'today';
    return 'upcoming';
  };

  return (
    <div className="px-4">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {days.map((day, i) => {
          const w = workouts[i % workouts.length];
          const isRestDay = !w;
          const status = getStatus(day, i);
          const isSelected = selectedDay === i;
          const isToday = isSameDay(day, today);

          return (
            <button key={i} onClick={() => onSelectDay(i)}
              className={cn('flex-shrink-0 flex flex-col items-center gap-1 px-3 py-3 rounded-2xl transition-all min-w-[56px]')}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                  : isToday
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(255,255,255,0.06)',
                border: isToday && !isSelected ? '1.5px solid rgba(59,130,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
              }}>
              {/* Day name */}
              <p className={cn('text-[9px] font-bold uppercase', isSelected ? 'text-white' : isToday ? 'text-blue-400' : 'text-white/40')}>
                {format(day, 'EEE')}
              </p>
              {/* Date number */}
              <p className={cn('text-sm font-bold', isSelected ? 'text-white' : 'text-white/80')}>
                {format(day, 'd')}
              </p>
              {/* Status dot */}
              <div className={cn('w-1.5 h-1.5 rounded-full')}
                style={{
                  background: status === 'done' ? '#22C55E' : status === 'missed' ? '#EF4444' : status === 'today' ? '#3B82F6' : 'rgba(255,255,255,0.2)'
                }} />
              {/* Workout label */}
              <p className={cn('text-[8px] text-center leading-tight', isSelected ? 'text-white/80' : 'text-white/25')} style={{ maxWidth: 48 }}>
                {isRestDay ? 'Rest' : w?.day_name?.split(' ').slice(0, 2).join(' ') || 'Day'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}