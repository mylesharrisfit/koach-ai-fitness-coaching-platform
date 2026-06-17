import React, { useState } from 'react';
import { CheckCircle2, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Thin progress bar ──────────────────────────────────────────────────────
function Bar({ pct, color = '#2563EB' }) {
  const clamped = Math.min(100, Math.max(0, pct || 0));
  return (
    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  );
}

// ── Macro mini-bar ─────────────────────────────────────────────────────────
function MacroBar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold" style={{ color }}>{label}</span>
        <span className="text-[10px] text-gray-400">{current ?? 0}g / {target ?? 0}g</span>
      </div>
      <Bar pct={pct} color={color} />
    </div>
  );
}

export default function GoalCard({ goal, onEdit, onDelete, onToggleComplete }) {
  const isCompleted = goal.status === 'completed';

  // ── Numeric ──────────────────────────────────────────────────────────────
  const numericPct = goal.goal_type === 'numeric' && goal.target_value > 0
    ? Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
    : 0;

  // ── Nutrition overall pct (calories) ─────────────────────────────────────
  const calPct = goal.goal_type === 'nutrition' && goal.calories_target > 0
    ? Math.min(100, Math.round(((goal.calories_current ?? 0) / goal.calories_target) * 100))
    : 0;

  // ── Simple ───────────────────────────────────────────────────────────────
  const simplePct = goal.goal_type === 'simple' ? (goal.progress_pct ?? 0) : 0;

  const TYPE_META = {
    numeric:   { label: 'Numeric',   color: '#2563EB', bg: '#eff6ff' },
    nutrition: { label: 'Nutrition', color: '#16a34a', bg: '#f0fdf4' },
    simple:    { label: 'Simple',    color: '#7c3aed', bg: '#f5f3ff' },
  };
  const meta = TYPE_META[goal.goal_type] || TYPE_META.simple;

  return (
    <div className={cn(
      'bg-white rounded-xl border shadow-sm p-4 transition-opacity',
      isCompleted ? 'border-emerald-200 opacity-75' : 'border-gray-100'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {isCompleted && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />}
          <div className="min-w-0">
            <p className={cn('text-sm font-bold leading-tight', isCompleted ? 'line-through text-gray-400' : 'text-gray-800')}>
              {goal.name}
            </p>
            {goal.notes && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{goal.notes}</p>}
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full mr-1"
            style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
          <button onClick={() => onEdit(goal)} title="Edit"
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
          <button onClick={() => onToggleComplete(goal)} title={isCompleted ? 'Reactivate' : 'Mark complete'}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            {isCompleted ? <RotateCcw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          </button>
          <button onClick={() => onDelete(goal)} title="Delete"
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Numeric goal body ── */}
      {goal.goal_type === 'numeric' && (
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xl font-bold text-gray-800">
              {goal.current_value ?? 0}
              <span className="text-sm font-normal text-gray-400 ml-1">{goal.unit}</span>
            </span>
            <span className="text-xs text-gray-400">
              Target: <span className="font-semibold text-gray-600">{goal.target_value} {goal.unit}</span>
            </span>
          </div>
          <Bar pct={numericPct} color={meta.color} />
          <p className="text-[10px] text-gray-400 mt-1 text-right">{numericPct}% of goal</p>
        </div>
      )}

      {/* ── Nutrition goal body ── */}
      {goal.goal_type === 'nutrition' && (
        <div>
          <div className="flex items-end justify-between mb-2">
            <span className="text-xl font-bold text-gray-800">
              {goal.calories_current ?? 0}
              <span className="text-sm font-normal text-gray-400 ml-1">kcal</span>
            </span>
            <span className="text-xs text-gray-400">
              Target: <span className="font-semibold text-gray-600">{goal.calories_target ?? 0} kcal</span>
            </span>
          </div>
          <Bar pct={calPct} color={meta.color} />
          <div className="flex gap-3 mt-3">
            <MacroBar label="Protein" current={goal.protein_current ?? 0} target={goal.protein_target ?? 0} color="#2563EB" />
            <MacroBar label="Carbs"   current={goal.carbs_current   ?? 0} target={goal.carbs_target   ?? 0} color="#f59e0b" />
            <MacroBar label="Fat"     current={goal.fat_current     ?? 0} target={goal.fat_target     ?? 0} color="#ef4444" />
          </div>
        </div>
      )}

      {/* ── Simple goal body ── */}
      {goal.goal_type === 'simple' && (
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-xl font-bold" style={{ color: meta.color }}>{simplePct}%</span>
            <span className="text-xs text-gray-400">Progress</span>
          </div>
          <Bar pct={simplePct} color={meta.color} />
        </div>
      )}
    </div>
  );
}