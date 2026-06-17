import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Pencil, Trash2, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_META = {
  numeric:   { label: 'Numeric',   color: '#2563EB', bg: '#eff6ff' },
  nutrition: { label: 'Nutrition', color: '#16a34a', bg: '#f0fdf4' },
  simple:    { label: 'Simple',    color: '#7c3aed', bg: '#f5f3ff' },
};

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}
function TInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400" />
  );
}

const EMPTY_TMPL = { name: '', goal_type: 'numeric', notes: '', target_value: '', unit: '', calories_target: '', protein_target: '', carbs_target: '', fat_target: '' };

function TemplateEditForm({ template, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: template?.name || '',
    goal_type: template?.goal_type || 'numeric',
    notes: template?.notes || '',
    target_value: template?.target_value ?? '',
    unit: template?.unit || '',
    calories_target: template?.calories_target ?? '',
    protein_target: template?.protein_target ?? '',
    carbs_target: template?.carbs_target ?? '',
    fat_target: template?.fat_target ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name required'); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), goal_type: form.goal_type, notes: form.notes || null };
    if (form.goal_type === 'numeric') {
      payload.target_value = form.target_value !== '' ? Number(form.target_value) : null;
      payload.unit = form.unit || null;
    }
    if (form.goal_type === 'nutrition') {
      payload.calories_target = form.calories_target !== '' ? Number(form.calories_target) : null;
      payload.protein_target  = form.protein_target  !== '' ? Number(form.protein_target)  : null;
      payload.carbs_target    = form.carbs_target    !== '' ? Number(form.carbs_target)    : null;
      payload.fat_target      = form.fat_target      !== '' ? Number(form.fat_target)      : null;
    }
    if (template?.id) {
      await base44.entities.GoalTemplate.update(template.id, payload);
    } else {
      await base44.entities.GoalTemplate.create({ ...payload, coach_id: 'me' });
    }
    toast.success(template?.id ? 'Template updated' : 'Template created');
    setSaving(false);
    onSaved();
  };

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {['numeric', 'nutrition', 'simple'].map(t => (
          <button key={t} onClick={() => set('goal_type', t)}
            className={`py-1.5 rounded-lg text-xs font-semibold border-2 transition-all ${form.goal_type === t ? 'border-blue-500 bg-white text-blue-600' : 'border-gray-100 bg-white text-gray-500'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <Field label="Template Name"><TInput value={form.name} onChange={v => set('name', v)} placeholder="e.g. Weight Loss Target" /></Field>
      {form.goal_type === 'numeric' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Target Value"><TInput type="number" value={form.target_value} onChange={v => set('target_value', v)} placeholder="e.g. 175" /></Field>
          <Field label="Unit"><TInput value={form.unit} onChange={v => set('unit', v)} placeholder="e.g. lbs" /></Field>
        </div>
      )}
      {form.goal_type === 'nutrition' && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories"><TInput type="number" value={form.calories_target} onChange={v => set('calories_target', v)} placeholder="2200" /></Field>
          <Field label="Protein (g)"><TInput type="number" value={form.protein_target} onChange={v => set('protein_target', v)} placeholder="180" /></Field>
          <Field label="Carbs (g)"><TInput type="number" value={form.carbs_target} onChange={v => set('carbs_target', v)} placeholder="220" /></Field>
          <Field label="Fat (g)"><TInput type="number" value={form.fat_target} onChange={v => set('fat_target', v)} placeholder="70" /></Field>
        </div>
      )}
      <Field label="Notes (optional)">
        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="Optional description…"
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
      </Field>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="text-xs font-semibold text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 bg-white">Cancel</button>
        <button onClick={handleSave} disabled={saving}
          className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg disabled:opacity-50">
          {saving ? 'Saving…' : template?.id ? 'Update' : 'Create'}
        </button>
      </div>
    </div>
  );
}

export default function GoalTemplatesManager({ onClose }) {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState(null); // template id or 'new'

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['goal-templates'],
    queryFn: () => base44.entities.GoalTemplate.list('-created_date'),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['goal-templates'] });

  const handleDelete = async (t) => {
    if (!confirm(`Delete template "${t.name}"?`)) return;
    await base44.entities.GoalTemplate.delete(t.id);
    toast.success('Template deleted');
    refresh();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col" style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-blue-500" />
            <h3 className="text-base font-bold text-gray-900">Goal Templates</h3>
            <span className="text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{templates.length}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

          {/* New template form */}
          {editingId === 'new'
            ? <TemplateEditForm template={null} onSaved={() => { setEditingId(null); refresh(); }} onCancel={() => setEditingId(null)} />
            : (
              <button onClick={() => setEditingId('new')}
                className="w-full text-sm font-semibold text-blue-600 border-2 border-dashed border-blue-200 rounded-xl py-3 hover:bg-blue-50 transition-colors">
                + New Template
              </button>
            )
          }

          {isLoading && <p className="text-xs text-gray-400 text-center py-6">Loading…</p>}

          {!isLoading && templates.length === 0 && editingId !== 'new' && (
            <div className="text-center py-8">
              <LayoutTemplate className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">No templates yet. Create one above or save a goal as a template from the client profile.</p>
            </div>
          )}

          {templates.map(t => {
            const meta = TYPE_META[t.goal_type] || TYPE_META.simple;
            if (editingId === t.id) {
              return <TemplateEditForm key={t.id} template={t} onSaved={() => { setEditingId(null); refresh(); }} onCancel={() => setEditingId(null)} />;
            }
            return (
              <div key={t.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-gray-800 truncate">{t.name}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    {t.goal_type === 'numeric' && t.target_value ? `Target: ${t.target_value} ${t.unit || ''}` :
                     t.goal_type === 'nutrition' && t.calories_target ? `${t.calories_target} kcal · ${t.protein_target ?? 0}g P · ${t.carbs_target ?? 0}g C · ${t.fat_target ?? 0}g F` :
                     t.notes || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditingId(t.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(t)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}