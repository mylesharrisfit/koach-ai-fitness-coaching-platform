import React, { useState, useMemo } from 'react';
import { subWeeks, parseISO, format, startOfWeek } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import { averageAdherenceScore } from '@/lib/adherence';

const CHART_TABS = ['Overall', 'Workout', 'Nutrition'];
const COLORS = ['var(--tc-primary)', 'var(--tc-success)', 'var(--tc-warning)', 'var(--tc-ai)', 'var(--tc-destructive)', 'var(--kc-06b6d4)', 'var(--kc-ec4899)', 'var(--kc-84cc16)'];

function buildWeeklyData(clients, cisByClient, key, rangeWeeks) {
  const weeks = [];
  for (let i = rangeWeeks - 1; i >= 0; i--) {
    const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const weekEnd = subWeeks(new Date(), i - 1);
    const point = { week: format(weekStart, 'MMM d') };
    let teamTotal = 0; let teamCount = 0;
    for (const client of clients) {
      const cis = (cisByClient[client.id] || []).filter(ci => {
        const d = parseISO(ci.date);
        return d >= weekStart && d < weekEnd;
      });
      if (!cis.length) { point[client.id] = null; continue; }
      let val;
      if (key === 'overall') val = averageAdherenceScore(cis);
      else if (key === 'workout') {
        const vals = cis.map(ci => ci.compliance_training).filter(v => v != null);
        val = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      } else {
        const vals = cis.map(ci => ci.compliance_nutrition).filter(v => v != null);
        val = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      }
      point[client.id] = val;
      if (val !== null) { teamTotal += val; teamCount++; }
    }
    point.team_avg = teamCount ? Math.round(teamTotal / teamCount) : null;
    weeks.push(point);
  }
  return weeks;
}

const CustomTooltip = ({ active, payload, label, clients }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[140px]">
      <p className="font-bold text-foreground mb-2">{label}</p>
      {payload.map((p, i) => {
        const clientName = p.dataKey === 'team_avg' ? 'Team Avg' : clients.find(c => c.id === p.dataKey)?.name || p.dataKey;
        return (
          <div key={i} className="flex items-center justify-between gap-3 mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-foreground">{clientName}</span>
            </div>
            <span className="font-bold" style={{ color: p.color }}>{p.value !== null ? `${p.value}%` : '—'}</span>
          </div>
        );
      })}
    </div>
  );
};

export default function AdherenceTrends({ clients, checkIns, rangeWeeks }) {
  const [tab, setTab] = useState('Overall');
  const [hiddenClients, setHiddenClients] = useState(new Set());

  const cisByClient = useMemo(() => {
    const map = {};
    for (const ci of checkIns) (map[ci.client_id] = map[ci.client_id] || []).push(ci);
    return map;
  }, [checkIns]);

  const chartData = useMemo(() =>
    buildWeeklyData(clients, cisByClient, tab.toLowerCase(), Math.min(rangeWeeks, 12)),
    [clients, cisByClient, tab, rangeWeeks]
  );

  const toggleClient = (id) => {
    setHiddenClients(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Summary stats
  const summary = useMemo(() => {
    const key = tab === 'Overall' ? 'overall' : tab === 'Workout' ? 'workout' : 'nutrition';
    const scored = clients.map(client => {
      const cis = cisByClient[client.id] || [];
      const sorted = [...cis].sort((a, b) => new Date(b.date) - new Date(a.date));
      const cutoff = subWeeks(new Date(), rangeWeeks);
      const inRange = sorted.filter(ci => parseISO(ci.date) >= cutoff);
      const prevInRange = sorted.filter(ci => {
        const d = parseISO(ci.date);
        return d >= subWeeks(new Date(), rangeWeeks * 2) && d < cutoff;
      });
      let val;
      if (key === 'overall') val = inRange.length ? averageAdherenceScore(inRange) : null;
      else {
        const field = key === 'workout' ? 'compliance_training' : 'compliance_nutrition';
        const vals = inRange.map(ci => ci[field]).filter(v => v != null);
        val = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      }
      let prevVal = null;
      if (key === 'overall') prevVal = prevInRange.length ? averageAdherenceScore(prevInRange) : null;
      else {
        const field = key === 'workout' ? 'compliance_training' : 'compliance_nutrition';
        const vals = prevInRange.map(ci => ci[field]).filter(v => v != null);
        prevVal = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
      }
      return { client, val, improvement: val !== null && prevVal !== null ? val - prevVal : null };
    }).filter(x => x.val !== null);

    const best = scored.sort((a, b) => b.val - a.val)[0];
    const mostImproved = scored.filter(x => x.improvement !== null).sort((a, b) => b.improvement - a.improvement)[0];
    const needsAttention = scored.sort((a, b) => a.val - b.val)[0];
    return { best, mostImproved, needsAttention };
  }, [clients, cisByClient, tab, rangeWeeks]);

  const visibleClients = clients.slice(0, 8);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground mr-3">Adherence Trends</p>
        {CHART_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              tab === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-border')}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Client legend toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-8 h-0.5 bg-sidebar" style={{ borderTop: '2px dashed var(--tc-foreground)' }} />
            <span className="text-[10px] text-muted-foreground font-medium">Team Avg</span>
          </div>
          {visibleClients.map((c, i) => (
            <button key={c.id} onClick={() => toggleClient(c.id)}
              className={cn('flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border transition-all',
                hiddenClients.has(c.id) ? 'opacity-40 line-through' : '')}>
              <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {c.name}
            </button>
          ))}
        </div>

        {/* Chart */}
        {chartData.length < 2 ? (
          <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
            Not enough data — log more check-ins to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-muted)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip clients={visibleClients} />} />
              {/* Team avg dashed */}
              <Line type="monotone" dataKey="team_avg" stroke="var(--tc-foreground)" strokeWidth={2} strokeDasharray="6 3"
                dot={false} connectNulls name="Team Avg" />
              {/* Per-client lines */}
              {visibleClients.map((c, i) => (
                !hiddenClients.has(c.id) && (
                  <Line key={c.id} type="monotone" dataKey={c.id} stroke={COLORS[i % COLORS.length]}
                    strokeWidth={1.5} dot={{ r: 2.5, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                    activeDot={{ r: 4 }} connectNulls />
                )
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* Summary pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {summary.best && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-success/10 border border-success">
              <span className="text-success text-lg">🏆</span>
              <div className="min-w-0">
                <p className="text-[10px] text-success font-semibold uppercase tracking-wide">Best This Period</p>
                <p className="text-xs font-bold text-success truncate">{summary.best.client.name}</p>
                <p className="text-[10px] text-success">{summary.best.val}% adherence</p>
              </div>
            </div>
          )}
          {summary.mostImproved && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent border border-accent">
              <span className="text-primary text-lg">📈</span>
              <div className="min-w-0">
                <p className="text-[10px] text-primary font-semibold uppercase tracking-wide">Most Improved</p>
                <p className="text-xs font-bold text-primary truncate">{summary.mostImproved.client.name}</p>
                <p className="text-[10px] text-primary">+{summary.mostImproved.improvement}% vs last period</p>
              </div>
            </div>
          )}
          {summary.needsAttention && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-destructive/10 border border-destructive">
              <span className="text-destructive text-lg">⚠️</span>
              <div className="min-w-0">
                <p className="text-[10px] text-destructive font-semibold uppercase tracking-wide">Needs Attention</p>
                <p className="text-xs font-bold text-destructive truncate">{summary.needsAttention.client.name}</p>
                <p className="text-[10px] text-destructive">{summary.needsAttention.val}% adherence</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}