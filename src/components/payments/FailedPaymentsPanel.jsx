import React, { useState } from 'react';
import { AlertTriangle, RefreshCcw, CreditCard, MessageSquare, X, ChevronDown, ChevronUp } from 'lucide-react';
import { parseISO, differenceInDays } from 'date-fns';

const FAILURE_REASONS = {
  card_declined: 'Card declined',
  insufficient_funds: 'Insufficient funds',
  expired_card: 'Card expired',
  incorrect_cvc: 'Incorrect CVC',
  processing_error: 'Processing error',
  do_not_honor: 'Card declined (do not honor)',
};

export default function FailedPaymentsPanel({ payments = [], onRetry, onMessage }) {
  const [expanded, setExpanded] = useState(true);
  const failed = payments.filter(p => p.status === 'failed');
  if (failed.length === 0) return null;

  const daysSince = (d) => {
    try { return differenceInDays(new Date(), parseISO(d)); }
    catch { return 0; }
  };

  return (
    <div style={{ background: 'rgb(var(--destructive))', border: '1.5px solid rgb(var(--destructive))', borderRadius: 14, marginBottom: 20, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <AlertTriangle size={16} color="rgb(var(--destructive))" />
        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--destructive))', flex: 1 }}>
          {failed.length} Failed Payment{failed.length > 1 ? 's' : ''} — Action Required
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--destructive))' }}>
          ${failed.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)}
        </span>
        {expanded ? <ChevronUp size={14} color="rgb(var(--destructive))" /> : <ChevronDown size={14} color="rgb(var(--destructive))" />}
      </button>

      {expanded && (
        <div style={{ padding: '0 18px 14px' }}>
          {failed.map(p => (
            <div key={p.id} style={{ background: 'rgb(var(--card))', borderRadius: 10, padding: '12px 14px', marginBottom: 8, border: '1px solid rgb(var(--destructive))' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{p.client_name}</div>
                  <div style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>{p.description || 'Payment'}</div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'rgb(var(--destructive))', fontWeight: 600 }}>
                      ✗ {FAILURE_REASONS[p.failure_reason] || p.failure_reason || 'Payment failed'}
                    </span>
                    <span style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>
                      {daysSince(p.paid_date || p.created_date)} days ago
                    </span>
                    <span style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>
                      Auto-retry: 3, 5, 7 days after failure
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'rgb(var(--destructive))' }}>${Number(p.amount || 0).toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                <ActionBtn icon={RefreshCcw} label="Retry Payment" onClick={() => onRetry(p)} color="rgb(var(--primary))" />
                <ActionBtn icon={CreditCard} label="Update Card" onClick={() => {}} color="rgb(var(--ai))" />
                <ActionBtn icon={MessageSquare} label="Message Client" onClick={() => onMessage(p)} color="rgb(var(--muted-foreground))" />
                <ActionBtn icon={X} label="Waive" onClick={() => {}} color="rgb(var(--muted-foreground))" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, color }) {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1.5px solid ${color}30`, background: h ? color + '10' : 'rgb(var(--card))', color, fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s' }}>
      <Icon size={12} /> {label}
    </button>
  );
}