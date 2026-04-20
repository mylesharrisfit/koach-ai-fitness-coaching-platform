import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Dumbbell, MessageSquare, MoreHorizontal,
  X, Calendar, Salad, TrendingUp, Settings, ClipboardList, ShoppingBag,
  Sparkles, CreditCard, BarChart3, Bot, Trophy, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Dumbbell, label: 'Programs', path: '/programs' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
];

const MORE_NAV = [
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: Salad, label: 'Nutrition', path: '/nutrition' },
  { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: Trophy, label: 'Adherence', path: '/adherence' },
  { icon: DollarSign, label: 'Sales', path: '/sales' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Sparkles, label: 'AI Assistant', path: '/assistant' },
  { icon: Bot, label: 'Automations', path: '/automations' },
  { icon: ShoppingBag, label: 'Store', path: '/store' },
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_NAV.some(
    (item) => location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
  );

  return (
    <>
      {/* More drawer overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More drawer */}
      <div
        className={cn(
          'fixed left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out',
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ bottom: '64px' }}
      >
        <div className="mx-3 mb-2 rounded-2xl border border-sidebar-border overflow-hidden" style={{ background: 'hsl(222 32% 6%)' }}>
          {/* Handle */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sidebar-border">
            <span className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">More</span>
            <button onClick={() => setMoreOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-sidebar-accent transition-colors">
              <X className="w-4 h-4 text-sidebar-foreground/60" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-0.5 p-3">
            {MORE_NAV.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 px-1 transition-colors',
                    isActive
                      ? 'bg-primary/15 text-primary'
                      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium text-center leading-tight">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-sidebar-border"
        style={{ background: 'hsl(222 32% 4%)', height: '64px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 transition-colors relative',
                isActive ? 'text-primary' : 'text-sidebar-foreground/50 active:text-sidebar-foreground'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <item.icon className={cn('w-5 h-5', isActive && 'drop-shadow-[0_0_8px_hsl(var(--sidebar-primary)/0.9)]')} />
              <span className={cn('text-[10px] font-medium tracking-tight', isActive ? 'text-primary' : 'text-sidebar-foreground/40')}>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 gap-1 transition-colors relative',
            (moreOpen || isMoreActive) ? 'text-primary' : 'text-sidebar-foreground/50 active:text-sidebar-foreground'
          )}
        >
          {(moreOpen || isMoreActive) && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
          )}
          <MoreHorizontal className={cn('w-5 h-5', (moreOpen || isMoreActive) && 'drop-shadow-[0_0_8px_hsl(var(--sidebar-primary)/0.9)]')} />
          <span className={cn('text-[10px] font-medium tracking-tight', (moreOpen || isMoreActive) ? 'text-primary' : 'text-sidebar-foreground/40')}>More</span>
        </button>
      </nav>
    </>
  );
}