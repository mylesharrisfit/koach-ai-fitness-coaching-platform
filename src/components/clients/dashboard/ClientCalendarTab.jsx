import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, isSameDay, isToday, parseISO, isSameMonth,
  startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval,
  getDay, addDays
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, X, ClipboardList,
  Phone, Target, Zap, Scale, Dumbbell, CheckCircle2, Circle, Loader2, RefreshCw
} from 'lucide-react';

// ── Event type config ─────────────────────────────────────────────────────────
const TYPES = {
  checkin:  { label: 'Check-in',    color: '#2563EB', dot: '#3B82F6', emoji: '📋', icon: ClipboardList },
  session:  { label: 'Session',     color: '#059669', dot: '#10B981', emoji: '📞', icon: Phone },
  goal:     { label: 'Goal Due',    color: '#D97706', dot: '#F59E0B', emoji: '🎯', icon: Target },
  habit:    { label: 'Habit',       color: '#7C3AED', dot: '#8B5CF6', emoji: '⚡', icon: Zap },
  weighin:  { label: 'Weigh-in',    color: '#0EA5E9', dot: '#38BDF8', emoji: '⚖️', icon: Scale },
  workout:  { label: 'Workout',     color: '#EC4899', dot: '#F472B6', emoji: '💪', icon: Dumbbell },
};

function buildEvents(checkIns, goals, sessions, weighIns, workoutSessions) {
  const ev = [];
  checkIns.forEach(ci => {
    if (!ci.date) return;
    ev.push({ id: `ci-${ci.id}`, date: ci.date, type: 'checkin', title: 'Check-in',
      done: !!ci.coach_responded || ci.review_status === 'reviewed' });
  });
  sessions.forEach(s => {
    if (!s.date) return;
    ev.push({ id: `se-${s.id}`, date: s.date, type: 'session', title: s.title || 'Session',
      done: s.status === 'completed' });
  });
  goals.forEach(g => {
    if (!g.due_date) return;
    ev.push({ id: `go-${g.id}`, date: g.due_date, type: 'goal', title: g.name,
      done: g.status === 'completed' });
  });
  weighIns.forEach(w => {
    if (!w.date) return;
    ev.push({ id: `wi-${w.id}`, date: w.date, type: 'weighin', title: `${w.weight} lbs`, done: true });
  });
  (workoutSessions || []).forEach(ws => {
    if (!ws.scheduled_date) return;
    ev.push({ id: `ws-${ws.id}`, date: ws.scheduled_date, type: 'workout',
      title: ws.workout_name || 'Workout', done: ws.status === 'completed' });
  });
  return ev;
}

// ── Event chip inside a day cell ──────────────────────────────────────────────
function EventChip({ event }) {
  const cfg = TYPES[event.type] || TYPES.checkin;
  return (
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold truncate"
      style={{ background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {event.done
        ? <CheckCircle2 className="w-2.5 h-2.5 flex-shrink-0" />
        : <Circle className="w-2.5 h-2.5 flex-shrink-0 opacity-60" />
      }
      <span className="truncate">{event.title}</span>
    </div>
  );
}

// ── Day cell in the weekly grid ───────────────────────────────────────────────
function DayCell({ day, events, onDayClick }) {
  const dayEvents = events.filter(e => isSameDay(parseISO(e.date), day));
  const isT = isToday(day);
  const maxShow = 3;
  const shown = dayEvents.slice(0, maxShow);
  const overflow = dayEvents.length - maxShow;

  return (
    <div
      onClick={() => onDayClick(day)}
      className="border-r border-b border-[#E5E7EB] p-1.5 cursor-pointer hover:bg-blue-50/40 transition-colors group relative"
      style={{ minHeight: 90 }}
    >
      {/* Day number */}
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
          ${isT ? 'bg-blue-600 text-white' : 'text-[#374151]'}`}>
          {format(day, 'd')}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDayClick(day); }}
          className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center bg-blue-600 text-white transition-opacity"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {shown.map(ev => <EventChip key={ev.id} event={ev} />)}
        {overflow > 0 && (
          <p className="text-[10px] text-[#6B7280] font-semibold pl-1">+{overflow} more</p>
        )}
      </div>
    </div>
  );
}

// ── Add Event Modal ───────────────────────────────────────────────────────────

const inputCls = "w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

// ── Repeat Options Modal ──────────────────────────────────────────────────────
const DAY_LABELS = ['S','M','T','W','T','F','S'];

function RepeatModal({ repeat, onChange, onClose }) {
  const [freq, setFreq] = useState(repeat.freq || 'weekly');
  const [every, setEvery] = useState(repeat.every || 1);
  const [days, setDays] = useState(repeat.days || [1,3,5]); // Mon, Wed, Fri default
  const [forWeeks, setForWeeks] = useState(repeat.forWeeks || 4);

  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const apply = () => {
    onChange({ freq, every, days, forWeeks });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.12 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[#111827] text-base">Repeat options</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6]">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">Frequency</label>
            <select className={inputCls} value={freq} onChange={e => setFreq(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {freq === 'weekly' || freq === 'biweekly' ? (
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                Every <select className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm mx-1" value={every} onChange={e => setEvery(Number(e.target.value))}>
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select> week on
              </label>
              <div className="flex gap-1.5 mt-2">
                {DAY_LABELS.map((d, i) => (
                  <button key={i} onClick={() => toggleDay(i)}
                    className="w-9 h-9 rounded-full text-xs font-bold transition-all"
                    style={{
                      background: days.includes(i) ? '#2563EB' : '#F3F4F6',
                      color: days.includes(i) ? '#fff' : '#374151',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : freq === 'daily' ? (
            <div>
              <label className="text-xs font-semibold text-[#374151] block mb-1.5">
                Every <select className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm mx-1" value={every} onChange={e => setEvery(Number(e.target.value))}>
                  {[1,2,3].map(n => <option key={n} value={n}>{n}</option>)}
                </select> day(s)
              </label>
            </div>
          ) : null}

          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1.5">
              Repeat for <select className="border border-[#E5E7EB] rounded-lg px-2 py-1 text-sm mx-1" value={forWeeks} onChange={e => setForWeeks(Number(e.target.value))}>
                {[1,2,3,4,6,8,12,16,20,26,39,52,78,104].map(n => <option key={n} value={n}>{n} {n >= 52 ? `(${Math.round(n/52)}yr${n > 52 ? '+' : ''})` : ''}</option>)}
              </select> {freq === 'daily' ? 'weeks' : 'weeks'}
            </label>
          </div>
        </div>

        <button onClick={apply}
          className="w-full mt-5 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#2563EB' }}>
          Apply
        </button>
      </motion.div>
    </div>
  );
}

// ── Generate all dates for a repeat config ────────────────────────────────────
function generateRepeatDates(startDate, repeat) {
  const dates = [];
  const totalDays = repeat.forWeeks * 7;
  if (repeat.freq === 'daily') {
    for (let i = 0; i < totalDays; i += repeat.every) {
      dates.push(addDays(startDate, i));
    }
  } else if (repeat.freq === 'weekly' || repeat.freq === 'biweekly') {
    const intervalDays = repeat.every * 7;
    for (let week = 0; week * intervalDays < totalDays; week++) {
      const weekStart = addDays(startDate, week * intervalDays);
      // Find nearest Sunday of that week to iterate days
      repeat.days.forEach(dayOfWeek => {
        // Find the date in this week with this day-of-week
        const startDow = startDate.getDay();
        let diff = dayOfWeek - startDow + (week * intervalDays);
        if (diff >= 0 && diff < totalDays) {
          dates.push(addDays(startDate, diff));
        }
      });
    }
  } else if (repeat.freq === 'monthly') {
    for (let m = 0; m < Math.ceil(repeat.forWeeks / 4); m++) {
      dates.push(addDays(startDate, m * 28));
    }
  }
  return [...new Set(dates.map(d => format(d, 'yyyy-MM-dd')))].sort();
}

// ── Activity type config for sidebar ─────────────────────────────────────────
const ACTIVITY_TYPES = [
  { key: 'workout',  label: 'Workout',      emoji: '💪', color: '#EC4899' },
  { key: 'session',  label: 'Session/Call', emoji: '📞', color: '#059669' },
  { key: 'goal',     label: 'Goal',         emoji: '🎯', color: '#D97706' },
  { key: 'habit',    label: 'Habit',        emoji: '⚡', color: '#7C3AED' },
  { key: 'weighin',  label: 'Weigh-in',     emoji: '⚖️', color: '#0EA5E9' },
  { key: 'checkin',  label: 'Check-in Form',emoji: '📋', color: '#2563EB' },
];

function WorkoutContent({ date, dateStr, setDateStr, repeat, setShowRepeat, client, onDone }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedWorkoutIdx, setSelectedWorkoutIdx] = useState('');
  const [note, setNote] = useState('');

  const { data: program, isLoading } = useQuery({
    queryKey: ['cal-program', client?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }, '-created_date', 1).then(r => r[0]),
    enabled: !!client?.assigned_program_id,
  });

  const workouts = program?.workouts || [];

  const save = async () => {
    if (selectedWorkoutIdx === '') return;
    setSaving(true);
    const workout = workouts[parseInt(selectedWorkoutIdx)];
    const baseDate = parseISO(dateStr);

    let datesToCreate = [dateStr];
    if (repeat) {
      datesToCreate = generateRepeatDates(baseDate, repeat);
    }

    // Batch creates with delay to avoid rate limits
    for (const d of datesToCreate) {
      const session = await base44.entities.WorkoutSession.create({
        client_id: client.id,
        program_id: client.assigned_program_id,
        program_name: program?.title,
        workout_name: workout?.day_name || `Day ${workout?.day_number || parseInt(selectedWorkoutIdx) + 1}`,
        scheduled_date: d,
        status: 'scheduled',
        notes: note || undefined,
        exercises: workout?.exercises || [],
        team_id: client.team_id,
      });
      // Sync to Google Calendar
      await base44.functions.invoke('googleCalendarProxy', {
        action: 'createEvent',
        event: {
          summary: `${client.name} - ${workout?.day_name || `Day ${workout?.day_number || parseInt(selectedWorkoutIdx) + 1}`}`,
          description: note || `Workout session for ${client.name}`,
          start: { date: d },
          end: { date: d },
        },
      }).catch(() => {}); // Silently fail if Google Calendar isn't connected
      await new Promise(r => setTimeout(r, 50));
    }
    qc.invalidateQueries({ queryKey: ['cal-workoutsessions', client.id] });
    onDone();
  };

  if (!client?.assigned_program_id) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-3xl mb-2">💪</p>
          <p className="text-sm font-semibold text-[#374151]">No program assigned</p>
          <p className="text-xs text-[#6B7280] mt-1">Assign a workout program to this client first.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-[#EC4899]" /></div>;

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Date</label>
          <div className="flex items-center gap-3">
            <input type="date" className={inputCls + ' flex-1'} value={dateStr} onChange={e => setDateStr(e.target.value)} />
            <button onClick={() => setShowRepeat(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
              <RefreshCw className="w-3 h-3" />
              {repeat ? `Repeating (${repeat.freq})` : 'Setup repeat'}
            </button>
          </div>
          {repeat && (
            <p className="text-[11px] text-[#6B7280] mt-1">
              Will create sessions on multiple dates · <button className="text-red-500 hover:underline" onClick={() => setShowRepeat(null)}>Clear</button>
            </p>
          )}
        </div>

        {program && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FDF2F8] border border-[#EC4899]/20">
            <span>💪</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#EC4899] truncate">{program.title}</p>
              <p className="text-[10px] text-[#6B7280]">{workouts.length} workout days</p>
            </div>
          </div>
        )}

        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-2">Select from current training program</label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {workouts.map((w, i) => (
              <label key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${selectedWorkoutIdx === String(i) ? 'border-[#EC4899] bg-[#FDF2F8]' : 'border-[#E5E7EB] hover:border-[#EC4899]/40'}`}>
                <input type="radio" name="workout_day" value={i} checked={selectedWorkoutIdx === String(i)}
                  onChange={() => setSelectedWorkoutIdx(String(i))} className="accent-[#EC4899]" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#111827]">{w.day_name || `Day ${w.day_number || i + 1}`}</p>
                  {w.exercises?.length > 0 && (
                    <p className="text-[10px] text-[#6B7280]">{w.exercises.length} exercises</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Note (optional)</label>
          <input className={inputCls} placeholder="Coaching notes…" value={note} onChange={e => setNote(e.target.value)} />
        </div>
      </div>

      <button onClick={save} disabled={saving || selectedWorkoutIdx === ''}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ background: '#EC4899' }}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {saving ? 'Adding…' : repeat ? `Add (${generateRepeatDates(parseISO(dateStr), repeat).length} sessions)` : 'Add to Calendar'}
      </button>
    </div>
  );
}

function SessionContent({ dateStr, setDateStr, repeat, setShowRepeat, client, onDone }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState('Coaching Session');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('video_call');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const baseDate = parseISO(dateStr);
    const datesToCreate = repeat ? generateRepeatDates(baseDate, repeat) : [dateStr];
    for (const d of datesToCreate) {
      await base44.entities.Session.create({ client_id: client.id, client_name: client.name,
        title, date: d, time, session_type: type, status: 'scheduled', team_id: client.team_id });
      // Sync to Google Calendar
      await base44.functions.invoke('googleCalendarProxy', {
        action: 'createEvent',
        event: {
          summary: `${client.name} - ${title}`,
          description: `${type.replace(/_/g, ' ')} at ${time}`,
          start: { dateTime: `${d}T${time}:00` },
          end: { dateTime: `${d}T${String(parseInt(time.split(':')[0]) + 1).padStart(2, '0')}:00:00` },
        },
      }).catch(() => {});
      await new Promise(r => setTimeout(r, 50));
    }
    qc.invalidateQueries({ queryKey: ['cal-sessions', client.id] });
    onDone();
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Date</label>
          <div className="flex items-center gap-3">
            <input type="date" className={inputCls + ' flex-1'} value={dateStr} onChange={e => setDateStr(e.target.value)} />
            <button onClick={() => setShowRepeat(true)} className="flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline whitespace-nowrap">
              <RefreshCw className="w-3 h-3" />{repeat ? `Repeating` : 'Setup repeat'}
            </button>
          </div>
        </div>
        <div><label className="text-xs font-semibold text-[#374151] block mb-1">Title</label><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-xs font-semibold text-[#374151] block mb-1">Time</label><input type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} /></div>
          <div><label className="text-xs font-semibold text-[#374151] block mb-1">Type</label>
            <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
              <option value="video_call">Video Call</option>
              <option value="phone_call">Phone Call</option>
              <option value="in_person">In Person</option>
            </select>
          </div>
        </div>
      </div>
      <button onClick={save} disabled={saving} className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: '#059669' }}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Adding…' : 'Add to Calendar'}
      </button>
    </div>
  );
}

function SimpleContent({ dateStr, setDateStr, repeat, setShowRepeat, client, onDone, actType }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [weight, setWeight] = useState('');

  const cfg = ACTIVITY_TYPES.find(a => a.key === actType);

  const save = async () => {
    setSaving(true);
    if (actType === 'weighin') {
      await base44.entities.WeighIn.create({ client_id: client.id, weight: parseFloat(weight), date: dateStr, note: note || undefined, team_id: client.team_id });
      qc.invalidateQueries({ queryKey: ['cal-weighins', client.id] });
    } else if (actType === 'checkin') {
      await base44.entities.CheckIn.create({ client_id: client.id, client_name: client.name, date: dateStr, status: 'pending', coach_notes: note || undefined, team_id: client.team_id });
      qc.invalidateQueries({ queryKey: ['cal-checkins', client.id] });
    } else if (actType === 'goal') {
      await base44.entities.Goal.create({ client_id: client.id, name, goal_type: 'simple', due_date: dateStr, status: 'active', team_id: client.team_id });
      qc.invalidateQueries({ queryKey: ['cal-goals', client.id] });
    } else if (actType === 'habit') {
      await base44.entities.Habit.create({ client_id: client.id, name, emoji: '⚡', frequency: 'daily', is_active: true, team_id: client.team_id });
      qc.invalidateQueries({ queryKey: ['cal-habits', client.id] });
    }
    onDone();
  };

  return (
    <div className="flex-1 flex flex-col justify-between">
      <div className="space-y-3">
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Date</label>
          <input type="date" className={inputCls} value={dateStr} onChange={e => setDateStr(e.target.value)} />
        </div>
        {actType === 'weighin' ? (
          <div><label className="text-xs font-semibold text-[#374151] block mb-1">Weight (lbs)</label><input type="number" step="0.1" className={inputCls} placeholder="175.5" value={weight} onChange={e => setWeight(e.target.value)} /></div>
        ) : actType === 'checkin' ? (
          <p className="text-xs text-[#6B7280]">Schedule a check-in on {dateStr}. The client will be prompted to complete it.</p>
        ) : (
          <div><label className="text-xs font-semibold text-[#374151] block mb-1">Name</label><input className={inputCls} placeholder={actType === 'goal' ? 'e.g. Reach 175 lbs' : 'e.g. Morning vitamins'} value={name} onChange={e => setName(e.target.value)} /></div>
        )}
        <div><label className="text-xs font-semibold text-[#374151] block mb-1">Note (optional)</label><input className={inputCls} placeholder="Any notes…" value={note} onChange={e => setNote(e.target.value)} /></div>
      </div>
      <button onClick={save} disabled={saving || (actType !== 'checkin' && actType !== 'weighin' && !name.trim()) || (actType === 'weighin' && !weight)}
        className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: cfg?.color || '#2563EB' }}>
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Adding…' : 'Add to Calendar'}
      </button>
    </div>
  );
}

function AddEventModal({ day, client, onClose }) {
  const [activeType, setActiveType] = useState('workout');
  const [dateStr, setDateStr] = useState(format(day, 'yyyy-MM-dd'));
  const [repeat, setRepeat] = useState(null);
  const [showRepeat, setShowRepeat] = useState(false);

  const renderContent = () => {
    if (activeType === 'workout') {
      return <WorkoutContent dateStr={dateStr} setDateStr={setDateStr} repeat={repeat} setShowRepeat={setShowRepeat} client={client} onDone={onClose} />;
    }
    if (activeType === 'session') {
      return <SessionContent dateStr={dateStr} setDateStr={setDateStr} repeat={repeat} setShowRepeat={setShowRepeat} client={client} onDone={onClose} />;
    }
    return <SimpleContent dateStr={dateStr} setDateStr={setDateStr} repeat={repeat} setShowRepeat={setShowRepeat} client={client} onDone={onClose} actType={activeType} />;
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50" />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.14 }}
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
            <h3 className="font-bold text-[#111827] text-lg">Add Activity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  // trigger save from content (handled by individual content components)
                }}
                className="px-4 py-1.5 rounded-lg text-sm font-bold text-white"
                style={{ background: '#2563EB', opacity: 0.9 }}
              >
                ADD
              </button>
              <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6]">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>
          </div>

          {/* Body: sidebar + content */}
          <div className="flex flex-1 overflow-hidden" style={{ minHeight: 400 }}>
            {/* Left sidebar */}
            <div className="w-44 border-r border-[#E5E7EB] bg-[#FAFAFA] flex-shrink-0 overflow-y-auto">
              {ACTIVITY_TYPES.map(t => (
                <button key={t.key} onClick={() => setActiveType(t.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-3 text-left text-sm font-semibold transition-colors border-l-2 ${
                    activeType === t.key
                      ? 'bg-white border-l-[#2563EB] text-[#111827]'
                      : 'border-l-transparent text-[#6B7280] hover:bg-white hover:text-[#374151]'
                  }`}
                >
                  <input type="checkbox" readOnly checked={activeType === t.key}
                    className="w-3.5 h-3.5 rounded accent-[#2563EB] flex-shrink-0" />
                  <span className="mr-1">{t.emoji}</span>
                  <span className="text-xs leading-tight">{t.label}</span>
                </button>
              ))}
            </div>

            {/* Right content */}
            <div className="flex-1 p-5 overflow-y-auto flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div key={activeType} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.1 }} className="flex flex-col flex-1">
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Repeat modal */}
      <AnimatePresence>
        {showRepeat && (
          <RepeatModal
            repeat={repeat || {}}
            onChange={r => setRepeat(r)}
            onClose={() => setShowRepeat(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── LEGEND ────────────────────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-[#E5E7EB] bg-[#FAFAFA]">
      <span className="text-[10px] font-bold text-[#6B7280] mr-1 self-center">LEGEND</span>
      {Object.entries(TYPES).map(([key, cfg]) => (
        <span key={key} className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: cfg.color }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function ClientCalendarTab({ client }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [activeDay, setActiveDay] = useState(null);

  const { data: checkIns = [] } = useQuery({
    queryKey: ['cal-checkins', client?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: client.id }, '-date', 150),
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
    queryFn: () => base44.entities.WeighIn.filter({ client_id: client.id }, '-date', 150),
    enabled: !!client?.id,
  });
  const { data: workoutSessions = [] } = useQuery({
    queryKey: ['cal-workoutsessions', client?.id],
    queryFn: () => base44.entities.WorkoutSession.filter({ client_id: client.id }, '-scheduled_date', 150),
    enabled: !!client?.id,
  });

  const events = useMemo(() => buildEvents(checkIns, goals, sessions, weighIns, workoutSessions),
    [checkIns, goals, sessions, weighIns, workoutSessions]);

  // Build weeks for this month (Mon–Sun grid)
  const weeks = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    // Pad to full weeks starting Monday
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
    const result = [];
    for (let i = 0; i < allDays.length; i += 7) {
      result.push(allDays.slice(i, i + 7));
    }
    return result;
  }, [viewDate]);

  const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Summary stats
  const monthEvents = useMemo(() => {
    const ms = startOfMonth(viewDate);
    const me = endOfMonth(viewDate);
    return events.filter(e => {
      const d = parseISO(e.date);
      return d >= ms && d <= me;
    });
  }, [events, viewDate]);

  const stats = [
    { label: 'Workouts',  count: monthEvents.filter(e => e.type === 'workout').length,   color: '#EC4899', emoji: '💪' },
    { label: 'Check-ins', count: monthEvents.filter(e => e.type === 'checkin').length,   color: '#2563EB', emoji: '📋' },
    { label: 'Sessions',  count: monthEvents.filter(e => e.type === 'session').length,   color: '#059669', emoji: '📞' },
    { label: 'Weigh-ins', count: monthEvents.filter(e => e.type === 'weighin').length,   color: '#0EA5E9', emoji: '⚖️' },
    { label: 'Goals',     count: monthEvents.filter(e => e.type === 'goal').length,      color: '#D97706', emoji: '🎯' },
  ];

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewDate(d => subMonths(d, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors">
            <ChevronLeft className="w-4 h-4 text-[#374151]" />
          </button>
          <h2 className="font-bold text-[#111827] text-sm min-w-[130px] text-center">
            {format(viewDate, 'MMMM yyyy')}
          </h2>
          <button onClick={() => setViewDate(d => addMonths(d, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F3F4F6] border border-[#E5E7EB] transition-colors">
            <ChevronRight className="w-4 h-4 text-[#374151]" />
          </button>
          <button onClick={() => setViewDate(new Date())}
            className="ml-1 px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#374151] hover:bg-[#F3F4F6] transition-colors">
            Today
          </button>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-3">
          {stats.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="text-sm">{s.emoji}</span>
              <span className="font-bold text-sm" style={{ color: s.color }}>{s.count}</span>
              <span className="text-[11px] text-[#6B7280]">{s.label}</span>
            </div>
          ))}
        </div>

        <button onClick={() => setActiveDay(new Date())}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
          style={{ background: '#2563EB' }}>
          <Plus className="w-3.5 h-3.5" /> Add Event
        </button>
      </div>

      {/* ── Legend ── */}
      <Legend />

      {/* ── Day-of-week headers ── */}
      <div className="grid grid-cols-7 border-b border-[#E5E7EB] flex-shrink-0">
        {DAY_HEADERS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-[#6B7280] border-r border-[#E5E7EB] last:border-r-0">
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ── */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#E5E7EB] last:border-b-0">
            {week.map((day, di) => {
              const inMonth = isSameMonth(day, viewDate);
              return (
                <div key={di} className={`${!inMonth ? 'bg-[#FAFAFA] opacity-50' : ''}`}>
                  <DayCell day={day} events={events} onDayClick={setActiveDay} />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Add Event modal ── */}
      <AnimatePresence>
        {activeDay && (
          <AddEventModal
            day={activeDay}
            client={client}
            onClose={() => setActiveDay(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}