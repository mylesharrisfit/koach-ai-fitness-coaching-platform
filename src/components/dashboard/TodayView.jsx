import React, { useState, useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { UserPlus, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import RunMyDayCenter from './RunMyDayCenter';
import { compositeAdherenceScore } from '@/lib/adherence';
import DashboardKPIs from './DashboardKPIs';
import TodaySchedule from './TodaySchedule';
import WeeklySnapshot from './WeeklySnapshot';
import FirstTimeBanner from './FirstTimeBanner';
import AIInsightsFeed from './AIInsightsFeed';
import BIDashboardCard from '@/components/business/bi/BIDashboardCard';

function ActionCenterSection({ clients, checkIns, messages, payments }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const totalUnresolved = useMemo(() => {
    let count = 0;
    const active = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    // missed check-ins (10+ days)
    active.forEach(c => {
      const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const days = cis[0] ? differenceInDays(new Date(), parseISO(cis[0].date)) : 999;
      if (days >= 10) count++;
    });
    // no program
    clients.forEach(c => {
      if (!c.assigned_program_id && (c.lifecycle_status || c.status) !== 'lead') count++;
    });
    // payments
    count += (payments || []).filter(p => p.status === 'failed' || p.status === 'pending').length;
    // low adherence
    clients.forEach(c => {
      const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (cis.length < 2) return;
      const score = compositeAdherenceScore(cis);
      if (score !== null && score < 65) count++;
    });
    // pending reviews
    count += checkIns.filter(ci => !ci.coach_responded && !ci.coach_notes && differenceInDays(new Date(), parseISO(ci.date)) <= 14).length;
    return count;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, checkIns, payments, refreshKey]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-foreground tracking-tight">Action Center</h2>
          {totalUnresolved > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              {totalUnresolved}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh action items"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground border border-border">
            <Zap className="w-2.5 h-2.5" /> AI
          </span>
        </div>
      </div>
      <RunMyDayCenter clients={clients} checkIns={checkIns} messages={messages} payments={payments} refreshKey={refreshKey} />
    </div>
  );
}

export default function TodayView({ clients, checkIns, messages, payments = [] }) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const activeCount = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active').length;

  // Count clients needing attention (stale check-in or low adherence). Drives
  // whether AI Insights is promoted above the informational sections.
  const flaggedCount = useMemo(() => {
    let n = 0;
    clients.forEach(c => {
      const active = c.status === 'active' || c.lifecycle_status === 'active';
      if (!active) return;
      const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const days = cis[0] ? differenceInDays(new Date(), parseISO(cis[0].date)) : 999;
      if (days >= 10) { n++; return; }
      if (cis.length >= 2) {
        const s = compositeAdherenceScore(cis);
        if (s !== null && s < 65) n++;
      }
    });
    return n;
  }, [clients, checkIns]);

  // Sections below Run My Day, ordered by unresolved signal (highest first),
  // stable within equal counts. Run My Day itself is always pinned to the top.
  const orderedSections = useMemo(() => {
    const secs = [
      { key: 'schedule', count: 0, node: <TodaySchedule clients={clients} /> },
      { key: 'insights', count: flaggedCount, node: clients.length > 0
          ? <AIInsightsFeed clients={clients} checkIns={checkIns} messages={messages} /> : null },
      { key: 'snapshot', count: 0, node: <WeeklySnapshot checkIns={checkIns} clients={clients} /> },
      { key: 'bi', count: 0, node: clients.length > 0 ? <BIDashboardCard /> : null },
    ].filter(s => s.node);
    return secs.map((s, i) => ({ ...s, i })).sort((a, b) => b.count - a.count || a.i - b.i);
  }, [clients, checkIns, messages, flaggedCount]);

  const [showBanner, setShowBanner] = useState(() => {
    return localStorage.getItem('koach_onboarding_complete') === '1' &&
           localStorage.getItem('koach_banner_dismissed') !== '1';
  });

  const dismissBanner = () => {
    localStorage.setItem('koach_banner_dismissed', '1');
    setShowBanner(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-4 sm:py-8 space-y-5 sm:space-y-7 pb-24">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 bg-sidebar rounded-xl p-4 sm:p-6">
        <div>
          <h1 className="text-base sm:text-xl font-semibold text-white" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, Coach
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'color-mix(in srgb, white 50%, transparent)' }}>
            {format(new Date(), 'EEE, MMM d')} · {activeCount} active client{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 border min-h-[44px]"
          style={{ background: 'color-mix(in srgb, white 10%, transparent)', color: 'var(--tc-sidebar-accent-foreground)', borderColor: 'color-mix(in srgb, white 20%, transparent)' }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      {/* ── First-Time Welcome Banner ───────────────── */}
      <AnimatePresence>
        {showBanner && <FirstTimeBanner onDismiss={dismissBanner} />}
      </AnimatePresence>

      {/* ── KPI Strip (context) ────────────────────── */}
      <DashboardKPIs clients={clients} checkIns={checkIns} payments={payments} />

      {/* ── Run My Day — pinned to the top of the actionable stack ── */}
      <ActionCenterSection clients={clients} checkIns={checkIns} messages={messages} payments={payments} />

      {/* ── Remaining sections, ordered by unresolved signal ── */}
      {orderedSections.map(s => (
        <React.Fragment key={s.key}>{s.node}</React.Fragment>
      ))}
    </div>
  );
}