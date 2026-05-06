import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';
import {
  LayoutDashboard, Users, Dumbbell, Calendar,
  MessageSquare, TrendingUp, Zap, LogOut, Settings,
  BarChart3, Bot, ChevronLeft, ChevronRight, Lock,
  Play, CreditCard, Activity, Salad, ClipboardList,
  Trophy, ShieldAlert, DollarSign, Landmark, ShoppingBag,
  Globe, Sparkles, Smartphone, LayoutTemplate, UserPlus, PackageOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { hasFeature } from '@/lib/subscription';

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: Play, label: 'Run My Day', path: '/fast-review' },
    ],
  },
  {
    label: 'Coaching',
    items: [
      { icon: Users, label: 'Clients', path: '/clients' },
      { icon: Dumbbell, label: 'Programs', path: '/programs' },
      { icon: Salad, label: 'Nutrition', path: '/nutrition' },
      { icon: ClipboardList, label: 'Exercise Library', path: '/exercises' },
      { icon: Salad, label: 'Food Library', path: '/food-library' },
      { icon: Calendar, label: 'Schedule', path: '/schedule' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
    ],
  },
  {
    label: 'Clients',
    items: [
      { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review', feature: 'checkin_review' },
      { icon: ShieldAlert, label: 'At-Risk', path: '/at-risk' },
      { icon: TrendingUp, label: 'Progress', path: '/progress', feature: 'progress' },
      { icon: Trophy, label: 'Adherence', path: '/adherence', feature: 'adherence' },
    ],
  },
  {
    label: 'Business',
    items: [
      { icon: DollarSign, label: 'Sales', path: '/sales', feature: 'sales' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: Landmark, label: 'Revenue', path: '/revenue' },
      { icon: Activity, label: 'Business', path: '/business', feature: 'revenue_dashboard' },
      { icon: ShoppingBag, label: 'Store', path: '/store', feature: 'store' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { icon: Bot, label: 'Automations', path: '/automations' },
      { icon: LayoutTemplate, label: 'Templates', path: '/coaching-templates' },
      { icon: Sparkles, label: 'AI Assistant', path: '/assistant', feature: 'assistant' },
      { icon: Globe, label: 'Community', path: '/community', feature: 'community' },
      { icon: Smartphone, label: 'Client View', path: '/my-day', feature: 'client_dashboard' },
      { icon: UserPlus, label: 'Onboarding', path: '/onboarding-manager' },
      { icon: PackageOpen, label: 'Migration', path: '/migration' },
      { icon: Zap, label: 'White Label', path: '/white-label' },
    ],
  },
];

const BOTTOM_ITEMS = [
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

function NavItem({ item, collapsed, onUpgrade, user }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));
  const isLocked = item.feature && !hasFeature(user, item.feature);

  if (isLocked) {
    return (
      <button
        onClick={() => onUpgrade?.(item.feature)}
        className={cn(
          'relative flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium w-full text-left transition-all duration-150',
          'text-muted-foreground hover:text-foreground/50 hover:bg-white/[0.03]'
        )}
      >
        <item.icon className="w-[16px] h-[16px] flex-shrink-0 opacity-40" />
        {!collapsed && (
          <>
            <span className="flex-1 opacity-40">{item.label}</span>
            <Lock className="w-3 h-3 opacity-20" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      to={item.path}
      className={cn(
        'relative flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium transition-all duration-150',
        isActive
          ? 'bg-primary/10 text-primary sidebar-active-dot'
          : 'text-muted-foreground hover:text-white hover:bg-white/[0.04]'
      )}
    >
      <item.icon className={cn(
        'w-[16px] h-[16px] flex-shrink-0',
        isActive ? 'text-primary' : ''
      )} />
      {!collapsed && (
        <span className={isActive ? 'font-semibold' : ''}>{item.label}</span>
      )}
      {isActive && !collapsed && (
        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
      )}
    </Link>
  );
}

export default function Sidebar({ user, onUpgrade }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen z-50 flex-col transition-all duration-200 hidden md:flex',
      'border-r border-white/[0.04]',
      collapsed ? 'w-[60px]' : 'w-[220px]'
    )}
    style={{ background: '#0A0A0A' }}
    >
      {/* Logo */}
      <div className={cn(
        'h-[60px] flex items-center border-b border-white/[0.04] flex-shrink-0',
        collapsed ? 'px-4 justify-center' : 'px-5 gap-3'
      )}>
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-[0_0_16px_rgba(59,130,246,0.4)]">
          <Zap className="w-[13px] h-[13px] text-white" />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 font-heading font-bold text-[14px] text-white tracking-tight">FitForge</span>
            <NotificationBell />
          </>
        )}
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 py-4 px-2.5 overflow-y-auto space-y-5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/20 px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavItem key={item.path} item={item} collapsed={collapsed} onUpgrade={onUpgrade} user={user} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-2.5 pb-4 pt-2 border-t border-white/[0.04] space-y-0.5">
        {BOTTOM_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <item.icon className="w-[16px] h-[16px] flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-medium text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
        >
          <LogOut className="w-[16px] h-[16px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center w-full py-2 rounded-xl text-muted-foreground hover:text-white hover:bg-white/[0.04] transition-all mt-1"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}