import React, { useMemo } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { subMonths, format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-sidebar text-white rounded-xl p-3 shadow-xl text-xs min-w-[140px]">
      <p className="font-bold mb-2 text-border">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function BIClientGrowthChart({ clients }) {
  const data = useMemo(() => {
    let runningTotal = 0;
    return Array.from({ length: 8 }, (_, i) => {
      const d = subMonths(new Date(), 7 - i);
      const monthStart = startOfMonth(d);
      const monthEnd = endOfMonth(d);

      const newClients = clients.filter(c => {
        const sd = c.start_date ? parseISO(c.start_date) : c.created_date ? new Date(c.created_date) : null;
        return sd && sd >= monthStart && sd <= monthEnd;
      }).length;

      const churned = clients.filter(c => {
        if (c.lifecycle_status !== 'completed' && c.lifecycle_status !== 'alumni') return false;
        const ud = c.updated_date ? new Date(c.updated_date) : null;
        return ud && ud >= monthStart && ud <= monthEnd;
      }).length;

      runningTotal += newClients - churned;
      return {
        month: format(d, 'MMM'),
        new: newClients,
        churned: -churned,
        total: Math.max(0, runningTotal),
      };
    });
  }, [clients]);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-foreground">Client Growth</h3>
        <p className="text-xs text-muted-foreground mt-0.5">New clients, churn, and total active count</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--tc-muted)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--tc-muted-foreground)' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="new" name="New Clients" fill="var(--tc-success)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="churned" name="Churned" fill="var(--tc-destructive)" radius={[0, 0, 3, 3]} />
          <Line type="monotone" dataKey="total" name="Total Active" stroke="var(--tc-primary)" strokeWidth={2.5} dot={{ fill: 'var(--tc-primary)', r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}