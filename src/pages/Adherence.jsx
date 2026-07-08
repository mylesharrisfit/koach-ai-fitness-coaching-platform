import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { subWeeks, parseISO } from 'date-fns';
import { Trophy, Zap, AlertTriangle, Crown, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AdherencePanel from '../components/adherence/AdherencePanel';
import BadgeCard from '../components/adherence/BadgeCard';
import BadgeUnlockToast from '../components/adherence/BadgeUnlockToast';
import AdherenceTable from '../components/adherence/AdherenceTable';
import AdherenceTrends from '../components/adherence/AdherenceTrends';
import AdherenceDetailDrawer from '../components/adherence/AdherenceDetailDrawer';
import AdherenceLeaderboard from '../components/adherence/AdherenceLeaderboard';
import { averageAdherenceScore, calculateStreak, checkInScore } from '@/lib/adherence';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { runAutoAwardForClient } from '@/lib/autoAward';
import { showAchievementToast } from '@/components/achievements/AchievementToast';
import { cn } from '@/lib/utils';
import { sendZapierEvent } from '@/lib/zapier';

const DATE_RANGES = [
  { label: 'This Week', weeks: 1 },
  { label: 'Last 30 Days', weeks: 4 },
  { label: 'Last 90 Days', weeks: 13 },
];

const TIER_FILTERS = ['All', 'bronze', 'silver', 'gold', 'platinum', 'elite'];
const CATEGORY_FILTERS = ['All', 'Milestones', 'Check-ins', 'Streaks', 'Compliance', 'Nutrition', 'Recovery', 'Mindset', 'Transformation', 'Performance', 'Special'];

const TIER_TAB_STYLES = {
  bronze:   { active: 'background:#CD7F32; color:#1A0F00; border-color:#CD7F32', dot: '#CD7F32' },
  silver:   { active: 'background:#C0C0C0; color:#111; border-color:#C0C0C0', dot: '#C0C0C0' },
  gold:     { active: 'background:#FFD700; color:#1A1000; border-color:#FFD700', dot: '#FFD700' },
  platinum: { active: 'background:#62D7FF; color:#03111A; border-color:#62D7FF', dot: '#62D7FF' },
  elite:    { active: 'background:linear-gradient(135deg,#2563EB,#7C3AED); color:#fff; border-color:#2563EB', dot: '#2563EB' },
};

const BADGE_PROGRESS_HINT = {
  streak_7:  { max: 7,  field: 'streak' },
  streak_14: { max: 14, field: 'streak' },
  streak_30: { max: 30, field: 'streak' },
  streak_60: { max: 60, field: 'streak' },
  streak_90: { max: 90, field: 'streak' },
  first_checkin: { max: 1, field: 'checkins' },
  perfect_week:  { max: 4, field: 'perfectCheckins' },
};

function getProgressForBadge(badgeKey, checkIns) {
  const hint = BADGE_PROGRESS_HINT[badgeKey];
  if (!hint) return null;
  const streak = calculateStreak(checkIns);
  if (hint.field === 'streak') return Math.min(streak, hint.max);
  if (hint.field === 'checkins') return Math.min(checkIns.length, hint.max);
  if (hint.field === 'perfectCheckins') {
    const scores = checkIns.slice(0, 4).map(checkInScore).filter(s => s !== null && s >= 80);
    return Math.min(scores.length, hint.max);
  }
  return null;
}

function LeaderCard({ client, score, streak, rank, badgeCount }) {
  const medal = ['👑', '🥈', '🥉'][rank] || null;
  const isFirst = rank === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: rank * 0.05 }}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center relative overflow-hidden"
      style={{
        background: isFirst ? 'radial-gradient(ellipse at 30% 0%, #2C2414 0%, #1A1608 100%)' : '#161820',
        border: isFirst ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isFirst ? '0 0 24px 4px rgba(255,215,0,0.18)' : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {isFirst && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)' }} />}
      {medal && <span className="text-lg leading-none">{medal}</span>}
      <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
        style={{ background: isFirst ? 'linear-gradient(135deg,#FFD700,#B8860B)' : '#1F2937', color: isFirst ? '#1A1000' : '#9CA3AF' }}>
        {client.name?.[0]}
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{client.name}</p>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black" style={{ color: isFirst ? '#FFD700' : '#93C5FD' }}>{score}</span>
        <span className="text-[9px] text-[#6B7280] uppercase tracking-wide">score</span>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF]">
        <span>🔥</span><span className="font-semibold text-white">{streak}</span>
        {badgeCount > 0 && <><span className="opacity-30">·</span><Trophy size={10} className="text-[#FFD700]" /><span>{badgeCount}</span></>}
      </div>
    </motion.div>
  );
}

export default function Adherence() {
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ client_id: '', badge_key: 'pr_hit', earned_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [tierFilter, setTierFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [autoAwarding, setAutoAwarding] = useState(false);
  const [unlockToast, setUnlockToast] = useState(null);
  const [dateRange, setDateRange] = useState(DATE_RANGES[1]); // Last 30 Days
  const [selectedClient, setSelectedClient] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsub = base44.entities.CheckIn.subscribe((event) => {
      if (event.type === 'create') queryClient.invalidateQueries({ queryKey: ['checkins'] });
    });
    return unsub;
  }, [queryClient]);

  const { data: clients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('name') });
  const { data: checkIns = [] } = useQuery({ queryKey: ['checkins'], queryFn: () => base44.entities.CheckIn.list('-date', 500) });
  const { data: badges = [] } = useQuery({ queryKey: ['badges'], queryFn: () => base44.entities.ClientBadge.list('-earned_date', 500) });

  const awardMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientBadge.create(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['recent-badges'] });
      setAwardOpen(false);
      const client = clients.find(c => c.id === vars.client_id);
      setUnlockToast({ badgeKey: vars.badge_key, clientName: client?.name });
      showAchievementToast(toast, vars.badge_key, client?.name);
      sendZapierEvent('badge.awarded', { client_id: vars.client_id, client_name: client?.name, badge_key: vars.badge_key, badge_label: BADGE_CONFIG[vars.badge_key]?.label, earned_date: vars.earned_date });
    },
  });

  const activeClients = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
  const getCheckIns = (id) => checkIns.filter(ci => ci.client_id === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getBadges = (id) => badges.filter(b => b.client_id === id);

  // ── Stat Cards ──
  const stats = useMemo(() => {
    const cutoff = subWeeks(new Date(), dateRange.weeks);
    let totalOverall = 0, totalWorkout = 0, totalNutrition = 0, scored = 0, atRisk = 0;
    for (const client of activeClients) {
      const cis = getCheckIns(client.id).filter(ci => parseISO(ci.date) >= cutoff);
      const overall = cis.length ? averageAdherenceScore(cis) : null;
      const wkVals = cis.map(ci => ci.compliance_training).filter(v => v != null);
      const ntVals = cis.map(ci => ci.compliance_nutrition).filter(v => v != null);
      if (overall !== null) { totalOverall += overall; scored++; }
      if (wkVals.length) totalWorkout += Math.round(wkVals.reduce((a, b) => a + b, 0) / wkVals.length);
      if (ntVals.length) totalNutrition += Math.round(ntVals.reduce((a, b) => a + b, 0) / ntVals.length);
      if (overall !== null && overall < 50) atRisk++;
    }
    return {
      overall: scored ? Math.round(totalOverall / scored) : 0,
      workout: scored ? Math.round(totalWorkout / scored) : 0,
      nutrition: scored ? Math.round(totalNutrition / scored) : 0,
      atRisk,
    };
  }, [activeClients, checkIns, dateRange]);

  const atRiskClients = activeClients.filter(c => {
    const score = averageAdherenceScore(getCheckIns(c.id));
    return score !== null && score < 50;
  });

  const badgeCountMap = useMemo(() => {
    const map = {};
    badges.forEach(b => { map[b.badge_key] = (map[b.badge_key] || 0) + 1; });
    return map;
  }, [badges]);

  const filteredBadgeKeys = useMemo(() =>
    Object.keys(BADGE_CONFIG).filter(k => {
      const cfg = BADGE_CONFIG[k];
      return (tierFilter === 'All' || cfg.tier === tierFilter) && (categoryFilter === 'All' || cfg.category === categoryFilter);
    }), [tierFilter, categoryFilter]);

  const categoryBadgeCounts = useMemo(() => {
    const counts = {};
    CATEGORY_FILTERS.forEach(cat => {
      counts[cat] = cat === 'All' ? Object.keys(BADGE_CONFIG).length : Object.values(BADGE_CONFIG).filter(b => b.category === cat).length;
    });
    return counts;
  }, []);

  const leaderboard = useMemo(() =>
    activeClients.map(c => ({ client: c, score: averageAdherenceScore(getCheckIns(c.id)), streak: calculateStreak(getCheckIns(c.id)), badgeCount: getBadges(c.id).length }))
      .filter(x => x.score !== null).sort((a, b) => b.score - a.score),
    [activeClients, checkIns, badges]);

  const handleAward = (e) => {
    e.preventDefault();
    const client = clients.find(c => c.id === awardForm.client_id);
    awardMutation.mutate({ ...awardForm, client_name: client?.name || '' });
  };

  const openAwardFor = (badgeKey, clientId = '') => {
    setAwardForm({ client_id: clientId, badge_key: badgeKey, earned_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
    setAwardOpen(true);
  };

  const handleAutoAward = async () => {
    setAutoAwarding(true);
    let totalBadges = 0; let affectedClients = 0;
    try {
      for (const client of activeClients) {
        const cis = getCheckIns(client.id);
        const cBadges = getBadges(client.id);
        const newKeys = await runAutoAwardForClient(client, cis, cBadges);
        if (newKeys.length > 0) { affectedClients++; totalBadges += newKeys.length; newKeys.forEach(key => showAchievementToast(toast, key, client.name)); }
      }
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['recent-badges'] });
      toast[totalBadges === 0 ? 'info' : 'success'](totalBadges === 0 ? 'No new badges — all up to date!' : `🏆 Awarded ${totalBadges} badge${totalBadges !== 1 ? 's' : ''} to ${affectedClients} client${affectedClients !== 1 ? 's' : ''}`);
    } catch (err) { toast.error('Auto-award failed: ' + err.message); }
    finally { setAutoAwarding(false); }
  };

  const selectedClientCheckIns = selectedClient ? getCheckIns(selectedClient.id) : [];

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* ── Header ── */}
      <div className="rounded-2xl p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #0D111E 100%)', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 32px rgba(0,0,0,0.5)' }}>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Adherence</h1>
          <p className="text-sm mt-0.5 text-[#6B7280]">Monitor compliance · Spot trends · Coach smarter</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Date range */}
          <div className="flex gap-1 bg-white/10 rounded-xl p-1">
            {DATE_RANGES.map(r => (
              <button key={r.label} onClick={() => setDateRange(r)}
                className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all',
                  dateRange.label === r.label ? 'bg-white text-[#111827]' : 'text-white/60 hover:text-white')}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
            <Settings className="w-4 h-4 text-white/70" />
          </button>
          <button onClick={handleAutoAward} disabled={autoAwarding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.2)' }}>
            <Zap className="w-4 h-4" />
            {autoAwarding ? 'Scanning...' : 'Auto-Award'}
          </button>
          <button onClick={() => openAwardFor('pr_hit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0D0D14] transition-all"
            style={{ background: 'linear-gradient(135deg,#FFD700,#F59E0B)', boxShadow: '0 2px 16px rgba(255,215,0,0.3)' }}>
            <Trophy className="w-4 h-4" /> Award Badge
          </button>
        </div>
      </div>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
              <span className="text-blue-600 text-sm font-bold">%</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.overall}<span className="text-sm font-normal text-[#6B7280] ml-1">%</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Overall Adherence</p>
        </div>
        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <span className="text-emerald-600 text-sm">💪</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.workout}<span className="text-sm font-normal text-[#6B7280] ml-1">%</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Workout Adherence</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50">
              <span className="text-orange-600 text-sm">🥗</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.nutrition}<span className="text-sm font-normal text-[#6B7280] ml-1">%</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Nutrition Adherence</p>
        </div>
        <div className="bg-white rounded-xl border border-red-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.atRisk}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">At-Risk Clients</p>
        </div>
      </div>

      {/* ── At-Risk Alert ── */}
      {atRiskClients.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-5 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{atRiskClients.length} client{atRiskClients.length > 1 ? 's' : ''}</strong> below threshold: {atRiskClients.map(c => c.name).join(', ')}</span>
        </div>
      )}

      {/* ── Adherence Table ── */}
      <div className="mb-5">
        <AdherenceTable
          clients={activeClients}
          checkIns={checkIns}
          rangeWeeks={dateRange.weeks}
          onSelectClient={setSelectedClient}
        />
      </div>

      {/* ── Trends ── */}
      <div className="mb-5">
        <AdherenceTrends clients={activeClients} checkIns={checkIns} rangeWeeks={dateRange.weeks} />
      </div>

      {/* ── Leaderboard ── */}
      <div className="mb-5">
        <AdherenceLeaderboard clients={activeClients} checkIns={checkIns} />
      </div>

      {/* ── Dark Leaderboard (existing) ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={15} className="text-[#F59E0B]" />
          <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">Achievement Leaderboard</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {leaderboard.map(({ client, score, streak, badgeCount }, i) => (
            <LeaderCard key={client.id} client={client} score={score} streak={streak} rank={i} badgeCount={badgeCount} />
          ))}
        </div>
      </div>

      {/* ── Achievements Gallery ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy size={15} className="text-[#111827]" />
            <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">Achievements Gallery</p>
          </div>
          <p className="text-xs text-[#6B7280]">{Object.keys(BADGE_CONFIG).length} total badges</p>
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 flex-nowrap mb-3">
          {TIER_FILTERS.map(t => {
            const isActive = tierFilter === t;
            const ts = TIER_TAB_STYLES[t];
            return (
              <button key={t} onClick={() => setTierFilter(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={isActive
                  ? (t === 'All' ? { background: '#111827', color: '#fff', borderColor: '#111827' }
                    : t === 'elite' ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', borderColor: '#2563EB', boxShadow: '0 0 12px rgba(37,99,235,0.4)' }
                    : { background: TIER_STYLES[t]?.accent, color: '#111', borderColor: TIER_STYLES[t]?.accent, boxShadow: `0 0 10px ${TIER_STYLES[t]?.glow}` })
                  : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }
                }
              >
                {t !== 'All' && ts && <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? 'currentColor' : TIER_STYLES[t]?.accent }} />}
                <span className="capitalize">{t === 'All' ? 'All' : TIER_STYLES[t]?.label || t}</span>
                {t !== 'All' && <span className="opacity-50">({Object.values(BADGE_CONFIG).filter(b => b.tier === t).length})</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 flex-nowrap mb-5">
          {CATEGORY_FILTERS.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all"
              style={categoryFilter === cat ? { background: '#111827', color: '#fff', borderColor: '#111827' } : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }}>
              {cat}<span className={categoryFilter === cat ? 'opacity-60' : 'opacity-40'}>({categoryBadgeCounts[cat]})</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredBadgeKeys.map((key, i) => {
            const hint = BADGE_PROGRESS_HINT[key];
            const anyClientCheckIns = activeClients.length > 0 ? getCheckIns(activeClients[0].id) : [];
            const prog = hint ? getProgressForBadge(key, anyClientCheckIns) : null;
            return (
              <motion.div key={key} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.018, duration: 0.25 }}>
                <BadgeCard badgeKey={key} earned={badgeCountMap[key] > 0} clientCount={badgeCountMap[key] || 0}
                  progress={!badgeCountMap[key] ? prog : undefined} progressMax={!badgeCountMap[key] ? hint?.max : undefined}
                  onClick={() => openAwardFor(key)} light={!badgeCountMap[key]} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Per-client panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeClients.map(client => {
          const clientBadges = getBadges(client.id);
          const cis = getCheckIns(client.id);
          return (
            <div key={client.id} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                  {client.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#111827]">{client.name}</p>
                  <p className="text-xs text-[#6B7280] capitalize">{client.goal?.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-[#6B7280]"><span className="font-bold text-[#111827]">{clientBadges.length}</span><span className="text-[#9CA3AF]"> / {Object.keys(BADGE_CONFIG).length}</span></span>
                  <button onClick={() => openAwardFor('pr_hit', client.id)}
                    className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                    style={{ background: 'rgba(255,215,0,0.12)', color: '#B45309', border: '1px solid rgba(217,119,6,0.25)' }}>
                    + Award
                  </button>
                </div>
              </div>
              {clientBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {clientBadges.slice(0, 5).map(b => {
                    const cfg = BADGE_CONFIG[b.badge_key];
                    const t = cfg ? TIER_STYLES[cfg.tier] : null;
                    if (!cfg || !t) return null;
                    return (
                      <span key={b.id} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: `${t.accent}18`, color: t.accent, border: `1px solid ${t.accent}35` }}>
                        {cfg.emoji} {cfg.label}
                      </span>
                    );
                  })}
                  {clientBadges.length > 5 && <span className="text-xs text-[#6B7280] px-2 py-1 rounded-full" style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>+{clientBadges.length - 5} more</span>}
                </div>
              )}
              {clientBadges.length === 0 && <p className="text-xs text-[#9CA3AF] italic mb-4">No achievements yet — award their first badge!</p>}
              <AdherencePanel client={client} checkIns={cis} badges={clientBadges} />
            </div>
          );
        })}
      </div>

      {/* ── Award Dialog ── */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent className="max-w-sm" style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)' }}>
          <DialogHeader><DialogTitle className="text-white font-black">Award Badge</DialogTitle></DialogHeader>
          <form onSubmit={handleAward} className="space-y-4 mt-2">
            <div>
              <Label className="text-[#9CA3AF] text-xs">Client</Label>
              <Select value={awardForm.client_id} onValueChange={v => setAwardForm({ ...awardForm, client_id: v })}>
                <SelectTrigger className="bg-[#1F2937] border-white/10 text-white"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#9CA3AF] text-xs">Badge</Label>
              <Select value={awardForm.badge_key} onValueChange={v => setAwardForm({ ...awardForm, badge_key: v })}>
                <SelectTrigger className="bg-[#1F2937] border-white/10 text-white"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(BADGE_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.emoji} {v.label} · {TIER_STYLES[v.tier]?.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {awardForm.badge_key && BADGE_CONFIG[awardForm.badge_key] && (() => {
              const cfg = BADGE_CONFIG[awardForm.badge_key];
              const t = TIER_STYLES[cfg.tier];
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.bg, border: `1px solid ${t.border}`, boxShadow: `0 0 16px ${t.glow}` }}>
                  <span className="text-3xl">{cfg.emoji}</span>
                  <div><p className="text-sm font-black" style={{ color: t.text }}>{cfg.label}</p><p className="text-xs mt-0.5" style={{ color: `${t.accent}88` }}>{cfg.desc}</p><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.accent }}>{t.label}</span></div>
                </div>
              );
            })()}
            <div>
              <Label className="text-[#9CA3AF] text-xs">Date</Label>
              <Input type="date" value={awardForm.earned_date} onChange={e => setAwardForm({ ...awardForm, earned_date: e.target.value })} className="bg-[#1F2937] border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAwardOpen(false)} className="border-white/10 text-[#9CA3AF] hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={!awardForm.client_id} style={{ background: 'linear-gradient(135deg,#FFD700,#F59E0B)', color: '#1A1000', fontWeight: 800 }}>🏆 Award</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Settings Panel ── */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setShowSettings(false)}>
          <div className="w-80 h-full bg-white shadow-2xl p-6 overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#111827]">Adherence Settings</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-4 h-4 text-[#6B7280]" /></button>
            </div>
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-[#374151] mb-3">Score Weights</p>
                {[
                  { label: 'Workout Completion', value: 40 },
                  { label: 'Nutrition Logging', value: 30 },
                  { label: 'Check-in Submission', value: 20 },
                  { label: 'App Engagement', value: 10 },
                ].map(({ label, value }) => (
                  <div key={label} className="mb-3">
                    <div className="flex justify-between text-xs mb-1 text-[#374151]"><span>{label}</span><span className="font-semibold">{value}%</span></div>
                    <div className="h-2 bg-[#F3F4F6] rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${value}%` }} /></div>
                  </div>
                ))}
                <p className="text-[10px] text-[#9CA3AF] mt-2">Weight customization coming soon</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#374151] mb-2">Thresholds</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#374151]">At-Risk below</span>
                    <span className="text-xs font-bold text-red-500">50%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#374151]">On Track above</span>
                    <span className="text-xs font-bold text-emerald-600">80%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Client Detail Drawer ── */}
      <AdherenceDetailDrawer
        client={selectedClient}
        checkIns={selectedClientCheckIns}
        open={!!selectedClient}
        onClose={() => setSelectedClient(null)}
      />

      {/* Badge unlock toast */}
      {unlockToast && <BadgeUnlockToast badgeKey={unlockToast.badgeKey} clientName={unlockToast.clientName} onClose={() => setUnlockToast(null)} />}
    </div>
  );
}