import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, MessageSquare,
  MoreHorizontal, Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MoreSheet from './MoreSheet';
import { useNotifications } from '@/hooks/useNotifications';

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Calendar, label: 'Calendar', path: '/schedule' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
];

const MORE_PATHS = [
  '/programs', '/nutrition', '/checkin-review', '/progress', '/adherence',
  '/sales', '/analytics', '/revenue', '/store', '/community',
  '/assistant', '/automations', '/my-day', '/white-label',
  '/subscription', '/settings', '/exercises', '/at-risk', '/business',
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();

  const isMoreActive = MORE_PATHS.some(
    p => location.pathname === p || location.pathname.startsWith(p)
  );

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      {/* Mobile notification tray */}
      {bellOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setBellOpen(false)} />
          <div className="fixed bottom-[60px] left-0 right-0 z-50 bg-card border border-border border-b-0 rounded-t-2xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card">
              <span className="text-sm font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary font-semibold">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No notifications yet</div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); setBellOpen(false); }}
                className={cn('flex items-start gap-3 px-4 py-3 border-b border-border/60 last:border-0 cursor-pointer', !n.is_read && 'bg-primary/5')}
              >
                <span className="text-lg mt-0.5">
                  {{ checkin_received: '📋', feedback_sent: '💬', checkin_reminder: '⏰', general: '🔔' }[n.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm text-foreground', !n.is_read ? 'font-semibold' : 'font-normal opacity-60')}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                </div>
                {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-sidebar border-t border-border"
        style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className={cn('text-[10px]', isActive ? 'font-semibold text-primary' : 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => setBellOpen(o => !o)}
          className={cn('flex flex-col items-center justify-center flex-1 gap-1', bellOpen ? 'text-primary' : 'text-muted-foreground')}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </button>

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn('flex flex-col items-center justify-center flex-1 gap-1', (moreOpen || isMoreActive) ? 'text-primary' : 'text-muted-foreground')}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}