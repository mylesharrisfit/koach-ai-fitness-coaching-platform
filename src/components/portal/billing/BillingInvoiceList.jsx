import React, { useState } from 'react';
import { FileText, Eye, CreditCard, Download, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const STATUS_CONFIG = {
  paid: { label: 'Paid', bg: 'rgba(16,185,129,0.15)', color: 'rgb(var(--success))', border: 'rgba(16,185,129,0.25)' },
  sent: { label: 'Unpaid', bg: 'rgba(245,158,11,0.15)', color: 'rgb(var(--warning))', border: 'rgba(245,158,11,0.25)' },
  viewed: { label: 'Unpaid', bg: 'rgba(245,158,11,0.15)', color: 'rgb(var(--warning))', border: 'rgba(245,158,11,0.25)' },
  draft: { label: 'Pending', bg: 'rgba(107,114,128,0.15)', color: 'rgb(var(--muted-foreground))', border: 'rgba(107,114,128,0.25)' },
  overdue: { label: 'Overdue', bg: 'rgba(239,68,68,0.15)', color: 'rgb(var(--destructive))', border: 'rgba(239,68,68,0.25)' },
  cancelled: { label: 'Cancelled', bg: 'rgba(107,114,128,0.15)', color: 'rgb(var(--muted-foreground))', border: 'rgba(107,114,128,0.25)' },
};

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d || '—'; } };

export default function BillingInvoiceList({ invoices, onView, onPay }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = [...invoices].sort((a, b) => new Date(b.issue_date) - new Date(a.issue_date));
  const displayed = showAll ? sorted : sorted.slice(0, 5);

  if (invoices.length === 0) {
    return (
      <div className="rounded-2xl p-6 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <FileText className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-white/40 text-sm">No invoices yet</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Invoices</p>
      <div className="space-y-2">
        {displayed.map(inv => {
          const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG.draft;
          const isUnpaid = ['sent', 'viewed', 'overdue', 'draft'].includes(inv.status);
          return (
            <div key={inv.id} className="rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-white text-sm font-bold truncate">{inv.invoice_number || 'Invoice'}</p>
                    <span className="text-white font-bold text-sm flex-shrink-0">{fmt(inv.amount)}</span>
                  </div>
                  <p className="text-white/40 text-xs truncate mt-0.5">{inv.description || '—'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                      {cfg.label}
                    </span>
                    <span className="text-white/25 text-[10px]">{fmtDate(inv.issue_date)}</span>
                    {inv.due_date && isUnpaid && (
                      <span className="text-white/25 text-[10px]">Due {fmtDate(inv.due_date)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onView(inv)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                {isUnpaid && (
                  <button onClick={() => onPay(inv)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold"
                    style={{ background: 'rgba(37,99,235,0.2)', color: 'rgb(var(--primary))', border: '1px solid rgba(37,99,235,0.3)' }}>
                    <CreditCard className="w-3.5 h-3.5" /> Pay
                  </button>
                )}
                {inv.status === 'paid' && (
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                    style={{ background: 'rgba(16,185,129,0.1)', color: 'rgb(var(--success))', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {invoices.length > 5 && (
        <button onClick={() => setShowAll(s => !s)}
          className="w-full mt-3 py-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {showAll ? 'Show less' : `Show all ${invoices.length} invoices`}
          <ChevronDown className="w-3.5 h-3.5" style={{ transform: showAll ? 'rotate(180deg)' : 'none' }} />
        </button>
      )}
    </div>
  );
}