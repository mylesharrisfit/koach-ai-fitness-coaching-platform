import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Dumbbell, MessageSquare, MoreHorizontal, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import MoreSheet from './MoreSheet';
import { useNotifications } from '@/hooks/useNotifications';

const MORE_PATHS = [
  '/schedule', '/nutrition', '/checkin-review', '/progress', '/adherence',
  '/sales', '/analytics', '/revenue', '/store', '/community',
  '/assistant', '/automations', '/my-day', '/white-label',
  '/subscription', '/settings',
];

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Dumbbell, label: 'Programs', path: '/programs' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const { unreadCount, notifications, markRead, markAllRead } = useNotifications();

  const isMoreActive = MORE_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p)
  );

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      {/* Mobile notification drawer */}
      {bellOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setBellOpen(false)} />
          <div className="fixed bottom-[68px] left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-card z-10">
              <span className="text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary font-semibold">
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { markRead(n.id); setBellOpen(false); }}
                  className={cn('flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0', !n.is_read && 'bg-primary/5')}
                >
                  <span className="text-lg mt-0.5">
                    {{ checkin_received: '📋', feedback_sent: '💬', checkin_reminder: '⏰', general: '🔔' }[n.type] || '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-tight', !n.is_read ? 'font-semibold' : 'text-muted-foreground')}>{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                  </div>
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                </div>
              ))
            )}
          </div>
        </>
      )}


      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-sidebar-border"
        style={{ background: 'hsl(222 32% 4%)', height: '68px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1.5 relative transition-colors active:scale-95 active:opacity-75',
                isActive ? 'text-primary' : 'text-sidebar-foreground/40 active:text-sidebar-foreground'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
              )}
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_8px_hsl(var(--sidebar-primary)/0.9)]')} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
            </Link>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => setBellOpen(o => !o)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 gap-1.5 relative transition-colors active:scale-95 active:opacity-75',
            bellOpen ? 'text-primary' : 'text-sidebar-foreground/40 active:text-sidebar-foreground'
          )}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Alerts</span>
        </button>

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 gap-1.5 relative transition-colors active:scale-95 active:opacity-75',
            (moreOpen || isMoreActive) ? 'text-primary' : 'text-sidebar-foreground/40 active:text-sidebar-foreground'
          )}
        >
          {(moreOpen || isMoreActive) && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
          )}
          <MoreHorizontal className={cn('w-5 h-5', (moreOpen || isMoreActive) && 'drop-shadow-[0_0_8px_hsl(var(--sidebar-primary)/0.9)]')} />
          <span className="text-[10px] font-medium tracking-tight">More</span>
        </button>
      </nav>
    </>
  );
}