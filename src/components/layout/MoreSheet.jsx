import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X, Calendar, Salad, ClipboardList, TrendingUp, Trophy,
  Settings, CreditCard, DollarSign, BarChart3, Sparkles,
  Bot, ShoppingBag, Globe, Smartphone, Landmark, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    title: 'Coaching',
    items: [
      { icon: Calendar, label: 'Schedule', path: '/schedule', color: 'text-blue-400', bg: 'bg-blue-400/10' },
      { icon: Salad, label: 'Nutrition', path: '/nutrition', color: 'text-green-400', bg: 'bg-green-400/10' },
      { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review', color: 'text-orange-400', bg: 'bg-orange-400/10' },
      { icon: TrendingUp, label: 'Progress', path: '/progress', color: 'text-purple-400', bg: 'bg-purple-400/10' },
      { icon: Trophy, label: 'Adherence', path: '/adherence', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    ],
  },
  {
    title: 'Business',
    items: [
      { icon: DollarSign, label: 'Sales', path: '/sales', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
      { icon: Landmark, label: 'Revenue', path: '/revenue', color: 'text-lime-400', bg: 'bg-lime-400/10' },
      { icon: ShoppingBag, label: 'Store', path: '/store', color: 'text-pink-400', bg: 'bg-pink-400/10' },
      { icon: Globe, label: 'Community', path: '/community', color: 'text-sky-400', bg: 'bg-sky-400/10' },
    ],
  },
  {
    title: 'Tools',
    items: [
      { icon: Sparkles, label: 'AI Assistant', path: '/assistant', color: 'text-violet-400', bg: 'bg-violet-400/10' },
      { icon: Bot, label: 'Automations', path: '/automations', color: 'text-rose-400', bg: 'bg-rose-400/10' },
      { icon: Smartphone, label: 'Client View', path: '/my-day', color: 'text-teal-400', bg: 'bg-teal-400/10' },
      { icon: Zap, label: 'White Label', path: '/white-label', color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: CreditCard, label: 'Subscription', path: '/subscription', color: 'text-primary', bg: 'bg-primary/10' },
      { icon: Settings, label: 'Settings', path: '/settings', color: 'text-muted-foreground', bg: 'bg-muted/20' },
    ],
  },
];

export default function MoreSheet({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-50 md:hidden flex flex-col transition-transform duration-300 ease-out rounded-t-3xl overflow-hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ background: 'hsl(222 28% 7%)', maxHeight: '88dvh' }}
      >
        {/* Handle bar */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-sidebar-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-sidebar-border">
          <h2 className="font-heading font-bold text-base text-sidebar-foreground">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-sidebar-accent hover:bg-sidebar-accent/70 transition-colors"
          >
            <X className="w-4 h-4 text-sidebar-foreground/70" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6 pb-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 mb-2 px-1">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all',
                        isActive
                          ? 'bg-primary/10 ring-1 ring-primary/20'
                          : 'hover:bg-sidebar-accent active:scale-[0.98]'
                      )}
                    >
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', item.bg)}>
                        <item.icon className={cn('w-4.5 h-4.5', item.color, 'w-[18px] h-[18px]')} />
                      </div>
                      <span className={cn(
                        'font-medium text-sm flex-1',
                        isActive ? 'text-primary' : 'text-sidebar-foreground/80'
                      )}>
                        {item.label}
                      </span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}