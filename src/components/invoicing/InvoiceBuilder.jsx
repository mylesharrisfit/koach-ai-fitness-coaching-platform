import React, { useState, useEffect, useRef } from 'react';
import { format, addDays } from 'date-fns';
import { Plus, Trash2, ChevronDown, Search } from 'lucide-react';

const today = () => format(new Date(), 'yyyy-MM-dd');

const DUE_PRESETS = [
  { label: 'Due Immediately', days: 0 },
  { label: 'Net 7', days: 7 },
  { label: 'Net 14', days: 14 },
  { label: 'Net 30', days: 30 },
  { label: 'Custom date', days: null },
];

const LINE_PRESETS = [
  { description: 'Monthly Coaching', qty: 1, price: 250 },
  { description: 'Program Design', qty: 1, price: 150 },
  { description: 'Nutrition Plan', qty: 1, price: 100 },
  { description: 'One-time Consultation', qty: 1, price: 75 },
  { description: 'Custom Package', qty: 1, price: 500 },
  { description: 'Late Fee', qty: 1, price: 25 },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

function ClientPicker({ clients, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef();
  const filtered = clients.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.email || '').toLowerCase().includes(q.toLowerCase()));
  const selected = clients.find(c => c.id === value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = (name) => (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const avatarColor = (name) => {
    const colors = ['rgb(var(--primary))', 'rgb(var(--ai))', 'rgb(var(--success))', 'rgb(var(--warning))', 'rgb(var(--destructive))'];
    return colors[(name?.charCodeAt(0) || 0) % colors.length];
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: '10px 14px', border: '1.5px solid rgb(var(--border))', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: 'rgb(var(--card))', minHeight: 44 }}
      >
        {selected ? (
          <>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: avatarColor(selected.name) + '20', border: `1px solid ${avatarColor(selected.name)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: avatarColor(selected.name), flexShrink: 0 }}>
              {initials(selected.name)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'rgb(var(--foreground))' }}>{selected.name}</div>
              <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>{selected.email || 'No email'}</div>
            </div>
          </>
        ) : (
          <span style={{ fontSize: 14, color: 'rgb(var(--muted-foreground))', flex: 1 }}>Select client…</span>
        )}
        <ChevronDown size={14} color="rgb(var(--muted-foreground))" />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'rgb(var(--card))', border: '1.5px solid rgb(var(--border))', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, marginTop: 4, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgb(var(--muted))', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={13} color="rgb(var(--muted-foreground))" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search clients…" style={{ border: 'none', outline: 'none', fontSize: 13, flex: 1, color: 'rgb(var(--foreground))' }} />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => { onChange(c); setOpen(false); setQ(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--background))'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 28, height: 28, borderRadius: 8, background: avatarColor(c.name) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: avatarColor(c.name), flexShrink: 0 }}>
                  {initials(c.name)}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>{c.email || 'No email'}</div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div style={{ padding: '12px 14px', fontSize: 13, color: 'rgb(var(--muted-foreground))' }}>No clients found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function LineItemRow({ item, index, onChange, onRemove }) {
  const total = (Number(item.qty) || 0) * (Number(item.price) || 0);
  const inp = { padding: '8px 10px', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 13, outline: 'none', background: 'rgb(var(--card))', color: 'rgb(var(--foreground))', width: '100%', boxSizing: 'border-box' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 100px 80px 32px', gap: 8, alignItems: 'center', marginBottom: 8 }}>
      <input value={item.description} onChange={e => onChange(index, 'description', e.target.value)} placeholder="Description" style={inp} />
      <input type="number" value={item.qty} onChange={e => onChange(index, 'qty', e.target.value)} placeholder="1" style={{ ...inp, textAlign: 'center' }} min="0" />
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--muted-foreground))', fontSize: 13 }}>$</span>
        <input type="number" value={item.price} onChange={e => onChange(index, 'price', e.target.value)} placeholder="0" style={{ ...inp, paddingLeft: 20 }} min="0" />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))', textAlign: 'right' }}>${total.toFixed(2)}</div>
      <button onClick={() => onRemove(index)} style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgb(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Trash2 size={12} color="rgb(var(--destructive))" />
      </button>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>{title}</div>
      {children}
    </div>
  );
}

const inputStyle = { padding: '10px 14px', border: '1.5px solid rgb(var(--border))', borderRadius: 10, fontSize: 14, outline: 'none', background: 'rgb(var(--card))', color: 'rgb(var(--foreground))', width: '100%', boxSizing: 'border-box' };
const labelStyle = { fontSize: 11, fontWeight: 600, color: 'rgb(var(--muted-foreground))', marginBottom: 5, display: 'block' };

export default function InvoiceBuilder({ form, setForm, clients, existingInvoices }) {
  const [showPresets, setShowPresets] = useState(false);
  const [duePreset, setDuePreset] = useState('Net 30');
  const presetsRef = useRef();

  useEffect(() => {
    const h = (e) => { if (presetsRef.current && !presetsRef.current.contains(e.target)) setShowPresets(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleClientSelect = (client) => {
    setForm(f => ({
      ...f,
      client_id: client.id,
      client_name: client.name,
      client_email: client.email || '',
      amount: f.line_items?.length ? f.amount : (client.monthly_rate || f.amount || ''),
    }));
  };

  const handleDuePreset = (preset) => {
    setDuePreset(preset.label);
    if (preset.days !== null) {
      set('due_date', format(addDays(new Date(), preset.days), 'yyyy-MM-dd'));
    }
  };

  const addLineItem = (preset = null) => {
    const item = preset || { description: '', qty: 1, price: '' };
    const items = [...(form.line_items || []), item];
    setForm(f => ({ ...f, line_items: items, ...recalc(items, f.discount, f.discount_type, f.tax) }));
    setShowPresets(false);
  };

  const updateLineItem = (index, field, value) => {
    const items = form.line_items.map((it, i) => i === index ? { ...it, [field]: value } : it);
    setForm(f => ({ ...f, line_items: items, ...recalc(items, f.discount, f.discount_type, f.tax) }));
  };

  const removeLineItem = (index) => {
    const items = form.line_items.filter((_, i) => i !== index);
    setForm(f => ({ ...f, line_items: items, ...recalc(items, f.discount, f.discount_type, f.tax) }));
  };

  const recalc = (items, discount, discountType, tax) => {
    const sub = (items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
    const discAmt = discountType === 'pct' ? sub * (Number(discount) || 0) / 100 : (Number(discount) || 0);
    const taxAmt = (sub - discAmt) * (Number(tax) || 0) / 100;
    return { subtotal: sub, amount: Math.max(0, sub - discAmt + taxAmt) };
  };

  const handleDiscountChange = (v) => {
    const r = recalc(form.line_items, v, form.discount_type, form.tax);
    setForm(f => ({ ...f, discount: v, ...r }));
  };

  const handleTaxChange = (v) => {
    const r = recalc(form.line_items, form.discount, form.discount_type, v);
    setForm(f => ({ ...f, tax: v, ...r }));
  };

  const toggleDiscountType = () => {
    const newType = form.discount_type === 'pct' ? 'fixed' : 'pct';
    const r = recalc(form.line_items, form.discount, newType, form.tax);
    setForm(f => ({ ...f, discount_type: newType, ...r }));
  };

  const subtotal = (form.line_items || []).reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.price) || 0), 0);
  const discAmt = form.discount_type === 'pct' ? subtotal * (Number(form.discount) || 0) / 100 : (Number(form.discount) || 0);
  const taxAmt = (subtotal - discAmt) * (Number(form.tax) || 0) / 100;
  const total = Math.max(0, subtotal - discAmt + taxAmt);

  // Installment schedule
  const installmentCount = Number(form.installment_count) || 2;
  const installmentAmt = total / installmentCount;
  const installmentDates = Array.from({ length: installmentCount }, (_, i) => {
    const d = addDays(new Date(form.issue_date || today()), i * 30);
    return format(d, 'MMM d, yyyy');
  });

  return (
    <div style={{ overflowY: 'auto', height: '100%', padding: '24px', paddingRight: '20px' }}>

      {/* RECIPIENT */}
      <Section title="Recipient">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Client *</label>
          <ClientPicker clients={clients} value={form.client_id} onChange={handleClientSelect} />
        </div>
        {form.client_id && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={labelStyle}>Client Email</label>
              <input value={form.client_email || ''} onChange={e => set('client_email', e.target.value)} placeholder="email@example.com" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Billing Address (optional)</label>
              <input value={form.billing_address || ''} onChange={e => set('billing_address', e.target.value)} placeholder="City, State" style={inputStyle} />
            </div>
          </div>
        )}
      </Section>

      {/* INVOICE DETAILS */}
      <Section title="Invoice Details">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
          <div>
            <label style={labelStyle}>Invoice Number</label>
            <input value={form.invoice_number || ''} onChange={e => set('invoice_number', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Currency</label>
            <select value={form.currency || 'USD'} onChange={e => set('currency', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
              {CURRENCIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Description / Title</label>
          <input value={form.description || ''} onChange={e => set('description', e.target.value)} placeholder="e.g. Monthly Coaching — June 2026" style={inputStyle} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label style={labelStyle}>Issue Date</label>
            <input type="date" value={form.issue_date || today()} onChange={e => set('issue_date', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {DUE_PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => handleDuePreset(p)}
                  style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: `1px solid ${duePreset === p.label ? 'rgb(var(--primary))' : 'rgb(var(--border))'}`, background: duePreset === p.label ? 'rgb(var(--accent))' : 'rgb(var(--card))', color: duePreset === p.label ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input type="date" value={form.due_date || ''} onChange={e => { set('due_date', e.target.value); setDuePreset('Custom date'); }} style={inputStyle} />
          </div>
        </div>
      </Section>

      {/* LINE ITEMS */}
      <Section title="Line Items">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 100px 80px 32px', gap: 8, marginBottom: 8 }}>
          {['Description', 'Qty', 'Unit Price', 'Total', ''].map((h, i) => (
            <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i === 3 ? 'right' : 'left' }}>{h}</div>
          ))}
        </div>
        {(form.line_items || []).map((item, i) => (
          <LineItemRow key={i} item={item} index={i} onChange={updateLineItem} onRemove={removeLineItem} />
        ))}
        <div ref={presetsRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button type="button" onClick={() => setShowPresets(s => !s)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, fontSize: 13, fontWeight: 600, background: 'rgb(var(--accent))', color: 'rgb(var(--primary))', border: '1px solid rgb(var(--accent))', cursor: 'pointer' }}>
            <Plus size={14} /> Add Line Item <ChevronDown size={12} />
          </button>
          {showPresets && (
            <div style={{ position: 'absolute', top: '100%', left: 0, background: 'rgb(var(--card))', border: '1.5px solid rgb(var(--border))', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 50, marginTop: 4, minWidth: 220, overflow: 'hidden' }}>
              <div style={{ padding: '8px 12px', fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgb(var(--muted))' }}>Quick Add</div>
              {LINE_PRESETS.map(p => (
                <div key={p.description} onClick={() => addLineItem({ ...p })}
                  style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--background))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span>{p.description}</span>
                  <span style={{ color: 'rgb(var(--muted-foreground))', fontSize: 12 }}>${p.price}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgb(var(--muted))' }}>
                <div onClick={() => addLineItem()} style={{ padding: '10px 14px', fontSize: 13, cursor: 'pointer', color: 'rgb(var(--muted-foreground))' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgb(var(--background))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  + Custom line item
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* PRICING */}
      <Section title="Pricing">
        <div style={{ background: 'rgb(var(--background))', borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'rgb(var(--muted-foreground))' }}>Subtotal</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>${subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: 'rgb(var(--muted-foreground))' }}>Discount</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="number" value={form.discount || ''} onChange={e => handleDiscountChange(e.target.value)} placeholder="0" style={{ width: 70, padding: '6px 8px', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 13, textAlign: 'right', outline: 'none' }} min="0" />
              <button onClick={toggleDiscountType} style={{ padding: '6px 10px', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 12, fontWeight: 600, background: 'rgb(var(--card))', cursor: 'pointer', color: 'rgb(var(--foreground))' }}>
                {form.discount_type === 'pct' ? '%' : '$'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'rgb(var(--muted-foreground))' }}>Tax (%)</span>
            <input type="number" value={form.tax || ''} onChange={e => handleTaxChange(e.target.value)} placeholder="0" style={{ width: 70, padding: '6px 8px', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 13, textAlign: 'right', outline: 'none' }} min="0" />
          </div>
          <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: 'rgb(var(--foreground))' }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: 'rgb(var(--foreground))', letterSpacing: '-0.02em' }}>${total.toFixed(2)}</span>
          </div>
        </div>
      </Section>

      {/* PAYMENT OPTIONS */}
      <Section title="Payment Options">
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Accept payment via</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {['stripe', 'manual', 'both'].map(opt => (
              <button key={opt} type="button" onClick={() => set('payment_method', opt)}
                style={{ flex: 1, padding: '9px', border: `1.5px solid ${form.payment_method === opt ? 'rgb(var(--primary))' : 'rgb(var(--border))'}`, borderRadius: 10, fontSize: 12, fontWeight: 600, background: form.payment_method === opt ? 'rgb(var(--accent))' : 'rgb(var(--card))', color: form.payment_method === opt ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))', cursor: 'pointer', textTransform: 'capitalize' }}>
                {opt === 'stripe' ? '⚡ Stripe' : opt === 'manual' ? '💸 Manual' : '✓ Both'}
              </button>
            ))}
          </div>
        </div>
        {/* Installments */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgb(var(--background))', borderRadius: 10, marginBottom: form.installments ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>Installment plan</div>
            <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>Split into multiple payments</div>
          </div>
          <Toggle value={form.installments} onChange={v => set('installments', v)} />
        </div>
        {form.installments && (
          <div style={{ background: 'rgb(var(--accent))', border: '1px solid rgb(var(--accent))', borderRadius: 10, padding: '14px' }}>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Number of installments</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 3, 4].map(n => (
                  <button key={n} type="button" onClick={() => set('installment_count', n)}
                    style={{ flex: 1, padding: '8px', border: `1.5px solid ${form.installment_count === n ? 'rgb(var(--primary))' : 'rgb(var(--border))'}`, borderRadius: 8, fontSize: 13, fontWeight: 600, background: form.installment_count === n ? 'rgb(var(--accent))' : 'rgb(var(--card))', color: form.installment_count === n ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))', cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
                <input type="number" value={![2,3,4].includes(form.installment_count) ? form.installment_count : ''} onChange={e => set('installment_count', Number(e.target.value))} placeholder="Custom" min="2" style={{ flex: 1, padding: '8px', border: '1.5px solid rgb(var(--border))', borderRadius: 8, fontSize: 13, textAlign: 'center', outline: 'none' }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgb(var(--primary))', fontWeight: 600 }}>Payment schedule:</div>
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {installmentDates.map((d, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgb(var(--foreground))' }}>
                  <span>Payment {i + 1} — {d}</span>
                  <span style={{ fontWeight: 700 }}>${installmentAmt.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* RECURRING */}
      <Section title="Recurring Invoice">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgb(var(--background))', borderRadius: 10, marginBottom: form.is_recurring ? 12 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>Make this a recurring invoice</div>
            <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>Automatically generate on schedule</div>
          </div>
          <Toggle value={form.is_recurring} onChange={v => set('is_recurring', v)} />
        </div>
        {form.is_recurring && (
          <div style={{ background: 'rgb(var(--background))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: '14px', display: 'grid', gap: 10 }}>
            <div>
              <label style={labelStyle}>Frequency</label>
              <select value={form.recurring_interval || 'monthly'} onChange={e => set('recurring_interval', e.target.value)} style={{ ...inputStyle, appearance: 'none' }}>
                {['weekly', 'bi_weekly', 'monthly', 'quarterly', 'annually'].map(v => (
                  <option key={v} value={v}>{v.replace('_', '-')}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Start Date</label>
                <input type="date" value={form.recurring_start || today()} onChange={e => set('recurring_start', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>End Date</label>
                <input type="date" value={form.recurring_end || ''} onChange={e => set('recurring_end', e.target.value)} placeholder="Leave blank = until cancelled" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>Auto-charge saved card</div>
                <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>Charge automatically if card on file</div>
              </div>
              <Toggle value={form.auto_charge} onChange={v => set('auto_charge', v)} />
            </div>
          </div>
        )}
      </Section>

      {/* NOTES & TERMS */}
      <Section title="Notes & Terms">
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Notes to client <span style={{ color: 'rgb(var(--muted-foreground))', fontWeight: 400 }}>(visible on invoice)</span></label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Thank you for your business!" rows={3} style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Internal notes <span style={{ color: 'rgb(var(--muted-foreground))', fontWeight: 400 }}>(not visible to client)</span></label>
          <textarea value={form.internal_notes || ''} onChange={e => set('internal_notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={labelStyle}>Payment terms</label>
          <input value={form.payment_terms || ''} onChange={e => set('payment_terms', e.target.value)} placeholder="e.g. Payment due within 30 days" style={inputStyle} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'rgb(var(--background))', borderRadius: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'rgb(var(--foreground))' }}>Late fee policy</div>
            <div style={{ fontSize: 11, color: 'rgb(var(--muted-foreground))' }}>Charge % per month on overdue invoices</div>
          </div>
          <Toggle value={form.late_fee_enabled} onChange={v => set('late_fee_enabled', v)} />
        </div>
        {form.late_fee_enabled && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <input type="number" value={form.late_fee_pct || ''} onChange={e => set('late_fee_pct', e.target.value)} placeholder="1.5" style={{ ...inputStyle, width: 80 }} min="0" max="100" />
            <span style={{ fontSize: 13, color: 'rgb(var(--muted-foreground))' }}>% per month</span>
          </div>
        )}
      </Section>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      style={{ width: 40, height: 22, borderRadius: 9999, background: value ? 'rgb(var(--primary))' : 'rgb(var(--border))', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}>
      <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgb(var(--card))', position: 'absolute', top: 3, left: value ? 21 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  );
}