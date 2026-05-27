import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays } from 'date-fns';
import { X, Send, CalendarClock, Save } from 'lucide-react';
import { toast } from 'sonner';
import InvoiceBuilder from './InvoiceBuilder';
import InvoicePreview from './InvoicePreview';
import SendInvoiceModal from './SendInvoiceModal';

const today = () => format(new Date(), 'yyyy-MM-dd');
const net30 = () => format(addDays(new Date(), 30), 'yyyy-MM-dd');

function generateNumber(existing) {
  const nums = (existing || []).map(i => parseInt((i.invoice_number || '').replace('INV-', '') || '0')).filter(Boolean);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

const DEFAULT_FORM = (existingInvoices) => ({
  invoice_number: generateNumber(existingInvoices),
  client_id: '',
  client_name: '',
  client_email: '',
  billing_address: '',
  description: '',
  currency: 'USD',
  issue_date: today(),
  due_date: net30(),
  line_items: [{ description: '', qty: 1, price: '' }],
  subtotal: 0,
  discount: '',
  discount_type: 'pct',
  tax: '',
  amount: 0,
  payment_method: 'both',
  installments: false,
  installment_count: 2,
  is_recurring: false,
  recurring_interval: 'monthly',
  recurring_start: today(),
  recurring_end: '',
  auto_charge: false,
  notes: '',
  internal_notes: '',
  payment_terms: 'Payment due within 30 days',
  late_fee_enabled: false,
  late_fee_pct: 1.5,
  status: 'draft',
  type: 'one_time',
});

export default function InvoiceCreationModal({ invoice: editInvoice, onClose, onSaved, existingInvoices = [] }) {
  const isEdit = !!editInvoice?.id;

  const [form, setForm] = useState(() => {
    if (editInvoice?.id) {
      return {
        ...DEFAULT_FORM(existingInvoices),
        ...editInvoice,
        line_items: editInvoice.line_items?.length ? editInvoice.line_items : [{ description: '', qty: 1, price: '' }],
      };
    }
    return DEFAULT_FORM(existingInvoices);
  });

  const [saving, setSaving] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [coachUser, setCoachUser] = useState(null);
  const [activeTab, setActiveTab] = useState('builder'); // mobile: 'builder' | 'preview'

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-invoice'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
  });

  useEffect(() => {
    base44.auth.me().then(setCoachUser).catch(() => {});
  }, []);

  const handleSave = async (statusOverride = null) => {
    if (!form.client_id) return;
    setSaving(true);
    const payload = {
      ...form,
      status: statusOverride || form.status || 'draft',
      type: form.is_recurring ? 'recurring' : form.line_items?.length > 1 ? 'one_time' : form.type || 'one_time',
      amount: Number(form.amount) || 0,
    };
    // Remove internal-only keys
    delete payload.subtotal;

    if (isEdit) {
      await base44.entities.Invoice.update(editInvoice.id, payload);
    } else {
      const created = await base44.entities.Invoice.create(payload);
      // store id for send flow
      form.id = created.id;
      setForm(f => ({ ...f, id: created.id }));
    }
    setSaving(false);
    onSaved();
  };

  const handleSaveAsDraft = async () => {
    await handleSave('draft');
    onClose();
  };

  const handleSendClick = async () => {
    // Save first, then open send modal
    setSaving(true);
    const payload = { ...form, status: 'draft', amount: Number(form.amount) || 0, type: form.is_recurring ? 'recurring' : form.type || 'one_time' };
    delete payload.subtotal;
    let invoiceId = form.id;
    if (!invoiceId) {
      const created = await base44.entities.Invoice.create(payload);
      invoiceId = created.id;
      setForm(f => ({ ...f, id: invoiceId }));
    } else if (isEdit) {
      await base44.entities.Invoice.update(invoiceId, payload);
    }
    setSaving(false);
    onSaved();
    setShowSend(true);
  };

  const canSave = !!form.client_id;

  return (
    <>
      {/* Main Modal */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: '90vw', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, background: '#fff' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111', letterSpacing: '-0.02em' }}>{isEdit ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>{form.invoice_number}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Mobile tab switcher */}
              <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 10, padding: 3, gap: 2 }} className="lg:hidden">
                {['builder', 'preview'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)}
                    style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', background: activeTab === t ? '#fff' : 'transparent', color: activeTab === t ? '#111' : '#9CA3AF', cursor: 'pointer', boxShadow: activeTab === t ? '0 1px 4px rgba(0,0,0,0.1)' : 'none', textTransform: 'capitalize' }}>
                    {t === 'builder' ? 'Edit' : 'Preview'}
                  </button>
                ))}
              </div>
              <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', display: 'flex' }}>
                <X size={17} color="#6B7280" />
              </button>
            </div>
          </div>

          {/* Two-column body */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>
            {/* LEFT — Builder */}
            <div style={{ borderRight: '1px solid #F3F4F6', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <InvoiceBuilder
                form={form}
                setForm={setForm}
                clients={clients}
                existingInvoices={existingInvoices}
              />
            </div>

            {/* RIGHT — Preview */}
            <div style={{ overflow: 'hidden', background: '#F3F4F6' }}>
              <InvoicePreview form={form} coachUser={coachUser} />
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: '#fff', flexWrap: 'wrap' }}>
            <button onClick={handleSaveAsDraft} disabled={!canSave || saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#F3F4F6', color: canSave ? '#374151' : '#9CA3AF', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed' }}>
              <Save size={14} /> Save as Draft
            </button>

            <button onClick={() => setShowSchedule(s => !s)} disabled={!canSave}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 600, background: '#F3F4F6', color: canSave ? '#374151' : '#9CA3AF', border: 'none', cursor: canSave ? 'pointer' : 'not-allowed' }}>
              <CalendarClock size={14} /> Schedule Send
            </button>

            {showSchedule && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#6B7280' }}>Send on:</span>
                <input type="datetime-local" value={form.scheduled_send || ''} onChange={e => setForm(f => ({ ...f, scheduled_send: e.target.value }))}
                  style={{ padding: '6px 10px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12, outline: 'none' }} />
                <button onClick={async () => { await handleSave('draft'); toast.success('Invoice scheduled!'); onClose(); }}
                  style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#EFF6FF', color: '#2563EB', border: 'none', cursor: 'pointer' }}>
                  Schedule
                </button>
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button onClick={handleSendClick} disabled={!canSave || saving}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: (canSave && !saving) ? 'linear-gradient(135deg, #2563EB, #7C3AED)' : '#E5E7EB', color: (canSave && !saving) ? '#fff' : '#9CA3AF', border: 'none', cursor: (canSave && !saving) ? 'pointer' : 'not-allowed', boxShadow: (canSave && !saving) ? '0 0 20px rgba(37,99,235,0.3)' : 'none' }}>
              <Send size={15} />
              {saving ? 'Saving…' : 'Send Invoice'}
            </button>
          </div>
        </div>
      </div>

      {/* Send confirmation modal */}
      {showSend && (
        <SendInvoiceModal
          invoice={{ ...form, id: form.id || editInvoice?.id }}
          coachUser={coachUser}
          onClose={() => setShowSend(false)}
          onSent={() => { setShowSend(false); onClose(); }}
        />
      )}
    </>
  );
}