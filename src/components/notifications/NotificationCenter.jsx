import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, X, CheckCheck, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isToday, isYesterday, isThisWeek } from 'date-fns';
import NotificationItem from './NotificationItem';

const TABS = [
  { id: 'all',         label: 'All' },
  { id: 'unread',      label: 'Unread' },
  { id: 'client',      label: 'Clients' },
  { id: 'achievement', label: 'Achievements' },
  { id: 'payment',     label: 'Payments' },
  { id: 'message',     label: 'Messages' },
  { id: 'ai',          label: 'AI' },
  { id: 'system',      label: 'System' },
];

function groupNotifications(list) {
  const groups = [
    { key: 'today',    label: 'TODAY',      items: [] },
    { key: 'yesterday',label: 'YESTERDAY',  items: [] },
    { key: 'week',     label: 'THIS WEEK',  items: [] },
    { key: 'earlier',  label: 'EARLIER',    items: [] },
  ];
  for (const n of list) {
    let d;
    try { d = new Date(n.created_date); } catch { d = new Date(); }
    if (isToday(d)) groups[0].items.push(n);
    else if (isYesterday(d)) groups[1].items.push(n);
    else if (isThisWeek(d)) groups[2].items.push(n);
    else groups[3].items.push(n);
  }
  return groups.filter(g => g.items.length > 0);
}

function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <p className="font-bold text-foreground text-base">You're all caught up!</p>
      <p className="text-sm text-muted-foreground mt-1">
        {tab === 'all' ? 'No new notifications' : `No ${tab} notifications`}
      </p>
    </div>
  );
}

function GroupSection({ group, collapsed, onToggle, onMarkRead, onDismiss, onClose }) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 bg-muted border-y border-border hover:bg-muted transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{group.label}</span>
        <span className="text-[10px] text-border font-semibold ml-auto">{group.items.length}</span>
      </button>
      {!collapsed && group.items.map(n => (
        <NotificationItem key={n.id} n={n} onMarkRead={onMarkRead} onDismiss={onDismiss} onClose={onClose} />
      ))}
    </div>
  );
}

export default function NotificationCenter({ notifications, unreadCount, loading, markRead, markAllRead, dismiss, onClose, isMobile }) {
  const [tab, setTab] = useState('all');
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      if (tab === 'all') return true;
      if (tab === 'unread') return !n.is_read;
      return n.category === tab;
    });
  }, [notifications, tab]);

  const groups = useMemo(() => groupNotifications(filtered), [filtered]);

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const panelClass = isMobile
    ? 'fixed inset-0 z-50 flex flex-col bg-card'
    : 'w-[420px] max-h-[calc(100vh-80px)] bg-card rounded-2xl border border-border flex flex-col overflow-hidden';

  return (
    <motion.div
      initial={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.97, y: -8 }}
      animate={isMobile ? { x: 0 } : { opacity: 1, scale: 1, y: 0 }}
      exit={isMobile ? { x: '100%' } : { opacity: 0, scale: 0.97, y: -8 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={panelClass}
      style={isMobile ? {} : { boxShadow: '0 20px 60px color-mix(in srgb, black 18%, transparent), 0 0 0 1px color-mix(in srgb, black 6%, transparent)', background: 'var(--tc-card)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Bell className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="font-black text-foreground text-[15px]">Notifications</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black text-primary-foreground"
              style={{ background: 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' }}>
              {unreadCount > 99 ? '99+' : unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] text-primary font-bold hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-accent">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          <Link to="/notification-settings" onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Settings className="w-4 h-4" />
          </Link>
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-3 py-2 border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0">
        {TABS.map(t => {
          const isActive = tab === t.id;
          const count = t.id === 'unread' ? unreadCount
            : t.id === 'all' ? notifications.length
            : notifications.filter(n => n.category === t.id).length;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold flex-shrink-0 transition-all whitespace-nowrap"
              style={{
                background: isActive ? 'linear-gradient(135deg, var(--tc-primary), var(--tc-ai))' : 'var(--tc-muted)',
                color: isActive ? 'white' : 'var(--tc-muted-foreground)',
                border: isActive ? 'none' : '1px solid var(--tc-border)',
              }}>
              {t.label}
              {count > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: isActive ? 'color-mix(in srgb, white 25%, transparent)' : 'var(--tc-border)', color: isActive ? 'white' : 'var(--tc-muted-foreground)' }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-primary border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          groups.map(group => (
            <GroupSection key={group.key} group={group}
              collapsed={!!collapsedGroups[group.key]}
              onToggle={() => toggleGroup(group.key)}
              onMarkRead={markRead} onDismiss={dismiss} onClose={onClose} />
          ))
        )}

        {/* Bottom link */}
        {notifications.length > 0 && (
          <div className="px-4 py-4 text-center border-t border-border">
            <Link to="/notification-settings" onClick={onClose}
              className="text-xs text-muted-foreground hover:text-primary font-semibold transition-colors">
              Manage Notification Preferences →
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}