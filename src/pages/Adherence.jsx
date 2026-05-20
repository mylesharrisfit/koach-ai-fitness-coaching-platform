import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trophy, Zap, AlertTriangle } from 'lucide-react';
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
import { averageAdherenceScore, calculateStreak, checkInScore } from '@/lib/adherence';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { cn } from '@/lib/utils';

const TIER_FILTERS = ['All', 'bronze', 'silver', 'gold', 'platinum', 'elite'];

function checkAndAutoAward(client, checkIns, existingBadges) {
  const awarded = new Set(existingBadges.map(b => b.badge_key));
  const eligible = [];
  const streak = calculateStreak(checkIns);

  if (streak >= 7  && !awarded.has('streak_7'))  eligible.push('streak_7');
  if (streak >= 14 && !awarded.has('streak_14')) eligible.push('streak_14');
  if (streak >= 30 && !awarded.has('streak_30')) eligible.push('streak_30');
  if (streak >= 60 && !awarded.has('streak_60')) eligible.push('streak_60');
  if (streak >= 90 && !awarded.has('streak_90')) eligible.push('streak_90');

  if (checkIns.length >= 1 && !awarded.has('first_checkin')) eligible.push('first_checkin');

  const recentScores = checkIns.slice(0, 4).map(checkInScore).filter(s => s !== null);
  if (recentScores.length >= 4 && recentScores.every(s => s >= 80) && !awarded.has('perfect_week')) {
    eligible.push('perfect_week');
  }

  if (checkIns.length >= 2) {
    const latest = checkInScore(checkIns[0]);
    const prev = checkInScore(checkIns[1]);
    if (prev !== null && latest !== null && prev < 50 && latest >= 70 && !awarded.has('comeback')) {
      eligible.push('comeback');
    }
  }

  return eligible;
}

export default function Adherence() {
  const [awardOpen, setAwardOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({ client_id: '', badge_key: 'pr_hit', earned_date: format(new Date(), 'yyyy-MM-dd'), notes: '' });
  const [tierFilter, setTierFilter] = useState('All');
  const [autoAwarding, setAutoAwarding] = useState(false);
  const queryClient = useQueryClient();

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['badges'] }); setAwardOpen(false); },
  });

  const activeClients = clients.filter(c => c.status === 'active');
  const getCheckIns = (id) => checkIns.filter(ci => ci.client_id === id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const getBadges = (id) => badges.filter(b => b.client_id === id);

  const atRisk = activeClients.filter(c => {
    const score = averageAdherenceScore(getCheckIns(c.id));
    return score !== null && score < 50;
  });

  // Badge counts across all clients
  const badgeCountMap = useMemo(() => {
    const map = {};
    badges.forEach(b => { map[b.badge_key] = (map[b.badge_key] || 0) + 1; });
    return map;
  }, [badges]);

  // Filtered badge list for gallery
  const filteredBadgeKeys = useMemo(() =>
    Object.keys(BADGE_CONFIG).filter(k =>
      tierFilter === 'All' || BADGE_CONFIG[k].tier === tierFilter
    ), [tierFilter]);

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
    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      for (const client of activeClients) {
        const cis = getCheckIns(client.id);
        const cBadges = getBadges(client.id);
        const eligible = checkAndAutoAward(client, cis, cBadges);
        if (eligible.length > 0) {
          affectedClients++;
          for (const key of eligible) {
            await base44.entities.ClientBadge.create({
              client_id: client.id,
              client_name: client.name,
              badge_key: key,
              earned_date: today,
              notes: 'Auto-awarded',
            });
            totalBadges++;
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      if (totalBadges === 0) {
        toast.info('No new badges to award — all clients are up to date!');
      } else {
        toast.success(`Awarded ${totalBadges} new badge${totalBadges !== 1 ? 's' : ''} to ${affectedClients} client${affectedClients !== 1 ? 's' : ''}`);
      }
    } catch (err) {
      toast.error('Auto-award failed: ' + err.message);
    } finally {
      setAutoAwarding(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-[#111827] rounded-xl p-5 mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Adherence</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Track client compliance and consistency</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAutoAward}
            disabled={autoAwarding}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all disabled:opacity-60"
          >
            <Zap className="w-4 h-4" />
            {autoAwarding ? 'Awarding...' : 'Auto-Award'}
          </button>
          <button
            onClick={() => openAwardFor('pr_hit')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-white text-[#111827]"
          >
            <Trophy className="w-4 h-4" /> Award Badge
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {atRisk.length > 0 && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 mb-6 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span><strong>{atRisk.length} client{atRisk.length > 1 ? 's' : ''}</strong> below adherence threshold: {atRisk.map(c => c.name).join(', ')}</span>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 mb-6 shadow-sm">
        <p className="text-xs font-semibold text-[#1F2A44] uppercase tracking-wider mb-4">Adherence Leaderboard</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {activeClients
            .map(c => ({ client: c, score: averageAdherenceScore(getCheckIns(c.id)), streak: calculateStreak(getCheckIns(c.id)) }))
            .filter(x => x.score !== null)
            .sort((a, b) => b.score - a.score)
            .map(({ client, score, streak }, i) => (
              <div key={client.id} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#F6F7FB] border border-[#E7EAF3]">
                {i === 0 && <span className="text-xs text-amber-600 font-semibold">👑 Top</span>}
                <div className="w-8 h-8 rounded-full bg-[#EEF4FF] flex items-center justify-center text-primary font-bold text-sm">
                  {client.name?.[0]}
                </div>
                <p className="text-xs font-medium text-[#1F2A44] text-center leading-tight">{client.name}</p>
                <AdherenceScore score={score} size="sm" showLabel={false} />
                <p className="text-[10px] text-[#374151]">🔥 {streak}</p>
              </div>
            ))}
        </div>
      </div>

      {/* Achievements Gallery */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-[#111827]">Achievements Gallery</p>
          <p className="text-xs text-[#9CA3AF]">{Object.keys(BADGE_CONFIG).length} total badges</p>
        </div>

        {/* Tier filter tabs */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {TIER_FILTERS.map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold border transition-all capitalize',
                tierFilter === t
                  ? 'bg-[#111827] text-white border-[#111827]'
                  : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#9CA3AF]'
              )}
            >
              {t === 'All' ? 'All' : TIER_STYLES[t]?.label || t}
              {t !== 'All' && (
                <span className="ml-1 opacity-60">
                  ({Object.values(BADGE_CONFIG).filter(b => b.tier === t).length})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {filteredBadgeKeys.map(key => (
            <BadgeCard
              key={key}
              badgeKey={key}
              earned={badgeCountMap[key] > 0}
              clientCount={badgeCountMap[key] || 0}
              onClick={() => openAwardFor(key)}
            />
          ))}
        </div>
      </div>

      {/* Per-client panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {activeClients.map(client => {
          const clientBadges = getBadges(client.id);
          return (
            <div key={client.id} className="bg-white border border-[#E7EAF3] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#EEF4FF] flex items-center justify-center text-primary font-bold">
                  {client.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#1F2A44]">{client.name}</p>
                  <p className="text-xs text-[#374151] capitalize">{client.goal?.replace('_', ' ')}</p>
                </div>
                <button
                  onClick={() => openAwardFor('pr_hit', client.id)}
                  className="text-xs text-[#2563EB] hover:underline font-medium"
                >
                  + Award
                </button>
              </div>
              <AdherencePanel
                client={client}
                checkIns={getCheckIns(client.id)}
                badges={clientBadges}
              />
            </div>
          );
        })}
      </div>

      {/* Award badge dialog */}
      <Dialog open={awardOpen} onOpenChange={setAwardOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Award Badge</DialogTitle></DialogHeader>
          <form onSubmit={handleAward} className="space-y-4 mt-2">
            <div>
              <Label>Client</Label>
              <Select value={awardForm.client_id} onValueChange={v => setAwardForm({ ...awardForm, client_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Badge</Label>
              <Select value={awardForm.badge_key} onValueChange={v => setAwardForm({ ...awardForm, badge_key: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BADGE_CONFIG).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label} ({TIER_STYLES[v.tier]?.label})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Preview selected badge */}
            {awardForm.badge_key && BADGE_CONFIG[awardForm.badge_key] && (() => {
              const cfg = BADGE_CONFIG[awardForm.badge_key];
              const tier = TIER_STYLES[cfg.tier];
              return (
                <div className={cn('flex items-center gap-3 p-3 rounded-xl border', tier.bg, tier.border)}>
                  <span className="text-2xl">{cfg.emoji}</span>
                  <div>
                    <p className={cn('text-sm font-semibold', tier.text)}>{cfg.label}</p>
                    <p className="text-xs text-[#6B7280]">{cfg.desc}</p>
                  </div>
                </div>
              );
            })()}
            <div>
              <Label>Date</Label>
              <Input type="date" value={awardForm.earned_date} onChange={e => setAwardForm({ ...awardForm, earned_date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setAwardOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!awardForm.client_id}>Award Badge</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}