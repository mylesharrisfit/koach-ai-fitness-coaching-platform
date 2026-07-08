import React, { useMemo, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { Dumbbell, TrendingUp, Clock, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import NoProgramPanel from '@/components/clients/NoProgramPanel';
import QuickMessageModal from '@/components/clients/QuickMessageModal';

const DISMISS_PREFIX = 'insight_dismiss_';

function getDismissedUntil(key) {
  try { const raw = localStorage.getItem(DISMISS_PREFIX + key); return raw ? parseInt(raw, 10) : null; }
  catch { return null; }
}
function dismissFor24h(key) {
  try { localStorage.setItem(DISMISS_PREFIX + key, String(Date.now() + 24 * 3600 * 1000)); } catch {}
}
function isDismissed(key) {
  const until = getDismissedUntil(key);
  return until ? Date.now() < until : false;
}

function InsightCard({ icon: Icon, label, sub, actions, onDismiss }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-3 min-w-0">
      <div className="w-7 h-7 rounded-lg bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#111827] leading-tight">{label}</p>
        {sub && <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {actions}
        <button
          onClick={onDismiss}
          className="w-6 h-6 flex items-center justify-center rounded text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function IntelligenceBar({ clients = [], checkIns = [] }) {
  const [dismissed, setDismissed] = useState(() => new Set(['no_program', 'inactive', 'progression'].filter(isDismissed)));
  const [showNoProgramPanel, setShowNoProgramPanel] = useState(false);
  const [showInactiveMessage, setShowInactiveMessage] = useState(false);

  const dismiss = (key) => { dismissFor24h(key); setDismissed(s => new Set([...s, key])); };

  const checkInMap = useMemo(() => {
    const map = {};
    checkIns.forEach(ci => { if (!map[ci.client_id]) map[ci.client_id] = []; map[ci.client_id].push(ci); });
    return map;
  }, [checkIns]);

  const activeClients = useMemo(() => clients.filter(c => (c.lifecycle_status || 'active') === 'active'), [clients]);

  const noProgram = useMemo(() => activeClients.filter(c => !c.assigned_program_id), [activeClients]);

  const inactive = useMemo(() => activeClients.filter(c => {
    const cis = checkInMap[c.id] || [];
    if (!cis.length) return true;
    const lastDate = cis.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
    return differenceInDays(new Date(), parseISO(lastDate)) >= 14;
  }), [activeClients, checkInMap]);

  const readyForProgression = useMemo(() => activeClients.filter(c => {
    const cis = checkInMap[c.id] || [];
    if (cis.length < 4) return false;
    const score = compositeAdherenceScore(cis);
    return score !== null && score >= 80;
  }), [activeClients, checkInMap]);

  const insights = [
    {
      key: 'no_program',
      show: noProgram.length > 0,
      icon: Dumbbell,
      label: `${noProgram.length} client${noProgram.length > 1 ? 's' : ''} without a program`,
      sub: noProgram.slice(0, 2).map(c => c.name).join(', ') + (noProgram.length > 2 ? ` +${noProgram.length - 2} more` : ''),
      actions: (
        <button
          onClick={() => setShowNoProgramPanel(true)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Dumbbell className="w-3 h-3" /> Assign
        </button>
      ),
    },
    {
      key: 'inactive',
      show: inactive.length > 0,
      icon: Clock,
      label: `${inactive.length} inactive client${inactive.length > 1 ? 's' : ''}`,
      sub: inactive.slice(0, 2).map(c => c.name).join(', ') + (inactive.length > 2 ? ` +${inactive.length - 2} more` : '') + ' — no check-in in 14+ days',
      actions: (
        <button
          onClick={() => setShowInactiveMessage(true)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#374151] bg-[#F3F4F6] hover:bg-[#E5E7EB] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Message <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
    {
      key: 'progression',
      show: readyForProgression.length > 0,
      icon: TrendingUp,
      label: `${readyForProgression.length} client${readyForProgression.length > 1 ? 's' : ''} ready for progression`,
      sub: readyForProgression.slice(0, 2).map(c => c.name).join(', ') + (readyForProgression.length > 2 ? ` +${readyForProgression.length - 2} more` : '') + ' — 80%+ adherence',
      actions: null,
    },
  ];

  const visible = insights.filter(i => i.show && !dismissed.has(i.key));

  return (
    <>
      <div className="px-5 pt-3 flex-shrink-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-[#9CA3AF] mb-2">Insights</p>

        {visible.length === 0 ? (
          <div className="flex items-center gap-2.5 bg-white border border-[#E5E7EB] rounded-xl px-3.5 py-3">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <p className="text-xs font-medium text-[#374151]">All clients are on track</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(insight => (
              <InsightCard key={insight.key} {...insight} onDismiss={() => dismiss(insight.key)} />
            ))}
          </div>
        )}
      </div>

      {showNoProgramPanel && <NoProgramPanel clients={noProgram} onClose={() => setShowNoProgramPanel(false)} />}
      {showInactiveMessage && (
        <QuickMessageModal
          clients={inactive}
          suggestedTemplate="Hey [First Name], just checking in — how are things going?"
          onClose={() => setShowInactiveMessage(false)}
        />
      )}
    </>
  );
}