import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Play, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import RuleCard from '@/components/automations/RuleCard';
import RuleFormModal from '@/components/automations/RuleFormModal';
import AutomationTemplateCard from '@/components/automations/AutomationTemplateCard';
import AutomationResultsPanel from '@/components/automations/AutomationResultsPanel';
import { runAutomations, AUTOMATION_TEMPLATES } from '@/lib/automationEngine';

const TABS = [
  { key: 'rules', label: 'My Rules' },
  { key: 'templates', label: 'Templates' },
  { key: 'results', label: 'Live Results' },
];

export default function Automations() {
  const [tab, setTab] = useState('rules');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date'),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 300),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationRule.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['automation-rules'] }),
  });

  const handleSave = async (form) => {
    if (editingRule) {
      await updateMutation.mutateAsync({ id: editingRule.id, data: form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setEditingRule(null);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleToggle = (rule, is_active) => {
    updateMutation.mutate({ id: rule.id, data: { is_active } });
  };

  const handleUseTemplate = (template) => {
    const { icon, color, ...ruleData } = template;
    setEditingRule(null);
    setModalOpen(true);
    // Pre-fill form with template data via initial prop
    setEditingRule({ ...ruleData, _isTemplate: true });
  };

  // Run live results
  const results = useMemo(() => runAutomations(rules, clients, checkIns), [rules, clients, checkIns]);

  // Per-rule match counts
  const matchCountByRule = useMemo(() => {
    return results.reduce((acc, r) => {
      acc[r.rule.id] = (acc[r.rule.id] || 0) + 1;
      return acc;
    }, {});
  }, [results]);

  const activeCount = rules.filter(r => r.is_active).length;
  const triggeredCount = new Set(results.map(r => r.rule.id)).size;

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Automations"
        subtitle="Set IF/THEN rules that run automatically across all your clients"
        actions={
          <Button onClick={() => { setEditingRule(null); setModalOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Rule
          </Button>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Rules', value: rules.length, color: 'text-[#1F2A44]' },
          { label: 'Active', value: activeCount, color: 'text-emerald-600' },
          { label: 'Triggered Now', value: triggeredCount, color: triggeredCount > 0 ? 'text-red-500' : 'text-[#6B7280]' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E7EAF3] rounded-xl p-3 text-center shadow-sm">
            <p className={cn('text-2xl font-bold font-heading', s.color)}>{s.value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F6F7FB] border border-[#E7EAF3] rounded-lg p-1 mb-6 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'text-xs px-4 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5',
              tab === t.key ? 'bg-white shadow-sm text-[#1F2A44]' : 'text-[#6B7280] hover:text-[#1F2A44]'
            )}
          >
            {t.key === 'results' && triggeredCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
            )}
            {t.label}
            {t.key === 'results' && triggeredCount > 0 && (
              <span className="text-[10px] font-bold bg-destructive/20 text-destructive px-1.5 py-0.5 rounded-full">{triggeredCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Rules Tab */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-[#6B7280]">
              <Zap className="w-12 h-12 opacity-20" />
              <div className="text-center">
                <p className="text-sm font-medium text-[#1F2A44]">No rules yet</p>
                <p className="text-xs mt-1">Create a rule or pick a template to get started</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setTab('templates')} className="gap-1.5">
                  <LayoutTemplate className="w-4 h-4" /> Browse Templates
                </Button>
                <Button size="sm" onClick={() => { setEditingRule(null); setModalOpen(true); }} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Create Rule
                </Button>
              </div>
            </div>
          ) : (
            rules.map(rule => (
              <RuleCard
                key={rule.id}
                rule={rule}
                matchCount={matchCountByRule[rule.id] || 0}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))
          )}
        </div>
      )}

      {/* Templates Tab */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AUTOMATION_TEMPLATES.map((t, i) => (
            <AutomationTemplateCard key={i} template={t} onUse={handleUseTemplate} />
          ))}
        </div>
      )}

      {/* Live Results Tab */}
      {tab === 'results' && (
        <div className="space-y-4">
          <p className="text-xs text-[#6B7280]">
            {results.length > 0
              ? `${results.length} trigger${results.length > 1 ? 's' : ''} found across ${clients.length} clients`
              : 'Rules are evaluated in real-time against all active clients.'}
          </p>
          <AutomationResultsPanel results={results} />
        </div>
      )}

      <RuleFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null); }}
        onSave={handleSave}
        initial={editingRule?._isTemplate ? { ...editingRule, id: undefined, _isTemplate: undefined } : editingRule}
      />
    </div>
  );
}