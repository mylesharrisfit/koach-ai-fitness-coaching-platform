import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
      <p className="text-xs text-foreground mb-1">{label}</p>
      <p className="text-base font-bold text-success">${payload[0].value.toLocaleString()}</p>
    </div>
  );
};

export default function StripeRevenueChart({ data }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
      <h3 className="text-xs font-bold text-foreground uppercase tracking-widest mb-5">Revenue — Last 6 Months</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(162 72% 42%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(162 72% 42%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="hsl(162 72% 42%)" strokeWidth={2} fill="url(#revenueGrad)" dot={{ r: 3, fill: 'hsl(162 72% 42%)' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}