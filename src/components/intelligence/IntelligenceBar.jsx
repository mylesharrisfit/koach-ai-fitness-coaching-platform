import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import {
  Dumbbell, TrendingUp, Clock, ArrowRight, X, Sparkles, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/* ── Quick-assign program modal ── */
function QuickAssignModal({ client, onClose }) {
  const [selected, setSelected] = useState('');
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: () => base44.entities.WorkoutProgram.list('-created_date', 20),
  });

  const assignMutation = useMutation({
    mutationFn: () => base44.entities.Client.update(client.id, { assigned_program_id: selected }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success(`Program assigned to ${client.name}`);
      onClose();
    },
  });

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-[#E7EAF3]">
          <DialogTitle className="text-base font-bold text-[#1F2A44]">Assign Program</DialogTitle>
          <p className="text-xs text-[#6B7280] mt-0.5">Assign a program to <strong>{client.name}</strong></p>
        </div>
        <div className="p-4 space-y-3">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="border-[#E7EAF3] bg-[#F6F7FB]">
              <SelectValue placeholder="Choose a program…" />
            </SelectTrigger>
            <SelectContent>
              {programs.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 text-xs border-[#E7EAF3]" onClick={onClose}>Cancel</Button>
            <Button className="flex-1 text-xs" disabled={!selected || assignMutation.isPending}
              onClick={() => assignMutation.mutate()}>
              {assignMutation.isPending ? 'Assigning…' : 'Assign'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Single insight chip ── */
function InsightCard({ icon: Icon, color, label, value, sub, actions, dimissed, onDismiss }) {
  if (dimissed) return null;
  return (
    <div className={cn(
      'flex items-center gap-3 bg-white border rounded-xl px-3.5 py-3 min-w-0',
      color.border
    )}>
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', color.bg)}>
        <Icon className={cn('w-4 h-4', color.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-bold text-[#1F2A44] leading-tight">{label}</p>
        {sub && <p className="text-[11px] text-[#6B7280] mt-0.5 truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {actions}
        <button onClick={onDismiss}
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-[#6B7280] hover:bg-[#F6F7FB] transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function IntelligenceBar({ clients = [], checkIns = [] }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(new Set());
  const [assignTarget, setAssignTarget] = useState(null);

  const dismiss = (key) => setDismissed(s => new Set([...s, key]));

  // Build check-in map
  const checkInMap = useMemo(() => {
    const map = {};
    checkIns.forEach(ci => {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    });
    return map;
  }, [checkIns]);

  const activeClients = useMemo(() => clients.filter(c => (c.lifecycle_status || 'active') === 'active'), [clients]);

  // 1. Clients without a program assigned
  const noProgram = useMemo(() =>
    activeClients.filter(c => !c.assigned_program_id),
    [activeClients]
  );

  // 2. Inactive clients (no check-in in 14+ days, but they are active)
  const inactive = useMemo(() =>
    activeClients.filter(c => {
      const cis = checkInMap[c.id] || [];
      if (!cis.length) return true;
      const lastDate = cis.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
      return differenceInDays(new Date(), parseISO(lastDate)) >= 14;
    }),
    [activeClients, checkInMap]
  );

  // 3. Ready for progression (adherence >= 80 for 4+ check-ins)
  const readyForProgression = useMemo(() =>
    activeClients.filter(c => {
      const cis = checkInMap[c.id] || [];
      if (cis.length < 4) return false;
      const score = compositeAdherenceScore(cis);
      return score !== null && score >= 80;
    }),
    [activeClients, checkInMap]
  );

  const insights = [
    {
      key: 'no_program',
      show: noProgram.length > 0,
      icon: Dumbbell,
      color: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
      label: `${noProgram.length} client${noProgram.length > 1 ? 's' : ''} without a program`,
      sub: noProgram.slice(0, 2).map(c => c.name).join(', ') + (noProgram.length > 2 ? ` +${noProgram.length - 2} more` : ''),
      actions: (
        <button
          onClick={() => setAssignTarget(noProgram[0])}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Dumbbell className="w-3 h-3" /> Assign
        </button>
      ),
    },
    {
      key: 'inactive',
      show: inactive.length > 0,
      icon: Clock,
      color: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
      label: `${inactive.length} inactive client${inactive.length > 1 ? 's' : ''}`,
      sub: inactive.slice(0, 2).map(c => c.name).join(', ') + (inactive.length > 2 ? ` +${inactive.length - 2} more` : '') + ' — no check-in in 14+ days',
      actions: (
        <button
          onClick={() => navigate('/messages')}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Message <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
    {
      key: 'progression',
      show: readyForProgression.length > 0,
      icon: TrendingUp,
      color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
      label: `${readyForProgression.length} client${readyForProgression.length > 1 ? 's' : ''} ready for progression`,
      sub: readyForProgression.slice(0, 2).map(c => c.name).join(', ') + (readyForProgression.length > 2 ? ` +${readyForProgression.length - 2} more` : '') + ' — 80%+ adherence',
      actions: (
        <button
          onClick={() => navigate(`/client-profile?id=${readyForProgression[0].id}`)}
          className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Review <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  const visible = insights.filter(i => i.show && !dismissed.has(i.key));
  if (visible.length === 0) return null;

  return (
    <>
      <div className="px-5 pt-3 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Insights</span>
        </div>

        {/* Insight cards */}
        <div className="space-y-2">
          {visible.map(insight => (
            <InsightCard
              key={insight.key}
              icon={insight.icon}
              color={insight.color}
              label={insight.label}
              sub={insight.sub}
              actions={insight.actions}
              onDismiss={() => dismiss(insight.key)}
            />
          ))}
        </div>
      </div>

      {/* Quick assign modal */}
      {assignTarget && (
        <QuickAssignModal client={assignTarget} onClose={() => setAssignTarget(null)} />
      )}
    </>
  );
}