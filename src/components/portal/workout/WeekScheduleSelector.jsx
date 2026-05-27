import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

export default function WeekScheduleSelector({ program, workoutSessions, selectedDay, onSelectDay }) {
  const workouts = program?.workouts || [];
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatus = (day) => {
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
          const status = getStatus(day);
          const isSelected = selectedDay === i;
          const isToday = isSameDay(day, today);

          return (
            <button key={i} onClick={() => onSelectDay(i)}
              className={cn('flex-shrink-0 flex flex-col items-center gap-1 px-3 py-3 rounded-2xl transition-all min-w-[58px]')}
              style={{
                background: isSelected ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : isToday ? '#EFF6FF' : '#FFFFFF',
                border: isSelected ? 'none' : isToday ? '2px solid #BFDBFE' : '1.5px solid #F1F5F9',
                boxShadow: isSelected ? '0 4px 16px rgba(37,99,235,0.3)' : '0 1px 6px rgba(0,0,0,0.05)',
              }}>
              <p className={cn('text-[9px] font-black uppercase tracking-wide',
                isSelected ? 'text-white/80' : isToday ? 'text-blue-500' : 'text-slate-400')}>
                {format(day, 'EEE')}
              </p>
              <p className={cn('text-sm font-black', isSelected ? 'text-white' : isToday ? 'text-blue-600' : 'text-slate-700')}>
                {format(day, 'd')}
              </p>
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: status === 'done' ? (isSelected ? 'rgba(255,255,255,0.3)' : '#DCFCE7') : 
                              status === 'missed' ? (isSelected ? 'rgba(255,255,255,0.15)' : '#FEE2E2') :
                              status === 'today' ? (isSelected ? 'rgba(255,255,255,0.2)' : '#DBEAFE') : 'transparent',
                }}>
                {status === 'done' && <Check className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-emerald-500'}`} strokeWidth={3} />}
                {status === 'missed' && <span className={`text-[8px] font-bold ${isSelected ? 'text-white/60' : 'text-red-400'}`}>✕</span>}
                {status === 'today' && <div className="w-1.5 h-1.5 rounded-full" style={{ background: isSelected ? 'white' : '#3B82F6' }} />}
                {status === 'upcoming' && <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
              </div>
              <p className={cn('text-[8px] text-center leading-tight font-semibold',
                isSelected ? 'text-white/70' : 'text-slate-400')} style={{ maxWidth: 48 }}>
                {isRestDay ? '🌙' : w?.day_name?.split(' ').slice(0, 2).join(' ') || 'Day'}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}