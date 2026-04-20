import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, Calendar, MessageSquare, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Dumbbell, label: 'Programs', path: '/programs' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden bg-sidebar border-t border-sidebar-border" style={{ background: 'hsl(222 32% 4%)' }}>
      {PRIMARY_NAV.map((item) => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center flex-1 py-2 gap-0.5 text-xs font-medium transition-colors',
              isActive
                ? 'text-primary'
                : 'text-sidebar-foreground/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_6px_hsl(var(--sidebar-primary)/0.8)]')} />
            <span className="text-[10px]">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}