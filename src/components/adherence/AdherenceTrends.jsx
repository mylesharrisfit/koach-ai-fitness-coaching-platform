import React, { useState, useMemo } from 'react';
import { subWeeks, parseISO, format, startOfWeek } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts';
import { cn } from '@/lib/utils';
import { averageAdherenceScore } from '@/lib/adherence';

const CHART_TABS = ['Overall', 'Workout', 'Nutrition'];
const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#7C3AED', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

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
    <div className="bg-white border border-[#E5E7EB] rounded-xl px-3 py-2.5 shadow-xl text-xs min-w-[140px]">
      <p className="font-bold text-[#111827] mb-2">{label}</p>
      {payload.map((p, i) => {
        const clientName = p.dataKey === 'team_avg' ? 'Team Avg' : clients.find(c => c.id === p.dataKey)?.name || p.dataKey;
        return (
          <div key={i} className="flex items-center justify-between gap-3 mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="text-[#374151]">{clientName}</span>
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
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 py-3 border-b border-[#E5E7EB]">
        <p className="text-sm font-semibold text-[#111827] mr-3">Adherence Trends</p>
        {CHART_TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-3 py-1 rounded-lg text-xs font-semibold transition-all',
              tab === t ? 'bg-primary text-white' : 'bg-[#F3F4F6] text-[#374151] hover:bg-[#E5E7EB]')}>
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Client legend toggles */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-8 h-0.5 bg-[#111827]" style={{ borderTop: '2px dashed #111827' }} />
            <span className="text-[10px] text-[#6B7280] font-medium">Team Avg</span>
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
          <div className="flex items-center justify-center h-48 text-sm text-[#9CA3AF]">
            Not enough data — log more check-ins to see trends.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip clients={visibleClients} />} />
              {/* Team avg dashed */}
              <Line type="monotone" dataKey="team_avg" stroke="#111827" strokeWidth={2} strokeDasharray="6 3"
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
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-emerald-600 text-lg">🏆</span>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Best This Period</p>
                <p className="text-xs font-bold text-emerald-800 truncate">{summary.best.client.name}</p>
                <p className="text-[10px] text-emerald-600">{summary.best.val}% adherence</p>
              </div>
            </div>
          )}
          {summary.mostImproved && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <span className="text-blue-600 text-lg">📈</span>
              <div className="min-w-0">
                <p className="text-[10px] text-blue-600 font-semibold uppercase tracking-wide">Most Improved</p>
                <p className="text-xs font-bold text-blue-800 truncate">{summary.mostImproved.client.name}</p>
                <p className="text-[10px] text-blue-600">+{summary.mostImproved.improvement}% vs last period</p>
              </div>
            </div>
          )}
          {summary.needsAttention && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <span className="text-red-500 text-lg">⚠️</span>
              <div className="min-w-0">
                <p className="text-[10px] text-red-500 font-semibold uppercase tracking-wide">Needs Attention</p>
                <p className="text-xs font-bold text-red-700 truncate">{summary.needsAttention.client.name}</p>
                <p className="text-[10px] text-red-500">{summary.needsAttention.val}% adherence</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}