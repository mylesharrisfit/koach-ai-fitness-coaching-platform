import React from 'react';
import { DollarSign, TrendingUp, Clock, AlertTriangle, BarChart2 } from 'lucide-react';
import { startOfMonth, endOfMonth, subMonths, parseISO, isWithinInterval } from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--muted))', borderRadius: 14, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'rgb(var(--foreground))', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>{sub}</div>}
    </div>
  );
}

export default function InvoiceStatCards({ invoices = [] }) {
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const inRange = (dateStr, start, end) => {
    try { return isWithinInterval(parseISO(dateStr), { start, end }); } catch { return false; }
  };

  const paid = invoices.filter(i => i.status === 'paid');
  const totalRevenue = paid.reduce((s, i) => s + Number(i.amount || 0), 0);

  const thisMonthRev = paid.filter(i => i.paid_date && inRange(i.paid_date, thisMonthStart, thisMonthEnd))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const lastMonthRev = paid.filter(i => i.paid_date && inRange(i.paid_date, lastMonthStart, lastMonthEnd))
    .reduce((s, i) => s + Number(i.amount || 0), 0);
  const moPct = lastMonthRev === 0 ? null : Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);

  const outstanding = invoices.filter(i => ['sent', 'viewed', 'draft'].includes(i.status))
    .reduce((s, i) => s + Number(i.amount || 0), 0);

  const overdue = invoices.filter(i => i.status === 'overdue');
  const overdueAmt = overdue.reduce((s, i) => s + Number(i.amount || 0), 0);

  const allAmounts = invoices.filter(i => i.amount).map(i => Number(i.amount));
  const avgInvoice = allAmounts.length ? allAmounts.reduce((a, b) => a + b, 0) / allAmounts.length : 0;

  const fmt = (n) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
      <StatCard icon={DollarSign} label="Total Revenue" value={fmt(totalRevenue)} sub={`${paid.length} payments`} color="rgb(var(--success))" bg="rgb(var(--success))" />
      <StatCard icon={TrendingUp} label="This Month" value={fmt(thisMonthRev)} sub={moPct === null ? 'No prior data' : `${moPct >= 0 ? '+' : ''}${moPct}% vs last month`} color="rgb(var(--primary))" bg="rgb(var(--accent))" />
      <StatCard icon={Clock} label="Outstanding" value={fmt(outstanding)} sub="Awaiting payment" color="rgb(var(--warning))" bg="rgb(var(--warning))" />
      <StatCard icon={AlertTriangle} label="Overdue" value={fmt(overdueAmt)} sub={`${overdue.length} invoice${overdue.length !== 1 ? 's' : ''}`} color="rgb(var(--destructive))" bg="rgb(var(--destructive))" />
      <StatCard icon={BarChart2} label="Avg Invoice" value={fmt(avgInvoice)} sub="Per invoice" color="rgb(var(--ai))" bg="rgb(var(--ai))" />
    </div>
  );
}