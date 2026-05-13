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
          <div
            className="fixed bottom-[60px] left-0 right-0 z-50 rounded-t-2xl max-h-[60vh] overflow-y-auto"
            style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 sticky top-0"
              style={{ background: '#161616', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-sm font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-semibold" style={{ color: '#3B82F6' }}>
                  Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No notifications yet</div>
            ) : notifications.map(n => (
              <div
                key={n.id}
                onClick={() => { markRead(n.id); setBellOpen(false); }}
                className="flex items-start gap-3 px-4 py-3 cursor-pointer"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: !n.is_read ? 'rgba(59,130,246,0.04)' : 'transparent' }}
              >
                <span className="text-lg mt-0.5">
                  {{ checkin_received: '📋', feedback_sent: '💬', checkin_reminder: '⏰', general: '🔔' }[n.type] || '🔔'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white" style={{ fontWeight: !n.is_read ? 600 : 400, opacity: n.is_read ? 0.5 : 1 }}>{n.title}</p>
                  {n.body && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'rgba(255,255,255,0.35)' }}>{n.body}</p>}
                </div>
                {!n.is_read && <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#3B82F6' }} />}
              </div>
            ))}
          </div>
        </>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
        style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)', background: '#0D0D0D', borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        {PRIMARY_NAV.map(item => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 gap-1 transition-colors"
              style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.3)' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Notifications */}
        <button
          onClick={() => setBellOpen(o => !o)}
          className="flex flex-col items-center justify-center flex-1 gap-1"
          style={{ color: bellOpen ? '#3B82F6' : 'rgba(255,255,255,0.3)' }}
        >
          <div className="relative">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 bg-blue-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Alerts</span>
        </button>

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 gap-1"
          style={{ color: (moreOpen || isMoreActive) ? '#3B82F6' : 'rgba(255,255,255,0.3)' }}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </>
  );
}