import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameDay, isSameMonth, isToday, parseISO,
  startOfWeek, endOfWeek
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Camera, ClipboardList, Phone,
  Target, Zap, Dumbbell, CheckCircle2, Calendar, Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AddCalendarEventModal from './AddCalendarEventModal';

const EVENT_TYPES = {
  checkin: { label: 'Check-in', color: '#2563EB', bg: '#EFF6FF', icon: ClipboardList, emoji: '📋' },
  photo:   { label: 'Weigh-in', color: '#7C3AED', bg: '#F5F3FF', icon: Camera,        emoji: '⚖️' },
  call:    { label: 'Session',  color: '#059669', bg: '#ECFDF5', icon: Phone,         emoji: '📞' },
  goal:    { label: 'Goal Due', color: '#D97706', bg: '#FFFBEB', icon: Target,        emoji: '🎯' },
  habit:   { label: 'Habit',   color: '#EC4899', bg: '#FDF2F8', icon: Zap,           emoji: '⚡' },
  workout: { label: 'Workout', color: '#0EA5E9', bg: '#F0F9FF', icon: Dumbbell,      emoji: '💪' },
};

function buildEvents(checkIns, goals, sessions, weighIns) {
  const events = [];
  checkIns.forEach(ci => {
    if (!ci.date) return;
    events.push({ id: `ci-${ci.id}`, date: ci.date, type: 'checkin', title: 'Weekly Check-in',
      subtitle: ci.review_status === 'reviewed' ? 'Reviewed ✓' : ci.coach_responded ? 'Responded ✓' : 'Submitted',
      done: !!ci.coach_responded || ci.review_status === 'reviewed' });
  });
  sessions.forEach(s => {
    if (!s.date) return;
    events.push({ id: `sess-${s.id}`, date: s.date, type: 'call', title: s.title || 'Coaching Session',
      subtitle: s.session_type || s.status || '', done: s.status === 'completed' });
  });
  goals.forEach(g => {
    if (!g.due_date) return;
    events.push({ id: `goal-${g.id}`, date: g.due_date, type: 'goal', title: g.name,
      subtitle: g.status === 'completed' ? 'Completed ✓' : `Target: ${g.target_value || ''} ${g.unit || ''}`.trim(),
      done: g.status === 'completed' });
  });
  weighIns.forEach(w => {
    if (!w.date) return;
    events.push({ id: `weigh-${w.id}`, date: w.date, type: 'photo', title: 'Weigh-in',
      subtitle: `${w.weight} lbs`, done: true });
  });
  return events;
}

function DayCell({ day, currentMonth, events, onSelect, selected }) {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isSelectedDay = selected && isSameDay(day, selected);
  const isTodayDate = isToday(day);
  const dotColors = [...new Set(dayEvents.map(e => EVENT_TYPES[e.type]?.color))].slice(0, 3);

  return (
    <button
      onClick={() => onSelect(day)}
      className={cn('flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all relative', !isCurrentMonth && 'opacity-25')}
      style={{
        background: isSelectedDay ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : isTodayDate ? '#EFF6FF' : 'transparent',
        minHeight: 44,
        outline: isSelectedDay ? '2px solid #2563EB' : isTodayDate ? '1.5px solid #BFDBFE' : 'none',
        outlineOffset: isSelectedDay ? 1 : 0,
      }}
    >
      <span className="text-xs font-bold"
        style={{ color: isSelectedDay ? '#fff' : isTodayDate ? '#2563EB' : isCurrentMonth ? '#1E293B' : '#CBD5E1' }}>
        {format(day, 'd')}
      </span>
      {dotColors.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {dotColors.map((c, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full"
              style={{ background: isSelectedDay ? 'rgba(255,255,255,0.85)' : c }} />
          ))}
        </div>
      )}
    </button>
  );
}

function EventRow({ event }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.checkin;
  return (
    <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 p-3 rounded-xl border"
      style={{ background: cfg.bg, borderColor: cfg.color + '30' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm"
        style={{ background: cfg.color + '20' }}>
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#111827] truncate">{event.title}</p>
        {event.subtitle && <p className="text-xs text-[#6B7280] truncate">{event.subtitle}</p>}
      </div>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ background: cfg.color + '20', color: cfg.color }}>
        {cfg.label}
      </span>
      {event.done && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />}
    </motion.div>
  );
}

const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function ClientCalendarTab({ client }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: checkIns = [] } = useQuery({
    queryKey: ['cal-checkins', client?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: client.id }, '-date', 100),
    enabled: !!client?.id,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ['cal-goals', client?.id],
    queryFn: () => base44.entities.Goal.filter({ client_id: client.id }, '-created_date', 50),
    enabled: !!client?.id,
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['cal-sessions', client?.id],
    queryFn: () => base44.entities.Session.filter({ client_id: client.id }, '-date', 50),
    enabled: !!client?.id,
  });
  const { data: weighIns = [] } = useQuery({
    queryKey: ['cal-weighins', client?.id],
    queryFn: () => base44.entities.WeighIn.filter({ client_id: client.id }, '-date', 100),
    enabled: !!client?.id,
  });

  const events = useMemo(() => buildEvents(checkIns, goals, sessions, weighIns), [checkIns, goals, sessions, weighIns]);

  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedEvents = useMemo(
    () => events.filter(e => isSameDay(parseISO(e.date), selectedDay)).sort((a, b) => a.type.localeCompare(b.type)),
    [events, selectedDay]
  );

  const monthEvents = events.filter(e => isSameMonth(parseISO(e.date), currentMonth));
  const monthStats = [
    { label: 'Check-ins', count: monthEvents.filter(e => e.type === 'checkin').length, color: '#2563EB', emoji: '📋' },
    { label: 'Sessions',  count: monthEvents.filter(e => e.type === 'call').length,    color: '#059669', emoji: '📞' },
    { label: 'Weigh-ins', count: monthEvents.filter(e => e.type === 'photo').length,   color: '#7C3AED', emoji: '⚖️' },
    { label: 'Goals',     count: monthEvents.filter(e => e.type === 'goal').length,    color: '#D97706', emoji: '🎯' },
  ];

  const handleDaySelect = (day) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setAddModalOpen(true);
    } else {
      setSelectedDay(day);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-5 grid lg:grid-cols-[1fr_320px] gap-5">

        {/* ── Left: Calendar ── */}
        <div className="space-y-4">
          {/* Month stats */}
          <div className="grid grid-cols-4 gap-2">
            {monthStats.map(s => (
              <div key={s.label} className="bg-white border border-[#E5E7EB] rounded-xl p-3 text-center">
                <p className="text-lg mb-0.5">{s.emoji}</p>
                <p className="font-black text-xl" style={{ color: s.color }}>{s.count}</p>
                <p className="text-[10px] text-[#6B7280] font-semibold">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Calendar */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E7EB]">
              <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-colors">
                <ChevronLeft className="w-4 h-4 text-[#374151]" />
              </button>
              <p className="font-bold text-[#111827] text-sm">{format(currentMonth, 'MMMM yyyy')}</p>
              <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] transition-colors">
                <ChevronRight className="w-4 h-4 text-[#374151]" />
              </button>
            </div>

            <div className="grid grid-cols-7 px-3 pt-2 pb-1">
              {DAY_HEADERS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-[#9CA3AF] py-1">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
              {calDays.map(day => (
                <DayCell key={day.toISOString()} day={day} currentMonth={currentMonth}
                  events={events} onSelect={handleDaySelect} selected={selectedDay} />
              ))}
            </div>

            <div className="px-4 pb-4 flex flex-wrap gap-1.5 border-t border-[#F3F4F6] pt-3">
              {Object.entries(EVENT_TYPES).map(([key, cfg]) => (
                <span key={key} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                  style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.emoji} {cfg.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Selected day panel ── */}
        <div className="space-y-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#111827]">
                  {isToday(selectedDay) ? 'Today' : format(selectedDay, 'EEE, MMM d')}
                </p>
                <p className="text-[11px] text-[#6B7280]">{selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setAddModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                style={{ background: '#2563EB' }}>
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
            <div className="p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {selectedEvents.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-2xl mb-2">📅</p>
                    <p className="text-sm text-[#6B7280] font-medium">Nothing scheduled</p>
                    <button onClick={() => setAddModalOpen(true)}
                      className="mt-2 text-xs text-[#2563EB] font-semibold hover:underline">
                      + Add something
                    </button>
                  </div>
                ) : (
                  selectedEvents.map(ev => <EventRow key={ev.id} event={ev} />)
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* All events this month list */}
          <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB]">
              <p className="font-bold text-sm text-[#111827]">All Events This Month</p>
            </div>
            <div className="divide-y divide-[#F3F4F6] max-h-64 overflow-y-auto">
              {monthEvents.length === 0 ? (
                <p className="text-xs text-[#9CA3AF] text-center py-6">No events this month</p>
              ) : (
                monthEvents
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map(ev => {
                    const cfg = EVENT_TYPES[ev.type] || EVENT_TYPES.checkin;
                    return (
                      <button key={ev.id} onClick={() => setSelectedDay(parseISO(ev.date))}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] transition-colors text-left">
                        <span className="text-sm flex-shrink-0">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#111827] truncate">{ev.title}</p>
                          <p className="text-[10px] text-[#6B7280]">{format(parseISO(ev.date), 'EEE, MMM d')}</p>
                        </div>
                        {ev.done && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: cfg.color }} />}
                      </button>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {addModalOpen && (
          <AddCalendarEventModal
            date={selectedDay}
            client={client}
            onClose={() => setAddModalOpen(false)}
            onSuccess={() => setAddModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}