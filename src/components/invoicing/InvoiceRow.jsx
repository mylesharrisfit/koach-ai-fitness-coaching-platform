import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Eye, Bell, CheckCircle2, Trash2, Copy, FileDown } from 'lucide-react';
import InvoiceStatusBadge from './InvoiceStatusBadge';

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 10,
      background: color + '18', border: `1.5px solid ${color}28`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, onClick, color = '#6B7280' }) {
  const [h, setH] = useState(false);
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        width: 28, height: 28, borderRadius: 7, border: 'none',
        background: h ? color + '12' : 'transparent',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color,
        transition: 'background 0.12s',
      }}>
      <Icon size={13} />
    </button>
  );
}

export default function InvoiceRow({ invoice, onView, onMarkPaid, onSendReminder, onDuplicate, onDelete }) {
  const [hovered, setHovered] = useState(false);
  const fmt = (d) => { try { return format(parseISO(d), 'MMM d, yyyy'); } catch { return d || '—'; } };

  const handleDownload = () => {
    // Basic PDF-like text download as placeholder
    const content = `Invoice: ${invoice.invoice_number}\nClient: ${invoice.client_name}\nDescription: ${invoice.description || ''}\nAmount: $${invoice.amount}\nDue: ${fmt(invoice.due_date)}\nStatus: ${invoice.status}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${invoice.invoice_number}.txt`;
    a.click();
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onView}
      style={{
        display: 'grid',
        gridTemplateColumns: '34px minmax(120px,1.8fr) minmax(140px,2.5fr) 90px minmax(90px,1fr) 90px auto',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderBottom: '1px solid #F3F4F6',
        background: hovered ? '#FAFAFA' : '#fff',
        transition: 'background 0.12s',
        cursor: 'pointer',
      }}
    >
      {/* Avatar */}
      <Avatar name={invoice.client_name} />

      {/* Client + Invoice # */}
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {invoice.client_name}
        </div>
        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1 }}>{invoice.invoice_number}</div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>
        {invoice.description || '—'}
      </div>

      {/* Amount */}
      <div style={{ fontSize: 14, fontWeight: 800, color: '#111', textAlign: 'right', whiteSpace: 'nowrap' }}>
        ${Number(invoice.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      {/* Dates */}
      <div>
        <div style={{ fontSize: 11, color: '#374151', fontWeight: 500 }}>Due {fmt(invoice.due_date)}</div>
        <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 1 }}>Issued {fmt(invoice.issue_date)}</div>
      </div>

      {/* Status */}
      <div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      {/* Actions */}
      <div
        style={{ display: 'flex', gap: 1, opacity: hovered ? 1 : 0, transition: 'opacity 0.15s' }}
        onClick={e => e.stopPropagation()}
      >
        <ActionBtn icon={Eye} title="View / Edit" onClick={onView} color="#2563EB" />
        {!['paid', 'cancelled'].includes(invoice.status) && (
          <ActionBtn icon={Bell} title="Send Reminder" onClick={onSendReminder} color="#D97706" />
        )}
        {!['paid', 'cancelled'].includes(invoice.status) && (
          <ActionBtn icon={CheckCircle2} title="Mark as Paid" onClick={onMarkPaid} color="#16A34A" />
        )}
        <ActionBtn icon={FileDown} title="Download" onClick={handleDownload} color="#6B7280" />
        <ActionBtn icon={Copy} title="Duplicate" onClick={onDuplicate} color="#6B7280" />
        <ActionBtn icon={Trash2} title="Delete" onClick={onDelete} color="#DC2626" />
      </div>
    </div>
  );
}