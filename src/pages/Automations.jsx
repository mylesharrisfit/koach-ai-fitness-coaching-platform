import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Zap, Plus, Check, Pencil, Trash2, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, AlertTriangle, MessageSquare, Bell,
  Flame, Flag, TrendingDown, Smile, Scale, ClipboardList, Dumbbell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { runAutomations, AUTOMATION_TEMPLATES, CONDITION_META, ACTION_META } from '@/lib/automationEngine';
import RuleFormModal from '@/components/automations/RuleFormModal';
import { toast } from 'sonner';

/* ── Condition → icon map ── */
const COND_ICONS = {
  missed_checkin: <ClipboardList className="w-4 h-4" />,
  missed_workouts: <Dumbbell className="w-4 h-4" />,
  low_adherence: <TrendingDown className="w-4 h-4" />,
  weight_plateau: <Scale className="w-4 h-4" />,
  low_nutrition: <Flame className="w-4 h-4" />,
  mood_low: <Smile className="w-4 h-4" />,
  no_progress: <TrendingDown className="w-4 h-4" />,
  declining_trend: <TrendingDown className="w-4 h-4" />,
};

const ACTION_COLORS = {
  send_message: 'bg-blue-50 border-blue-100 text-primary',
  send_template: 'bg-blue-50 border-blue-100 text-primary',
  notify_coach: 'bg-amber-50 border-amber-100 text-amber-600',
  adjust_calories: 'bg-orange-50 border-orange-100 text-orange-600',
  flag_client: 'bg-red-50 border-red-100 text-red-500',
  suggest_adjustment: 'bg-purple-50 border-purple-100 text-purple-600',
};

/* ── Single active rule card ── */
function ActiveRuleCard({ rule, matchCount, onToggle, onEdit, onDelete }) {
  const cMeta = CONDITION_META[rule.condition_type] || {};
  const aMeta = ACTION_META[rule.action_type] || {};
  const actionColor = ACTION_COLORS[rule.action_type] || 'bg-[#F6F7FB] border-[#E7EAF3] text-[#374151]';

  return (
    <div className={cn(
      'bg-white border rounded-2xl p-4 transition-all',
      rule.is_active ? 'border-[#E7EAF3] shadow-sm' : 'border-[#E7EAF3] opacity-50'
    )}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center text-[#6B7280] flex-shrink-0">
          {COND_ICONS[rule.condition_type] || <Zap className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <p className="font-semibold text-sm text-[#1F2A44]">{rule.name}</p>
            {matchCount > 0 && rule.is_active && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 border border-red-100 text-red-500 px-1.5 py-0.5 rounded-full">
                <AlertTriangle className="w-2.5 h-2.5" /> {matchCount} triggered
              </span>
            )}
          </div>

          {/* IF → THEN pill row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] px-2.5 py-1 rounded-lg">
              IF {cMeta.label || rule.condition_type?.replace(/_/g, ' ')}
              {rule.condition_threshold != null && (
                <span className="text-[#9CA3AF] ml-1">
                  ({rule.condition_threshold}{cMeta.thresholdType === 'percent' ? '%' : cMeta.thresholdType === 'days' ? 'd' : '×'})
                </span>
              )}
            </span>
            <span className="text-[#9CA3AF] text-xs">→</span>
            <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-lg border', actionColor)}>
              {aMeta.icon} {aMeta.label || rule.action_type?.replace(/_/g, ' ')}
            </span>
          </div>

          {rule.action_message && (
            <p className="text-[11px] text-[#6B7280] mt-2 line-clamp-1 italic">"{rule.action_message}"</p>
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-[#9CA3AF]">
              {rule.trigger_count > 0 ? `Fired ${rule.trigger_count}×` : 'Never fired'}
              {rule.last_triggered ? ` · last ${rule.last_triggered}` : ''}
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => onEdit(rule)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F6F7FB] text-[#6B7280] transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onDelete(rule.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onToggle(rule, !rule.is_active)}
                className={cn('flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-semibold border transition-all',
                  rule.is_active
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                    : 'bg-[#F6F7FB] border-[#E7EAF3] text-[#6B7280] hover:bg-[#ECEEF5]'
                )}
              >
                {rule.is_active ? <><ToggleRight className="w-3.5 h-3.5" /> On</> : <><ToggleLeft className="w-3.5 h-3.5" /> Off</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Template card (1-click add) ── */
function TemplateCard({ template, isAdded, onAdd, onCustomize }) {
  const actionColor = ACTION_COLORS[template.action_type] || 'bg-[#F6F7FB] border-[#E7EAF3]';
  const cMeta = CONDITION_META[template.condition_type] || {};
  const aMeta = ACTION_META[template.action_type] || {};

  return (
    <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center text-xl flex-shrink-0">
          {template.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[#1F2A44] leading-tight">{template.name}</p>
          <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">{template.description}</p>
        </div>
      </div>

      {/* IF → THEN pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-medium bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] px-2.5 py-1 rounded-lg">
          IF {cMeta.label}
        </span>
        <span className="text-[#9CA3AF] text-xs">→</span>
        <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-lg border', actionColor)}>
          {aMeta.label}
        </span>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={() => onAdd(template)}
          disabled={isAdded}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl text-sm font-semibold border transition-all active:scale-95',
            isAdded
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600 cursor-default'
              : 'bg-primary text-white border-transparent hover:bg-primary/90'
          )}
        >
          {isAdded ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Use Template</>}
        </button>
        <button
          onClick={() => onCustomize(template)}
          className="h-9 px-3 rounded-xl border border-[#E7EAF3] text-xs font-medium text-[#374151] hover:bg-[#F6F7FB] transition-colors"
        >
          Customize
        </button>
      </div>
    </div>
  );
}

/* ── Triggered clients panel ── */
function TriggeredPanel({ results }) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center gap-2">
        <Check className="w-8 h-8 text-emerald-400" />
        <p className="text-sm font-semibold text-[#1F2A44]">All clear!</p>
        <p className="text-xs text-[#6B7280]">No rules are triggering right now</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((r, i) => {
        const aMeta = ACTION_META[r.rule.action_type] || {};
        return (
          <div key={i} className="flex items-start gap-3 bg-white border border-red-100 rounded-xl p-3">
            <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1F2A44]">{r.client.name}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{r.detail}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[10px] font-medium bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] px-2 py-0.5 rounded-full">{r.rule.name}</span>
                <span className="text-[10px] text-[#9CA3AF]">→ {aMeta.label || r.rule.action_type}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ── */
export default function Automations() {
  const [tab, setTab] = useState('templates');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [addedTemplates, setAddedTemplates] = useState(new Set());
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

  const results = useMemo(() => runAutomations(rules, clients, checkIns), [rules, clients, checkIns]);
  const matchCountByRule = useMemo(() => results.reduce((acc, r) => {
    acc[r.rule.id] = (acc[r.rule.id] || 0) + 1;
    return acc;
  }, {}), [results]);

  const activeCount = rules.filter(r => r.is_active).length;
  const triggeredCount = results.length;

  const handleSave = async (form) => {
    if (editingRule?.id && !editingRule?._isTemplate) {
      await updateMutation.mutateAsync({ id: editingRule.id, data: form });
      toast.success('Rule updated');
    } else {
      await createMutation.mutateAsync(form);
      toast.success('Rule created');
    }
    setEditingRule(null);
  };

  const handleAddTemplate = async (template) => {
    const { icon, color, ...ruleData } = template;
    await createMutation.mutateAsync({ ...ruleData, is_active: true });
    setAddedTemplates(s => new Set([...s, template.name]));
    toast.success(`"${template.name}" added!`);
  };

  const handleCustomize = (template) => {
    const { icon, color, ...ruleData } = template;
    setEditingRule({ ...ruleData, _isTemplate: true });
    setModalOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const TABS = [
    { key: 'templates', label: 'Templates' },
    { key: 'rules', label: `My Rules${rules.length > 0 ? ` (${rules.length})` : ''}` },
    { key: 'triggered', label: 'Triggered', badge: triggeredCount },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-[#1F2A44] flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" /> Automations
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">IF/THEN rules that run automatically across your clients</p>
        </div>
        <Button size="sm" onClick={() => { setEditingRule(null); setModalOpen(true); }} className="gap-1.5">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Active Rules', value: activeCount, color: 'text-emerald-600' },
          { label: 'Total Rules', value: rules.length, color: 'text-[#1F2A44]' },
          { label: 'Triggered Now', value: triggeredCount, color: triggeredCount > 0 ? 'text-red-500' : 'text-[#374151]' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#E7EAF3] rounded-xl p-3 text-center shadow-sm">
            <p className={cn('text-2xl font-bold font-heading tabular-nums', s.color)}>{s.value}</p>
            <p className="text-[11px] text-[#6B7280] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors',
              tab === t.key ? 'bg-white shadow-sm text-[#1F2A44]' : 'text-[#6B7280] hover:text-[#1F2A44]'
            )}
          >
            {t.label}
            {t.badge > 0 && (
              <span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Templates tab ── */}
      {tab === 'templates' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {AUTOMATION_TEMPLATES.map((t, i) => {
            const isAdded = addedTemplates.has(t.name) || rules.some(r => r.name === t.name);
            return (
              <TemplateCard
                key={i}
                template={t}
                isAdded={isAdded}
                onAdd={handleAddTemplate}
                onCustomize={handleCustomize}
              />
            );
          })}
        </div>
      )}

      {/* ── My Rules tab ── */}
      {tab === 'rules' && (
        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#F6F7FB] border border-[#E7EAF3] flex items-center justify-center">
                <Zap className="w-7 h-7 text-[#9CA3AF]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1F2A44]">No rules yet</p>
                <p className="text-xs text-[#6B7280] mt-1">Start with a template or create a custom rule</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTab('templates')} className="gap-1.5">
                Browse Templates
              </Button>
            </div>
          ) : (
            rules.map(rule => (
              <ActiveRuleCard
                key={rule.id}
                rule={rule}
                matchCount={matchCountByRule[rule.id] || 0}
                onToggle={(rule, val) => updateMutation.mutate({ id: rule.id, data: { is_active: val } })}
                onEdit={handleEdit}
                onDelete={(id) => { deleteMutation.mutate(id); toast.success('Rule deleted'); }}
              />
            ))
          )}
        </div>
      )}

      {/* ── Triggered tab ── */}
      {tab === 'triggered' && (
        <TriggeredPanel results={results} />
      )}

      <RuleFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingRule(null); }}
        onSave={handleSave}
        initial={editingRule?._isTemplate
          ? { ...editingRule, id: undefined, _isTemplate: undefined }
          : editingRule}
      />
    </div>
  );
}