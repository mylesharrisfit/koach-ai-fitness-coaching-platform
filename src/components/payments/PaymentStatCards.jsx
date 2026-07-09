import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, RefreshCcw, TrendingUp } from 'lucide-react';
import {
  startOfMonth, endOfMonth, parseISO, isWithinInterval
} from 'date-fns';

function StatCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div style={{ background: 'var(--tc-card)', border: '1px solid var(--tc-muted)', borderRadius: 14, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={color} />
        </div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--tc-foreground)', letterSpacing: '-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function fmt(n) {
  if (n === undefined || n === null) return '$0';
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Number(n).toFixed(0)}`;
}

export default function PaymentStatCards({ payments = [] }) {
  const now = new Date();
  const mStart = startOfMonth(now);
  const mEnd = endOfMonth(now);

  const inMonth = (dateStr) => {
    try { return isWithinInterval(parseISO(dateStr), { start: mStart, end: mEnd }); }
    catch { return false; }
  };

  const collected = payments
    .filter(p => p.status === 'paid' && p.paid_date && inMonth(p.paid_date))
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const pending = payments
    .filter(p => p.status === 'pending')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const overdue = payments
    .filter(p => p.status === 'failed')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const refunded = payments
    .filter(p => p.status === 'refunded')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const allCollected = payments
    .filter(p => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount || 0), 0);

  const net = allCollected - refunded;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
      <StatCard icon={CheckCircle2} label="Collected This Month" value={fmt(collected)} sub="Payments received" color="var(--tc-success)" bg="var(--tc-success)" />
      <StatCard icon={Clock} label="Pending" value={fmt(pending)} sub="Expected" color="var(--tc-primary)" bg="var(--tc-accent)" />
      <StatCard icon={AlertTriangle} label="Overdue / Failed" value={fmt(overdue)} sub={`${payments.filter(p => p.status === 'failed').length} payments`} color="var(--tc-destructive)" bg="var(--tc-destructive)" />
      <StatCard icon={RefreshCcw} label="Refunded" value={fmt(refunded)} sub="Total refunds" color="var(--tc-warning)" bg="var(--tc-warning)" />
      <StatCard icon={TrendingUp} label="Net Revenue" value={fmt(net)} sub="Collected minus refunds" color="var(--tc-ai)" bg="var(--tc-ai)" />
    </div>
  );
}