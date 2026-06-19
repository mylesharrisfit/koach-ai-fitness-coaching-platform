import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { X, Dumbbell, Target, Zap, Scale, Phone, ClipboardList, Loader2 } from 'lucide-react';

const EVENT_OPTIONS = [
  { key: 'session',   label: 'Session / Call',   emoji: '📞', color: '#059669', bg: '#ECFDF5', icon: Phone },
  { key: 'goal',      label: 'Goal',             emoji: '🎯', color: '#D97706', bg: '#FFFBEB', icon: Target },
  { key: 'habit',     label: 'Habit',            emoji: '⚡', color: '#EC4899', bg: '#FDF2F8', icon: Zap },
  { key: 'weighin',   label: 'Weigh-in',         emoji: '⚖️', color: '#7C3AED', bg: '#F5F3FF', icon: Scale },
  { key: 'checkin',   label: 'Check-in',         emoji: '📋', color: '#2563EB', bg: '#EFF6FF', icon: ClipboardList },
];

// ── Sub-forms ────────────────────────────────────────────────────────────────

function SessionForm({ date, client, onSuccess, onClose }) {
  const [title, setTitle] = useState('Coaching Session');
  const [time, setTime] = useState('09:00');
  const [sessionType, setSessionType] = useState('video_call');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    setSaving(true);
    await base44.entities.Session.create({
      client_id: client.id,
      client_name: client.name,
      title,
      date: format(date, 'yyyy-MM-dd'),
      time,
      session_type: sessionType,
      status: 'scheduled',
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-sessions', client.id] });
    onSuccess();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Time</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Type</label>
          <select value={sessionType} onChange={e => setSessionType(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 bg-white">
            <option value="video_call">Video Call</option>
            <option value="phone_call">Phone Call</option>
            <option value="in_person">In Person</option>
            <option value="check_in">Check-in</option>
          </select>
        </div>
      </div>
      <SaveButton saving={saving} onClick={save} />
    </div>
  );
}

function GoalForm({ date, client, onSuccess }) {
  const [name, setName] = useState('');
  const [goalType, setGoalType] = useState('simple');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Goal.create({
      client_id: client.id,
      name,
      goal_type: goalType,
      target_value: targetValue ? parseFloat(targetValue) : undefined,
      unit: unit || undefined,
      due_date: format(date, 'yyyy-MM-dd'),
      status: 'active',
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-goals', client.id] });
    onSuccess();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Goal Name</label>
        <input placeholder="e.g. Reach 175 lbs" value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Type</label>
        <select value={goalType} onChange={e => setGoalType(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#D97706]/30">
          <option value="simple">Simple (Yes/No)</option>
          <option value="numeric">Numeric (with target)</option>
        </select>
      </div>
      {goalType === 'numeric' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1">Target</label>
            <input type="number" placeholder="175" value={targetValue} onChange={e => setTargetValue(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[#374151] block mb-1">Unit</label>
            <input placeholder="lbs, steps…" value={unit} onChange={e => setUnit(e.target.value)}
              className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706]/30" />
          </div>
        </div>
      )}
      <SaveButton saving={saving} onClick={save} disabled={!name.trim()} color="#D97706" />
    </div>
  );
}

function HabitForm({ date, client, onSuccess }) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⚡');
  const [frequency, setFrequency] = useState('daily');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await base44.entities.Habit.create({
      client_id: client.id,
      name,
      emoji,
      frequency,
      is_active: true,
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-habits', client.id] });
    onSuccess();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Habit Name</label>
        <input placeholder="e.g. Morning vitamins" value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC4899]/30" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Emoji</label>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2}
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#EC4899]/30" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#374151] block mb-1">Frequency</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value)}
            className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#EC4899]/30">
            <option value="daily">Daily</option>
            <option value="custom">Custom days</option>
          </select>
        </div>
      </div>
      <SaveButton saving={saving} onClick={save} disabled={!name.trim()} color="#EC4899" />
    </div>
  );
}

function WeighInForm({ date, client, onSuccess }) {
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    if (!weight) return;
    setSaving(true);
    await base44.entities.WeighIn.create({
      client_id: client.id,
      weight: parseFloat(weight),
      date: format(date, 'yyyy-MM-dd'),
      note: note || undefined,
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-weighins', client.id] });
    onSuccess();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Weight (lbs)</label>
        <input type="number" step="0.1" placeholder="175.5" value={weight} onChange={e => setWeight(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Note (optional)</label>
        <input placeholder="Any comments…" value={note} onChange={e => setNote(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30" />
      </div>
      <SaveButton saving={saving} onClick={save} disabled={!weight} color="#7C3AED" />
    </div>
  );
}

function CheckInForm({ date, client, onSuccess }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const save = async () => {
    setSaving(true);
    await base44.entities.CheckIn.create({
      client_id: client.id,
      client_name: client.name,
      date: format(date, 'yyyy-MM-dd'),
      status: 'pending',
      coach_notes: note || undefined,
      team_id: client.team_id,
    });
    qc.invalidateQueries({ queryKey: ['cal-checkins', client.id] });
    onSuccess();
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-[#6B7280]">Schedule a check-in for {format(date, 'MMMM d, yyyy')}.</p>
      <div>
        <label className="text-xs font-semibold text-[#374151] block mb-1">Coach Note (optional)</label>
        <textarea rows={2} placeholder="Any context for this check-in…" value={note} onChange={e => setNote(e.target.value)}
          className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30" />
      </div>
      <SaveButton saving={saving} onClick={save} color="#2563EB" />
    </div>
  );
}

function SaveButton({ saving, onClick, disabled = false, color = '#2563EB' }) {
  return (
    <button onClick={onClick} disabled={saving || disabled}
      className="w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
      style={{ background: color }}>
      {saving && <Loader2 className="w-4 h-4 animate-spin" />}
      {saving ? 'Saving…' : 'Add to Calendar'}
    </button>
  );
}

// ── Main modal ───────────────────────────────────────────────────────────────
export default function AddCalendarEventModal({ date, client, onClose, onSuccess }) {
  const [selected, setSelected] = useState(null);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  const renderForm = () => {
    switch (selected) {
      case 'session':  return <SessionForm  date={date} client={client} onSuccess={handleSuccess} onClose={onClose} />;
      case 'goal':     return <GoalForm     date={date} client={client} onSuccess={handleSuccess} />;
      case 'habit':    return <HabitForm    date={date} client={client} onSuccess={handleSuccess} />;
      case 'weighin':  return <WeighInForm  date={date} client={client} onSuccess={handleSuccess} />;
      case 'checkin':  return <CheckInForm  date={date} client={client} onSuccess={handleSuccess} />;
      default: return null;
    }
  };

  const selectedOpt = EVENT_OPTIONS.find(o => o.key === selected);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6]"
          style={{ background: selected ? (selectedOpt?.bg || '#F9FAFB') : '#F9FAFB' }}>
          <div>
            <p className="text-[11px] text-[#6B7280] font-semibold uppercase tracking-wider">
              {format(date, 'EEEE, MMMM d')}
            </p>
            <h3 className="font-bold text-[#111827] text-base mt-0.5">
              {selected ? `Add ${selectedOpt?.label}` : 'What would you like to add?'}
            </h3>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        <div className="p-4">
          {/* Type picker */}
          {!selected ? (
            <div className="grid grid-cols-2 gap-2">
              {EVENT_OPTIONS.map(opt => (
                <button key={opt.key} onClick={() => setSelected(opt.key)}
                  className="flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all hover:shadow-sm"
                  style={{ borderColor: opt.color + '40', background: opt.bg }}>
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-bold" style={{ color: opt.color }}>{opt.label}</span>
                </button>
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={selected}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.12 }}>
                {renderForm()}
                <button onClick={() => setSelected(null)}
                  className="w-full mt-2 text-xs text-[#6B7280] hover:text-[#374151] transition-colors py-1">
                  ← Back to options
                </button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  );
}