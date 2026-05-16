import React, { useMemo, useState, useCallback } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, TrendingUp, Clock, X, Sparkles, ChevronRight, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NoProgramPanel from './NoProgramPanel';
import BulkMessagePanel from './BulkMessagePanel';

/* ── 24-hour dismiss helpers ── */
const DISMISS_KEY = 'insight_dismissed_at';

function getDismissed() {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}'); } catch { return {}; }
}

function dismissInsight(key) {
  const d = getDismissed();
  d[key] = Date.now();
  localStorage.setItem(DISMISS_KEY, JSON.stringify(d));
}

function isDismissed(key) {
  const d = getDismissed();
  if (!d[key]) return false;
  return (Date.now() - d[key]) < 24 * 60 * 60 * 1000; // 24 hours
}

/* ── Urgency border map ── */
const URGENCY_BORDER = {
  critical: 'border-l-4 border-l-red-400',
  warning:  'border-l-4 border-l-orange-400',
  info:     'border-l-4 border-l-blue-400',
  success:  'border-l-4 border-l-emerald-400',
};

/* ── Single insight card ── */
function InsightCard({ icon: Icon, color, label, sub, actions, urgency, onDismiss }) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-white border border-[#E7EAF3] rounded-xl px-3.5 py-3 min-w-0',
      URGENCY_BORDER[urgency] || URGENCY_BORDER.info
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
          title="Dismiss for 24 hours"
          className="w-6 h-6 flex items-center justify-center rounded-lg text-[#C4C9D4] hover:text-[#6B7280] hover:bg-[#F6F7FB] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function IntelligenceBar({ clients = [], checkIns = [] }) {
  const navigate = useNavigate();
  // Use a tick counter to force re-render when dismiss state changes
  const [dismissTick, setDismissTick] = useState(0);
  const [showNoProgramPanel, setShowNoProgramPanel] = useState(false);
  const [showMessagePanel, setShowMessagePanel] = useState(false);

  const handleDismiss = useCallback((key) => {
    dismissInsight(key);
    setDismissTick(t => t + 1);
  }, []);

  // Build check-in map
  const checkInMap = useMemo(() => {
    const map = {};
    checkIns.forEach(ci => {
      if (!map[ci.client_id]) map[ci.client_id] = [];
      map[ci.client_id].push(ci);
    });
    return map;
  }, [checkIns]);

  const activeClients = useMemo(
    () => clients.filter(c => (c.lifecycle_status || 'active') === 'active'),
    [clients]
  );

  // 1. Clients without a program
  const noProgram = useMemo(
    () => activeClients.filter(c => !c.assigned_program_id),
    [activeClients]
  );

  // 2. Inactive clients (no check-in in 14+ days)
  const inactive = useMemo(
    () => activeClients.filter(c => {
      const cis = checkInMap[c.id] || [];
      if (!cis.length) return true;
      const lastDate = [...cis].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date;
      return differenceInDays(new Date(), parseISO(lastDate)) >= 14;
    }),
    [activeClients, checkInMap]
  );

  // 3. Ready for progression (80%+ adherence, 4+ check-ins)
  const readyForProgression = useMemo(
    () => activeClients.filter(c => {
      const cis = checkInMap[c.id] || [];
      if (cis.length < 4) return false;
      const score = compositeAdherenceScore(cis);
      return score !== null && score >= 80;
    }),
    [activeClients, checkInMap]
  );

  const insights = useMemo(() => [
    {
      key: 'no_program',
      show: noProgram.length > 0,
      urgency: 'warning',
      icon: Dumbbell,
      color: { bg: 'bg-blue-50', icon: 'text-blue-600' },
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
      urgency: inactive.length >= 3 ? 'critical' : 'warning',
      icon: Clock,
      color: { bg: 'bg-amber-50', icon: 'text-amber-600' },
      label: `${inactive.length} inactive client${inactive.length > 1 ? 's' : ''}`,
      sub: inactive.slice(0, 2).map(c => c.name).join(', ') + (inactive.length > 2 ? ` +${inactive.length - 2} more` : '') + ' — no check-in in 14+ days',
      actions: (
        <button
          onClick={() => setShowMessagePanel(true)}
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
      color: { bg: 'bg-emerald-50', icon: 'text-emerald-600' },
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [noProgram, inactive, readyForProgression, navigate]);

  // Only show insights that have data AND are not dismissed
  // dismissTick ensures we re-evaluate after dismissing
  const visible = useMemo(
    () => insights.filter(i => i.show && !isDismissed(i.key)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insights, dismissTick]
  );

  // Show section header if there are any active insights (even all dismissed → show green)
  const hasAnyIssues = insights.some(i => i.show);

  return (
    <>
      <div className="px-5 pt-3 flex-shrink-0">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">Insights</span>
        </div>

        {visible.length === 0 ? (
          /* All on track */
          <div className="flex items-center gap-2.5 bg-white border border-[#E7EAF3] rounded-xl px-3.5 py-3 border-l-4 border-l-emerald-400">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#1F2A44]">All clients are on track</p>
              <p className="text-[11px] text-[#6B7280]">No action items right now — great work!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map(insight => (
              <InsightCard
                key={insight.key}
                icon={insight.icon}
                color={insight.color}
                urgency={insight.urgency}
                label={insight.label}
                sub={insight.sub}
                actions={insight.actions}
                onDismiss={() => handleDismiss(insight.key)}
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

      {showMessagePanel && (
        <BulkMessagePanel
          clients={inactive}
          onClose={() => setShowMessagePanel(false)}
          onSent={() => handleDismiss('inactive')}
        />
      )}
    </>
  );
}