import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const CATEGORY_CONFIG = {
  client:      { bg: '#EFF6FF', color: '#2563EB', emoji: '👤' },
  message:     { bg: '#F5F3FF', color: '#7C3AED', emoji: '💬' },
  payment:     { bg: '#ECFDF5', color: '#059669', emoji: '💳' },
  atrisk:      { bg: '#FFF7ED', color: '#D97706', emoji: '⚠️' },
  ai:          { bg: '#EEF2FF', color: '#4F46E5', emoji: '🤖' },
  checkin:     { bg: '#F0FDFA', color: '#0D9488', emoji: '📋' },
  schedule:    { bg: '#FEFCE8', color: '#CA8A04', emoji: '📅' },
  achievement: { bg: '#FFFBEB', color: '#D97706', emoji: '🏆' },
  system:      { bg: '#F8FAFC', color: '#64748B', emoji: '⚙️' },
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
      className="relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-slate-50 last:border-0 group"
      style={{ background: !n.is_read ? 'rgba(37,99,235,0.03)' : 'transparent' }}
    >
      {/* Unread dot */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-opacity"
        style={{ background: '#2563EB', opacity: n.is_read ? 0 : 1 }} />

      {/* Category icon */}
      <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-base mt-0.5"
        style={{ background: cfg.bg }}>
        <span>{cfg.emoji}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-1">
        <p className="text-[13px] leading-snug line-clamp-1"
          style={{ fontWeight: n.is_read ? 500 : 700, color: n.is_read ? '#374151' : '#111827' }}>
          {n.title}
        </p>
        {n.body && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {n.client_name && (
            <span className="text-[11px] font-semibold" style={{ color: '#2563EB' }}>{n.client_name}</span>
          )}
          {n.client_name && <span className="text-slate-200 text-[10px]">·</span>}
          <span className="text-[11px] text-slate-300">{timeLabel(n.created_date)}</span>
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
        style={{ background: '#F1F5F9' }}
      >
        <X className="w-3 h-3 text-slate-400" />
      </button>
    </div>
  );
}