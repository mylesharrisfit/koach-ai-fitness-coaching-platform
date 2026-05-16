import React, { useState } from 'react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameDay, isSameMonth, format
} from 'date-fns';
import { cn } from '@/lib/utils';
import SessionDetailPopover from './SessionDetailPopover';

const typeColors = {
  video_call: 'bg-blue-500 text-white',
  in_person: 'bg-emerald-500 text-white',
  check_in: 'bg-blue-500 text-white',
  program_review: 'bg-violet-500 text-white',
  onboarding: 'bg-emerald-500 text-white',
  progress_review: 'bg-amber-500 text-white',
  consultation: 'bg-gray-400 text-white',
};

export default function MonthView({ currentDate, sessions, onDayClick, onEditSession, clients = [] }) {
  const [selectedSession, setSelectedSession] = useState(null);
  const today = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = [];
  let d = gridStart;
  while (d <= gridEnd) {
    days.push(d);
    d = addDays(d, 1);
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E7EAF3] shadow-sm overflow-hidden">
        {/* Day labels */}
        <div className="grid grid-cols-7 border-b border-[#E7EAF3]">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2.5 text-center text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#E7EAF3] last:border-b-0">
            {week.map(day => {
              const isToday = isSameDay(day, today);
              const inMonth = isSameMonth(day, currentDate);
              const daySessions = sessions.filter(s => s.date === format(day, 'yyyy-MM-dd'));
              const maxVisible = 2;
              const extra = daySessions.length - maxVisible;

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => onDayClick(day)}
                  className={cn(
                    'min-h-[90px] p-1.5 border-r border-[#E7EAF3] last:border-r-0 cursor-pointer hover:bg-[#F6F7FB] transition-colors',
                    !inMonth && 'bg-[#FAFAFA]'
                  )}
                >
                  {/* Date number */}
                  <div className={cn(
                    'w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mb-1',
                    isToday ? 'bg-primary text-white' : inMonth ? 'text-[#1F2A44]' : 'text-[#C4C9D8]'
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Session chips */}
                  <div className="space-y-0.5">
                    {daySessions.slice(0, maxVisible).map(s => {
                      const isCancelled = s.status === 'cancelled';
                      const client = clients.find(c => c.id === s.client_id);
                      return (
                        <div
                          key={s.id}
                          onClick={e => { e.stopPropagation(); setSelectedSession(s); }}
                          className={cn(
                            'w-full text-left text-[10px] font-medium px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-90 transition-opacity',
                            typeColors[s.type] || 'bg-primary text-white',
                            isCancelled && 'bg-red-500 text-white line-through'
                          )}
                        >
                          {s.time ? `${s.time} ` : ''}{s.title}
                        </div>
                      );
                    })}
                    {extra > 0 && (
                      <div className="text-[10px] font-semibold text-[#6B7280] pl-1">
                        +{extra} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Session Detail Popover */}
      {selectedSession && (
        <SessionDetailPopover
          session={selectedSession}
          client={clients.find(c => c.id === selectedSession.client_id)}
          onClose={() => setSelectedSession(null)}
          onUpdate={(data) => {
            setSelectedSession(null);
          }}
          onMessage={(clientId) => {
            setSelectedSession(null);
            window.location.href = `/messages?clientId=${clientId}`;
          }}
          onReschedule={() => {
            setSelectedSession(null);
          }}
          onCancel={() => {
            setSelectedSession(null);
          }}
        />
      )}
    </>
  );
}