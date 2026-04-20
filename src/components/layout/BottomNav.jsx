import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Dumbbell, MessageSquare, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import MoreSheet from './MoreSheet';

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

  const isMoreActive = MORE_PATHS.some(
    (p) => location.pathname === p || location.pathname.startsWith(p)
  );

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

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