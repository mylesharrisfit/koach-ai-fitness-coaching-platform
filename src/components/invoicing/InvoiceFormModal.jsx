import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { X } from 'lucide-react';

const today = () => format(new Date(), 'yyyy-MM-dd');
const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return format(d, 'yyyy-MM-dd');
};

function generateInvoiceNumber(existing) {
  const nums = existing.map(i => parseInt((i.invoice_number || '').replace('INV-', '') || '0')).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export default function InvoiceFormModal({ invoice, onClose, onSave, existingInvoices = [] }) {
  const isEdit = !!invoice?.id;
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-invoice'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  const [form, setForm] = useState({
    invoice_number: invoice?.invoice_number || generateInvoiceNumber(existingInvoices),
    client_id: invoice?.client_id || '',
    client_name: invoice?.client_name || '',
    client_email: invoice?.client_email || '',
    description: invoice?.description || '',
    amount: invoice?.amount || '',
    status: invoice?.status || 'draft',
    type: invoice?.type || 'one_time',
    issue_date: invoice?.issue_date || today(),
    due_date: invoice?.due_date || nextMonth(),
    notes: invoice?.notes || '',
    recurring_interval: invoice?.recurring_interval || 'monthly',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleClientChange = (clientId) => {
    const c = clients.find(c => c.id === clientId);
    set('client_id', clientId);
    if (c) {
      set('client_name', c.name);
      set('client_email', c.email || '');
      if (!form.amount && c.monthly_rate) set('amount', c.monthly_rate);
    }
  };

  const handleSave = () => {
    if (!form.client_id || !form.amount || !form.due_date) return;
    onSave({ ...form, amount: Number(form.amount) });
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    background: 'rgb(var(--background))', color: 'rgb(var(--foreground))', border: '1.5px solid rgb(var(--border))',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'rgb(var(--card))', borderRadius: 20, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgb(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'rgb(var(--foreground))', margin: 0 }}>{isEdit ? 'Edit Invoice' : 'New Invoice'}</h2>
            <p style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))', margin: '2px 0 0' }}>{form.invoice_number}</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgb(var(--muted))', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
            <X size={16} color="rgb(var(--muted-foreground))" />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            {/* Client */}
            <div>
              <label style={labelStyle}>Client *</label>
              <select value={form.client_id} onChange={e => handleClientChange(e.target.value)} style={inputStyle}>
                <option value="">Select client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Monthly Coaching — June 2026" style={inputStyle} />
            </div>

            {/* Amount + Type */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Amount (USD) *</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--muted-foreground))', fontSize: 14 }}>$</span>
                  <input type="number" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" style={{ ...inputStyle, paddingLeft: 28 }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)} style={inputStyle}>
                  <option value="one_time">One Time</option>
                  <option value="recurring">Recurring</option>
                  <option value="package">Package</option>
                </select>
              </div>
            </div>

            {form.type === 'recurring' && (
              <div>
                <label style={labelStyle}>Recurring Interval</label>
                <select value={form.recurring_interval} onChange={e => set('recurring_interval', e.target.value)} style={inputStyle}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            )}

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Issue Date</label>
                <input type="date" value={form.issue_date} onChange={e => set('issue_date', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Due Date *</label>
                <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={inputStyle} />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={labelStyle}>Notes (optional)</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes…" rows={3}
                style={{ ...inputStyle, resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgb(var(--muted))', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600, background: 'rgb(var(--muted))', color: 'rgb(var(--foreground))', border: 'none', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={!form.client_id || !form.amount}
            style={{ padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: (!form.client_id || !form.amount) ? 'rgb(var(--border))' : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', color: (!form.client_id || !form.amount) ? 'rgb(var(--muted-foreground))' : 'rgb(var(--card))', border: 'none', cursor: (!form.client_id || !form.amount) ? 'not-allowed' : 'pointer' }}>
            {isEdit ? 'Save Changes' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}