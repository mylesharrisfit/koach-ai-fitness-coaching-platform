import React, { useMemo, useState } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks, subDays, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { TrendingUp, BarChart2 } from 'lucide-react';

const RANGE_OPTIONS = [
  { key: 'this_week',  label: 'This Week' },
  { key: 'last_week',  label: 'Last Week' },
  { key: 'last_30',   label: 'Last 30 Days' },
  { key: 'last_90',   label: 'Last 90 Days' },
];

function getDateRange(key) {
  const now = new Date();
  switch (key) {
    case 'this_week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'last_week': {
      const s = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
      return { start: s, end: endOfWeek(s, { weekStartsOn: 1 }) };
    }
    case 'last_30':
      return { start: subDays(now, 29), end: now };
    case 'last_90':
      return { start: subDays(now, 89), end: now };
    default:
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }
}

function getBarLabel(key, date) {
  if (key === 'last_30' || key === 'last_90') return format(date, 'MMM d');
  return format(date, 'EEE').slice(0, 3);
}

function groupByDay(items, dateField, range, rangeKey) {
  const days = eachDayOfInterval({ start: range.start, end: range.end });
  // For 30/90 days, bucket by week
  if (rangeKey === 'last_30' || rangeKey === 'last_90') {
    const buckets = [];
    for (let i = 0; i < days.length; i += 7) {
      const weekDays = days.slice(i, i + 7);
      const count = items.filter(item => {
        const d = parseISO(item[dateField]);
        return weekDays.some(wd => format(wd, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'));
      }).length;
      buckets.push({ label: format(weekDays[0], 'MMM d'), count });
    }
    return buckets;
  }
  return days.map(day => ({
    label: format(day, 'EEE').slice(0, 3),
    count: items.filter(item => format(parseISO(item[dateField]), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length,
  }));
}

const GRAD_COLORS = ['#3b82f6', '#6366f1', '#8b5cf6'];

function CustomBar(props) {
  const { x, y, width, height, index, total } = props;
  const colorIndex = Math.floor((index / Math.max(total - 1, 1)) * (GRAD_COLORS.length - 1));
  const color = GRAD_COLORS[Math.min(colorIndex, GRAD_COLORS.length - 1)];
  return <rect x={x} y={y} width={width} height={height} rx={4} fill={color} opacity={height === 0 ? 0.2 : 1} />;
}

function MiniChart({ title, summary, chart }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <p className="text-xs font-bold text-gray-700">{title}</p>
      <div className="h-28">{chart}</div>
      <p className="text-[11px] text-gray-400 font-medium">{summary}</p>
    </div>
  );
}

export default function WeeklySnapshot({ checkIns = [], clients = [] }) {
  const [range, setRange] = useState('this_week');
  const dateRange = useMemo(() => getDateRange(range), [range]);

  // Chart 1 — Check-in adherence
  const checkInData = useMemo(() => {
    const items = checkIns.filter(ci => {
      const d = parseISO(ci.date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
    return groupByDay(items, 'date', dateRange, range);
  }, [checkIns, dateRange, range]);

  const totalCheckIns = useMemo(() => checkInData.reduce((s, d) => s + d.count, 0), [checkInData]);

  // Chart 2 — New clients joined
  const newClientData = useMemo(() => {
    const items = clients.filter(c => {
      if (!c.created_date) return false;
      const d = parseISO(c.created_date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end });
    });
    return groupByDay(items, 'created_date', dateRange, range);
  }, [clients, dateRange, range]);

  const totalNewClients = useMemo(() => newClientData.reduce((s, d) => s + d.count, 0), [newClientData]);

  // Chart 3 — Avg training compliance
  const complianceData = useMemo(() => {
    const items = checkIns.filter(ci => {
      const d = parseISO(ci.date);
      return isWithinInterval(d, { start: dateRange.start, end: dateRange.end }) && ci.compliance_training != null;
    });
    if (range === 'last_30' || range === 'last_90') {
      const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
      const buckets = [];
      for (let i = 0; i < days.length; i += 7) {
        const weekDays = days.slice(i, i + 7);
        const bucket = items.filter(ci => weekDays.some(wd => format(parseISO(ci.date), 'yyyy-MM-dd') === format(wd, 'yyyy-MM-dd')));
        const avg = bucket.length ? Math.round(bucket.reduce((s, ci) => s + ci.compliance_training, 0) / bucket.length) : 0;
        buckets.push({ label: format(weekDays[0], 'MMM d'), count: avg });
      }
      return buckets;
    }
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map(day => {
      const bucket = items.filter(ci => format(parseISO(ci.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'));
      const avg = bucket.length ? Math.round(bucket.reduce((s, ci) => s + ci.compliance_training, 0) / bucket.length) : 0;
      return { label: format(day, 'EEE').slice(0, 3), count: avg };
    });
  }, [checkIns, dateRange, range]);

  const avgCompliance = useMemo(() => {
    const vals = complianceData.filter(d => d.count > 0);
    return vals.length ? Math.round(vals.reduce((s, d) => s + d.count, 0) / vals.length) : 0;
  }, [complianceData]);

  const axisStyle = { fontSize: 10, fill: '#9ca3af' };

  return (
    <div className="rounded-xl bg-white border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))' }}>
            <BarChart2 className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Weekly Snapshot</h2>
        </div>
        <select
          value={range}
          onChange={e => setRange(e.target.value)}
          className="text-xs font-semibold border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-300 cursor-pointer"
        >
          {RANGE_OPTIONS.map(o => (
            <option key={o.key} value={o.key}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Charts */}
      <div className="px-5 py-4 flex flex-col sm:flex-row gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
        {/* Chart 1 */}
        <MiniChart
          title="Check-in Adherence"
          summary={`${totalCheckIns} check-in${totalCheckIns !== 1 ? 's' : ''} this period`}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={checkInData} barSize={14} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                  formatter={(v) => [v, 'Check-ins']}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {checkInData.map((_, i) => (
                    <Cell key={i} fill={i < checkInData.length / 2 ? '#3b82f6' : '#6366f1'} fillOpacity={_ .count === 0 ? 0.2 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          }
        />

        {/* Chart 2 */}
        <div className="sm:pl-6 flex-1 min-w-0">
          <MiniChart
            title="New Clients"
            summary={`${totalNewClients} new client${totalNewClients !== 1 ? 's' : ''} added`}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={newClientData} barSize={14} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    formatter={(v) => [v, 'New Clients']}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {newClientData.map((entry, i) => (
                      <Cell key={i} fill="#10b981" fillOpacity={entry.count === 0 ? 0.2 : 1} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            }
          />
        </div>

        {/* Chart 3 */}
        <div className="sm:pl-6 flex-1 min-w-0">
          <MiniChart
            title="Avg Training Compliance"
            summary={`${avgCompliance}% avg compliance`}
            chart={
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={complianceData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis dataKey="label" tick={axisStyle} axisLine={false} tickLine={false} />
                  <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    formatter={(v) => [`${v}%`, 'Compliance']}
                  />
                  <Line
                    type="monotone" dataKey="count" stroke="#f59e0b"
                    strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            }
          />
        </div>
      </div>
    </div>
  );
}