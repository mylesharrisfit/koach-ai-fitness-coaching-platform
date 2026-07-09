import React, { useState } from 'react';
import { Download, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { format, parseISO, subDays, isAfter } from 'date-fns';

const STATUS_ICONS = {
  paid: { Icon: CheckCircle2, color: 'rgb(var(--success))' },
  failed: { Icon: XCircle, color: 'rgb(var(--destructive))' },
  pending: { Icon: Clock, color: 'rgb(var(--warning))' },
  refunded: { Icon: RefreshCw, color: 'rgb(var(--muted-foreground))' },
};

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d || '—'; } };

export default function BillingHistory({ payments, invoices }) {
  const [filter, setFilter] = useState('all');

  // Combine paid invoices as history entries
  const paidInvoiceEntries = invoices.filter(i => i.status === 'paid').map(i => ({
    id: `inv-${i.id}`,
    date: i.paid_date || i.updated_date,
    description: i.description || i.invoice_number || 'Invoice',
    amount: i.amount,
    status: 'paid',
    method: i.payment_method || 'card',
    type: 'invoice',
  }));

  const paymentEntries = payments.map(p => ({
    id: `pay-${p.id}`,
    date: p.paid_date || p.created_date,
    description: p.description || 'Payment',
    amount: p.amount,
    status: p.status,
    method: 'card',
    type: 'payment',
  }));

  const all = [...paidInvoiceEntries, ...paymentEntries].sort((a, b) => new Date(b.date) - new Date(a.date));

  const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'paid', label: 'Paid' },
    { key: 'failed', label: 'Failed' },
    { key: 'last30', label: 'Last 30 days' },
  ];

  const filtered = all.filter(entry => {
    if (filter === 'paid') return entry.status === 'paid';
    if (filter === 'failed') return entry.status === 'failed';
    if (filter === 'last30') return isAfter(new Date(entry.date), subDays(new Date(), 30));
    return true;
  });

  return (
    <div>
      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: filter === f.key ? 'rgb(var(--primary) / 0.2)' : 'rgba(255,255,255,0.05)',
              color: filter === f.key ? 'rgb(var(--primary))' : 'rgba(255,255,255,0.35)',
              border: `1px solid ${filter === f.key ? 'rgb(var(--primary) / 0.3)' : 'transparent'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-white/30 text-sm">No payment history</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const cfg = STATUS_ICONS[entry.status] || STATUS_ICONS.pending;
            return (
              <div key={entry.id} className="flex items-center gap-3 p-3.5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${cfg.color}15` }}>
                  <cfg.Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold truncate">{entry.description}</p>
                  <p className="text-white/30 text-xs mt-0.5">{fmtDate(entry.date)} · {entry.method}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-white font-bold text-sm" style={{ color: entry.status === 'failed' ? 'rgb(var(--destructive))' : entry.status === 'refunded' ? 'rgb(var(--muted-foreground))' : 'rgb(var(--card))' }}>
                    {entry.status === 'refunded' ? '-' : ''}{fmt(entry.amount)}
                  </p>
                  {entry.status === 'paid' && (
                    <button className="text-[10px] text-primary mt-0.5 flex items-center gap-1">
                      <Download className="w-2.5 h-2.5" /> Receipt
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}