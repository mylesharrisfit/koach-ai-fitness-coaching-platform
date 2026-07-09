import React, { useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns';
import { Calendar, AlertTriangle } from 'lucide-react';

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--success))', 'rgb(var(--warning))', 'rgb(var(--destructive))'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function UpcomingPayments({ invoices = [], payments = [] }) {
  const now = new Date();
  const in30 = addDays(now, 30);

  const upcoming = useMemo(() => {
    return invoices
      .filter(inv => ['sent', 'viewed', 'draft'].includes(inv.status) && inv.due_date)
      .filter(inv => {
        try {
          const d = parseISO(inv.due_date);
          return isAfter(d, now) && isBefore(d, in30);
        } catch { return false; }
      })
      .sort((a, b) => (a.due_date > b.due_date ? 1 : -1));
  }, [invoices]);

  const total = upcoming.reduce((s, i) => s + Number(i.amount || 0), 0);

  if (upcoming.length === 0) {
    return (
      <div style={{ background: 'rgb(var(--card))', borderRadius: 14, border: '1px solid rgb(var(--muted))', padding: '24px', textAlign: 'center' }}>
        <Calendar size={28} color="rgb(var(--muted-foreground))" style={{ margin: '0 auto 8px' }} />
        <p style={{ fontSize: 13, color: 'rgb(var(--muted-foreground))', margin: 0 }}>No upcoming payments in the next 30 days</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgb(var(--card))', borderRadius: 14, border: '1px solid rgb(var(--muted))', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid rgb(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={15} color="rgb(var(--primary))" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--foreground))' }}>Upcoming Payments — Next 30 Days</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 800, color: 'rgb(var(--success))' }}>${total.toFixed(2)} expected</span>
      </div>
      {upcoming.map(inv => {
        const daysLeft = Math.ceil((parseISO(inv.due_date) - now) / 86400000);
        const atRisk = daysLeft <= 3;
        return (
          <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgb(var(--background))', background: atRisk ? 'rgb(var(--warning))' : 'rgb(var(--card))' }}>
            <Avatar name={inv.client_name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>{inv.client_name}</div>
              <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>{inv.description || inv.invoice_number}</div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--foreground))' }}>${Number(inv.amount).toFixed(2)}</div>
              <div style={{ fontSize: 11, color: atRisk ? 'rgb(var(--warning))' : 'rgb(var(--muted-foreground))', display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                {atRisk && <AlertTriangle size={10} />}
                Due {format(parseISO(inv.due_date), 'MMM d')} ({daysLeft}d)
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}