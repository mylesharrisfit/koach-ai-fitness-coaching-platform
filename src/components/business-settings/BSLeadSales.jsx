import React from 'react';
import { TrendingUp, GripVertical, Plus, X } from 'lucide-react';
import { BSSection, BSRow, BSToggle, BSSelect, BSInput, BSTextarea, BSDivider } from './BSSection';

const DEFAULT_STAGES = [
  { id: '1', label: 'New Lead' }, { id: '2', label: 'DM\'d' },
  { id: '3', label: 'Call Booked' }, { id: '4', label: 'Proposal Sent' },
  { id: '5', label: 'Closed / Won' }, { id: '6', label: 'Lost' },
];

const DEFAULTS = {
  pipeline_stages: DEFAULT_STAGES, auto_move_pipeline_enabled: false, auto_move_pipeline_days: 7,
  followup_reminder_enabled: true, followup_reminder_days: 3,
};

export default function BSLeadSales({ s, set }) {
  const stages = s.pipeline_stages?.length ? s.pipeline_stages : DEFAULT_STAGES;

  const updateStage = (id, label) => set('pipeline_stages', stages.map(st => st.id === id ? { ...st, label } : st));
  const removeStage = (id) => set('pipeline_stages', stages.filter(st => st.id !== id));
  const addStage = () => set('pipeline_stages', [...stages, { id: Date.now().toString(), label: 'New Stage' }]);

  return (
    <BSSection icon={TrendingUp} title="Lead & Sales Settings" onReset={() => Object.entries(DEFAULTS).forEach(([k, v]) => set(k, v))}>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lead Pipeline</p>
      <BSRow label="Pipeline stages" hint="Drag to reorder (coming soon), click to rename">
        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div key={stage.id} className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>{i + 1}</div>
              <input value={stage.label} onChange={e => updateStage(stage.id, e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-blue-400" />
              <button onClick={() => removeStage(stage.id)} className="text-slate-400 hover:text-red-400 transition-colors flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button onClick={addStage} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
            <Plus className="w-4 h-4" /> Add Stage
          </button>
        </div>
      </BSRow>
      <BSRow label="Auto-move to next stage" hint="After X days with no activity">
        <div className="space-y-2">
          <BSToggle value={s.auto_move_pipeline_enabled} onChange={v => set('auto_move_pipeline_enabled', v)} />
          {s.auto_move_pipeline_enabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">After</span>
              <BSInput type="number" value={s.auto_move_pipeline_days} onChange={v => set('auto_move_pipeline_days', v)} min={1} className="w-20" />
              <span className="text-sm text-slate-500">days of inactivity</span>
            </div>
          )}
        </div>
      </BSRow>
      <BSRow label="Follow-up reminder">
        <div className="space-y-2">
          <BSToggle value={s.followup_reminder_enabled} onChange={v => set('followup_reminder_enabled', v)} />
          {s.followup_reminder_enabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">After</span>
              <BSInput type="number" value={s.followup_reminder_days} onChange={v => set('followup_reminder_days', v)} min={1} className="w-20" />
              <span className="text-sm text-slate-500">days</span>
            </div>
          )}
        </div>
      </BSRow>
    </BSSection>
  );
}