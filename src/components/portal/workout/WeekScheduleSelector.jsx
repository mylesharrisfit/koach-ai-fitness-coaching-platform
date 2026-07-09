import React, { useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

const today = new Date();
const weekStart = startOfWeek(today, { weekStartsOn: 1 });

export default function WeekScheduleSelector({ program, workoutSessions, selectedDay, onSelectDay }) {
  const workouts = program?.workouts || [];
  const scrollRef = useRef(null);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getStatus = (day) => {
    const isToday = isSameDay(day, today);
    const isPast = day < today && !isToday;
    const done = workoutSessions?.some(s => {
      if (!s.completed_at) return false;
      const d = new Date(s.completed_at);
      return isSameDay(d, day);
    });
    if (done) return 'done';
    if (isToday) return 'today';
    if (isPast) return 'missed';
    return 'upcoming';
  };

  return (
    <div className="px-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 px-1">This Week</p>
      <div ref={scrollRef} className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1"
        style={{ scrollSnapType: 'x mandatory' }}>
        {days.map((day, i) => {
          const w = workouts[i % workouts.length];
          const isRest = !w || w.day_name?.toLowerCase().includes('rest');
          const status = getStatus(day);
          const isSelected = selectedDay === i;
          const isTodayCard = isSameDay(day, today);
          const done = status === 'done';
          const missed = status === 'missed';

          return (
            <motion.button
              key={i}
              onClick={() => onSelectDay(i)}
              whileTap={{ scale: 0.93 }}
              style={{
                width: isTodayCard ? 86 : 80,
                minWidth: isTodayCard ? 86 : 80,
                height: 104,
                scrollSnapAlign: 'start',
                borderRadius: 18,
                flexShrink: 0,
                background: isSelected
                  ? 'linear-gradient(160deg, rgb(var(--primary)) 0%, rgb(var(--ai)) 100%)'
                  : isTodayCard
                  ? 'rgb(var(--accent))'
                  : 'rgb(var(--card))',
                border: isSelected
                  ? 'none'
                  : isTodayCard
                  ? '2px solid rgb(var(--accent))'
                  : '1.5px solid rgb(var(--muted))',
                boxShadow: isSelected
                  ? '0 6px 20px rgb(var(--primary) / 0.35)'
                  : isTodayCard
                  ? '0 2px 12px rgb(var(--primary) / 0.12)'
                  : '0 1px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 6px 8px',
                transition: 'box-shadow 0.2s',
              }}>
              {/* Day label */}
              <p style={{
                fontSize: 9,
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isSelected ? 'rgba(255,255,255,0.7)' : isTodayCard ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))',
              }}>
                {format(day, 'EEE')}
              </p>

              {/* Date number */}
              <p style={{
                fontSize: isTodayCard ? 20 : 17,
                fontWeight: 900,
                color: isSelected ? 'rgb(var(--card))' : isTodayCard ? 'rgb(var(--primary))' : 'rgb(var(--foreground))',
                lineHeight: 1,
              }}>
                {format(day, 'd')}
              </p>

              {/* Workout name */}
              <p style={{
                fontSize: 9,
                fontWeight: 700,
                color: isSelected ? 'rgba(255,255,255,0.65)' : isRest ? 'rgb(var(--muted-foreground))' : 'rgb(var(--muted-foreground))',
                textAlign: 'center',
                maxWidth: 72,
                lineHeight: 1.3,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {isRest ? 'Rest' : (w?.day_name?.split(' ').slice(0, 2).join(' ') || 'Day')}
              </p>

              {/* Status indicator */}
              <div style={{
                width: done || missed ? 18 : 14,
                height: done || missed ? 18 : 14,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: done
                  ? (isSelected ? 'rgba(255,255,255,0.3)' : 'rgb(var(--success))')
                  : missed
                  ? (isSelected ? 'rgba(255,255,255,0.15)' : 'rgb(var(--destructive))')
                  : isTodayCard
                  ? (isSelected ? 'rgba(255,255,255,0.25)' : 'rgb(var(--accent))')
                  : 'transparent',
                border: status === 'upcoming' && !isTodayCard ? '1.5px dashed rgb(var(--muted-foreground))' : 'none',
              }}>
                {done && <Check style={{ width: 10, height: 10, color: isSelected ? 'white' : 'white', strokeWidth: 3.5 }} />}
                {missed && <span style={{ fontSize: 8, fontWeight: 900, color: isSelected ? 'rgba(255,255,255,0.7)' : 'rgb(var(--destructive))' }}>✕</span>}
                {isTodayCard && !done && !missed && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: isSelected ? 'white' : 'rgb(var(--primary))' }} />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}