import React from 'react';
import { CheckCircle2, AlertTriangle, Eye, Send, FileText, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: '#F3F4F6', color: '#6B7280', icon: FileText },
  sent:      { label: 'Sent',      bg: '#EFF6FF', color: '#2563EB', icon: Send },
  viewed:    { label: 'Viewed',    bg: '#E0F2FE', color: '#0284C7', icon: Eye },
  paid:      { label: 'Paid',      bg: '#F0FDF4', color: '#16A34A', icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   bg: '#FEF2F2', color: '#DC2626', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: '#F3F4F6', color: '#9CA3AF', icon: XCircle },
};

export default function InvoiceStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = cfg.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 9999, background: cfg.bg, color: cfg.color, fontSize: 11, fontWeight: 700 }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}