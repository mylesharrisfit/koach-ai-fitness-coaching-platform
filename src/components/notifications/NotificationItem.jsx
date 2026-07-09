import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CATEGORY_CONFIG = {
  client:      { bg: 'var(--tc-accent)', color: 'var(--tc-primary)', emoji: '👤' },
  message:     { bg: 'var(--tc-ai)', color: 'var(--tc-ai)', emoji: '💬' },
  payment:     { bg: 'var(--tc-success)', color: 'var(--tc-success)', emoji: '💳' },
  atrisk:      { bg: 'var(--tc-warning)', color: 'var(--tc-warning)', emoji: '⚠️' },
  ai:          { bg: 'var(--tc-accent)', color: 'var(--kc-4f46e5)', emoji: '🤖' },
  checkin:     { bg: 'var(--kc-f0fdfa)', color: 'var(--kc-0d9488)', emoji: '📋' },
  schedule:    { bg: 'var(--tc-warning)', color: 'var(--kc-ca8a04)', emoji: '📅' },
  achievement: { bg: 'var(--tc-warning)', color: 'var(--tc-warning)', emoji: '🏆' },
  system:      { bg: 'var(--tc-muted)', color: 'var(--tc-muted-foreground)', emoji: '⚙️' },
};

function timeLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
    if (isYesterday(d)) return 'Yesterday';
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return ''; }
}

export default function NotificationItem({ n, onMarkRead, onDismiss, onClose }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();
  const cfg = CATEGORY_CONFIG[n.category] || CATEGORY_CONFIG.system;

  const handleClick = () => {
    if (!n.is_read) onMarkRead(n.id);
    if (n.link) { navigate(n.link); onClose(); }
  };

  const handleAction = (e) => {
    e.stopPropagation();
    if (!n.is_read) onMarkRead(n.id);
    if (n.link) { navigate(n.link); onClose(); }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    onDismiss(n.id);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border last:border-0 group"
      style={{ background: !n.is_read ? 'color-mix(in srgb, var(--tc-primary) 3%, transparent)' : 'transparent' }}
    >
      {/* Unread dot */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-opacity"
        style={{ background: 'var(--tc-primary)', opacity: n.is_read ? 0 : 1 }} />

      {/* Category icon */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base mt-0.5"
        style={{ background: cfg.bg }}>
        <span>{cfg.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[13px] leading-snug line-clamp-1"
          style={{ fontWeight: n.is_read ? 500 : 700, color: n.is_read ? 'var(--tc-foreground)' : 'var(--tc-foreground)' }}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {n.client_name && (
            <span className="text-[11px] font-semibold" style={{ color: 'var(--tc-primary)' }}>{n.client_name}</span>
          )}
          {n.client_name && <span className="text-border text-[10px]">·</span>}
          <span className="text-[11px] text-border">{timeLabel(n.created_date)}</span>
        </div>
        {/* Action button */}
        {n.action_label && (hovered || true) && (
          <button
            onClick={handleAction}
            className="mt-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-colors"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {n.action_label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all opacity-0 group-hover:opacity-100"
        style={{ background: 'var(--tc-muted)' }}
      >
        <X className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
}