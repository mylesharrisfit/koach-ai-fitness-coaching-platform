import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO } from 'date-fns';
import { Sparkles, RefreshCw, Dumbbell, MessageSquare, Trophy, TrendingUp, AlertTriangle, Target, X, ArrowRight } from 'lucide-react';
import { compositeAdherenceScore } from '@/lib/adherence';
import { cn } from '@/lib/utils';

// ── Insight type configs ──────────────────────────────────────────────────────
const INSIGHT_TYPES = {
  upgrade:    { icon: Dumbbell,       gradient: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '#bbf7d0', iconBg: '#16a34a', tag: 'Program Upgrade' },
  reengage:   { icon: MessageSquare,  gradient: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '#bfdbfe', iconBg: '#2563eb', tag: 'Re-engagement' },
  win:        { icon: Trophy,         gradient: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '#fde68a', iconBg: '#d97706', tag: 'Celebrate a Win' },
  upsell:     { icon: TrendingUp,     gradient: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '#ddd6fe', iconBg: '#7c3aed', tag: 'Upsell Opportunity' },
  at_risk:    { icon: AlertTriangle,  gradient: 'linear-gradient(135deg, #fff7ed, #ffedd5)', border: '#fed7aa', iconBg: '#ea580c', tag: 'At-Risk Alert' },
  goal_check: { icon: Target,         gradient: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)', border: '#bae6fd', iconBg: '#0284c7', tag: 'Goal Check-in Due' },
};

// ── Data-driven insight generators ───────────────────────────────────────────
function generateInsights(clients, checkIns, messages) {
  const insights = [];
  const now = new Date();

  // 1. Program upgrade ready — clients with 85%+ adherence and 2+ weeks of data
  const upgradeReady = clients.filter(c => {
    const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (cis.length < 4) return false;
    const score = compositeAdherenceScore(cis);
    return score !== null && score >= 85;
  });
  if (upgradeReady.length > 0) {
    const names = upgradeReady.slice(0, 3).map(c => c.name.split(' ')[0]);
    const rest = upgradeReady.length - names.length;
    const nameStr = names.join(', ') + (rest > 0 ? ` +${rest} more` : '');
    insights.push({
      id: 'upgrade',
      type: 'upgrade',
      headline: `${upgradeReady.length} client${upgradeReady.length > 1 ? 's' : ''} ready for a program upgrade`,
      body: `${nameStr} ${upgradeReady.length > 1 ? 'have' : 'has'} been crushing their program with 85%+ adherence for 2+ weeks. Time to level them up!`,
      actionLabel: 'Review Clients',
      actionPath: `/clients`,
    });
  }

  // 2. Re-engagement — active clients not messaged in 7+ days
  const notMessaged = clients.filter(c => {
    if (c.lifecycle_status !== 'active' && c.status !== 'active') return false;
    const lastMsg = messages
      ? messages.filter(m => m.client_id === c.id && m.sender === 'coach').sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0]
      : null;
    if (!lastMsg) return differenceInDays(now, new Date(c.created_date || now)) > 3;
    return differenceInDays(now, new Date(lastMsg.created_date)) >= 7;
  });
  if (notMessaged.length > 0) {
    const names = notMessaged.slice(0, 3).map(c => c.name.split(' ')[0]);
    const rest = notMessaged.length - names.length;
    insights.push({
      id: 'reengage',
      type: 'reengage',
      headline: `${notMessaged.length} client${notMessaged.length > 1 ? 's' : ''} haven't heard from you in 7+ days`,
      body: `${names.join(', ')}${rest > 0 ? ` and ${rest} more` : ''} may feel disconnected. A quick check-in message can boost retention significantly.`,
      actionLabel: 'Message Now',
      actionPath: `/messages`,
    });
  }

  // 3. Celebrate a win — clients who recently improved their adherence
  const winners = clients.filter(c => {
    const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (cis.length < 2) return false;
    const latest = cis[0];
    const prev = cis[1];
    const recentDays = differenceInDays(now, parseISO(latest.date));
    if (recentDays > 10) return false;
    const latestScore = ((latest.compliance_training || 0) + (latest.compliance_nutrition || 0)) / 2;
    const prevScore = ((prev.compliance_training || 0) + (prev.compliance_nutrition || 0)) / 2;
    return latestScore >= 85 && latestScore > prevScore + 10;
  });
  if (winners.length > 0) {
    const names = winners.slice(0, 3).map(c => c.name.split(' ')[0]);
    insights.push({
      id: 'win',
      type: 'win',
      headline: `${winners.length} client${winners.length > 1 ? 's' : ''} hit a new personal best this week 🏆`,
      body: `${names.join(', ')} ${winners.length > 1 ? 'have' : 'has'} shown significant improvement in their latest check-in. Send some encouragement to keep the momentum going!`,
      actionLabel: 'Send Congrats',
      actionPath: `/messages`,
    });
  }

  // 4. Upsell — leads in pipeline 14+ days with no conversion
  const staleleads = clients.filter(c => {
    if (c.lifecycle_status !== 'lead') return false;
    return differenceInDays(now, new Date(c.created_date || now)) >= 14;
  });
  if (staleleads.length > 0) {
    const names = staleleads.slice(0, 3).map(c => c.name.split(' ')[0]);
    insights.push({
      id: 'upsell',
      type: 'upsell',
      headline: `${staleleads.length} lead${staleleads.length > 1 ? 's' : ''} waiting for 2+ weeks`,
      body: `${names.join(', ')} ${staleleads.length > 1 ? 'have' : 'has'} been in your pipeline for 14+ days. A personalized outreach or limited-time offer could convert them now.`,
      actionLabel: 'View Leads',
      actionPath: `/clients?status=lead`,
    });
  }

  // 5. At-risk — clients with declining adherence trend
  const atRisk = clients.filter(c => {
    const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (cis.length < 3) return false;
    const scores = cis.slice(0, 3).map(ci => ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2);
    return scores[0] < scores[1] && scores[1] < scores[2] && scores[0] < 60;
  });
  if (atRisk.length > 0) {
    const names = atRisk.slice(0, 3).map(c => c.name.split(' ')[0]);
    insights.push({
      id: 'at_risk',
      type: 'at_risk',
      headline: `${atRisk.length} client${atRisk.length > 1 ? 's' : ''} showing a declining trend`,
      body: `${names.join(', ')} ${atRisk.length > 1 ? 'have' : 'has'} had 3 consecutive weeks of declining compliance. Proactive outreach now could prevent them from churning.`,
      actionLabel: 'View At-Risk',
      actionPath: `/at-risk`,
    });
  }

  // 6. Goal check-in — clients who started 30+ days ago with no recent check-in
  const goalCheck = clients.filter(c => {
    if (!c.start_date) return false;
    const daysSinceStart = differenceInDays(now, parseISO(c.start_date));
    if (daysSinceStart < 28 || daysSinceStart % 30 > 5) return false;
    const cis = checkIns.filter(ci => ci.client_id === c.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastCi = cis[0];
    if (!lastCi) return true;
    return differenceInDays(now, parseISO(lastCi.date)) > 7;
  });
  if (goalCheck.length > 0) {
    const names = goalCheck.slice(0, 3).map(c => c.name.split(' ')[0]);
    insights.push({
      id: 'goal_check',
      type: 'goal_check',
      headline: `${goalCheck.length} client${goalCheck.length > 1 ? 's' : ''} due for a goal review`,
      body: `${names.join(', ')} ${goalCheck.length > 1 ? 'are' : 'is'} approaching a program milestone. A quick goal review keeps clients motivated and shows you care beyond the workouts.`,
      actionLabel: 'Review Goals',
      actionPath: `/clients`,
    });
  }

  return insights;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 animate-pulse"
      style={{ background: '#f9fafb', border: '1px solid #f3f4f6' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl bg-gray-200" />
        <div className="h-3.5 bg-gray-200 rounded w-20" />
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-full" />
        <div className="h-3 bg-gray-200 rounded w-5/6" />
      </div>
      <div className="h-8 bg-gray-200 rounded-lg w-28 mt-1" />
    </div>
  );
}

// ── Single insight card ───────────────────────────────────────────────────────
function InsightCard({ insight, onDismiss }) {
  const navigate = useNavigate();
  const cfg = INSIGHT_TYPES[insight.type];
  const Icon = cfg.icon;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3.5 transition-all hover:shadow-md"
      style={{
        background: cfg.gradient,
        border: `1px solid ${cfg.border}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top row: icon + tag + dismiss */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: cfg.iconBg }}>
            <Icon className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: cfg.iconBg }}>
            {cfg.tag}
          </span>
        </div>
        <button
          onClick={() => onDismiss(insight.id)}
          className="p-1 rounded-md opacity-40 hover:opacity-80 transition-opacity shrink-0 -mt-0.5 -mr-0.5"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Headline + body */}
      <div>
        <p className="text-sm font-bold text-gray-900 leading-snug">{insight.headline}</p>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{insight.body}</p>
      </div>

      {/* Action */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <button
          onClick={() => navigate(insight.actionPath)}
          className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
          style={{ background: cfg.iconBg, color: '#fff' }}
        >
          {insight.actionLabel}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIInsights({ clients = [], checkIns = [], messages = [] }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [dismissed, setDismissed] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const allInsights = useMemo(
    () => generateInsights(clients, checkIns, messages),
    [clients, checkIns, messages, refreshKey] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const visible = useMemo(
    () => allInsights.filter(i => !dismissed.has(i.id)).slice(0, 3),
    [allInsights, dismissed]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setDismissed(new Set());
    setTimeout(() => {
      setRefreshKey(k => k + 1);
      setIsRefreshing(false);
    }, 900);
  }, []);

  const handleDismiss = useCallback((id) => {
    setDismissed(prev => new Set([...prev, id]));
  }, []);

  const notEnoughData = clients.length < 2;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: '#8b5cf6' }} />
            <h2 className="text-sm font-bold text-gray-900 tracking-tight">AI Insights</h2>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Personalized recommendations based on your client data</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:bg-gray-50 shrink-0 disabled:opacity-60"
          style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
          Refresh Insights
        </button>
      </div>

      {/* Cards grid */}
      {isRefreshing ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : notEnoughData ? (
        <div className="rounded-2xl px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', border: '1px solid #ddd6fe' }}>
          <Sparkles className="w-8 h-8 mx-auto mb-3" style={{ color: '#8b5cf6', opacity: 0.5 }} />
          <p className="text-sm font-semibold text-gray-700">Add more clients and check back soon</p>
          <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto">
            AI Insights get smarter as your roster grows — start by adding clients and collecting check-ins.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl px-6 py-8 text-center"
          style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0' }}>
          <div className="text-3xl mb-2">✅</div>
          <p className="text-sm font-semibold text-gray-700">No new insights right now</p>
          <p className="text-xs text-gray-400 mt-1.5">
            Your clients are looking great! Check back after more check-ins come in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {visible.map(insight => (
            <InsightCard key={insight.id} insight={insight} onDismiss={handleDismiss} />
          ))}
        </div>
      )}
    </div>
  );
}