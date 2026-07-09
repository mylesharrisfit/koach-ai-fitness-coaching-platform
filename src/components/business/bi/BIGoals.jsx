import React, { useState, useMemo } from 'react';
import { Target, Edit2, Check, X, Trophy } from 'lucide-react';
import { parseISO, startOfMonth } from 'date-fns';

const GOAL_PRESETS = [
  { key: 'mrr', label: 'Monthly Revenue Target', unit: '$', defaultVal: 5000 },
  { key: 'new_clients', label: 'New Clients This Month', unit: '', defaultVal: 3 },
  { key: 'retention', label: 'Retention Rate Target', unit: '%', defaultVal: 90 },
];

function GoalCard({ goal, current, unit, onEdit }) {
  const pct = Math.min(100, goal.target > 0 ? Math.round((current / goal.target) * 100) : 0);
  const achieved = pct >= 100;
  const color = achieved ? 'rgb(var(--success))' : pct >= 70 ? 'rgb(var(--warning))' : 'rgb(var(--primary))';

  return (
    <div className={`p-3.5 rounded-xl border relative ${achieved ? 'border-success bg-success/10' : 'border-border bg-muted'}`}>
      {achieved && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-success rounded-full flex items-center justify-center shadow-sm">
          <Trophy className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-foreground">{goal.label}</p>
        <button onClick={onEdit} className="p-1 hover:bg-muted rounded-lg transition-colors">
          <Edit2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>
      <div className="flex items-end justify-between mb-2">
        <p className="text-lg font-bold" style={{ color }}>
          {unit === '$' ? `$${current.toLocaleString()}` : `${current}${unit}`}
        </p>
        <p className="text-xs text-muted-foreground">
          / {unit === '$' ? `$${goal.target.toLocaleString()}` : `${goal.target}${unit}`}
        </p>
      </div>
      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5">{pct}% to goal{achieved ? ' 🎉' : ''}</p>
    </div>
  );
}

export default function BIGoals({ clients, checkIns }) {
  const [goals, setGoals] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bi_goals') || 'null') || {}; } catch { return {}; }
  });
  const [editing, setEditing] = useState(null);
  const [tempVal, setTempVal] = useState('');

  const saveGoals = (updated) => {
    setGoals(updated);
    localStorage.setItem('bi_goals', JSON.stringify(updated));
  };

  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);
  const newThisMonth = clients.filter(c => {
    const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
    return sd && sd >= startOfMonth(new Date());
  }).length;
  const completedPct = clients.length > 0
    ? Math.round(((clients.length - clients.filter(c => c.lifecycle_status === 'completed' || c.lifecycle_status === 'alumni').length) / clients.length) * 100)
    : 100;

  const currentValues = { mrr, new_clients: newThisMonth, retention: completedPct };

  const startEdit = (key, defaultVal) => {
    setEditing(key);
    setTempVal(String(goals[key]?.target || defaultVal));
  };

  const saveEdit = () => {
    if (!editing) return;
    const preset = GOAL_PRESETS.find(g => g.key === editing);
    saveGoals({ ...goals, [editing]: { label: preset.label, target: Number(tempVal) } });
    setEditing(null);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" /> Business Goals
        </h3>
      </div>

      {editing && (
        <div className="mb-4 p-3 bg-accent border border-primary rounded-xl">
          <p className="text-xs font-semibold text-primary mb-2">{GOAL_PRESETS.find(g => g.key === editing)?.label}</p>
          <div className="flex gap-2">
            <input type="number" value={tempVal} onChange={e => setTempVal(e.target.value)}
              className="flex-1 text-sm border border-primary rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-primary" />
            <button onClick={saveEdit} className="w-8 h-8 bg-success text-white rounded-lg flex items-center justify-center hover:bg-success">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditing(null)} className="w-8 h-8 bg-border text-muted-foreground rounded-lg flex items-center justify-center hover:bg-border">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {GOAL_PRESETS.map(preset => (
          <GoalCard
            key={preset.key}
            goal={goals[preset.key] || { label: preset.label, target: preset.defaultVal }}
            current={currentValues[preset.key] || 0}
            unit={preset.unit}
            onEdit={() => startEdit(preset.key, preset.defaultVal)}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-3">Click ✏️ on any goal to set your target</p>
    </div>
  );
}