import React, { useState } from 'react';
import { X, RefreshCcw } from 'lucide-react';

const REFUND_REASONS = [
  'Client request',
  'Service not delivered',
  'Duplicate charge',
  'Goodwill gesture',
  'Other',
];

export default function RefundModal({ payment, onClose, onConfirm }) {
  const [type, setType] = useState('full');
  const [partialAmt, setPartialAmt] = useState('');
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [note, setNote] = useState('');

  const refundAmt = type === 'full' ? Number(payment.amount) : Number(partialAmt || 0);
  const valid = reason && (type === 'full' || (partialAmt && Number(partialAmt) > 0 && Number(partialAmt) <= Number(payment.amount)));

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, background: '#F9FAFB', border: '1.5px solid #E5E7EB', outline: 'none', boxSizing: 'border-box', color: '#111' };
  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 460, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#111', margin: 0 }}>Process Refund</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: '2px 0 0' }}>{payment.client_name} · ${Number(payment.amount).toFixed(2)}</p>
          </div>
          <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer' }}>
            <X size={15} color="#6B7280" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Full / Partial toggle */}
          <div>
            <label style={labelStyle}>Refund Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['full', 'Full Refund', `$${Number(payment.amount).toFixed(2)}`], ['partial', 'Partial Refund', 'Custom amount']].map(([v, label, sub]) => (
                <button key={v} onClick={() => setType(v)}
                  style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${type === v ? '#2563EB' : '#E5E7EB'}`, background: type === v ? '#EFF6FF' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: type === v ? '#2563EB' : '#374151' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sub}</div>
                </button>
              ))}
            </div>
          </div>

          {type === 'partial' && (
            <div>
              <label style={labelStyle}>Refund Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }}>$</span>
                <input type="number" value={partialAmt} onChange={e => setPartialAmt(e.target.value)}
                  placeholder={`Max $${Number(payment.amount).toFixed(2)}`}
                  style={{ ...inputStyle, paddingLeft: 26 }} />
              </div>
            </div>
          )}

          <div>
            <label style={labelStyle}>Reason *</label>
            <select value={reason} onChange={e => setReason(e.target.value)} style={inputStyle}>
              <option value="">Select reason…</option>
              {REFUND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {reason === 'Other' && (
            <div>
              <label style={labelStyle}>Specify Reason</label>
              <input value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Describe the reason…" style={inputStyle} />
            </div>
          )}

          <div>
            <label style={labelStyle}>Internal Note (optional)</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Only visible to you…" rows={2}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>

          <div style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 600 }}>
              Refunding ${refundAmt.toFixed(2)} — this action cannot be undone.
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Client will be notified by email. Processing may take 5–10 business days.</div>
          </div>
        </div>

        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: '#F3F4F6', color: '#374151', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={() => valid && onConfirm({ type, amount: refundAmt, reason: reason === 'Other' ? otherReason : reason, note })}
            disabled={!valid}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: valid ? '#DC2626' : '#E5E7EB', color: valid ? '#fff' : '#9CA3AF', border: 'none', cursor: valid ? 'pointer' : 'not-allowed' }}>
            <RefreshCcw size={14} /> Process Refund
          </button>
        </div>
      </div>
    </div>
  );
}