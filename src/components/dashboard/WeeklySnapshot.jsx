import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { startOfWeek, endOfWeek, subWeeks, subDays, format, isWithinInterval, parseISO } from 'date-fns';

const RANGES = [
  { key: 'this_week',  label: 'This Week' },
  { key: 'last_week',  label: 'Last Week' },
  { key: 'last_30',   label: 'Last 30 Days' },
  { key: 'last_90',   label: 'Last 90 Days' },
];

function getRange(key) {
  const now = new Date();
  switch (key) {
    case 'this_week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'last_week': {
      const lw = subWeeks(now, 1);
      return { start: startOfWeek(lw, { weekStartsOn: 1 }), end: endOfWeek(lw, { weekStartsOn: 1 }) };
    }
    case 'last_30':
      return { start: subDays(now, 29), end: now };
    case 'last_90':
      return { start: subDays(now, 89), end: now };
    default:
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
  }
}

// Generate day-by-day buckets for week views, or week buckets for longer ranges
function buildCheckinBuckets(rangeKey, checkIns) {
  const { start, end } = getRange(rangeKey);
  const inRange = checkIns.filter(ci => {
    try { return isWithinInterval(parseISO(ci.date), { start, end }); } catch { return false; }
  });

  if (rangeKey === 'this_week' || rangeKey === 'last_week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts = {};
    days.forEach(d => counts[d] = 0);
    inRange.forEach(ci => {
      const day = format(parseISO(ci.date), 'EEE');
      if (counts[day] !== undefined) counts[day]++;
    });
    return days.map(d => ({ label: d, value: counts[d] }));
  } else {
    // Weekly buckets
    const buckets = {};
    inRange.forEach(ci => {
      const weekStart = format(startOfWeek(parseISO(ci.date), { weekStartsOn: 1 }), 'MMM d');
      buckets[weekStart] = (buckets[weekStart] || 0) + 1;
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }
}

function buildWorkoutBuckets(rangeKey, sessions) {
  const { start, end } = getRange(rangeKey);
  const inRange = sessions.filter(s => {
    try { return isWithinInterval(parseISO(s.date), { start, end }); } catch { return false; }
  });

  if (rangeKey === 'this_week' || rangeKey === 'last_week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const completed = {}, total = {};
    days.forEach(d => { completed[d] = 0; total[d] = 0; });
    inRange.forEach(s => {
      const day = format(parseISO(s.date), 'EEE');
      if (total[day] !== undefined) {
        total[day]++;
        if (s.status === 'completed') completed[day]++;
      }
    });
    return days.map(d => ({ label: d, completed: completed[d], total: total[d] }));
  } else {
    const buckets = {};
    inRange.forEach(s => {
      const weekStart = format(startOfWeek(parseISO(s.date), { weekStartsOn: 1 }), 'MMM d');
      if (!buckets[weekStart]) buckets[weekStart] = { label: weekStart, completed: 0, total: 0 };
      buckets[weekStart].total++;
      if (s.status === 'completed') buckets[weekStart].completed++;
    });
    return Object.values(buckets);
  }
}

function buildRevenueBuckets(rangeKey, payments) {
  const { start, end } = getRange(rangeKey);
  const inRange = payments.filter(p => {
    const d = p.paid_date || p.created_date;
    if (!d) return false;
    try { return isWithinInterval(parseISO(d.split('T')[0]), { start, end }); } catch { return false; }
  });

  if (rangeKey === 'this_week' || rangeKey === 'last_week') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const totals = {};
    days.forEach(d => totals[d] = 0);
    inRange.forEach(p => {
      const dateStr = (p.paid_date || p.created_date || '').split('T')[0];
      const day = format(parseISO(dateStr), 'EEE');
      if (totals[day] !== undefined) totals[day] += (p.amount || 0);
    });
    return days.map(d => ({ label: d, value: totals[d] }));
  } else {
    const buckets = {};
    inRange.forEach(p => {
      const dateStr = (p.paid_date || p.created_date || '').split('T')[0];
      const weekStart = format(startOfWeek(parseISO(dateStr), { weekStartsOn: 1 }), 'MMM d');
      buckets[weekStart] = (buckets[weekStart] || 0) + (p.amount || 0);
    });
    return Object.entries(buckets).map(([label, value]) => ({ label, value }));
  }
}

// Gradient bar fill via a linearGradient def
const GRAD_ID = 'barGrad';

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg"
      style={{ background: '#1e293b', color: '#fff' }}>
      <span style={{ opacity: 0.6 }}>{label}: </span>
      {prefix}{payload[0].value}{suffix}
    </div>
  );
}

function MiniChart({ title, summary, children }) {
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-2">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{title}</p>
      <div className="h-32">{children}</div>
      <p className="text-[11px] text-gray-400 font-medium">{summary}</p>
    </div>
  );
}

export default function WeeklySnapshot({ checkIns = [], sessions = [], payments = [] }) {
  const [range, setRange] = useState('this_week');

  const checkinData = useMemo(() => buildCheckinBuckets(range, checkIns), [range, checkIns]);
  const sessionData = useMemo(() => buildWorkoutBuckets(range, sessions), [range, sessions]);
  const revenueData = useMemo(() => buildRevenueBuckets(range, payments), [range, payments]);

  const totalCheckins = checkinData.reduce((s, d) => s + d.value, 0);
  const totalSessions = sessionData.reduce((s, d) => s + d.total, 0);
  const completedSessions = sessionData.reduce((s, d) => s + d.completed, 0);
  const totalRevenue = revenueData.reduce((s, d) => s + d.value, 0);

  const sessionChartData = sessionData.map(d => ({
    ...d,
    missed: d.total - d.completed,
  }));

  return (
    <div className="rounded-xl bg-white border border-gray-100 overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))' }}>
            <BarChart2 className="w-3.5 h-3.5" style={{ color: '#8b5cf6' }} />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Weekly Snapshot</h2>
        </div>
        <select
          value={range}
          onChange={e => setRange(e.target.value)}
          className="text-xs font-semibold rounded-lg px-2.5 py-1.5 border border-gray-200 bg-gray-50 text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {RANGES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </div>

      {/* Charts */}
      <div className="px-5 py-4 flex flex-col sm:flex-row gap-6 sm:divide-x divide-gray-100">

        {/* Chart 1 — Check-in Adherence */}
        <MiniChart
          title="Check-in Adherence"
          summary={`${totalCheckins} check-in${totalCheckins !== 1 ? 's' : ''} this period`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={checkinData} barCategoryGap="30%">
              <defs>
                <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" check-ins" />} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" fill={`url(#${GRAD_ID})`} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </MiniChart>

        {/* Chart 2 — Session Completion */}
        <div className="sm:pl-6 flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Session Completion</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sessionChartData} barCategoryGap="30%" barGap={2}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold shadow-lg"
                        style={{ background: '#1e293b', color: '#fff' }}>
                        <div style={{ opacity: 0.6, marginBottom: 2 }}>{label}</div>
                        <div>✓ {payload.find(p => p.dataKey === 'completed')?.value ?? 0} done</div>
                        <div style={{ color: '#f87171' }}>✗ {payload.find(p => p.dataKey === 'missed')?.value ?? 0} missed</div>
                      </div>
                    );
                  }}
                  cursor={{ fill: '#f3f4f6' }}
                />
                <Bar dataKey="completed" fill="url(#sessGrad)" radius={[4, 4, 0, 0]} stackId="s" />
                <Bar dataKey="missed" fill="#fee2e2" radius={[4, 4, 0, 0]} stackId="s" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            {completedSessions}/{totalSessions} session{totalSessions !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Chart 3 — Revenue */}
        <div className="sm:pl-6 flex-1 min-w-0 flex flex-col gap-2">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Revenue</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#f97316" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="url(#revGrad)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-gray-400 font-medium">
            ${totalRevenue.toLocaleString()} this period
          </p>
        </div>

      </div>
    </div>
  );
}