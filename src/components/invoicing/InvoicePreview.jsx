import React from 'react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft:     { bg: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))' },
  sent:      { bg: 'rgb(var(--accent))', color: 'rgb(var(--primary))' },
  paid:      { bg: 'rgb(var(--success))', color: 'rgb(var(--success))' },
  overdue:   { bg: 'rgb(var(--destructive))', color: 'rgb(var(--destructive))' },
};

export default function InvoicePreview({ form, coachUser }) {
  const subtotal = (form.line_items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discAmt = form.discount_type === 'pct' ? subtotal * (Number(form.discount) || 0) / 100 : (Number(form.discount) || 0);
  const taxAmt = (subtotal - discAmt) * (Number(form.tax) || 0) / 100;
  const total = Math.max(0, subtotal - discAmt + taxAmt);

  const coachName = coachUser?.full_name || 'Your Coach';
  const businessName = coachUser?.business_name || coachName;

  const fmt = (d) => { try { return format(new Date(d), 'MMMM d, yyyy'); } catch { return d || '—'; } };
  const cur = form.currency || 'USD';
  const fmtMoney = (n) => `${cur} ${Number(n || 0).toFixed(2)}`;

  const statusCfg = STATUS_COLORS[form.status || 'draft'];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: 'rgb(var(--muted))', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Live Preview</div>

      {/* Invoice Paper */}
      <div style={{ background: 'rgb(var(--card))', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

        {/* Brand Header */}
        <div style={{ padding: '24px 28px', background: 'rgb(var(--sidebar))' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'rgb(var(--card))' }}>K</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--card))', letterSpacing: '0.05em' }}>KOACH AI</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'rgb(var(--card))', letterSpacing: '-0.02em' }}>INVOICE</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{form.invoice_number || 'INV-XXXX'}</div>
              <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 9999, background: statusCfg.bg, color: statusCfg.color, fontSize: 11, fontWeight: 700 }}>
                {(form.status || 'Draft').charAt(0).toUpperCase() + (form.status || 'draft').slice(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px' }}>

          {/* From / To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 22 }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>From</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{businessName}</div>
              {coachUser?.email && <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>{coachUser.email}</div>}
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Bill To</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{form.client_name || <span style={{ color: 'rgb(var(--muted-foreground))' }}>Client Name</span>}</div>
              {form.client_email && <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', marginTop: 2 }}>{form.client_email}</div>}
              {form.billing_address && <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', marginTop: 1 }}>{form.billing_address}</div>}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'rgb(var(--background))', borderRadius: 10 }}>
            {[
              { label: 'Invoice #', value: form.invoice_number || '—' },
              { label: 'Issue Date', value: fmt(form.issue_date) },
              { label: 'Due Date', value: fmt(form.due_date) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--foreground))' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {form.description && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgb(var(--accent))', borderRadius: 8, borderLeft: '3px solid rgb(var(--primary))' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--primary))' }}>{form.description}</div>
            </div>
          )}

          {/* Line Items */}
          {(form.line_items || []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 70px 70px', gap: 6, padding: '6px 0', borderBottom: '1px solid rgb(var(--muted))', marginBottom: 6 }}>
                {['Description', 'Qty', 'Price', 'Total'].map((h, i) => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
              {form.line_items.map((item, i) => {
                const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 70px 70px', gap: 6, padding: '6px 0', borderBottom: '1px solid rgb(var(--background))' }}>
                    <div style={{ fontSize: 12, color: 'rgb(var(--foreground))' }}>{item.description || <span style={{ color: 'rgb(var(--muted-foreground))' }}>Item description</span>}</div>
                    <div style={{ fontSize: 12, color: 'rgb(var(--foreground))', textAlign: 'right' }}>{item.qty || 1}</div>
                    <div style={{ fontSize: 12, color: 'rgb(var(--foreground))', textAlign: 'right' }}>${Number(item.price || 0).toFixed(2)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgb(var(--foreground))', textAlign: 'right' }}>${lineTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div style={{ padding: '12px 14px', background: 'rgb(var(--background))', borderRadius: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>Subtotal</span>
              <span style={{ fontSize: 12, color: 'rgb(var(--foreground))' }}>{fmtMoney(subtotal)}</span>
            </div>
            {Number(form.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>Discount</span>
                <span style={{ fontSize: 12, color: 'rgb(var(--success))' }}>-{fmtMoney(discAmt)}</span>
              </div>
            )}
            {Number(form.tax) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>Tax ({form.tax}%)</span>
                <span style={{ fontSize: 12, color: 'rgb(var(--foreground))' }}>{fmtMoney(taxAmt)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid rgb(var(--border))', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))' }}>Total Due</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'rgb(var(--foreground))', letterSpacing: '-0.02em' }}>{fmtMoney(total)}</span>
            </div>
          </div>

          {/* Payment Button Preview */}
          <div style={{ marginBottom: 16 }}>
            <button style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', color: 'rgb(var(--card))', border: 'none', cursor: 'default', letterSpacing: '-0.01em' }}>
              💳 Pay {fmtMoney(total)} Securely
            </button>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'rgb(var(--muted-foreground))', marginTop: 6 }}>
              {form.payment_method === 'manual' ? 'Manual payment — see instructions below' : 'Powered by Stripe · 256-bit SSL encrypted'}
            </div>
          </div>

          {/* Notes */}
          {form.notes && (
            <div style={{ padding: '10px 14px', background: 'rgb(var(--warning))', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgb(var(--warning))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: 'rgb(var(--foreground))', lineHeight: 1.5 }}>{form.notes}</div>
            </div>
          )}

          {form.payment_terms && (
            <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))', textAlign: 'center', padding: '0 8px' }}>{form.payment_terms}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 28px', background: 'rgb(var(--background))', borderTop: '1px solid rgb(var(--muted))', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'rgb(var(--muted-foreground))' }}>Generated by KOACH AI · koach.ai</div>
        </div>
      </div>
    </div>
  );
}