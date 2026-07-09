import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { X, Send, Mail, MessageSquare, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

export default function SendInvoiceModal({ invoice, coachUser, onClose, onSent }) {
  const [sendVia, setSendVia] = useState('both');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const firstName = (invoice.client_name || '').split(' ')[0] || 'there';
  const coachFirst = (coachUser?.full_name || 'Your Coach').split(' ')[0];

  const defaultMsg = `Hi ${firstName},\n\nPlease find your invoice for ${invoice.description || 'coaching services'} attached. Click the button below to view and pay securely.\n\nThank you!\n— Coach ${coachFirst}`;
  const [message, setMessage] = useState(defaultMsg);

  const handleSend = async () => {
    setSending(true);
    try {
      // Update invoice status to "sent"
      await base44.entities.Invoice.update(invoice.id, { status: 'sent' });

      // Send email if applicable
      if ((sendVia === 'email' || sendVia === 'both') && invoice.client_email) {
        await base44.integrations.Core.SendEmail({
          to: invoice.client_email,
          subject: `Invoice ${invoice.invoice_number} — ${invoice.description || 'Coaching Services'} — $${Number(invoice.amount).toFixed(2)}`,
          body: `${message}\n\n---\nInvoice #: ${invoice.invoice_number}\nAmount Due: $${Number(invoice.amount).toFixed(2)}\nDue Date: ${invoice.due_date || '—'}\n\nView & pay your invoice by logging into your coaching portal.`,
        });
      }

      // Send in-app message if applicable
      if ((sendVia === 'message' || sendVia === 'both') && invoice.client_id) {
        await base44.entities.Message.create({
          client_id: invoice.client_id,
          client_name: invoice.client_name,
          sender: 'coach',
          content: `📄 Invoice ${invoice.invoice_number} — $${Number(invoice.amount).toFixed(2)} due ${invoice.due_date || 'soon'}. ${message}`,
          tag: 'general',
        });
      }

      setSent(true);
      setTimeout(() => {
        toast.success(`Invoice sent to ${invoice.client_name} ✓`);
        onSent();
      }, 1200);
    } catch (err) {
      toast.error('Failed to send invoice. Please try again.');
      setSending(false);
    }
  };

  const fmtDate = (d) => { try { return format(new Date(d), 'MMMM d, yyyy'); } catch { return d || '—'; } };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'rgb(var(--card))', borderRadius: 20, width: '100%', maxWidth: 500, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        {sent ? (
          <div style={{ padding: '48px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgb(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={28} color="rgb(var(--success))" />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'rgb(var(--foreground))', marginBottom: 6 }}>Invoice Sent!</div>
              <div style={{ fontSize: 14, color: 'rgb(var(--muted-foreground))' }}>Invoice sent to {invoice.client_name} ✓</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgb(var(--muted))', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'rgb(var(--foreground))' }}>Send Invoice</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>Review before sending</p>
              </div>
              <button onClick={onClose} style={{ background: 'rgb(var(--muted))', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', display: 'flex' }}>
                <X size={16} color="rgb(var(--muted-foreground))" />
              </button>
            </div>

            <div style={{ padding: '20px 24px' }}>
              {/* Summary card */}
              <div style={{ background: 'rgb(var(--background))', borderRadius: 12, padding: '14px 16px', marginBottom: 18, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Client</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{invoice.client_name}</div>
                  <div style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>{invoice.client_email || 'No email set'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Invoice</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{invoice.invoice_number}</div>
                  <div style={{ fontSize: 12, color: 'rgb(var(--muted-foreground))' }}>{invoice.description}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Amount</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: 'rgb(var(--foreground))' }}>${Number(invoice.amount).toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Due Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'rgb(var(--foreground))' }}>{fmtDate(invoice.due_date)}</div>
                </div>
              </div>

              {/* Message */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, display: 'block' }}>Message to client</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5}
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgb(var(--border))', borderRadius: 10, fontSize: 13, outline: 'none', resize: 'none', lineHeight: 1.6, color: 'rgb(var(--foreground))', boxSizing: 'border-box' }} />
              </div>

              {/* Send via */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgb(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, display: 'block' }}>Send via</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { key: 'email', label: 'Email', icon: Mail },
                    { key: 'message', label: 'In-App', icon: MessageSquare },
                    { key: 'both', label: 'Both', icon: Send },
                  ].map(opt => {
                    const Icon = opt.icon;
                    const active = sendVia === opt.key;
                    return (
                      <button key={opt.key} type="button" onClick={() => setSendVia(opt.key)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 8px', border: `1.5px solid ${active ? 'rgb(var(--primary))' : 'rgb(var(--border))'}`, borderRadius: 10, background: active ? 'rgb(var(--accent))' : 'rgb(var(--card))', color: active ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))', cursor: 'pointer', fontSize: 12, fontWeight: active ? 700 : 500 }}>
                        <Icon size={16} />
                        {opt.label}
                        {opt.key === 'both' && <span style={{ fontSize: 9, color: active ? 'rgb(var(--primary))' : 'rgb(var(--muted-foreground))' }}>(recommended)</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Send button */}
              <button onClick={handleSend} disabled={sending}
                style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700, background: sending ? 'rgb(var(--border))' : 'linear-gradient(135deg, rgb(var(--primary)), rgb(var(--ai)))', color: sending ? 'rgb(var(--muted-foreground))' : 'rgb(var(--card))', border: 'none', cursor: sending ? 'not-allowed' : 'pointer', boxShadow: sending ? 'none' : '0 0 20px rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Send size={16} />
                {sending ? 'Sending…' : 'Send Now'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}