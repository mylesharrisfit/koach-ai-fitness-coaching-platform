import React, { useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { Video, MapPin, ClipboardCheck, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

const HOUR_START = 6;
const HOUR_END = 22;
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
const SLOT_HEIGHT = 64;

const typeIcons = { video_call: Video, in_person: MapPin, check_in: ClipboardCheck, consultation: Phone };
const typeColors = {
  video_call: 'from-primary to-primary',
  in_person: 'from-success to-success',
  check_in: 'from-warning to-warning',
  consultation: 'from-ai to-ai',
};

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function CurrentTimeLine() {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = HOUR_START * 60;
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  if (minutes < startMinutes || minutes > HOUR_END * 60) return null;
  const top = ((minutes - startMinutes) / totalMinutes) * (SLOT_HEIGHT * HOURS.length);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top }}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0 -ml-1.5" />
      <div className="flex-1 h-px bg-destructive" />
    </div>
  );
}

function SessionChip({ session, onEdit, compact }) {
  const Icon = typeIcons[session.type] || Video;
  const gradient = typeColors[session.type] || 'from-primary to-primary';
  const minutes = parseTimeToMinutes(session.time);
  const startMinutes = HOUR_START * 60;
  const totalMinutes = (HOUR_END - HOUR_START) * 60;
  const top = minutes !== null
    ? ((minutes - startMinutes) / totalMinutes) * (SLOT_HEIGHT * HOURS.length)
    : 0;
  const height = Math.max(((session.duration_minutes || 60) / 60) * SLOT_HEIGHT - 4, 28);

  return (
    <div
      onClick={() => onEdit(session)}
      className={cn(
        'absolute left-1 right-1 rounded-xl cursor-pointer overflow-hidden shadow-sm hover:shadow-md transition-all z-10',
        `bg-gradient-to-b ${gradient}`
      )}
      style={{ top: minutes !== null ? top + 2 : 4, height }}
    >
      <div className="px-2 py-1 h-full flex flex-col justify-start overflow-hidden">
        <div className="flex items-center gap-1 min-w-0">
          <Icon className="w-3 h-3 text-white/90 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-white truncate">{session.title}</span>
        </div>
        {!compact && session.client_name && (
          <span className="text-[10px] text-white/80 truncate">{session.client_name}</span>
        )}
        {!compact && session.time && (
          <span className="text-[10px] text-white/70">{session.time}</span>
        )}
      </div>
    </div>
  );
}

export default function TimeGrid({ days, sessions, onEdit, onNewSession }) {
  const scrollRef = useRef(null);
  const today = new Date();

  useEffect(() => {
    if (scrollRef.current) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = HOUR_START * 60;
      const pct = Math.max(0, (minutes - startMinutes - 60) / ((HOUR_END - HOUR_START) * 60));
      scrollRef.current.scrollTop = pct * scrollRef.current.scrollHeight;
    }
  }, []);

  return (
    <div className="flex flex-col bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="flex border-b border-border bg-card sticky top-0 z-30">
        <div className="w-14 flex-shrink-0" />
        {days.map(day => {
          const isToday = isSameDay(day, today);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                'flex-1 py-2.5 px-1 text-center border-l border-border',
                isToday && 'bg-accent/50'
              )}
            >
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(day, 'EEE')}
              </p>
              <div
                className={cn(
                  'w-8 h-8 mx-auto mt-0.5 flex items-center justify-center rounded-full text-sm font-bold',
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        className="overflow-y-auto"
        style={{ maxHeight: '72vh' }}
      >
        <div className="flex relative" style={{ height: SLOT_HEIGHT * HOURS.length }}>
          {/* Time column */}
          <div className="w-14 flex-shrink-0 relative z-10">
            {HOURS.map(h => (
              <div
                key={h}
                className="flex items-start justify-end pr-2"
                style={{ height: SLOT_HEIGHT, paddingTop: 6 }}
              >
                <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                  {h === 12 ? '12 PM' : h < 12 ? `${h} AM` : `${h - 12} PM`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const isToday = isSameDay(day, today);
            const daySessions = sessions.filter(s => s.date === format(day, 'yyyy-MM-dd'));
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex-1 relative border-l border-border',
                  isToday && 'bg-accent/30'
                )}
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    onNewSession(day);
                  }
                }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border/70"
                    style={{ top: (h - HOUR_START) * SLOT_HEIGHT }}
                  />
                ))}

                {/* No sessions label */}
                {daySessions.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[11px] text-muted-foreground font-medium">No sessions</span>
                  </div>
                )}

                {/* Sessions */}
                {daySessions.map(session => (
                  <SessionChip
                    key={session.id}
                    session={session}
                    onEdit={onEdit}
                    compact={days.length > 3}
                  />
                ))}

                {/* Current time */}
                {isToday && <CurrentTimeLine />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}