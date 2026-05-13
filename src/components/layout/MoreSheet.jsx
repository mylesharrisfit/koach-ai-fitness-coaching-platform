import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  X, Calendar, Salad, ClipboardList, TrendingUp,
  Settings, CreditCard, DollarSign, BarChart3, Sparkles,
  Bot, Globe, Smartphone, Landmark, Dumbbell, Trophy, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SECTIONS = [
  {
    title: 'Coaching',
    items: [
      { icon: Dumbbell, label: 'Programs', path: '/programs' },
      { icon: Salad, label: 'Nutrition', path: '/nutrition' },
      { icon: ClipboardList, label: 'Check-ins', path: '/checkin-review' },
      { icon: TrendingUp, label: 'Progress', path: '/progress' },
      { icon: Trophy, label: 'Adherence', path: '/adherence' },
      { icon: ShieldAlert, label: 'At-Risk', path: '/at-risk' },
    ],
  },
  {
    title: 'Business',
    items: [
      { icon: DollarSign, label: 'Payments', path: '/revenue' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: Globe, label: 'Community', path: '/community' },
    ],
  },
  {
    title: 'AI Tools',
    items: [
      { icon: Sparkles, label: 'AI Assistant', path: '/assistant' },
      { icon: Bot, label: 'Automations', path: '/automations' },
      { icon: Smartphone, label: 'Client View', path: '/my-day' },
    ],
  },
  {
    title: 'Account',
    items: [
      { icon: CreditCard, label: 'Subscription', path: '/subscription' },
      { icon: Settings, label: 'Settings', path: '/settings' },
    ],
  },
];

export default function MoreSheet({ open, onClose }) {
  const location = useLocation();

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/70 md:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed left-0 right-0 bottom-0 z-50 md:hidden flex flex-col transition-transform duration-300 ease-out rounded-t-2xl overflow-hidden',
          open ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ background: '#161616', maxHeight: '88dvh', border: '1px solid rgba(255,255,255,0.06)', borderBottom: 'none' }}
      >
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-8 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="font-bold text-base text-white">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6 pb-8">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2 px-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all"
                      style={{
                        background: isActive ? 'rgba(59,130,246,0.1)' : 'transparent',
                        color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      <item.icon className="w-[16px] h-[16px] flex-shrink-0" />
                      <span className="text-sm font-medium flex-1">{item.label}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#3B82F6' }} />}
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