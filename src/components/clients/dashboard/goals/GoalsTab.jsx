import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import GoalCard from './GoalCard';
import GoalFormModal from './GoalFormModal';
import GoalTemplatesManager from './GoalTemplatesManager';

export default function GoalsTab({ client }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showTemplatesManager, setShowTemplatesManager] = useState(false);
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', client.id],
    queryFn: () => base44.entities.Goal.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => {
      // Active first, then by created date desc
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return new Date(b.created_date) - new Date(a.created_date);
    }),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['goals', client.id] });

  const handleEdit = (goal) => { setEditingGoal(goal); setFormOpen(true); };
  const handleAdd  = ()     => { setEditingGoal(null); setFormOpen(true); };

  const handleDelete = async (goal) => {
    if (!confirm(`Delete goal "${goal.name}"?`)) return;
    await base44.entities.Goal.delete(goal.id);
    toast.success('Goal deleted');
    refresh();
  };

  const handleToggleComplete = async (goal) => {
    const newStatus = goal.status === 'completed' ? 'active' : 'completed';
    await base44.entities.Goal.update(goal.id, { status: newStatus });
    toast.success(newStatus === 'completed' ? 'Goal marked complete!' : 'Goal reactivated');
    refresh();
  };

  const handleSaved = () => {
    setFormOpen(false);
    setEditingGoal(null);
    refresh();
  };

  const active    = goals.filter(g => g.status === 'active');
  const completed = goals.filter(g => g.status === 'completed');

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f8f9fa' }}>
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Client Goals</h3>
            <p className="text-xs text-gray-400 mt-0.5">{active.length} active · {completed.length} completed</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplatesManager(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
            >
              <LayoutTemplate className="w-3.5 h-3.5" /> Templates
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
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <span className="text-2xl">🎯</span>
            </div>
            <p className="text-sm font-semibold text-gray-600 mb-1">No goals yet</p>
            <p className="text-xs text-gray-400 mb-4">Create custom goals to track this client's progress.</p>
            <button
              onClick={handleAdd}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              + Add the first goal
            </button>
          </div>
        )}

        {/* Active goals */}
        {active.length > 0 && (
          <div className="space-y-3">
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

      {/* Templates manager */}
      {showTemplatesManager && (
        <GoalTemplatesManager onClose={() => setShowTemplatesManager(false)} />
      )}

      {/* Form modal */}
      {formOpen && (
        <GoalFormModal
          clientId={client.id}
          goal={editingGoal}
          onSaved={handleSaved}
          onClose={() => { setFormOpen(false); setEditingGoal(null); }}
        />
      )}
    </div>
  );
}