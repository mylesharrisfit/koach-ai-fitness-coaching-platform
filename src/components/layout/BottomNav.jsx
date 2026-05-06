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
          <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setBellOpen(false)} />
          <div className="fixed bottom-[60px] left-0 right-0 z-50 border border-white/[0.06] border-b-0 rounded-t-2xl max-h-[60vh] overflow-y-auto"
            style={{ background: '#111111' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0" style={{ background: '#111111' }}>
              <span className="text-sm font-bold text-white">Notifications</span>
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
                className={cn(
                  'flex items-start gap-3 px-5 py-4 border-b border-white/[0.04] last:border-0 cursor-pointer transition-colors hover:bg-white/[0.03]',
                  !n.is_read && 'bg-primary/5'
                )}
              >
                <span className="text-lg mt-0.5">
                  {{ checkin_received: '📋', feedback_sent: '💬', checkin_reminder: '⏰', general: '🔔' }[n.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm text-white', !n.is_read ? 'font-semibold' : 'font-normal opacity-50')}>{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                </div>
                {!n.is_read && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />}
              </div>
            ))}
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-white/[0.06]"
        style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)', background: '#0A0A0A' }}
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
                'flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-150',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon className={cn('w-[18px] h-[18px]', isActive && 'drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]')} />
              <span className={cn('text-[10px]', isActive ? 'font-semibold text-primary' : 'font-medium')}>{item.label}</span>
            </Link>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => setBellOpen(o => !o)}
          className={cn('flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-150', bellOpen ? 'text-primary' : 'text-muted-foreground')}
        >
          <div className="relative">
            <Bell className="w-[18px] h-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[14px] h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </button>

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn('flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-150', (moreOpen || isMoreActive) ? 'text-primary' : 'text-muted-foreground')}
        >
          <MoreHorizontal className="w-[18px] h-[18px]" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}