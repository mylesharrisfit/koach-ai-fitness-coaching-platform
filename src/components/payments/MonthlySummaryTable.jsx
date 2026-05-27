import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

export default function MonthlySummaryTable({ invoices = [], payments = [] }) {
  const months = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 11 - i);
      const start = startOfMonth(d);
      const end = endOfMonth(d);
      const inRange = (dateStr) => {
        try { return isWithinInterval(parseISO(dateStr), { start, end }); } catch { return false; }
      };

      const paid = invoices.filter(inv => inv.status === 'paid' && inv.paid_date && inRange(inv.paid_date));
      const recurring = paid.filter(inv => inv.type === 'recurring');
      const oneTime = paid.filter(inv => inv.type !== 'recurring');
      const refunds = payments.filter(p => p.status === 'refunded' && p.paid_date && inRange(p.paid_date));

      const newRev = oneTime.reduce((s, i) => s + Number(i.amount || 0), 0);
      const recRev = recurring.reduce((s, i) => s + Number(i.amount || 0), 0);
      const refundAmt = refunds.reduce((s, p) => s + Number(p.amount || 0), 0);
      const net = newRev + recRev - refundAmt;
      const clients = new Set(paid.map(i => i.client_id)).size;

      return { month: format(d, 'MMM yyyy'), newRev, recRev, refundAmt, net, clients };
    });
  }, [invoices, payments]);

  const totals = months.reduce((acc, m) => ({
    newRev: acc.newRev + m.newRev,
    recRev: acc.recRev + m.recRev,
    refundAmt: acc.refundAmt + m.refundAmt,
    net: acc.net + m.net,
    clients: acc.clients + m.clients,
  }), { newRev: 0, recRev: 0, refundAmt: 0, net: 0, clients: 0 });

  const exportCSV = () => {
    const headers = ['Month', 'New Revenue', 'Recurring Revenue', 'Refunds', 'Net Revenue', 'Client Count'];
    const rows = months.map(m => [m.month, m.newRev.toFixed(2), m.recRev.toFixed(2), m.refundAmt.toFixed(2), m.net.toFixed(2), m.clients]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'monthly_summary.csv'; a.click();
  };

  const fmt = (n) => `$${Number(n).toFixed(0)}`;
  const th = { fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 12px', background: '#F9FAFB', textAlign: 'right', whiteSpace: 'nowrap' };
  const td = (bold, color) => ({ padding: '10px 12px', fontSize: 13, fontWeight: bold ? 700 : 500, color: color || '#374151', textAlign: 'right', borderBottom: '1px solid #F9FAFB', whiteSpace: 'nowrap' });

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F3F4F6', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Monthly Financial Summary</span>
        <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#F9FAFB', border: '1.5px solid #E5E7EB', color: '#374151', cursor: 'pointer' }}>
          <Download size={12} /> Export CSV
        </button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...th, textAlign: 'left' }}>Month</th>
              <th style={th}>New Revenue</th>
              <th style={th}>Recurring</th>
              <th style={th}>Refunds</th>
              <th style={th}>Net Revenue</th>
              <th style={th}>Clients</th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => (
              <tr key={m.month}>
                <td style={{ ...td(false), textAlign: 'left', fontWeight: 600, color: '#111' }}>{m.month}</td>
                <td style={td()}>{fmt(m.newRev)}</td>
                <td style={td()}>{fmt(m.recRev)}</td>
                <td style={td(false, m.refundAmt > 0 ? '#D97706' : '#9CA3AF')}>
                  {m.refundAmt > 0 ? `−${fmt(m.refundAmt)}` : '—'}
                </td>
                <td style={td(true, m.net > 0 ? '#16A34A' : '#DC2626')}>{fmt(m.net)}</td>
                <td style={td()}>{m.clients}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F9FAFB' }}>
              <td style={{ ...td(true), textAlign: 'left', color: '#111' }}>Totals</td>
              <td style={td(true)}>{fmt(totals.newRev)}</td>
              <td style={td(true)}>{fmt(totals.recRev)}</td>
              <td style={td(true, '#D97706')}>{totals.refundAmt > 0 ? `−${fmt(totals.refundAmt)}` : '—'}</td>
              <td style={td(true, '#16A34A')}>{fmt(totals.net)}</td>
              <td style={td(true)}>{totals.clients}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}