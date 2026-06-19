import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  addMonths, subMonths, isSameDay, isSameMonth, isToday, parseISO,
  startOfWeek, endOfWeek
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Camera, ClipboardList, Phone,
  Target, Zap, Dumbbell, Salad, X, Calendar, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Event type config ───────────────────────────────────
const EVENT_TYPES = {
  checkin:   { label: 'Check-in',   color: '#2563EB', bg: '#EFF6FF', icon: ClipboardList, emoji: '📋' },
  photo:     { label: 'Photos',     color: '#7C3AED', bg: '#F5F3FF', icon: Camera,        emoji: '📸' },
  call:      { label: 'Coach Call', color: '#059669', bg: '#ECFDF5', icon: Phone,         emoji: '📞' },
  goal:      { label: 'Goal',       color: '#D97706', bg: '#FFFBEB', icon: Target,        emoji: '🎯' },
  habit:     { label: 'Habit',      color: '#EC4899', bg: '#FDF2F8', icon: Zap,           emoji: '⚡' },
  workout:   { label: 'Workout',    color: '#0EA5E9', bg: '#F0F9FF', icon: Dumbbell,      emoji: '💪' },
  nutrition: { label: 'Nutrition',  color: '#10B981', bg: '#ECFDF5', icon: Salad,         emoji: '🥗' },
};

// ── Build calendar events from real data ────────────────
function buildEvents(checkIns, habits, habitCompletions, goals, sessions, weighIns) {
  const events = [];

  // Check-ins
  checkIns.forEach(ci => {
    if (!ci.date) return;
    events.push({
      id: `ci-${ci.id}`,
      date: ci.date,
      type: 'checkin',
      title: 'Weekly Check-in',
      subtitle: ci.review_status === 'reviewed' ? 'Reviewed ✓' : 'Submitted',
      done: !!ci.coach_responded || ci.review_status === 'reviewed',
    });
  });

  // Sessions / calls
  sessions.forEach(s => {
    if (!s.date) return;
    events.push({
      id: `sess-${s.id}`,
      date: s.date,
      type: 'call',
      title: s.title || 'Coach Session',
      subtitle: s.time || '',
      done: s.status === 'completed',
    });
  });

  // Goals with due dates
  goals.forEach(g => {
    if (!g.due_date) return;
    events.push({
      id: `goal-${g.id}`,
      date: g.due_date,
      type: 'goal',
      title: g.name,
      subtitle: g.status === 'completed' ? 'Completed ✓' : `Target: ${g.target_value || ''} ${g.unit || ''}`.trim(),
      done: g.status === 'completed',
    });
  });

  // Weigh-ins (as photo/measurement markers)
  weighIns.forEach(w => {
    if (!w.date) return;
    events.push({
      id: `weigh-${w.id}`,
      date: w.date,
      type: 'photo',
      title: 'Weight Logged',
      subtitle: `${w.weight} lbs`,
      done: true,
    });
  });

  return events;
}

// ── Day cell ────────────────────────────────────────────
function DayCell({ day, currentMonth, events, onSelect, selected }) {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isSelectedDay = selected && isSameDay(day, selected);
  const isTodayDate = isToday(day);

  const dotColors = [...new Set(dayEvents.map(e => EVENT_TYPES[e.type]?.color))].slice(0, 3);

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onSelect(day)}
      className={cn(
        'flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl transition-all relative',
        isSelectedDay && 'ring-2 ring-blue-500',
        !isCurrentMonth && 'opacity-30',
      )}
      style={{
        background: isSelectedDay
          ? 'linear-gradient(135deg, #2563EB, #7C3AED)'
          : isTodayDate
          ? '#EFF6FF'
          : 'transparent',
        minHeight: 52,
      }}
    >
      <span className={cn(
        'text-xs font-bold mb-1',
        isSelectedDay ? 'text-white' : isTodayDate ? '#2563EB' : isCurrentMonth ? '#1E293B' : '#94A3B8'
      )}
        style={{ color: isSelectedDay ? '#fff' : isTodayDate ? '#2563EB' : undefined }}
      >
        {format(day, 'd')}
      </span>
      {/* Dot indicators */}
      {dotColors.length > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {dotColors.map((c, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: isSelectedDay ? 'rgba(255,255,255,0.8)' : c }} />
          ))}
        </div>
      )}
    </motion.button>
  );
}

// ── Event pill ──────────────────────────────────────────
function EventPill({ event }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.checkin;
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.color + '22' }}>
        <span className="text-base">{cfg.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 truncate">{event.title}</p>
        {event.subtitle ? <p className="text-xs text-slate-500 truncate">{event.subtitle}</p> : null}
      </div>
      {event.done && (
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
      )}
    </motion.div>
  );
}

// ── Upcoming event row ──────────────────────────────────
function UpcomingRow({ event }) {
  const cfg = EVENT_TYPES[event.type] || EVENT_TYPES.checkin;
  const date = parseISO(event.date);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
        style={{ background: cfg.bg }}>
        {cfg.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{event.title}</p>
        <p className="text-[11px] text-slate-400">{format(date, 'EEE, MMM d')}</p>
      </div>
      <span className="text-[10px] font-bold px-2 py-1 rounded-full"
        style={{ background: cfg.bg, color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  );
}

// ── Legend pill ─────────────────────────────────────────
function LegendPill({ type, cfg }) {
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

// ── MAIN ────────────────────────────────────────────────
export default function PortalCalendar({ user }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  // Fetch client
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-cal-client', user?.id],
    queryFn: () => base44.entities.Client.filter({ user_id: user.id }, '-created_date', 1),
    enabled: !!user?.id,
  });
  const myClient = clients[0];

  // Fetch data in parallel
  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-cal-checkins', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 100),
    enabled: !!myClient?.id,
  });
  const { data: goals = [] } = useQuery({
    queryKey: ['portal-cal-goals', myClient?.id],
    queryFn: () => base44.entities.Goal.filter({ client_id: myClient.id }, '-created_date', 50),
    enabled: !!myClient?.id,
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['portal-cal-sessions', myClient?.id],
    queryFn: () => base44.entities.Session.filter({ client_id: myClient.id }, '-date', 50),
    enabled: !!myClient?.id,
  });
  const { data: weighIns = [] } = useQuery({
    queryKey: ['portal-cal-weighins', myClient?.id],
    queryFn: () => base44.entities.WeighIn.filter({ client_id: myClient.id }, '-date', 50),
    enabled: !!myClient?.id,
  });

  const events = useMemo(
    () => buildEvents(checkIns, [], [], goals, sessions, weighIns),
    [checkIns, goals, sessions, weighIns]
  );

  // Calendar grid days
  const calDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedEvents = useMemo(
    () => events.filter(e => isSameDay(parseISO(e.date), selectedDay)),
    [events, selectedDay]
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return events
      .filter(e => parseISO(e.date) >= today)
      .sort((a, b) => parseISO(a.date) - parseISO(b.date))
      .slice(0, 5);
  }, [events]);

  const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div className="pb-32" style={{ background: '#F8F9FA', minHeight: '100vh' }}>
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4" style={{ boxShadow: '0 1px 0 #F1F5F9' }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">My Schedule</p>
            <h1 className="text-slate-900 font-black text-2xl leading-tight">Calendar</h1>
          </div>
          <Calendar className="w-7 h-7 text-blue-500" />
        </div>
      </div>

      {/* Calendar card */}
      <div className="mx-4 mt-4 bg-white rounded-3xl overflow-hidden"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #F1F5F9' }}>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </motion.button>
          <p className="font-black text-slate-800 text-base">{format(currentMonth, 'MMMM yyyy')}</p>
          <motion.button whileTap={{ scale: 0.88 }}
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </motion.button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-2 pb-1">
          {DAY_HEADERS.map(d => (
            <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-0.5 px-3 pb-3">
          {calDays.map(day => (
            <DayCell
              key={day.toISOString()}
              day={day}
              currentMonth={currentMonth}
              events={events}
              onSelect={setSelectedDay}
              selected={selectedDay}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="px-4 pb-4 flex gap-1.5 flex-wrap">
          {Object.entries(EVENT_TYPES).slice(0, 5).map(([key, cfg]) => (
            <LegendPill key={key} type={key} cfg={cfg} />
          ))}
        </div>
      </div>

      {/* Selected day events */}
      <div className="mx-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-bold text-slate-800 text-sm">
            {isToday(selectedDay) ? "Today" : format(selectedDay, 'EEE, MMMM d')}
          </p>
          <span className="text-[11px] text-slate-400 font-semibold">
            {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center"
            style={{ border: '1px solid #F1F5F9', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p className="text-3xl mb-2">📅</p>
            <p className="text-slate-400 text-sm font-semibold">Nothing scheduled</p>
            <p className="text-slate-300 text-xs mt-1">Rest up or stay ahead of your goals</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {selectedEvents.map(event => (
                <EventPill key={event.id} event={event} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Upcoming section */}
      {upcomingEvents.length > 0 && (
        <div className="mx-4 mt-5">
          <p className="font-bold text-slate-800 text-sm mb-3">Coming Up</p>
          <div className="bg-white rounded-2xl px-4 py-1"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
            {upcomingEvents.map(event => (
              <UpcomingRow key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}

      {/* Monthly summary */}
      <div className="mx-4 mt-4 mb-4">
        <div className="bg-white rounded-2xl p-4"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #F1F5F9' }}>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3">This Month</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Check-ins', count: events.filter(e => e.type === 'checkin' && isSameMonth(parseISO(e.date), currentMonth)).length, emoji: '📋', color: '#2563EB' },
              { label: 'Sessions', count: events.filter(e => e.type === 'call' && isSameMonth(parseISO(e.date), currentMonth)).length, emoji: '📞', color: '#059669' },
              { label: 'Goals Due', count: events.filter(e => e.type === 'goal' && isSameMonth(parseISO(e.date), currentMonth)).length, emoji: '🎯', color: '#D97706' },
            ].map(stat => (
              <div key={stat.label} className="text-center p-3 rounded-xl" style={{ background: '#F8FAFC' }}>
                <p className="text-xl mb-0.5">{stat.emoji}</p>
                <p className="font-black text-lg" style={{ color: stat.color }}>{stat.count}</p>
                <p className="text-slate-400 text-[10px] font-semibold">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}