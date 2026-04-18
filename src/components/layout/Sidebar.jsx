import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Dumbbell, Salad, Calendar, 
  MessageSquare, TrendingUp, ShoppingBag, Settings, 
  ChevronLeft, ChevronRight, Zap, LogOut, Sparkles, Trophy, ClipboardList, DollarSign, Smartphone, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { base44 } from '@/api/base44Client';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Users, label: 'Clients', path: '/clients' },
  { icon: Dumbbell, label: 'Programs', path: '/programs' },
  { icon: Salad, label: 'Nutrition', path: '/nutrition' },
  { icon: Calendar, label: 'Schedule', path: '/schedule' },
  { icon: MessageSquare, label: 'Messages', path: '/messages' },
  { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review' },
  { icon: TrendingUp, label: 'Progress', path: '/progress' },
  { icon: Trophy, label: 'Adherence', path: '/adherence' },
  { icon: DollarSign, label: 'Sales', path: '/sales' },
  { icon: Globe, label: 'Community', path: '/community' },
  { icon: Smartphone, label: 'Client View', path: '/my-day' },
  { icon: Sparkles, label: 'AI Assistant', path: '/assistant' },
  { icon: ShoppingBag, label: 'Store', path: '/store' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border z-50 flex flex-col transition-all duration-300",
      collapsed ? "w-[72px]" : "w-[240px]"
    )} style={{ background: 'hsl(222 32% 4%)' }}>
      {/* Ambient glow at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/8 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border relative z-10">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/30 shadow-glow-sm flex-shrink-0">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        {!collapsed && (
          <span className="ml-3 font-heading font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text" style={{ WebkitBackgroundClip: 'text' }}>FitForge</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-5 px-3 space-y-0.5 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/15 text-sidebar-primary-foreground shadow-glow-sm ring-1 ring-primary/25" 
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              )}
            >
              {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" style={{ boxShadow: '0 0 8px hsl(var(--sidebar-primary) / 0.8)' }} />}
              <item.icon className={cn("w-4 h-4 flex-shrink-0 transition-colors", isActive && "text-primary")} />
              {!collapsed && <span className={cn("tracking-tight", isActive && "text-sidebar-foreground")}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Link
          to="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <button
          onClick={() => base44.auth.logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent transition-all w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
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