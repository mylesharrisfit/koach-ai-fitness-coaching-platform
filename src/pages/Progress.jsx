import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInWeeks, parseISO, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, TrendingUp, Minus, Image, Star, Scale, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import ClientProgressDetail from '@/components/progress/ClientProgressDetail';

/* ── helpers ── */
function calcProgressScore(client, checkIns) {
  if (!checkIns.length) return null;
  let score = 50;
  const sorted = [...checkIns].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (client.target_weight && last.weight && first.weight) {
    const needed = Math.abs(client.target_weight - first.weight);
    const achieved = Math.abs(last.weight - first.weight);
    if (needed > 0) score += Math.min(30, (achieved / needed) * 30);
  }
  const recentCIs = sorted.slice(-4);
  const avgAdh = recentCIs.reduce((s, ci) => s + ((ci.compliance_training ?? 70) + (ci.compliance_nutrition ?? 70)) / 2, 0) / recentCIs.length;
  score += (avgAdh / 100) * 40 - 20;
  const weeksActive = differenceInWeeks(new Date(last.date), new Date(first.date)) + 1;
  const consistency = Math.min(1, checkIns.length / weeksActive);
  score += consistency * 20 - 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getTrend(checkIns) {
  const w = checkIns.filter(ci => ci.weight).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (w.length < 2) return 'stable';
  const diff = w[w.length - 1].weight - w[w.length - 2].weight;
  if (diff > 0.5) return 'up';
  if (diff < -0.5) return 'down';
  return 'stable';
}



export default function Progress() {
  const [selectedClientId, setSelectedClientId] = useState('all');
  const [detailClient, setDetailClient] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('name'),
  });

  const { data: allCheckIns = [] } = useQuery({
    queryKey: ['checkins'],
    queryFn: () => base44.entities.CheckIn.list('-date', 1000),
  });

  const { data: allSessions = [] } = useQuery({
    queryKey: ['workout-sessions'],
    queryFn: () => base44.entities.WorkoutSession.list('-completed_at', 500),
  });

  const activeClients = useMemo(
    () => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'),
    [clients]
  );

  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of allCheckIns) {
      (map[ci.client_id] = map[ci.client_id] || []).push(ci);
    }
    return map;
  }, [allCheckIns]);

  const sessionsByClient = useMemo(() => {
    const map = {};
    for (const s of allSessions) {
      (map[s.client_id] = map[s.client_id] || []).push(s);
    }
    return map;
  }, [allSessions]);

  // ── Global stat cards ──
  const stats = useMemo(() => {
    let totalLost = 0;
    let personalBests = 0;
    let photoClients = 0;
    let scoredClients = 0;
    let totalScore = 0;

    for (const client of activeClients) {
      const cis = (cisByClient[client.id] || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      if (!cis.length) continue;
      const first = cis[0];
      const last = cis[cis.length - 1];
      if (first.weight && last.weight) {
        const diff = first.weight - last.weight;
        if (diff > 0) totalLost += diff;
      }
      const score = calcProgressScore(client, cis);
      if (score !== null) { totalScore += score; scoredClients++; }
      const hasPhotos = cis.some(ci => ci.photo_urls?.length > 0);
      if (hasPhotos) photoClients++;
      // Personal bests this week: check if last workout was a new record
      const sessions = sessionsByClient[client.id] || [];
      if (sessions.length >= 2) {
        const sorted = [...sessions].sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));
        const thisWeek = new Date();
        thisWeek.setDate(thisWeek.getDate() - 7);
        if (new Date(sorted[0].completed_at) > thisWeek) personalBests++;
      }
    }

    return {
      totalLost: Math.round(totalLost * 10) / 10,
      avgScore: scoredClients ? Math.round(totalScore / scoredClients) : 0,
      personalBests,
      photoClients,
    };
  }, [activeClients, cisByClient, sessionsByClient]);

  // ── Filtered client rows ──
  const visibleClients = useMemo(() => {
    const pool = selectedClientId === 'all' ? activeClients : activeClients.filter(c => c.id === selectedClientId);
    return pool.map(client => {
      const cis = (cisByClient[client.id] || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      const sessions = sessionsByClient[client.id] || [];
      const first = cis[0];
      const last = cis[cis.length - 1];
      const startWeight = first?.weight;
      const currentWeight = last?.weight;
      const goalWeight = client.target_weight;
      const startDate = client.start_date || first?.date;
      const weeksActive = startDate ? differenceInWeeks(new Date(), parseISO(startDate)) + 1 : null;
      const trend = getTrend(cis);
      const score = calcProgressScore(client, cis);
      // Progress toward goal (0–100%)
      let goalPct = null;
      if (startWeight && currentWeight && goalWeight && startWeight !== goalWeight) {
        goalPct = Math.min(100, Math.max(0, Math.round(
          (Math.abs(currentWeight - startWeight) / Math.abs(goalWeight - startWeight)) * 100
        )));
      }
      return { client, cis, sessions, startWeight, currentWeight, goalWeight, weeksActive, trend, score, goalPct, lastDate: last?.date };
    }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  }, [activeClients, selectedClientId, cisByClient, sessionsByClient]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #111827 0%, #1E293B 100%)' }}>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight">Progress</h1>
          <p className="text-xs sm:text-sm mt-0.5 text-white/50">
            Track, visualize, and celebrate client transformations
          </p>
        </div>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white h-9 text-sm">
            <SelectValue placeholder="All clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {activeClients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-emerald-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50">
              <Scale className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.totalLost}<span className="text-sm font-normal text-[#6B7280] ml-1">lbs</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Total Weight Lost</p>
        </div>
        <div className="bg-white rounded-xl border border-blue-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.avgScore}<span className="text-sm font-normal text-[#6B7280] ml-1">/100</span></p>
          <p className="text-xs text-[#6B7280] mt-0.5">Avg Progress Score</p>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50">
              <Star className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.personalBests}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Personal Bests This Week</p>
        </div>
        <div className="bg-white rounded-xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50">
              <Image className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#111827]">{stats.photoClients}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">Before/After Photos</p>
        </div>
      </div>

      {/* Client List */}
      {visibleClients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E5E7EB]">
          <BarChart3 className="w-12 h-12 text-[#D1D5DB] mb-3" />
          <p className="font-semibold text-[#374151]">No active clients yet</p>
          <p className="text-sm text-[#9CA3AF] mt-1">Add clients and start logging check-ins to track progress.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleClients.map(row => (
            <ClientProgressRow key={row.client.id} row={row} onViewProgress={() => setDetailClient(row)} />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {detailClient && (
        <ClientProgressDetail
          client={detailClient.client}
          checkIns={detailClient.cis}
          sessions={detailClient.sessions}
          allClients={clients}
          onClose={() => setDetailClient(null)}
        />
      )}
    </div>
  );
}

function ClientProgressRow({ row, onViewProgress }) {
  const { client, cis, sessions, startWeight, currentWeight, goalWeight, weeksActive, trend, score, goalPct, lastDate } = row;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'down' ? 'text-emerald-500' : trend === 'up' ? 'text-red-400' : 'text-[#9CA3AF]';
  const trendBg = trend === 'down' ? 'bg-emerald-50' : trend === 'up' ? 'bg-red-50' : 'bg-[#F3F4F6]';

  // Goal label
  const goalLabel = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength', endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness' }[client.goal] || 'General';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)' }}>
            {client.avatar_url
              ? <img src={client.avatar_url} alt={client.name} className="w-11 h-11 rounded-full object-cover" />
              : client.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#111827] truncate">{client.name}</p>
            <p className="text-xs text-[#6B7280]">{goalLabel}</p>
          </div>
        </div>

        {/* Weight progression */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <WeightPill label="Start" value={startWeight} />
          <div className="flex items-center gap-1">
            <div className="h-px w-5 bg-[#E5E7EB]" />
            <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold', trendBg, trendColor)}>
              <TrendIcon className="w-3 h-3" />
            </div>
            <div className="h-px w-5 bg-[#E5E7EB]" />
          </div>
          <WeightPill label="Now" value={currentWeight} highlight />
          <div className="flex items-center gap-1">
            <div className="h-px w-5 bg-[#E5E7EB]" />
            <span className="text-[#D1D5DB] text-xs">→</span>
            <div className="h-px w-5 bg-[#E5E7EB]" />
          </div>
          <WeightPill label="Goal" value={goalWeight} goal />
        </div>

        {/* Progress bar */}
        <div className="flex-1 min-w-[120px] max-w-[180px]">
          <div className="flex justify-between text-[10px] text-[#9CA3AF] mb-1">
            <span>Goal Progress</span>
            <span>{goalPct !== null ? `${goalPct}%` : 'N/A'}</span>
          </div>
          <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
              style={{ width: `${goalPct ?? 0}%` }} />
          </div>
        </div>

        {/* Quick stat chips */}
        <div className="flex gap-2 flex-wrap">
          {weeksActive && <Chip label={`${weeksActive}w active`} />}
          <Chip label={`${cis.length} check-ins`} />
          <Chip label={`${sessions.length} workouts`} />
          {lastDate && <Chip label={`Updated ${format(parseISO(lastDate), 'MMM d')}`} />}
        </div>

        {/* Score + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {score !== null && (
            <div className="text-center">
              <div className={cn('text-lg font-bold', score >= 70 ? 'text-emerald-600' : score >= 50 ? 'text-orange-500' : 'text-red-400')}>
                {score}
              </div>
              <div className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">Score</div>
            </div>
          )}
          <button onClick={onViewProgress}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors whitespace-nowrap">
            View Progress
          </button>
        </div>
      </div>
    </div>
  );
}

function WeightPill({ label, value, highlight, goal }) {
  return (
    <div className="text-center">
      <div className={cn('text-xs font-bold',
        highlight ? 'text-[#2563EB]' : goal ? 'text-emerald-600' : 'text-[#374151]')}>
        {value ? `${value}` : '—'}
        {value && <span className="text-[9px] font-normal ml-0.5">lbs</span>}
      </div>
      <div className="text-[9px] text-[#9CA3AF] uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span className="px-2 py-0.5 bg-[#F3F4F6] rounded-full text-[10px] text-[#6B7280] font-medium whitespace-nowrap">
      {label}
    </span>
  );
}