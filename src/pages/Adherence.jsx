import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Zap, AlertTriangle, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AdherencePanel from '../components/adherence/AdherencePanel';
import AdherenceScore from '../components/adherence/AdherenceScore';
import BadgeCard from '../components/adherence/BadgeCard';
import BadgeUnlockToast from '../components/adherence/BadgeUnlockToast';
import { averageAdherenceScore, calculateStreak, checkInScore } from '@/lib/adherence';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { runAutoAwardForClient } from '@/lib/autoAward';
import { showAchievementToast } from '@/components/achievements/AchievementToast';
import { cn } from '@/lib/utils';

const TIER_FILTERS = ['All', 'bronze', 'silver', 'gold', 'platinum', 'elite'];

// Remove the inline checkAndAutoAward — now handled by lib/autoAward.js

const TIER_TAB_STYLES = {
  bronze:   { active: 'background:#CD7F32; color:#1A0F00; border-color:#CD7F32',   dot: '#CD7F32' },
  silver:   { active: 'background:#C0C0C0; color:#111; border-color:#C0C0C0',       dot: '#C0C0C0' },
  gold:     { active: 'background:#FFD700; color:#1A1000; border-color:#FFD700',    dot: '#FFD700' },
  platinum: { active: 'background:#62D7FF; color:#03111A; border-color:#62D7FF',    dot: '#62D7FF' },
  elite:    { active: 'background:linear-gradient(135deg,#2563EB,#7C3AED); color:#fff; border-color:#2563EB', dot: '#2563EB' },
};

// Progress hints per badge
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

// ── Leaderboard card ────────────────────────────────────────────────────────
function LeaderCard({ client, score, streak, rank, badgeCount }) {
  const medal = ['👑', '🥈', '🥉'][rank] || null;
  const isFirst = rank === 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.05 }}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl text-center relative overflow-hidden"
      style={{
        background: isFirst
          ? 'radial-gradient(ellipse at 30% 0%, #2C2414 0%, #1A1608 100%)'
          : '#161820',
        border: isFirst ? '1px solid rgba(255,215,0,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isFirst ? '0 0 24px 4px rgba(255,215,0,0.18)' : '0 2px 8px rgba(0,0,0,0.4)',
      }}
    >
      {isFirst && (
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(255,215,0,0.08) 0%, transparent 70%)' }}
        />
      )}
      {medal && <span className="text-lg leading-none">{medal}</span>}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
        style={{
          background: isFirst ? 'linear-gradient(135deg,#FFD700,#B8860B)' : '#1F2937',
          color: isFirst ? '#1A1000' : '#9CA3AF',
        }}
      >
        {client.name?.[0]}
      </div>
      <p className="text-xs font-semibold text-white leading-tight">{client.name}</p>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-black" style={{ color: isFirst ? '#FFD700' : '#93C5FD' }}>
          {score}
        </span>
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
  const [autoAwarding, setAutoAwarding] = useState(false);
  const [unlockToast, setUnlockToast] = useState(null);
  const queryClient = useQueryClient();

  // Real-time subscription: re-run auto-award whenever a new check-in is created
  useEffect(() => {
    const unsub = base44.entities.CheckIn.subscribe((event) => {
      if (event.type === 'create') {
        queryClient.invalidateQueries({ queryKey: ['checkins'] });
      }
    });
    return unsub;
  }, [queryClient]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 300),
  });
  const { data: badges = [] } = useQuery({
    queryKey: ['badges'],
    queryFn: () => base44.entities.ClientBadge.list('-earned_date', 500),
  });

  const awardMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientBadge.create(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['recent-badges'] });
      setAwardOpen(false);
      const client = clients.find(c => c.id === vars.client_id);
      setUnlockToast({ badgeKey: vars.badge_key, clientName: client?.name });
      showAchievementToast(toast, vars.badge_key, client?.name);
    },
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const getCheckIns = (id) => checkIns.filter(ci => ci.client_id === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getBadges = (id) => badges.filter(b => b.client_id === id);

  const atRisk = activeClients.filter(c => {
    const score = averageAdherenceScore(getCheckIns(c.id));
    return score !== null && score < 50;
  });

  const badgeCountMap = useMemo(() => {
    const map = {};
    badges.forEach(b => { map[b.badge_key] = (map[b.badge_key] || 0) + 1; });
    return map;
  }, [badges]);

  const filteredBadgeKeys = useMemo(() =>
    Object.keys(BADGE_CONFIG).filter(k =>
      tierFilter === 'All' || BADGE_CONFIG[k].tier === tierFilter
    ), [tierFilter]);

  const leaderboard = useMemo(() =>
    activeClients
      .map(c => ({
        client: c,
        score: averageAdherenceScore(getCheckIns(c.id)),
        streak: calculateStreak(getCheckIns(c.id)),
        badgeCount: getBadges(c.id).length,
      }))
      .filter(x => x.score !== null)
      .sort((a, b) => b.score - a.score),
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
    let totalBadges = 0;
    let affectedClients = 0;
    try {
      for (const client of activeClients) {
        const cis = getCheckIns(client.id);
        const cBadges = getBadges(client.id);
        const newKeys = await runAutoAwardForClient(client, cis, cBadges);
        if (newKeys.length > 0) {
          affectedClients++;
          totalBadges += newKeys.length;
          // Show a toast for each new badge
          newKeys.forEach(key => showAchievementToast(toast, key, client.name));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['recent-badges'] });
      if (totalBadges === 0) {
        toast.info('No new badges to award — everyone is up to date!');
      } else {
        toast.success(`🏆 Awarded ${totalBadges} badge${totalBadges !== 1 ? 's' : ''} to ${affectedClients} client${affectedClients !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      toast.error('Auto-award failed: ' + err.message);
    } finally {
      setAutoAwarding(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #0D111E 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Adherence</h1>
          <p className="text-sm mt-0.5 text-[#6B7280]">Track consistency · Award achievements · Build retention</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoAward}
            disabled={autoAwarding}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#93C5FD', border: '1px solid rgba(147,197,253,0.2)' }}
          >
            <Zap className="w-4 h-4" />
            {autoAwarding ? 'Scanning...' : 'Auto-Award'}
          </button>
          <button
            onClick={() => openAwardFor('pr_hit')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-[#0D0D14] transition-all"
            style={{ background: 'linear-gradient(135deg,#FFD700,#F59E0B)', boxShadow: '0 2px 16px rgba(255,215,0,0.3)' }}
          >
            <Trophy className="w-4 h-4" /> Award Badge
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      {atRisk.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 mb-6 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171' }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{atRisk.length} client{atRisk.length > 1 ? 's' : ''}</strong> below threshold: {atRisk.map(c => c.name).join(', ')}</span>
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Crown size={15} className="text-[#F59E0B]" />
          <p className="text-sm font-bold text-[#111827] uppercase tracking-wider">Leaderboard</p>
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

        {/* Tier tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {TIER_FILTERS.map(t => {
            const isActive = tierFilter === t;
            const ts = TIER_TAB_STYLES[t];
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                style={isActive
                  ? (t === 'All'
                    ? { background: '#111827', color: '#fff', borderColor: '#111827' }
                    : (t === 'elite'
                      ? { background: 'linear-gradient(135deg,#2563EB,#7C3AED)', color: '#fff', borderColor: '#2563EB', boxShadow: '0 0 12px rgba(37,99,235,0.4)' }
                      : { background: TIER_STYLES[t]?.accent, color: '#111', borderColor: TIER_STYLES[t]?.accent, boxShadow: `0 0 10px ${TIER_STYLES[t]?.glow}` }
                    ))
                  : { background: '#fff', color: '#6B7280', borderColor: '#E5E7EB' }
                }
              >
                {t !== 'All' && ts && (
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: isActive ? 'currentColor' : TIER_STYLES[t]?.accent }} />
                )}
                <span className="capitalize">{t === 'All' ? 'All' : TIER_STYLES[t]?.label || t}</span>
                {t !== 'All' && (
                  <span className="opacity-50">
                    ({Object.values(BADGE_CONFIG).filter(b => b.tier === t).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredBadgeKeys.map((key, i) => {
            const hint = BADGE_PROGRESS_HINT[key];
            // Use first active client's data for gallery progress hint (aggregate)
            const anyClientCheckIns = activeClients.length > 0 ? getCheckIns(activeClients[0].id) : [];
            const prog = hint ? getProgressForBadge(key, anyClientCheckIns) : null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.018, duration: 0.25 }}
              >
                <BadgeCard
                  badgeKey={key}
                  earned={badgeCountMap[key] > 0}
                  clientCount={badgeCountMap[key] || 0}
                  progress={!badgeCountMap[key] ? prog : undefined}
                  progressMax={!badgeCountMap[key] ? hint?.max : undefined}
                  onClick={() => openAwardFor(key)}
                  light={!badgeCountMap[key]}
                />
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
          const score = averageAdherenceScore(cis);
          return (
            <div key={client.id}
              className="bg-white border border-[#E5E7EB] rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm"
                  style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE' }}>
                  {client.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#111827]">{client.name}</p>
                  <p className="text-xs text-[#6B7280] capitalize">{client.goal?.replace(/_/g, ' ')}</p>
                </div>
                <button
                  onClick={() => openAwardFor('pr_hit', client.id)}
                  className="text-xs font-bold px-3 py-1 rounded-lg transition-all"
                  style={{ background: 'rgba(255,215,0,0.12)', color: '#FFD700', border: '1px solid rgba(255,215,0,0.25)' }}
                >
                  + Award
                </button>
              </div>

              {/* Top earned badges for this client */}
              {clientBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {clientBadges.slice(0, 5).map(b => {
                    const cfg = BADGE_CONFIG[b.badge_key];
                    const t = cfg ? TIER_STYLES[cfg.tier] : null;
                    if (!cfg || !t) return null;
                    return (
                      <span key={b.id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: `${t.accent}18`, color: t.accent, border: `1px solid ${t.accent}35` }}
                      >
                        {cfg.emoji} {cfg.label}
                      </span>
                    );
                  })}
                  {clientBadges.length > 5 && (
                    <span className="text-xs text-[#6B7280] px-2 py-1 rounded-full"
                      style={{ background: '#F3F4F6', border: '1px solid #E5E7EB' }}>
                      +{clientBadges.length - 5} more
                    </span>
                  )}
                </div>
              )}
              {clientBadges.length === 0 && (
                <p className="text-xs text-[#9CA3AF] italic mb-4">No achievements yet — award their first badge!</p>
              )}

              <AdherencePanel client={client} checkIns={cis} badges={clientBadges} />
            </div>
          );
        })}
      </div>

      {/* ── Award dialog ── */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent className="max-w-sm" style={{ background: '#161820', border: '1px solid rgba(255,255,255,0.1)' }}>
          <DialogHeader>
            <DialogTitle className="text-white font-black">Award Badge</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAward} className="space-y-4 mt-2">
            <div>
              <Label className="text-[#9CA3AF] text-xs">Client</Label>
              <Select value={awardForm.client_id} onValueChange={v => setAwardForm({ ...awardForm, client_id: v })}>
                <SelectTrigger className="bg-[#1F2937] border-white/10 text-white">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#9CA3AF] text-xs">Badge</Label>
              <Select value={awardForm.badge_key} onValueChange={v => setAwardForm({ ...awardForm, badge_key: v })}>
                <SelectTrigger className="bg-[#1F2937] border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BADGE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.emoji} {v.label} · {TIER_STYLES[v.tier]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Badge preview */}
            {awardForm.badge_key && BADGE_CONFIG[awardForm.badge_key] && (() => {
              const cfg = BADGE_CONFIG[awardForm.badge_key];
              const t = TIER_STYLES[cfg.tier];
              return (
                <div className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: t.bg, border: `1px solid ${t.border}`, boxShadow: `0 0 16px ${t.glow}` }}>
                  <span className="text-3xl">{cfg.emoji}</span>
                  <div>
                    <p className="text-sm font-black" style={{ color: t.text }}>{cfg.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: `${t.accent}88` }}>{cfg.desc}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: t.accent }}>{t.label}</span>
                  </div>
                </div>
              );
            })()}

            <div>
              <Label className="text-[#9CA3AF] text-xs">Date</Label>
              <Input type="date" value={awardForm.earned_date}
                onChange={e => setAwardForm({ ...awardForm, earned_date: e.target.value })}
                className="bg-[#1F2937] border-white/10 text-white" />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAwardOpen(false)}
                className="border-white/10 text-[#9CA3AF] hover:bg-white/5">Cancel</Button>
              <Button type="submit" disabled={!awardForm.client_id}
                style={{ background: 'linear-gradient(135deg,#FFD700,#F59E0B)', color: '#1A1000', fontWeight: 800 }}>
                🏆 Award
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Badge unlock toast */}
      {unlockToast && (
        <BadgeUnlockToast
          badgeKey={unlockToast.badgeKey}
          clientName={unlockToast.clientName}
          onClose={() => setUnlockToast(null)}
        />
      )}
    </div>
  );
}