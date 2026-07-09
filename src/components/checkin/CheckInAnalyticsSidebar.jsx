import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseISO, startOfWeek, subWeeks } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, MessageSquare, Moon, Smile } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
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
  if (val == null) return 'rgb(var(--muted-foreground))';
  if (val >= 75) return 'rgb(var(--success))';
  if (val >= 50) return 'rgb(var(--warning))';
  return 'rgb(var(--destructive))';
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
    if (val > 0) return <TrendingUp className="w-3.5 h-3.5 text-success" />;
    if (val < 0) return <TrendingDown className="w-3.5 h-3.5 text-destructive" />;
    return <Minus className="w-3.5 h-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">

      {/* ── Section A: Weekly Overview ── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">This Week</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendIcon val={weeklyStats.countChange} />
            {weeklyStats.countChange !== null && (
              <span className={cn(weeklyStats.countChange > 0 ? 'text-success' : weeklyStats.countChange < 0 ? 'text-destructive' : '')}>
                {weeklyStats.countChange > 0 ? '+' : ''}{weeklyStats.countChange}%
              </span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-foreground">{weeklyStats.ciCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Check-ins</p>
            {weeklyStats.lastCount > 0 && (
              <p className="text-xs text-muted-foreground">vs {weeklyStats.lastCount} last wk</p>
            )}
          </div>
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-semibold text-foreground">
              {weeklyStats.avgCompliance ?? '–'}{weeklyStats.avgCompliance != null && '%'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Compliance</p>
          </div>
          <div className="flex items-center gap-2 border border-border rounded-lg p-2.5">
            <Moon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{weeklyStats.avgSleep ?? '–'}<span className="text-xs font-normal text-muted-foreground"> hrs</span></p>
              <p className="text-xs text-muted-foreground">Avg Sleep</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-border rounded-lg p-2.5">
            <Smile className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">{weeklyStats.avgMood ?? '–'}<span className="text-xs font-normal text-muted-foreground">/5</span></p>
              <p className="text-xs text-muted-foreground">Avg Mood</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section B: 4-Week Compliance Trend ── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Compliance Trend</h3>
        <ResponsiveContainer width="100%" height={110}>
          <BarChart data={weeklyTrend} barCategoryGap="25%">
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={28} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgb(var(--border))', boxShadow: 'none' }}
              formatter={(v) => [`${v}%`, 'Compliance']}
            />
            <Bar dataKey="value" radius={[3, 3, 0, 0]} fill="rgb(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Section C: At-Risk Clients ── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">At-Risk</h3>
        {atRiskClients.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">All clients on track</p>
        ) : (
          <div className="space-y-1">
            {atRiskClients.map(({ ci, client, score, flags }) => (
              <div key={ci.id} className="flex items-center gap-2.5 py-2 border-b border-muted last:border-0">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-xs shrink-0">
                  {(client?.name || ci.client_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{client?.name || ci.client_name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{flags.slice(0, 2).join(' · ')}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {score !== null && (
                    <span className="text-xs font-medium text-destructive">{score}%</span>
                  )}
                  <button
                    onClick={() => navigate(`/messages?clientId=${ci.client_id}`)}
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Section D: Top Performers ── */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Top Performers</h3>
        {topPerformers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No top performers yet this week</p>
        ) : (
          <div className="space-y-1">
            {topPerformers.map(({ ci, client, score, streak }, idx) => (
              <div key={ci.id} className="flex items-center gap-2.5 py-2 border-b border-muted last:border-0">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-xs shrink-0">
                  {(client?.name || ci.client_name || '?')[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{client?.name || ci.client_name}</p>
                  {streak > 1 && <p className="text-[10px] text-muted-foreground">{streak}-check streak</p>}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {idx === 0 && <span className="text-xs">🏆</span>}
                  {score !== null && (
                    <span className="text-xs font-medium text-success">{score}%</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}