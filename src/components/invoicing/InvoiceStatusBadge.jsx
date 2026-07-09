import React from 'react';
import { CheckCircle2, AlertTriangle, Eye, Send, FileText, XCircle } from 'lucide-react';

const STATUS_CONFIG = {
  draft:     { label: 'Draft',     bg: 'var(--tc-muted)', color: 'var(--tc-muted-foreground)', icon: FileText },
  sent:      { label: 'Sent',      bg: 'var(--tc-accent)', color: 'var(--tc-primary)', icon: Send },
  viewed:    { label: 'Viewed',    bg: 'var(--tc-accent)', color: 'var(--tc-primary)', icon: Eye },
  paid:      { label: 'Paid',      bg: 'var(--tc-success)', color: 'var(--tc-success)', icon: CheckCircle2 },
  overdue:   { label: 'Overdue',   bg: 'var(--tc-destructive)', color: 'var(--tc-destructive)', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', bg: 'var(--tc-muted)', color: 'var(--tc-muted-foreground)', icon: XCircle },
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