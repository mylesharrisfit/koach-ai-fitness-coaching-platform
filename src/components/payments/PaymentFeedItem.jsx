import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Eye, RefreshCcw, FileText, CreditCard, Banknote, Wallet } from 'lucide-react';

const STATUS_CFG = {
  paid:              { label: 'Succeeded',   bg: 'var(--tc-success)', color: 'var(--tc-success)' },
  pending:           { label: 'Pending',      bg: 'var(--tc-accent)', color: 'var(--tc-primary)' },
  failed:            { label: 'Failed',       bg: 'var(--tc-destructive)', color: 'var(--tc-destructive)' },
  refunded:          { label: 'Refunded',     bg: 'var(--tc-warning)', color: 'var(--tc-warning)' },
  partial_refund:    { label: 'Part. Refund', bg: 'var(--tc-warning)', color: 'var(--kc-ca8a04)' },
  disputed:          { label: 'Disputed',     bg: 'var(--tc-destructive)', color: 'var(--tc-destructive)' },
};

function PayMethodIcon({ method }) {
  if (!method) return <CreditCard size={14} color="var(--tc-muted-foreground)" />;
  const m = method.toLowerCase();
  if (m.includes('bank') || m.includes('ach')) return <Banknote size={14} color="var(--tc-primary)" />;
  if (m.includes('cash') || m.includes('manual')) return <Wallet size={14} color="var(--tc-success)" />;
  return <CreditCard size={14} color="var(--tc-muted-foreground)" />;
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['var(--tc-primary)', 'var(--tc-ai)', 'var(--tc-success)', 'var(--tc-warning)', 'var(--tc-destructive)'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: color + '18', border: `1.5px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Btn({ icon: Icon, label, onClick, color = 'var(--tc-muted-foreground)' }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, border: 'none', background: h ? color + '12' : 'var(--tc-background)', color, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}>
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
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--tc-muted)', background: hovered ? 'var(--tc-background)' : 'var(--tc-card)', transition: 'background 0.12s' }}
    >
      <Avatar name={payment.client_name} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tc-foreground)' }}>{payment.client_name}</span>
          {payment.description && (
            <span style={{ fontSize: 12, color: 'var(--tc-muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240 }}>
              — {payment.description}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--tc-muted-foreground)' }}>{fmtDate(payment.paid_date || payment.created_date)}</span>
          <PayMethodIcon method={payment.payment_method} />
          {payment.payment_method && <span style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', textTransform: 'capitalize' }}>{payment.payment_method.replace(/_/g, ' ')}</span>}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 800, color: isNegative ? 'var(--tc-destructive)' : 'var(--tc-success)', flexShrink: 0, minWidth: 70, textAlign: 'right' }}>
        {isNegative ? '−' : '+'}${Number(payment.amount || 0).toFixed(2)}
      </div>

      <div style={{ flexShrink: 0 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 9999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
          {cfg.label}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4, flexShrink: 0, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}>
        <Btn icon={Eye} label="Invoice" onClick={onViewInvoice} color="var(--tc-primary)" />
        {payment.status === 'paid' && <Btn icon={RefreshCcw} label="Refund" onClick={onRefund} color="var(--tc-warning)" />}
        <Btn icon={FileText} label="Receipt" onClick={() => {}} color="var(--tc-muted-foreground)" />
      </div>
    </div>
  );
}