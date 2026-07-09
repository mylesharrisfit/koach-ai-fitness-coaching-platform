import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { subMonths, format, startOfMonth, parseISO, endOfMonth } from 'date-fns';

const RANGES = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1Y', months: 12 },
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sidebar text-white rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold mb-2 text-border">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">${(p.value || 0).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function BIRevenueChart({ clients, payments }) {
  const [range, setRange] = useState(6);

  const data = useMemo(() => {
    const months = Array.from({ length: range }, (_, i) => {
      const d = subMonths(new Date(), range - 1 - i);
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);

      // Active clients in that month
      const activeThen = clients.filter(c => {
        const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
        return sd && sd <= monthEnd && (c.lifecycle_status === 'active' || c.lifecycle_status === 'at_risk' || !c.lifecycle_status || c.status === 'active');
      });

      const newClients = clients.filter(c => {
        const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
        return sd && sd >= monthStart && sd <= monthEnd;
      });

      const mrr = activeThen.reduce((s, c) => s + (c.monthly_rate || 0), 0);
      const newRevenue = newClients.reduce((s, c) => s + (c.monthly_rate || 0), 0);

      return {
        month: format(d, 'MMM yy'),
        mrr,
        newRevenue,
        existingRevenue: Math.max(0, mrr - newRevenue),
      };
    });
    return months;
  }, [clients, range, payments]);

  const maxMrr = Math.max(...data.map(d => d.mrr), 1);
  // Milestone markers
  const milestones = [1000, 5000, 10000].filter(m => m <= maxMrr * 1.2 && m > 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-foreground">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Monthly Recurring Revenue over time</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map(r => (
            <button key={r.label} onClick={() => setRange(r.months)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${range === r.months ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-border'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--tc-primary)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--tc-primary)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--tc-success)" stopOpacity={0.15} />
              <stop offset="95%" stopColor="var(--tc-success)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-muted)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false}
            tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
          <Tooltip content={<CustomTooltip />} />
          {milestones.map(m => (
            <ReferenceLine key={m} y={m} stroke="var(--tc-warning)" strokeDasharray="4 4"
              label={{ value: `$${m >= 1000 ? m / 1000 + 'k' : m} MRR`, position: 'right', fontSize: 9, fill: 'var(--tc-warning)' }} />
          ))}
          <Area type="monotone" dataKey="existingRevenue" name="Existing Clients" stroke="var(--tc-primary)" strokeWidth={2} fill="url(#mrrGrad)" dot={false} />
          <Area type="monotone" dataKey="newRevenue" name="New Clients" stroke="var(--tc-success)" strokeWidth={2} fill="url(#newGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>

      <div className="flex gap-4 mt-2">
        {[
          { color: 'var(--tc-primary)', label: 'Existing Revenue' },
          { color: 'var(--tc-success)', label: 'New Client Revenue' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}