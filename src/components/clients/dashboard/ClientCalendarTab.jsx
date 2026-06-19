import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks,
  eachDayOfInterval, isSameDay, isToday, parseISO, isSameMonth,
  startOfMonth, endOfMonth, addMonths, subMonths, eachWeekOfInterval,
  getDay
} from 'date-fns';
import {
  ChevronLeft, ChevronRight, Plus, X, ClipboardList,
  Phone, Target, Zap, Scale, Dumbbell, CheckCircle2, Circle, Loader2
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
const ADD_OPTIONS = [
  { key: 'workout', label: 'Workout',        emoji: '💪', color: '#EC4899', bg: '#FDF2F8' },
  { key: 'session', label: 'Session / Call', emoji: '📞', color: '#059669', bg: '#ECFDF5' },
  { key: 'goal',    label: 'Goal',           emoji: '🎯', color: '#D97706', bg: '#FFFBEB' },
  { key: 'habit',   label: 'Habit',          emoji: '⚡', color: '#7C3AED', bg: '#F5F3FF' },
  { key: 'weighin', label: 'Weigh-in',       emoji: '⚖️', color: '#0EA5E9', bg: '#F0F9FF' },
  { key: 'checkin', label: 'Check-in',       emoji: '📋', color: '#2563EB', bg: '#EFF6FF' },
];

function Field({ label, children }) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-[#374151] block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30";

function SaveBtn({ saving, color = '#2563EB', disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={saving || disabled}
      className="w-full py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
      style={{ background: color }}>
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {saving ? 'Saving…' : 'Save'}
    </button>
  );
}

function WorkoutSubForm({ date, client, onDone }) {
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [selectedWorkoutIdx, setSelectedWorkoutIdx] = useState('');
  const [note, setNote] = useState('');

  // Fetch the client's assigned program
  const { data: program, isLoading } = useQuery({
    queryKey: ['cal-program', client?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }, '-created_date', 1)
      .then(r => r[0]),
    enabled: !!client?.assigned_program_id,
  });

  const workouts = program?.workouts || [];

  const save = async () => {
    if (selectedWorkoutIdx === '') return;
    setSaving(true);
    const workout = workouts[parseInt(selectedWorkoutIdx)];
    await base44.entities.WorkoutSession.create({
      client_id: client.id,
      program_id: client.assigned_program_id,
      program_name: program?.title,
      workout_name: workout?.day_name || `Day ${workout?.day_number || parseInt(selectedWorkoutIdx) + 1}`,
      scheduled_date: format(date, 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: note || undefined,
      exercises: workout?.exercises || [],
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-workoutsessions', client.id] });
    onDone();
  };

  if (!client?.assigned_program_id) {
    return (
      <div className="text-center py-4">
        <p className="text-2xl mb-2">💪</p>
        <p className="text-sm font-semibold text-[#374151]">No program assigned</p>
        <p className="text-xs text-[#6B7280] mt-1">Assign a workout program to this client first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-[#EC4899]" />
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {program && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FDF2F8] border border-[#EC4899]/20">
          <span className="text-base">💪</span>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#EC4899] truncate">{program.title}</p>
            <p className="text-[10px] text-[#6B7280]">{workouts.length} workout{workouts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}
      <Field label="Select Workout Day">
        <select className={inputCls} value={selectedWorkoutIdx} onChange={e => setSelectedWorkoutIdx(e.target.value)}>
          <option value="">— Choose a day —</option>
          {workouts.map((w, i) => (
            <option key={i} value={i}>
              {w.day_name || `Day ${w.day_number || i + 1}`}
              {w.exercises?.length ? ` (${w.exercises.length} exercises)` : ''}
            </option>
          ))}
        </select>
      </Field>
      {selectedWorkoutIdx !== '' && workouts[parseInt(selectedWorkoutIdx)]?.exercises?.length > 0 && (
        <div className="rounded-lg border border-[#F3F4F6] bg-[#FAFAFA] px-3 py-2 max-h-28 overflow-y-auto space-y-0.5">
          {workouts[parseInt(selectedWorkoutIdx)].exercises.slice(0, 6).map((ex, i) => (
            <p key={i} className="text-[11px] text-[#374151] truncate">• {ex.name} {ex.sets && ex.reps ? `— ${ex.sets}×${ex.reps}` : ''}</p>
          ))}
          {workouts[parseInt(selectedWorkoutIdx)].exercises.length > 6 && (
            <p className="text-[10px] text-[#6B7280]">+{workouts[parseInt(selectedWorkoutIdx)].exercises.length - 6} more</p>
          )}
        </div>
      )}
      <Field label="Note (optional)">
        <input className={inputCls} placeholder="Any coaching notes…" value={note} onChange={e => setNote(e.target.value)} />
      </Field>
      <SaveBtn saving={saving} color="#EC4899" disabled={selectedWorkoutIdx === ''} onClick={save} />
    </div>
  );
}

function SessionSubForm({ date, client, onDone }) {
  const [title, setTitle] = useState('Coaching Session');
  const [time, setTime] = useState('09:00');
  const [type, setType] = useState('video_call');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    setSaving(true);
    await base44.entities.Session.create({ client_id: client.id, client_name: client.name,
      title, date: format(date, 'yyyy-MM-dd'), time, session_type: type, status: 'scheduled', team_id: client.team_id });
    qc.invalidateQueries({ queryKey: ['cal-sessions', client.id] });
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <Field label="Title"><input className={inputCls} value={title} onChange={e => setTitle(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Time"><input type="time" className={inputCls} value={time} onChange={e => setTime(e.target.value)} /></Field>
        <Field label="Type">
          <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
            <option value="video_call">Video Call</option>
            <option value="phone_call">Phone Call</option>
            <option value="in_person">In Person</option>
          </select>
        </Field>
      </div>
      <SaveBtn saving={saving} color="#059669" onClick={save} />
    </div>
  );
}

function GoalSubForm({ date, client, onDone }) {
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState('simple');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    setSaving(true);
    await base44.entities.Goal.create({ client_id: client.id, name, goal_type: goalType,
      target_value: target ? parseFloat(target) : undefined, unit: unit || undefined,
      due_date: format(date, 'yyyy-MM-dd'), status: 'active', team_id: client.team_id });
    qc.invalidateQueries({ queryKey: ['cal-goals', client.id] });
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <Field label="Goal Name"><input className={inputCls} placeholder="e.g. Reach 175 lbs" value={name} onChange={e => setName(e.target.value)} /></Field>
      <Field label="Type">
        <select className={inputCls} value={goalType} onChange={e => setGoalType(e.target.value)}>
          <option value="simple">Simple (Yes/No)</option>
          <option value="numeric">Numeric (with target)</option>
        </select>
      </Field>
      {goalType === 'numeric' && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Target"><input type="number" className={inputCls} placeholder="175" value={target} onChange={e => setTarget(e.target.value)} /></Field>
          <Field label="Unit"><input className={inputCls} placeholder="lbs, km…" value={unit} onChange={e => setUnit(e.target.value)} /></Field>
        </div>
      )}
      <SaveBtn saving={saving} color="#D97706" disabled={!name.trim()} onClick={save} />
    </div>
  );
}

function HabitSubForm({ date, client, onDone }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [freq, setFreq] = useState('daily');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    setSaving(true);
    await base44.entities.Habit.create({ client_id: client.id, name, emoji, frequency: freq,
      is_active: true, team_id: client.team_id });
    qc.invalidateQueries({ queryKey: ['cal-habits', client.id] });
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <Field label="Habit Name"><input className={inputCls} placeholder="e.g. Morning vitamins" value={name} onChange={e => setName(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Emoji"><input className={inputCls + ' text-center'} value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} /></Field>
        <Field label="Frequency">
          <select className={inputCls} value={freq} onChange={e => setFreq(e.target.value)}>
            <option value="daily">Daily</option>
            <option value="custom">Custom</option>
          </select>
        </Field>
      </div>
      <SaveBtn saving={saving} color="#7C3AED" disabled={!name.trim()} onClick={save} />
    </div>
  );
}

function WeighInSubForm({ date, client, onDone }) {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    setSaving(true);
    await base44.entities.WeighIn.create({ client_id: client.id, weight: parseFloat(weight),
      date: format(date, 'yyyy-MM-dd'), note: note || undefined, team_id: client.team_id });
    qc.invalidateQueries({ queryKey: ['cal-weighins', client.id] });
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <Field label="Weight (lbs)"><input type="number" step="0.1" className={inputCls} placeholder="175.5" value={weight} onChange={e => setWeight(e.target.value)} /></Field>
      <Field label="Note (optional)"><input className={inputCls} placeholder="Any comments…" value={note} onChange={e => setNote(e.target.value)} /></Field>
      <SaveBtn saving={saving} color="#0EA5E9" disabled={!weight} onClick={save} />
    </div>
  );
}

function CheckInSubForm({ date, client, onDone }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();
  const save = async () => {
    setSaving(true);
    await base44.entities.CheckIn.create({ client_id: client.id, client_name: client.name,
      date: format(date, 'yyyy-MM-dd'), status: 'pending', coach_notes: note || undefined, team_id: client.team_id });
    qc.invalidateQueries({ queryKey: ['cal-checkins', client.id] });
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <p className="text-xs text-[#6B7280]">Schedule a check-in for {format(date, 'MMMM d, yyyy')}.</p>
      <Field label="Coach Note (optional)">
        <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Context for this check-in…" value={note} onChange={e => setNote(e.target.value)} />
      </Field>
      <SaveBtn saving={saving} color="#2563EB" onClick={save} />
    </div>
  );
}

function AddEventModal({ day, client, onClose }) {
  const [step, setStep] = useState(null); // null = picker, else key

  const opt = ADD_OPTIONS.find(o => o.key === step);

  const subForms = {
    workout: WorkoutSubForm,
    session: SessionSubForm,
    goal: GoalSubForm,
    habit: HabitSubForm,
    weighin: WeighInSubForm,
    checkin: CheckInSubForm,
  };
  const SubForm = step ? subForms[step] : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.14 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F3F4F6]"
          style={{ background: step ? opt.bg : '#F9FAFB' }}>
          <div>
            <p className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">{format(day, 'EEE, MMM d')}</p>
            <h3 className="font-bold text-[#111827] text-sm mt-0.5">
              {step ? `Add ${opt.label}` : 'Add to Calendar'}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="p-4">
          {!step ? (
            <div className="grid grid-cols-2 gap-2">
              {ADD_OPTIONS.map(o => (
                <button key={o.key} onClick={() => setStep(o.key)}
                  className="flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all hover:shadow-sm active:scale-95"
                  style={{ borderColor: o.color + '35', background: o.bg }}>
                  <span className="text-xl">{o.emoji}</span>
                  <span className="text-xs font-bold leading-tight" style={{ color: o.color }}>{o.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.12 }}>
                <SubForm date={day} client={client} onDone={onClose} />
                <button onClick={() => setStep(null)}
                  className="w-full mt-2 text-xs text-[#6B7280] hover:text-[#374151] transition-colors py-1">
                  ← Back
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
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