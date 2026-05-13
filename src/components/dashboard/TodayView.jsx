import React, { useState } from 'react';
import { format } from 'date-fns';
import { Link2, Copy, Check, ExternalLink, Plus, UserPlus, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RunMyDayCenter from './RunMyDayCenter';
import RecommendationsWidget from './RecommendationsWidget';
import DashboardKPIs from './DashboardKPIs';

function OnboardingLinkBanner() {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/start`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(59,130,246,0.12)' }}>
        <Link2 className="w-3.5 h-3.5" style={{ color: '#3B82F6' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white">Client Onboarding Link</p>
        <p className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{link}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <a href="/start" target="_blank" rel="noopener noreferrer"
          className="p-1.5 rounded-md transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <button onClick={copy}
          className="p-1.5 rounded-md transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
          {copied
            ? <Check className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
            : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}

export default function TodayView({ clients, checkIns, messages, payments = [] }) {
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="max-w-4xl mx-auto px-5 py-8 sm:px-8 space-y-8 pb-24">

      {/* ── Header ─────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
            {greeting}, Coach 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {format(new Date(), 'EEEE, MMMM d')} · {clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active').length} active clients
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: '#3B82F6', color: '#fff' }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Client
          </button>
        </div>
      </div>

      {/* ── KPI Strip ──────────────────────────────── */}
      <DashboardKPIs clients={clients} checkIns={checkIns} payments={payments} />

      {/* ── Onboarding Link ────────────────────────── */}
      <OnboardingLinkBanner />

      {/* ── AI Command Center ──────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Action Center</h2>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
            AI Powered
          </span>
        </div>
        <RunMyDayCenter clients={clients} checkIns={checkIns} messages={messages} payments={payments} />
      </div>

      {/* ── Recommendations ────────────────────────── */}
      {checkIns.length > 0 && clients.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-white mb-4">AI Recommendations</h2>
          <RecommendationsWidget clients={clients} checkIns={checkIns} />
        </div>
      )}
    </div>
  );
}