import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Supabase-forward: this surface reads plan_versions and calls the planMutations
// edge function directly on Supabase (the closed-loop backend lives there). It
// activates once the app is on Supabase auth/data (VITE_AUTH_PROVIDER=supabase);
// the sidebar link is gated on that so it stays hidden on the Base44 shell.
import { supabase } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, XCircle, Sparkles, ClipboardCheck, Utensils, Dumbbell, Loader2 } from 'lucide-react';

const SOURCE_LABEL = {
  ai_adaptation: 'AI adaptation',
  coach_command: 'Coach command',
  manual_edit: 'Manual edit',
};

/** Turn a structured PlanDiff into readable before → after lines. */
function diffLines(diff) {
  const out = [];
  for (const [k, c] of Object.entries(diff?.fields ?? {})) {
    out.push(`${k.replace(/_/g, ' ')}: ${c?.before ?? '—'} → ${c?.after ?? '—'}`);
  }
  for (const m of diff?.meals ?? []) out.push(`meal ${m.op}${m.after?.name ? ` → ${m.after.name}` : ''}`);
  for (const w of diff?.workouts ?? []) out.push(`day ${w.day_number} ${w.op}${w.after?.day_name ? ` → ${w.after.day_name}` : ''}`);
  return out;
}

function ProposalCard({ version, clientName, onDecision, pending }) {
  const KindIcon = version.plan_kind === 'workout' ? Dumbbell : Utensils;
  const lines = diffLines(version.diff);
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-ai/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-ai" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-foreground">{clientName || 'Client'}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-primary border border-primary/30">
                <KindIcon className="w-3 h-3" /> {version.plan_kind}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {SOURCE_LABEL[version.source] || version.source}
              </span>
            </div>
            {version.rationale && <p className="text-xs text-muted-foreground mt-1">{version.rationale}</p>}
            {version.created_at && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {format(parseISO(version.created_at), 'MMM d, h:mm a')}
              </p>
            )}
          </div>
        </div>

        {/* Diff */}
        <div className="mt-3 rounded-xl border border-border bg-background p-3 space-y-1">
          {lines.length ? lines.map((l, i) => (
            <p key={i} className="text-xs font-mono text-foreground">{l}</p>
          )) : <p className="text-xs text-muted-foreground">No structured changes</p>}
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 gap-1.5" disabled={pending}
            onClick={() => onDecision(version, 'approve')}>
            <CheckCircle2 className="w-4 h-4" /> Approve
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" disabled={pending}
            onClick={() => onDecision(version, 'reject')}>
            <XCircle className="w-4 h-4" /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PlanApprovals() {
  const qc = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['plan-versions', 'pending'],
    queryFn: () => supabase.entities.PlanVersion.filter({ status: 'pending_approval' }),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => supabase.entities.Client.list('name'),
  });

  const clientName = useMemo(() => {
    const map = {};
    for (const c of clients) map[c.id] = c.name;
    return map;
  }, [clients]);

  const sorted = useMemo(
    () => [...versions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [versions],
  );

  const decide = useMutation({
    mutationFn: ({ version, action }) =>
      supabase.functions.invoke('planMutations', { action, version_id: version.id }),
    onSuccess: (_res, { action }) => {
      qc.invalidateQueries({ queryKey: ['plan-versions'] });
      qc.invalidateQueries({ queryKey: ['nutrition-plans'] });
      qc.invalidateQueries({ queryKey: ['programs'] });
      toast.success(action === 'approve' ? 'Change applied' : 'Proposal rejected');
    },
    onError: (err) => toast.error(err?.message || 'Action failed'),
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="rounded-2xl p-4 sm:p-5 mb-5"
        style={{ background: 'var(--tc-sidebar)', border: '1px solid color-mix(in srgb, white 7%, transparent)' }}>
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-white/80" />
          <h1 className="text-xl font-bold text-white">Plan Approvals</h1>
        </div>
        <p className="text-xs mt-1 text-white/50">
          AI-proposed plan changes waiting for your review. Approving applies the change to the client's plan.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <CheckCircle2 className="w-14 h-14 text-success opacity-60" />
          <p className="font-semibold text-sm">No pending proposals</p>
          <p className="text-xs text-muted-foreground">AI adaptations awaiting review will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((v) => (
            <ProposalCard key={v.id} version={v} clientName={clientName[v.client_id]}
              onDecision={(version, action) => decide.mutate({ version, action })}
              pending={decide.isPending} />
          ))}
        </div>
      )}
    </div>
  );
}
