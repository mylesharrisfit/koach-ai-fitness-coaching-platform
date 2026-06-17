import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutTemplate, Target, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import GoalCard from './goals/GoalCard';
import GoalFormModal from './goals/GoalFormModal';
import GoalTemplatesManager from './goals/GoalTemplatesManager';
import TemplatePickerSheet from './goals/TemplatePickerSheet';
import HabitsSection from './habits/HabitsSection';

// ── Sub-sections ─────────────────────────────────────────────────────────────
const SECTIONS = [
  { key: 'goals',  label: 'Goals',  icon: Target },
  { key: 'habits', label: 'Habits', icon: Sparkles },
];

export default function GoalsHabitsTab({ client }) {
  const [section, setSection] = useState('goals');
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [prefilledTemplate, setPrefilledTemplate] = useState(null);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', client.id],
    queryFn: () => base44.entities.Goal.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return new Date(b.created_date) - new Date(a.created_date);
    }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['goals', client.id] });

  const handleEdit   = (goal) => { setEditingGoal(goal); setFormOpen(true); };
  const handleAdd    = ()     => { setEditingGoal(null); setPrefilledTemplate(null); setFormOpen(true); };
  const handleSaved  = ()     => { setFormOpen(false); setEditingGoal(null); setPrefilledTemplate(null); refresh(); };

  // Called when a template is picked from the picker sheet
  const handleTemplateSelected = (tmpl) => {
    setShowTemplatePicker(false);
    setEditingGoal(null);
    setPrefilledTemplate(tmpl);
    setFormOpen(true);
  };

  const handleDelete = async (goal) => {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await base44.entities.Goal.delete(goal.id);
    toast.success('Goal deleted');
    refresh();
  };

  const handleToggleComplete = async (goal) => {
    const newStatus = goal.status === 'completed' ? 'active' : 'completed';
    await base44.entities.Goal.update(goal.id, { status: newStatus });
    toast.success(newStatus === 'completed' ? 'Goal marked complete! 🎉' : 'Goal reactivated');
    refresh();
  };

  const active    = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#f8f9fa' }}>

      {/* ── Section toggle bar ── */}
      <div className="flex-shrink-0 flex items-center gap-1 px-6 pt-4 pb-0">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const isActive = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-t-lg text-sm font-semibold border-b-2 transition-all"
              style={{
                borderBottomColor: isActive ? '#2563EB' : 'transparent',
                color: isActive ? '#2563EB' : '#6B7280',
                background: isActive ? '#fff' : 'transparent',
              }}
            >
              <Icon className="w-4 h-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ── Divider ── */}
      <div className="flex-shrink-0 border-b border-gray-200" />

      {/* ── Goals section ── */}
      {section === 'goals' && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Client Goals</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {active.length} active · {completed.length} completed
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplatesManager(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-200 bg-white transition-colors"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" /> Manage Templates
                </button>
                <button
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" /> Add Goal
                </button>
              </div>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="text-center py-12 text-sm text-gray-400">Loading goals…</div>
            )}

            {/* Empty state */}
            {!isLoading && goals.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Target className="w-7 h-7 text-blue-400" />
                </div>
                <p className="text-sm font-bold text-gray-700 mb-1">No goals yet</p>
                <p className="text-xs text-gray-400 mb-5">
                  Set goals for this client to track progress over time.
                  <br />You can create from scratch or use a saved template.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add First Goal
                  </button>
                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-blue-600 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-200 transition-colors"
                  >
                    <LayoutTemplate className="w-4 h-4" /> Browse Templates
                  </button>
                </div>
              </div>
            )}

            {/* Active goals */}
            {active.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 rounded-full bg-blue-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Active</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">{active.length}</span>
                </div>
                {active.map(g => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            )}

            {/* Completed goals */}
            {completed.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-3 rounded-full bg-emerald-400" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Completed</p>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600">{completed.length}</span>
                </div>
                {completed.map(g => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onToggleComplete={handleToggleComplete}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Habits section ── */}
      {section === 'habits' && (
        <div className="flex-1 overflow-hidden">
          <HabitsSection client={client} />
        </div>
      )}

      {/* ── Portals ── */}
      {showTemplatesManager && ReactDOM.createPortal(
        <GoalTemplatesManager onClose={() => setShowTemplatesManager(false)} />,
        document.body
      )}
      {showTemplatePicker && ReactDOM.createPortal(
        <TemplatePickerSheet
          onSelect={handleTemplateSelected}
          onClose={() => setShowTemplatePicker(false)}
        />,
        document.body
      )}
      {formOpen && ReactDOM.createPortal(
        <GoalFormModal
          clientId={client.id}
          goal={editingGoal}
          prefilledTemplate={prefilledTemplate}
          onSaved={handleSaved}
          onClose={() => { setFormOpen(false); setEditingGoal(null); setPrefilledTemplate(null); }}
        />,
        document.body
      )}
    </div>
  );
}