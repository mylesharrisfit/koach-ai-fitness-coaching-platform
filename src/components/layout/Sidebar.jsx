import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '@/components/notifications/NotificationBell';
import { 
  LayoutDashboard, Users, Dumbbell, Salad, Calendar, Play,
  MessageSquare, TrendingUp, ShoppingBag, Settings, 
  ChevronLeft, ChevronRight, Zap, LogOut, Sparkles, Trophy, ClipboardList, DollarSign, Smartphone, Globe, Lock, CreditCard, Bot, BarChart3, Landmark, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';
import { hasFeature, getUserTier } from '@/lib/subscription';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Dumbbell, label: 'Programs', path: '/programs' },
  { icon: Play, label: 'Exercise Library', path: '/exercises' },
  { icon: Salad, label: 'Nutrition', path: '/nutrition' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
  { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review', feature: 'checkin_review' },
  { icon: ShieldAlert, label: 'At-Risk Clients', path: '/at-risk' },
  { icon: TrendingUp, label: 'Progress', path: '/progress', feature: 'progress' },
  { icon: Trophy, label: 'Adherence', path: '/adherence', feature: 'adherence' },
  { icon: DollarSign, label: 'Sales', path: '/sales', feature: 'sales' },
  { icon: Globe, label: 'Community', path: '/community', feature: 'community' },
  { icon: Smartphone, label: 'Client View', path: '/my-day', feature: 'client_dashboard' },
  { icon: Sparkles, label: 'AI Assistant', path: '/assistant', feature: 'assistant' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Landmark, label: 'Revenue', path: '/revenue' },
  { icon: TrendingUp, label: 'Business', path: '/business', feature: 'revenue_dashboard' },
  { icon: Bot, label: 'Automations', path: '/automations' },
  { icon: ShoppingBag, label: 'Store', path: '/store', feature: 'store' },
  { icon: CreditCard, label: 'Subscription', path: '/subscription' },
  { icon: Smartphone, label: 'White Label App', path: '/white-label' },
];

export default function Sidebar({ user, onUpgrade }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const tier = getUserTier(user);

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex-col transition-all duration-300 hidden md:flex",
      collapsed ? "w-[72px]" : "w-[240px]"
    )}>
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border relative z-10 gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shadow-glow-sm flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <>
            <span className="flex-1 font-heading font-bold text-base tracking-tight text-sidebar-foreground">FitForge</span>
            <NotificationBell />
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const isLocked = item.feature && !hasFeature(user, item.feature);
          return isLocked ? (
            <button
              key={item.path}
              onClick={() => onUpgrade?.(item.feature)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left text-sidebar-foreground/30 hover:text-sidebar-foreground/50 hover:bg-sidebar-accent/50 transition-all duration-200 group/locked"
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="tracking-tight flex-1">{item.label}</span>
                  <Lock className="w-3 h-3 opacity-60 group-hover/locked:opacity-100" />
                </>
              )}
            </button>
          ) : (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />}
              <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive ? "text-primary" : "")} />
              {!collapsed && <span className="tracking-tight">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        {/* Tier badge */}
        {!collapsed && (
          <Link to="/subscription" className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold mb-1 transition-all hover:opacity-80",
            tier.badge
          )}>
            <Zap className="w-3 h-3 flex-shrink-0" />
            <span className="flex-1">{tier.name} Plan</span>
            <CreditCard className="w-3 h-3 opacity-60" />
          </Link>
        )}
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent transition-all w-full"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 rounded-lg text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}