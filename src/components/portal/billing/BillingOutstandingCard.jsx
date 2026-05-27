import React from 'react';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function DueBadge({ dueDate }) {
  if (!dueDate) return null;
  const days = differenceInDays(parseISO(dueDate), new Date());
  if (days < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', color: '#F87171' }}>Overdue {Math.abs(days)}d</span>;
  if (days <= 3) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.2)', color: '#FCD34D' }}>Due in {days}d</span>;
  return <span className="text-white/30 text-[10px]">Due {format(parseISO(dueDate), 'MMM d')}</span>;
}

export default function BillingOutstandingCard({ unpaidInvoices, totalDue, onPayAll, onPayInvoice, onViewInvoice }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(245,158,11,0.15))', border: '1px solid rgba(239,68,68,0.3)' }}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <span className="text-red-400 text-xs font-bold uppercase tracking-wide">Outstanding Balance</span>
        </div>

        <p className="text-white font-black text-3xl mb-1">{fmt(totalDue)}</p>
        <p className="text-white/40 text-xs mb-4">{unpaidInvoices.length} unpaid invoice{unpaidInvoices.length > 1 ? 's' : ''}</p>

        <button onClick={onPayAll}
          className="w-full py-3.5 rounded-xl text-sm font-black text-white transition-all active:scale-98"
          style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
          Pay Now — {fmt(totalDue)}
        </button>

        {unpaidInvoices.length > 1 && (
          <div className="mt-3 space-y-2">
            {unpaidInvoices.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 py-2 px-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-semibold truncate">{inv.invoice_number || 'Invoice'}</p>
                  <p className="text-white/40 text-[10px] truncate">{inv.description}</p>
                </div>
                <DueBadge dueDate={inv.due_date} />
                <span className="text-white text-xs font-bold">{fmt(inv.amount)}</span>
                <button onClick={() => onPayInvoice(inv)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{ background: 'rgba(37,99,235,0.3)', color: '#60A5FA' }}>
                  Pay
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}