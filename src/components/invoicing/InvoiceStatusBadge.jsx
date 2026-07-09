import React from 'react';
import { CheckCircle2, AlertTriangle, Eye, Send, FileText, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))', icon: FileText },
  sent:      { label: 'Sent',      bg: 'rgb(var(--accent))', color: 'rgb(var(--primary))', icon: Send },
  viewed:    { label: 'Viewed',    bg: 'rgb(var(--accent))', color: 'rgb(var(--primary))', icon: Eye },
  paid:      { label: 'Paid',      bg: 'rgb(var(--success))', color: 'rgb(var(--success))', icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   bg: 'rgb(var(--destructive))', color: 'rgb(var(--destructive))', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: 'rgb(var(--muted))', color: 'rgb(var(--muted-foreground))', icon: XCircle },
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