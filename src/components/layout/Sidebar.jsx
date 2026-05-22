import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import KoachLogo from '@/components/brand/KoachLogo.jsx';
import NotificationBell from '@/components/notifications/NotificationBell';
import AchievementBell from '@/components/achievements/AchievementBell';
import {
  LayoutDashboard, Users, MessageSquare, Calendar,
  Dumbbell, Salad, ClipboardList, TrendingUp,
  Sparkles, Bot, BarChart3,
  CreditCard, Settings, LogOut, ChevronLeft, ChevronRight,
  Lock, DollarSign, UserPlus, Zap, Trophy, ShoppingBag,
  Globe, Smartphone, Activity, Apple, FileText,
  Shield, Palette, BookOpen, LayoutTemplate, ChevronDown, ChevronUp, Mail
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { hasFeature } from '@/lib/subscription';

const NAV_GROUPS = [
  {
    label: 'MAIN',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: BookOpen, label: 'Onboarding', path: '/onboarding-manager' },
      { icon: Users, label: 'Clients', path: '/clients' },
      { icon: MessageSquare, label: 'Messages', path: '/messages' },
      { icon: Calendar, label: 'Calendar', path: '/schedule' },
    ],
  },
  {
    label: 'COACHING',
    items: [
      { icon: Dumbbell, label: 'Programs', path: '/programs' },
      { icon: Salad, label: 'Nutrition', path: '/nutrition' },
      { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review', feature: 'checkin_review' },
      { icon: TrendingUp, label: 'Progress', path: '/progress', feature: 'progress' },
      { icon: Trophy, label: 'Adherence', path: '/adherence', feature: 'adherence' },
      { icon: Shield, label: 'At-Risk', path: '/at-risk' },
      { icon: Activity, label: 'Exercises', path: '/exercises' },
      { icon: Apple, label: 'Food Library', path: '/food-library' },
    ],
  },
  {
    label: 'AI TOOLS',
    items: [
      { icon: Sparkles, label: 'AI Assistant', path: '/assistant', feature: 'assistant' },
      { icon: Bot, label: 'Automations', path: '/automations' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { icon: DollarSign, label: 'Payments', path: '/revenue' },
      { icon: Mail, label: 'Email Center', path: '/email-center' },
      { icon: UserPlus, label: 'Leads', path: '/sales', feature: 'sales' },
      { icon: ShoppingBag, label: 'Store', path: '/store', feature: 'store' },
      { icon: Globe, label: 'Community', path: '/community', feature: 'community' },
      { icon: BarChart3, label: 'Business', path: '/business' },
    ],
  },
  {
    label: 'TOOLS',
    items: [
      { icon: LayoutTemplate, label: 'Templates', path: '/coaching-templates' },
      { icon: Palette, label: 'White Label', path: '/white-label' },
      { icon: Smartphone, label: 'Client View', path: '/my-day', feature: 'client_dashboard' },
    ],
  },
];

const BOTTOM_ITEMS = [
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

function useUnreadCount() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    staleTime: 30000,
  });
  return messages.filter(m => m.sender === 'client' && !m.is_read).length;
}

function NavItem({ item, collapsed, onUpgrade, user }) {
  const location = useLocation();
  const isActive = location.pathname === item.path ||
    (item.path !== '/' && location.pathname.startsWith(item.path));
  const isLocked = item.feature && !hasFeature(user, item.feature);
  const unreadCount = useUnreadCount();
  const showUnread = item.path === '/messages' && unreadCount > 0;

  if (isLocked) {
    return (
      <button
        onClick={() => onUpgrade?.(item.feature)}
        className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full text-left transition-colors"
        style={{ color: 'rgba(255,255,255,0.2)' }}
        title={collapsed ? item.label : undefined}
      >
        <item.icon className="w-[16px] h-[16px] flex-shrink-0" />
        {!collapsed && (
          <>
            <span className="flex-1 text-[13px]">{item.label}</span>
            <Lock className="w-3 h-3 opacity-30" />
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150',
        isActive
          ? 'text-white'
          : 'hover:text-white'
      )}
      style={{
        color: isActive ? '#fff' : 'rgba(255,255,255,0.38)',
        background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
      }}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full" style={{ background: '#3B82F6' }} />
      )}
      <item.icon className={cn('w-[16px] h-[16px] flex-shrink-0 transition-colors')} />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && showUnread && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 flex-shrink-0">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {collapsed && showUnread && (
        <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-red-500" />
      )}
    </Link>
  );
}

export default function Sidebar({ user, onUpgrade }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-50 flex-col transition-all duration-200 hidden md:flex',
        collapsed ? 'w-[56px]' : 'w-[210px]'
      )}
      style={{ background: '#0D0D0D', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo */}
      <div className={cn(
        'h-[56px] flex items-center flex-shrink-0',
        collapsed ? 'px-3 justify-center' : 'px-4 gap-3'
      )} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <KoachLogo size={32} rounded="rounded-xl" glow={true} bg={true} />
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0">
              <span className="block font-bold text-[13px] text-white tracking-tight leading-none">KOACH AI</span>
              <span className="block text-[9px] tracking-[0.12em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>Coaching OS</span>
            </div>
            <div className="flex items-center gap-1">
              <AchievementBell />
              <NotificationBell />
            </div>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && !collapsed && (
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] px-3 mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
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
      <div className="p-2 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        {BOTTOM_ITEMS.map(item => {
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#fff'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
            >
              <item.icon className="w-[16px] h-[16px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}

        <button
          onClick={() => base44.auth.logout()}
          title={collapsed ? 'Logout' : undefined}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all w-full"
          style={{ color: 'rgba(255,255,255,0.25)' }}
          onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
        >
          <LogOut className="w-[16px] h-[16px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center w-full py-2 rounded-lg transition-all mt-1"
          style={{ color: 'rgba(255,255,255,0.2)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}