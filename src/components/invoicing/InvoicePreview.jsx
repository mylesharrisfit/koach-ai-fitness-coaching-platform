import React from 'react';
import { format } from 'date-fns';

const STATUS_COLORS = {
  draft:     { bg: 'var(--tc-muted)', color: 'var(--tc-muted-foreground)' },
  sent:      { bg: 'var(--tc-accent)', color: 'var(--tc-primary)' },
  paid:      { bg: 'var(--tc-success)', color: 'var(--tc-success)' },
  overdue:   { bg: 'var(--tc-destructive)', color: 'var(--tc-destructive)' },
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
    <div style={{ height: '100%', overflowY: 'auto', background: 'var(--tc-muted)', padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Live Preview</div>

      {/* Invoice Paper */}
      <div style={{ background: 'var(--tc-card)', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 4px 24px color-mix(in srgb, black 8%, transparent)', overflow: 'hidden' }}>

        {/* Brand Header */}
        <div style={{ padding: '24px 28px', background: 'var(--tc-sidebar)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, color: 'var(--tc-primary-foreground)' }}>K</div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-primary-foreground)', letterSpacing: '0.05em' }}>KOACH AI</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--tc-primary-foreground)', letterSpacing: '-0.02em' }}>INVOICE</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'color-mix(in srgb, white 50%, transparent)', marginBottom: 2 }}>{form.invoice_number || 'INV-XXXX'}</div>
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
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>From</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-foreground)' }}>{businessName}</div>
              {coachUser?.email && <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginTop: 2 }}>{coachUser.email}</div>}
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Bill To</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tc-foreground)' }}>{form.client_name || <span style={{ color: 'var(--tc-muted-foreground)' }}>Client Name</span>}</div>
              {form.client_email && <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginTop: 2 }}>{form.client_email}</div>}
              {form.billing_address && <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', marginTop: 1 }}>{form.billing_address}</div>}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20, padding: '12px 14px', background: 'var(--tc-background)', borderRadius: 10 }}>
            {[
              { label: 'Invoice #', value: form.invoice_number || '—' },
              { label: 'Issue Date', value: fmt(form.issue_date) },
              { label: 'Due Date', value: fmt(form.due_date) },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tc-foreground)' }}>{value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          {form.description && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--tc-accent)', borderRadius: 8, borderLeft: '3px solid var(--tc-primary)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tc-primary)' }}>{form.description}</div>
            </div>
          )}

          {/* Line Items */}
          {(form.line_items || []).length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 70px 70px', gap: 6, padding: '6px 0', borderBottom: '1px solid var(--tc-muted)', marginBottom: 6 }}>
                {['Description', 'Qty', 'Price', 'Total'].map((h, i) => (
                  <div key={h} style={{ fontSize: 9, fontWeight: 700, color: 'var(--tc-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
                ))}
              </div>
              {form.line_items.map((item, i) => {
                const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 70px 70px', gap: 6, padding: '6px 0', borderBottom: '1px solid var(--tc-background)' }}>
                    <div style={{ fontSize: 12, color: 'var(--tc-foreground)' }}>{item.description || <span style={{ color: 'var(--tc-muted-foreground)' }}>Item description</span>}</div>
                    <div style={{ fontSize: 12, color: 'var(--tc-foreground)', textAlign: 'right' }}>{item.qty || 1}</div>
                    <div style={{ fontSize: 12, color: 'var(--tc-foreground)', textAlign: 'right' }}>${Number(item.price || 0).toFixed(2)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--tc-foreground)', textAlign: 'right' }}>${lineTotal.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals */}
          <div style={{ padding: '12px 14px', background: 'var(--tc-background)', borderRadius: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--tc-muted-foreground)' }}>Subtotal</span>
              <span style={{ fontSize: 12, color: 'var(--tc-foreground)' }}>{fmtMoney(subtotal)}</span>
            </div>
            {Number(form.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--tc-muted-foreground)' }}>Discount</span>
                <span style={{ fontSize: 12, color: 'var(--tc-success)' }}>-{fmtMoney(discAmt)}</span>
              </div>
            )}
            {Number(form.tax) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--tc-muted-foreground)' }}>Tax ({form.tax}%)</span>
                <span style={{ fontSize: 12, color: 'var(--tc-foreground)' }}>{fmtMoney(taxAmt)}</span>
              </div>
            )}
            <div style={{ borderTop: '1px solid var(--tc-border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tc-foreground)' }}>Total Due</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--tc-foreground)', letterSpacing: '-0.02em' }}>{fmtMoney(total)}</span>
            </div>
          </div>

          {/* Payment Button Preview */}
          <div style={{ marginBottom: 16 }}>
            <button style={{ width: '100%', padding: '13px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))', color: 'var(--tc-primary-foreground)', border: 'none', cursor: 'default', letterSpacing: '-0.01em' }}>
              💳 Pay {fmtMoney(total)} Securely
            </button>
            <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--tc-muted-foreground)', marginTop: 6 }}>
              {form.payment_method === 'manual' ? 'Manual payment — see instructions below' : 'Powered by Stripe · 256-bit SSL encrypted'}
            </div>
          </div>

          {/* Notes */}
          {form.notes && (
            <div style={{ padding: '10px 14px', background: 'var(--tc-warning)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--tc-warning)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 12, color: 'var(--tc-foreground)', lineHeight: 1.5 }}>{form.notes}</div>
            </div>
          )}

          {form.payment_terms && (
            <div style={{ fontSize: 11, color: 'var(--tc-muted-foreground)', textAlign: 'center', padding: '0 8px' }}>{form.payment_terms}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 28px', background: 'var(--tc-background)', borderTop: '1px solid var(--tc-muted)', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--tc-muted-foreground)' }}>Generated by KOACH AI · koachai.net</div>
        </div>
      </div>
    </div>
  );
}