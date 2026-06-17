import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const DAYS = [
  { idx: 1, label: 'M' },
  { idx: 2, label: 'T' },
  { idx: 3, label: 'W' },
  { idx: 4, label: 'T' },
  { idx: 5, label: 'F' },
  { idx: 6, label: 'S' },
  { idx: 0, label: 'S' },
];

const SUGGESTED_EMOJIS = ['💊', '💧', '😴', '👟', '🏃', '🥗', '🧘', '📖', '🚴', '🏋️'];
const SUGGESTED_NAMES  = ['Morning vitamins', 'Drink 3L water', 'Sleep 8hrs', '10k steps', 'Workout', 'Healthy meal', 'Meditate', 'Read 20 min'];

const EMPTY = { name: '', emoji: '', frequency: 'daily', days_of_week: [1,2,3,4,5], is_active: true };

export default function HabitFormModal({ clientId, habit, onSaved, onClose }) {
  const isEdit = !!habit?.id;
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (habit) {
      setForm({
        name: habit.name || '',
        emoji: habit.emoji || '',
        frequency: habit.frequency || 'daily',
        days_of_week: habit.days_of_week || [1,2,3,4,5],
        is_active: habit.is_active !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [habit]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const toggleDay = (idx) => {
    const current = form.days_of_week || [];
    const next = current.includes(idx) ? current.filter(d => d !== idx) : [...current, idx];
    set('days_of_week', next);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Habit name is required'); return; }
    if (form.frequency === 'custom' && (!form.days_of_week || form.days_of_week.length === 0)) {
      toast.error('Select at least one day'); return;
    }
    setSaving(true);
    const payload = {
      client_id: clientId,
      name: form.name.trim(),
      emoji: form.emoji || null,
      frequency: form.frequency,
      days_of_week: form.frequency === 'custom' ? form.days_of_week : [],
      is_active: form.is_active,
    };
    if (isEdit) {
      await base44.entities.Habit.update(habit.id, payload);
      toast.success('Habit updated');
    } else {
      await base44.entities.Habit.create(payload);
      toast.success('Habit added');
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Habit' : 'Add Habit'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Suggested names */}
          {!isEdit && (
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_NAMES.map(n => (
                  <button key={n} onClick={() => set('name', n)}
                    className="text-xs font-medium px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors">
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Name + emoji row */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Habit Name</label>
            <div className="flex gap-2">
              {/* Emoji picker (just a small input) */}
              <input
                type="text"
                maxLength={2}
                value={form.emoji}
                onChange={e => set('emoji', e.target.value)}
                placeholder="😀"
                className="w-12 text-center text-lg border border-gray-200 rounded-lg px-1 py-2 bg-white outline-none focus:ring-2 focus:ring-purple-400"
              />
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Morning vitamins"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            {/* Emoji suggestions */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {SUGGESTED_EMOJIS.map(e => (
                <button key={e} onClick={() => set('emoji', e)}
                  className={`text-base w-8 h-8 rounded-lg border transition-colors ${form.emoji === e ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50 hover:bg-purple-50'}`}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Frequency</label>
            <div className="flex gap-2 mb-3">
              {[{ key: 'daily', label: 'Every day' }, { key: 'custom', label: 'Specific days' }].map(f => (
                <button key={f.key} onClick={() => set('frequency', f.key)}
                  className={`flex-1 py-2 text-sm font-semibold rounded-xl border-2 transition-all ${
                    form.frequency === f.key
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>

            {form.frequency === 'custom' && (
              <div className="flex gap-1.5 justify-center">
                {DAYS.map(({ idx, label }) => {
                  const active = (form.days_of_week || []).includes(idx);
                  return (
                    <button key={idx} onClick={() => toggleDay(idx)}
                      className={`w-9 h-9 rounded-full text-xs font-bold border-2 transition-all ${
                        active
                          ? 'border-purple-500 bg-purple-500 text-white'
                          : 'border-gray-200 bg-white text-gray-400 hover:border-purple-300'
                      }`}>
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl">
              <span className="text-sm font-semibold text-gray-700">Active</span>
              <button
                onClick={() => set('is_active', !form.is_active)}
                className={`w-11 h-6 rounded-full border-2 transition-all relative ${form.is_active ? 'bg-purple-500 border-purple-500' : 'bg-gray-200 border-gray-200'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.is_active ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="text-sm font-semibold text-gray-500 px-4 py-2 rounded-lg border border-gray-200">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="text-sm font-semibold text-white px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Habit'}
          </button>
        </div>
      </div>
    </div>
  );
}