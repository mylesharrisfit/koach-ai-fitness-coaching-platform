import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, startOfWeek, isWithinInterval, subWeeks } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Trophy, AlertTriangle, MessageSquare, Moon, Zap, Smile } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';
import { checkInScore } from '@/lib/adherence';

const MOOD_SCORE = { great: 5, good: 4, okay: 3, tired: 2, stressed: 1 };

function weekRange(weeksAgo) {
  const start = startOfWeek(subWeeks(new Date(), weeksAgo), { weekStartsOn: 1 });
  const end = startOfWeek(subWeeks(new Date(), weeksAgo - 1), { weekStartsOn: 1 });
  return { start, end };
}

function avg(arr) {
  if (!arr.length) return null;
  return Math.round(arr.reduce((s, v) => s + v, 0) / arr.length);
}

function barColor(val) {
  if (val == null) return '#D1D5DB';
  if (val >= 75) return '#10B981';
  if (val >= 50) return '#F59E0B';
  return '#EF4444';
}

export default function CheckInAnalyticsSidebar({ checkIns, clients, latestPerClient, clientMap }) {
  const navigate = useNavigate();

  // ── Section A: Weekly overview ──
  const thisWeek = useMemo(() => {
    const { start, end } = weekRange(0);
    return checkIns.filter(ci => {
      const d = parseISO(ci.date);
      return d >= start && d < end;
    });
  }, [checkIns]);

  const lastWeek = useMemo(() => {
    const { start, end } = weekRange(1);
    return checkIns.filter(ci => {
      const d = parseISO(ci.date);
      return d >= start && d < end;
    });
  }, [checkIns]);

  const weeklyStats = useMemo(() => {
    const ciCount = thisWeek.length;
    const lastCount = lastWeek.length;
    const countChange = lastCount > 0 ? Math.round(((ciCount - lastCount) / lastCount) * 100) : null;

    const complianceVals = thisWeek
      .map(ci => avg([ci.compliance_training, ci.compliance_nutrition].filter(v => v != null)))
      .filter(v => v != null);
    const avgCompliance = avg(complianceVals);

    const sleepVals = thisWeek.map(ci => ci.sleep_hours).filter(v => v != null);
    const avgSleep = sleepVals.length ? (sleepVals.reduce((s, v) => s + v, 0) / sleepVals.length).toFixed(1) : null;

    const moodVals = thisWeek.map(ci => MOOD_SCORE[ci.mood]).filter(v => v != null);
    const avgMood = moodVals.length ? (moodVals.reduce((s, v) => s + v, 0) / moodVals.length).toFixed(1) : null;

    return { ciCount, lastCount, countChange, avgCompliance, avgSleep, avgMood };
  }, [thisWeek, lastWeek]);

  // ── Section B: 4-week trend ──
  const weeklyTrend = useMemo(() => {
    return [3, 2, 1, 0].map((weeksAgo, i) => {
      const { start, end } = weekRange(weeksAgo);
      const wCIs = checkIns.filter(ci => {
        const d = parseISO(ci.date);
        return d >= start && d < end;
      });
      const vals = wCIs
        .map(ci => avg([ci.compliance_training, ci.compliance_nutrition].filter(v => v != null)))
        .filter(v => v != null);
      return { name: `Wk ${i + 1}`, value: avg(vals) ?? 0 };
    });
  }, [checkIns]);

  // ── Section C: At-risk clients ──
  const atRiskClients = useMemo(() => {
    return latestPerClient
      .map(ci => {
        const score = checkInScore(ci);
        const flags = [];
        if (ci.compliance_training != null && ci.compliance_training < 60) flags.push('missed workouts');
        if (ci.compliance_nutrition != null && ci.compliance_nutrition < 60) flags.push('nutrition off');
        if (ci.sleep_hours != null && ci.sleep_hours < 6) flags.push('poor sleep');
        if (ci.mood === 'stressed' || ci.mood === 'tired') flags.push(`mood: ${ci.mood}`);
        return { ci, client: clientMap[ci.client_id], score, flags };
      })
      .filter(x => x.flags.length > 0 || (x.score !== null && x.score < 60))
      .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
      .slice(0, 3);
  }, [latestPerClient, clientMap]);

  // ── Section D: Top performers (this week) ──
  const topPerformers = useMemo(() => {
    return latestPerClient
      .map(ci => {
        const compVals = [ci.compliance_training, ci.compliance_nutrition].filter(v => v != null);
        const score = compVals.length ? avg(compVals) : checkInScore(ci);
        const client = clientMap[ci.client_id];
        const allCIs = checkIns.filter(x => x.client_id === ci.client_id);
        // streak = consecutive days with compliance >= 80
        let streak = 0;
        for (const x of allCIs) {
          const s = checkInScore(x);
          if (s !== null && s >= 70) streak++;
          else break;
        }
        return { ci, client, score, streak };
      })
      .filter(x => x.score !== null && x.score >= 75)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 3);
  }, [latestPerClient, clientMap, checkIns]);

  const TrendIcon = ({ val }) => {
    if (val === null) return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
    if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />;
    if (val < 0) return <TrendingDown className="w-3.5 h-3.5 text-red-500" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">

      {/* ── Section A: Weekly Overview ── */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1F2A44]">This Week</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendIcon val={weeklyStats.countChange} />
            {weeklyStats.countChange !== null && (
              <span className={cn(weeklyStats.countChange > 0 ? 'text-emerald-600' : weeklyStats.countChange < 0 ? 'text-red-500' : '')}>
                {weeklyStats.countChange > 0 ? '+' : ''}{weeklyStats.countChange}%
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F6F7FB] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-[#1F2A44]">{weeklyStats.ciCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Check-ins</p>
            {weeklyStats.lastCount > 0 && (
              <p className="text-[10px] text-muted-foreground">vs {weeklyStats.lastCount} last wk</p>
            )}
          </div>
          <div className="bg-[#F6F7FB] rounded-xl p-3 text-center">
            <p className={cn('text-2xl font-bold', weeklyStats.avgCompliance >= 75 ? 'text-emerald-600' : weeklyStats.avgCompliance >= 50 ? 'text-amber-500' : 'text-red-500')}>
              {weeklyStats.avgCompliance ?? '–'}{weeklyStats.avgCompliance != null && '%'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Avg Compliance</p>
          </div>
          <div className="flex items-center gap-2 bg-[#F6F7FB] rounded-xl p-2.5">
            <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1F2A44]">{weeklyStats.avgSleep ?? '–'}<span className="text-[10px] font-normal text-muted-foreground"> hrs</span></p>
              <p className="text-[10px] text-muted-foreground">Avg Sleep</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#F6F7FB] rounded-xl p-2.5">
            <Smile className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1F2A44]">{weeklyStats.avgMood ?? '–'}<span className="text-[10px] font-normal text-muted-foreground">/5</span></p>
              <p className="text-[10px] text-muted-foreground">Avg Mood</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: 4-Week Compliance Trend ── */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 shadow-sm">
        <h3 className="text-sm font-bold text-[#1F2A44] mb-3">Compliance Trend</h3>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={weeklyTrend} barCategoryGap="25%">
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E7EAF3' }}
              formatter={(v) => [`${v}%`, 'Compliance']}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {weeklyTrend.map((entry, i) => (
                <Cell key={i} fill={barColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-3 mt-1 justify-center">
          {[['#10B981', '>75%'], ['#F59E0B', '50–75%'], ['#EF4444', '<50%']].map(([color, label]) => (
            <div key={label} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section C: At-Risk Clients ── */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <h3 className="text-sm font-bold text-[#1F2A44]">At-Risk Clients</h3>
        </div>
        {atRiskClients.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">All clients on track 🎉</p>
        ) : (
          <div className="space-y-2">
            {atRiskClients.map(({ ci, client, score, flags }) => (
              <div key={ci.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-red-50/60 border border-red-100">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs shrink-0">
                  {(client?.name || ci.client_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{client?.name || ci.client_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{flags.slice(0, 2).join(' · ')}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {score !== null && (
                    <span className="text-[10px] font-bold text-red-600">{score}%</span>
                  )}
                  <button
                    onClick={() => navigate(`/messages?clientId=${ci.client_id}`)}
                    className="p-1.5 rounded-lg bg-white border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section D: Top Performers ── */}
      <div className="bg-white border border-[#E7EAF3] rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[#1F2A44]">Top Performers</h3>
        </div>
        {topPerformers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No top performers yet this week</p>
        ) : (
          <div className="space-y-2">
            {topPerformers.map(({ ci, client, score, streak }, idx) => (
              <div key={ci.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    {(client?.name || ci.client_name || '?')[0]?.toUpperCase()}
                  </div>
                  {idx === 0 && <span className="absolute -top-1 -right-1 text-xs">🏆</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{client?.name || ci.client_name}</p>
                  {streak > 1 && <p className="text-[10px] text-muted-foreground">{streak} check-in streak 🔥</p>}
                </div>
                {score !== null && (
                  <span className="text-[10px] font-bold text-emerald-600 shrink-0">{score}%</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}