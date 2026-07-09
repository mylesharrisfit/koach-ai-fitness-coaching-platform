import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Eye, RefreshCcw, FileText, CreditCard, Banknote, Wallet } from 'lucide-react';

const STATUS_CFG = {
  paid:              { label: 'Succeeded',   bg: 'rgb(var(--success))', color: 'rgb(var(--success))' },
  pending:           { label: 'Pending',      bg: 'rgb(var(--accent))', color: 'rgb(var(--primary))' },
  failed:            { label: 'Failed',       bg: 'rgb(var(--destructive))', color: 'rgb(var(--destructive))' },
  refunded:          { label: 'Refunded',     bg: 'rgb(var(--warning))', color: 'rgb(var(--warning))' },
  partial_refund:    { label: 'Part. Refund', bg: 'rgb(var(--warning))', color: '#CA8A04' },
  disputed:          { label: 'Disputed',     bg: 'rgb(var(--destructive))', color: 'rgb(var(--destructive))' },
};

function PayMethodIcon({ method }) {
  if (!method) return <CreditCard size={14} color="rgb(var(--muted-foreground))" />;
  const m = method.toLowerCase();
  if (m.includes('bank') || m.includes('ach')) return <Banknote size={14} color="rgb(var(--primary))" />;
  if (m.includes('cash') || m.includes('manual')) return <Wallet size={14} color="rgb(var(--success))" />;
  return <CreditCard size={14} color="rgb(var(--muted-foreground))" />;
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--success))', 'rgb(var(--warning))', 'rgb(var(--destructive))'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '18', border: `1.5px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Btn({ icon: Icon, label, onClick, color = 'rgb(var(--muted-foreground))' }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: h ? color + '12' : 'rgb(var(--background))', color, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}>
      <Icon size={11} /> {label}
    </button>
  );
}

export default function PaymentFeedItem({ payment, onViewInvoice, onRefund }) {
  const [hovered, setHovered] = useState(false);
  const cfg = STATUS_CFG[payment.status] || STATUS_CFG.pending;
  const isNegative = ['failed', 'refunded', 'partial_refund', 'disputed'].includes(payment.status);

  const fmtDate = (d) => { try { return format(parseISO(d), 'MMM d, yyyy · h:mm a'); } catch { return d || '—'; } };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid rgb(var(--muted))', background: hovered ? 'rgb(var(--background))' : 'rgb(var(--card))', transition: 'background 0.12s' }}
    >
      <Avatar name={payment.client_name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>{payment.client_name}</span>
          {payment.description && (
            <span style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
              — {payment.description}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>{fmtDate(payment.paid_date || payment.created_date)}</span>
          <PayMethodIcon method={payment.payment_method} />
          {payment.payment_method && <span style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', textTransform: 'capitalize' }}>{payment.payment_method.replace(/_/g, ' ')}</span>}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: isNegative ? 'rgb(var(--destructive))' : 'rgb(var(--success))', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
        {isNegative ? '−' : '+'}${Number(payment.amount || 0).toFixed(2)}
      </div>

      <div style={{ flexShrink: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 9999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
          {cfg.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <Btn icon={Eye} label="Invoice" onClick={onViewInvoice} color="rgb(var(--primary))" />
        {payment.status === 'paid' && <Btn icon={RefreshCcw} label="Refund" onClick={onRefund} color="rgb(var(--warning))" />}
        <Btn icon={FileText} label="Receipt" onClick={() => {}} color="rgb(var(--muted-foreground))" />
      </div>
    </div>
  );
}