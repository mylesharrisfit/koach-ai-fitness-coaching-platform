import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dumbbell, Salad, TrendingUp, Trophy, Shield, Activity, Apple,
  Sparkles, Bot, BarChart3,
  DollarSign, UserPlus, ShoppingBag, Globe, BarChart2,
  LayoutTemplate, Palette, Settings, CreditCard, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const SECTIONS = [
  {
    title: 'COACHING',
    items: [
      { icon: Dumbbell,       label: 'Programs',   path: '/programs' },
      { icon: Salad,          label: 'Nutrition',  path: '/nutrition' },
      { icon: TrendingUp,     label: 'Progress',   path: '/progress' },
      { icon: Trophy,         label: 'Adherence',  path: '/adherence' },
      { icon: Shield,         label: 'At-Risk',    path: '/at-risk' },
      { icon: Activity,       label: 'Exercises',  path: '/exercises' },
    ],
  },
  {
    title: 'AI TOOLS',
    items: [
      { icon: Sparkles,  label: 'AI Assistant', path: '/assistant' },
      { icon: Bot,       label: 'Automations',  path: '/automations' },
      { icon: BarChart3, label: 'Analytics',    path: '/analytics' },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      { icon: DollarSign,  label: 'Payments',  path: '/revenue' },
      { icon: UserPlus,    label: 'Leads',     path: '/sales' },
      { icon: ShoppingBag, label: 'Store',     path: '/store' },
      { icon: Globe,       label: 'Community', path: '/community' },
    ],
  },
  {
    title: 'TOOLS',
    items: [
      { icon: LayoutTemplate, label: 'Templates',   path: '/coaching-templates' },
      { icon: Apple,          label: 'Food Library', path: '/food-library' },
      { icon: Palette,        label: 'White Label', path: '/white-label' },
      { icon: Settings,       label: 'Settings',    path: '/settings' },
    ],
  },
];

export default function MoreSheet({ open, onClose }) {
  const location = useLocation();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 md:hidden"
            onClick={onClose}
          />
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed left-0 right-0 z-50 md:hidden flex flex-col rounded-t-2xl overflow-hidden bg-white"
            style={{ bottom: '60px', maxHeight: 'calc(80dvh - 60px)', borderTop: '1px solid #E5E7EB' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-1 flex-shrink-0">
              <div className="w-9 h-1 rounded-full bg-[#D1D5DB]" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-4 pt-2 pb-8">
              {SECTIONS.map((section) => (
                <div key={section.title} className="mb-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5 px-1 text-[#9CA3AF]">
                    {section.title}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path ||
                        (item.path !== '/' && location.pathname.startsWith(item.path));
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={onClose}
                          className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95"
                        >
                          <div className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center',
                            isActive ? 'bg-[#111827]' : 'bg-[#F3F4F6]'
                          )}>
                            <item.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#374151]')} />
                          </div>
                          <span className={cn(
                            'text-[10px] text-center leading-tight',
                            isActive ? 'text-[#111827] font-semibold' : 'text-[#6B7280]'
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Account links */}
              <div className="border-t border-[#F3F4F6] pt-4 mt-1">
                <div className="grid grid-cols-4 gap-2">
                  {[{ icon: CreditCard, label: 'Subscription', path: '/subscription' }].map(item => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <Link key={item.path} to={item.path} onClick={onClose} className="flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all active:scale-95">
                        <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', isActive ? 'bg-[#111827]' : 'bg-[#F3F4F6]')}>
                          <item.icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[#374151]')} />
                        </div>
                        <span className="text-[10px] text-[#6B7280] text-center leading-tight">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}