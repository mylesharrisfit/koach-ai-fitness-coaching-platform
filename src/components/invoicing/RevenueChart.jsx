import React, { useMemo } from 'react';
import { Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgb(var(--foreground))', borderRadius: 10, padding: '10px 14px', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: 'rgb(var(--card))', fontSize: 16, fontWeight: 700 }}>${Number(payload[0]?.value || 0).toLocaleString()}</div>
    </div>
  );
};

export default function RevenueChart({ invoices = [] }) {
  const data = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 11 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const revenue = invoices
        .filter(inv => inv.status === 'paid' && inv.paid_date)
        .filter(inv => { try { return isWithinInterval(parseISO(inv.paid_date), { start, end }); } catch { return false; } })
        .reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
      return { month: format(d, 'MMM yy'), revenue };
    });
    return months;
  }, [invoices]);

  return (
    <div style={{ background: 'rgb(var(--card))', borderRadius: 16, border: '1px solid rgb(var(--muted))', padding: '20px 20px 12px' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))', margin: '0 0 16px' }}>Monthly Revenue</h3>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} barCategoryGap="30%">
          <defs>
            <linearGradient id="revGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--primary))" />
              <stop offset="100%" stopColor="rgb(var(--ai))" />
            </linearGradient>
          </defs>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'rgb(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '' : `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.05)' }} />
          <Bar dataKey="revenue" fill="url(#revGradient)" radius={[6, 6, 0, 0]} />
          <Line type="monotone" dataKey="revenue" stroke="rgb(var(--warning))" strokeWidth={2} dot={false} strokeDasharray="4 2" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}