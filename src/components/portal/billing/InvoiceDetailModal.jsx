import React from 'react';
import { motion } from 'framer-motion';
import { X, Download, CreditCard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';

const fmt = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => { try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d || '—'; } };

export default function InvoiceDetailModal({ invoice, onClose, onPay }) {
  const isUnpaid = ['sent', 'viewed', 'overdue', 'draft'].includes(invoice.status);
  const isPaid = invoice.status === 'paid';

  const daysUntilDue = invoice.due_date ? differenceInDays(parseISO(invoice.due_date), new Date()) : null;
  const lineItems = invoice.line_items || [{ description: invoice.description, qty: 1, price: invoice.amount }];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28 }}
        className="w-full overflow-y-auto"
        style={{ background: '#111827', borderRadius: '24px 24px 0 0', maxHeight: '92vh', paddingBottom: 'env(safe-area-inset-bottom)' }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <div>
            <h2 className="text-white font-bold text-lg">{invoice.invoice_number || 'Invoice'}</h2>
            <p className="text-white/40 text-xs mt-0.5">Issued {fmtDate(invoice.issue_date)}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Status banner */}
        {isPaid && (
          <div className="mx-5 mb-4 p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-bold text-sm">Paid ✓</p>
              <p className="text-white/40 text-xs">{invoice.paid_date ? `Paid on ${fmtDate(invoice.paid_date)}` : 'Payment received'}</p>
            </div>
          </div>
        )}

        {invoice.status === 'overdue' && (
          <div className="mx-5 mb-4 p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-400 font-bold text-sm">Payment Overdue</p>
              <p className="text-white/40 text-xs">Was due {fmtDate(invoice.due_date)}</p>
            </div>
          </div>
        )}

        {isUnpaid && invoice.status !== 'overdue' && daysUntilDue !== null && daysUntilDue <= 3 && (
          <div className="mx-5 mb-4 p-3.5 rounded-2xl flex items-center gap-3" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-yellow-400 font-bold text-sm">Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* Invoice card */}
        <div className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="p-4 border-b border-white/10">
            <p className="text-white font-bold text-sm">{invoice.description || 'Coaching Services'}</p>
            <p className="text-white/40 text-xs mt-1">Due {fmtDate(invoice.due_date)}</p>
          </div>

          {/* Line items */}
          <div className="p-4 space-y-2 border-b border-white/10">
            {lineItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm">{item.description || 'Service'}</p>
                  {item.qty > 1 && <p className="text-white/30 text-xs">× {item.qty}</p>}
                </div>
                <p className="text-white text-sm font-semibold">{fmt((item.price || 0) * (item.qty || 1))}</p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="p-4 flex items-center justify-between">
            <p className="text-white font-bold">Total</p>
            <p className="text-white font-black text-xl">{fmt(invoice.amount)}</p>
          </div>
        </div>

        {/* Coach contact */}
        <div className="mx-5 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-2">Questions?</p>
          <p className="text-white/60 text-xs">Contact your coach via the Messages tab in your portal.</p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 space-y-3">
          {isUnpaid && (
            <button onClick={() => { onClose(); onPay(invoice); }}
              className="w-full py-4 rounded-2xl text-base font-black text-white"
              style={{ background: 'linear-gradient(135deg, #2563EB, #7C3AED)', boxShadow: '0 8px 24px rgba(37,99,235,0.4)' }}>
              Pay Now — {fmt(invoice.amount)}
            </button>
          )}
          {isPaid && (
            <button className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Download className="w-4 h-4" />
              Download Receipt
            </button>
          )}
          <button onClick={onClose} className="w-full py-3 rounded-2xl text-sm font-semibold text-white/40">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}