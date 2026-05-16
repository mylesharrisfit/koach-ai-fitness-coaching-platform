import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { Dumbbell, TrendingUp, Clock, X, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import NoProgramPanel from '@/components/clients/NoProgramPanel';
import QuickMessageModal from '@/components/clients/QuickMessageModal';

const DISMISS_PREFIX = 'insight_dismiss_';

function getDismissedUntil(key) {
  try {
    const raw = localStorage.getItem(DISMISS_PREFIX + key);
    if (!raw) return null;
    return parseInt(raw, 10);
  } catch { return null; }
}

function dismissFor24h(key) {
  try {
    localStorage.setItem(DISMISS_PREFIX + key, String(Date.now() + 24 * 3600 * 1000));
  } catch {}
}

function isDismissed(key) {
  const until = getDismissedUntil(key);
  if (!until) return false;
  return Date.now() < until;
}

/* ── Single insight card ── */
function InsightCard({ urgency = 'info', icon: Icon, color, label, sub, actions, onDismiss }) {
  const leftBorder = {
    info: 'border-l-blue-400',
    warning: 'border-l-orange-400',
    critical: 'border-l-red-500',
  }[urgency] ?? 'border-l-blue-400';

  return (
    <div className={cn(
      'flex items-center gap-3 bg-white border border-l-4 rounded-xl px-3.5 py-3 min-w-0',
      leftBorder,
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
        <button
          onClick={onDismiss}
          title="Hide for 24 hours"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-[#6B7280] hover:bg-[#F6F7FB] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Main component ── */
export default function IntelligenceBar({ clients = [], checkIns = [] }) {
  const [dismissed, setDismissed] = useState(() => {
    // Initialize from localStorage
    const keys = ['no_program', 'inactive', 'progression'];
    return new Set(keys.filter(isDismissed));
  });
  const [showNoProgramPanel, setShowNoProgramPanel] = useState(false);
  const [showInactiveMessage, setShowInactiveMessage] = useState(false);

  const dismiss = (key) => {
    dismissFor24h(key);
    setDismissed(s => new Set([...s, key]));
  };

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

  const noProgram = useMemo(() =>
    activeClients.filter(c => !c.assigned_program_id),
    [activeClients]
  );

  const inactive = useMemo(() =>
    activeClients.filter(c => {
      const cis = checkInMap[c.id] || [];
      if (!cis.length) return true;
      const lastDate = cis.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
      return differenceInDays(new Date(), parseISO(lastDate)) >= 14;
    }),
    [activeClients, checkInMap]
  );

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
      urgency: 'warning',
      icon: Dumbbell,
      color: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
      label: `${noProgram.length} client${noProgram.length > 1 ? 's' : ''} without a program`,
      sub: noProgram.slice(0, 2).map(c => c.name).join(', ') + (noProgram.length > 2 ? ` +${noProgram.length - 2} more` : ''),
      actions: (
        <button
          onClick={() => setShowNoProgramPanel(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          <Dumbbell className="w-3 h-3" /> Assign
        </button>
      ),
    },
    {
      key: 'inactive',
      show: inactive.length > 0,
      urgency: 'warning',
      icon: Clock,
      color: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
      label: `${inactive.length} inactive client${inactive.length > 1 ? 's' : ''}`,
      sub: inactive.slice(0, 2).map(c => c.name).join(', ') + (inactive.length > 2 ? ` +${inactive.length - 2} more` : '') + ' — no check-in in 14+ days',
      actions: (
        <button
          onClick={() => setShowInactiveMessage(true)}
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
        >
          Message <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
    {
      key: 'progression',
      show: readyForProgression.length > 0,
      urgency: 'info',
      icon: TrendingUp,
      color: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
      label: `${readyForProgression.length} client${readyForProgression.length > 1 ? 's' : ''} ready for progression`,
      sub: readyForProgression.slice(0, 2).map(c => c.name).join(', ') + (readyForProgression.length > 2 ? ` +${readyForProgression.length - 2} more` : '') + ' — 80%+ adherence',
      actions: null,
    },
  ];

  const visible = insights.filter(i => i.show && !dismissed.has(i.key));

  return (
    <>
      <div className="px-5 pt-3 flex-shrink-0">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Insights</span>
        </div>

        {visible.length === 0 ? (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[12px] font-semibold text-emerald-700">All clients are on track — great work! 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(insight => (
              <InsightCard
                key={insight.key}
                urgency={insight.urgency}
                icon={insight.icon}
                color={insight.color}
                label={insight.label}
                sub={insight.sub}
                actions={insight.actions}
                onDismiss={() => dismiss(insight.key)}
              />
            ))}
          </div>
        )}
      </div>

      {showNoProgramPanel && (
        <NoProgramPanel
          clients={noProgram}
          onClose={() => setShowNoProgramPanel(false)}
        />
      )}

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