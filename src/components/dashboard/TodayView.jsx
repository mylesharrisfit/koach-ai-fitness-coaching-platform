import React, { useState, useMemo } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Link2, Copy, Check, ExternalLink, UserPlus, RefreshCw, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import RunMyDayCenter from './RunMyDayCenter';
import { compositeAdherenceScore } from '@/lib/adherence';
import RecommendationsWidget from './RecommendationsWidget';
import DashboardKPIs from './DashboardKPIs';
import TodaySchedule from './TodaySchedule';
import WeeklySnapshot from './WeeklySnapshot';
import FirstTimeBanner from './FirstTimeBanner';

function OnboardingLinkBanner() {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/start`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: '#DBEAFE' }}>
        <Link2 className="w-3.5 h-3.5 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-blue-900">Client Onboarding Link</p>
        <p className="text-[11px] truncate mt-0.5 text-blue-600">{link}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a href="/start" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-md transition-colors hover:bg-blue-100"
          style={{ color: '#2563EB' }}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={copy}
          className="p-1.5 rounded-md transition-colors hover:bg-blue-100"
          style={{ color: '#2563EB' }}>
          {copied
            ? <Check className="w-3.5 h-3.5 text-green-600" />
            : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

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
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">Action Center</h2>
          {totalUnresolved > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              {totalUnresolved}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey(k => k + 1)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            title="Refresh action items"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#EFF6FF', color: '#3B82F6' }}>
            <Zap className="w-2.5 h-2.5" /> AI Powered
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

  const [showBanner, setShowBanner] = useState(() => {
    return localStorage.getItem('koach_onboarding_complete') === '1' &&
           localStorage.getItem('koach_banner_dismissed') !== '1';
  });

  const dismissBanner = () => {
    localStorage.setItem('koach_banner_dismissed', '1');
    setShowBanner(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 sm:px-8 space-y-7 pb-24">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, Coach 👋
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            {format(new Date(), 'EEEE, MMMM d')} · {activeCount} active client{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/clients')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 shadow-sm"
          style={{ background: '#3B82F6', color: '#fff' }}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Client
        </button>
      </div>

      {/* ── First-Time Welcome Banner ───────────────── */}
      <AnimatePresence>
        {showBanner && <FirstTimeBanner onDismiss={dismissBanner} />}
      </AnimatePresence>

      {/* ── KPI Strip ──────────────────────────────── */}
      <DashboardKPIs clients={clients} checkIns={checkIns} payments={payments} />

      {/* ── Today's Schedule ───────────────────────── */}
      <TodaySchedule clients={clients} />

      {/* ── Weekly Snapshot ─────────────────────────── */}
      <WeeklySnapshot checkIns={checkIns} clients={clients} />

      {/* ── Onboarding Link ────────────────────────── */}
      <OnboardingLinkBanner />

      {/* ── Action Center ──────────────────────────── */}
      <ActionCenterSection clients={clients} checkIns={checkIns} messages={messages} payments={payments} />

      {/* ── AI Recommendations ─────────────────────── */}
      {checkIns.length > 0 && clients.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight mb-4">AI Recommendations</h2>
          <RecommendationsWidget clients={clients} checkIns={checkIns} />
        </div>
      )}
    </div>
  );
}