import React, { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';

export default function InvoiceSidebar({ invoices = [] }) {
  const topClients = useMemo(() => {
    const byClient = {};
    invoices.filter(i => i.status === 'paid').forEach(i => {
      if (!byClient[i.client_name]) byClient[i.client_name] = 0;
      byClient[i.client_name] += Number(i.amount || 0);
    });
    return Object.entries(byClient).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [invoices]);

  const avgDaysToPay = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid' && i.issue_date && i.paid_date);
    if (!paid.length) return null;
    const total = paid.reduce((sum, i) => {
      try { return sum + differenceInDays(parseISO(i.paid_date), parseISO(i.issue_date)); } catch { return sum; }
    }, 0);
    return Math.round(total / paid.length);
  }, [invoices]);

  const paymentMethods = useMemo(() => {
    const counts = {};
    invoices.filter(i => i.payment_method).forEach(i => {
      counts[i.payment_method] = (counts[i.payment_method] || 0) + 1;
    });
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return Object.entries(counts).map(([k, v]) => ({ method: k, pct: Math.round((v / total) * 100) })).sort((a, b) => b.pct - a.pct);
  }, [invoices]);

  const onTimeRate = useMemo(() => {
    const paid = invoices.filter(i => i.status === 'paid' && i.paid_date && i.due_date);
    if (!paid.length) return null;
    const onTime = paid.filter(i => {
      try { return parseISO(i.paid_date) <= parseISO(i.due_date); } catch { return false; }
    }).length;
    return Math.round((onTime / paid.length) * 100);
  }, [invoices]);

  const card = { background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', padding: '16px', marginBottom: 12 };
  const title = { fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 12, margin: '0 0 12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Top Clients */}
      <div style={card}>
        <h4 style={title}>Top Paying Clients</h4>
        {topClients.length === 0 ? (
          <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>No paid invoices yet</p>
        ) : topClients.map(([name, amount], i) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>{i + 1}</div>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>${amount.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* Avg days + on-time */}
      <div style={card}>
        <h4 style={title}>Payment Stats</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ textAlign: 'center', background: '#F9FAFB', borderRadius: 10, padding: '12px 8px' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{avgDaysToPay ?? '—'}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>Avg days to pay</div>
          </div>
          <div style={{ textAlign: 'center', background: '#F9FAFB', borderRadius: 10, padding: '12px 8px' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: onTimeRate >= 80 ? '#16A34A' : '#D97706' }}>{onTimeRate !== null ? `${onTimeRate}%` : '—'}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>On-time rate</div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <div style={card}>
          <h4 style={title}>Payment Methods</h4>
          {paymentMethods.map(({ method, pct }) => (
            <div key={method} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#374151', textTransform: 'capitalize' }}>{method.replace(/_/g, ' ')}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{pct}%</span>
              </div>
              <div style={{ height: 4, background: '#F3F4F6', borderRadius: 9999 }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #2563EB, #7C3AED)', borderRadius: 9999 }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}