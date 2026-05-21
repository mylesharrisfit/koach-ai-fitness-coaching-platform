import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ClipboardList, MessageSquare, MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MoreSheet from './MoreSheet';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

function useUnreadMessages() {
  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date', 200),
    staleTime: 30000,
  });
  return messages.filter(m => m.sender === 'client' && !m.is_read).length;
}

function usePendingCheckIns() {
  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins-review'],
    queryFn: () => base44.entities.CheckIn.list('-date', 200),
    staleTime: 30000,
  });
  return checkIns.filter(ci => !ci.coach_responded && !ci.review_status?.includes('reviewed')).length;
}

const PRIMARY_NAV = [
  { icon: LayoutDashboard, label: 'Home',      path: '/' },
  { icon: Users,           label: 'Clients',   path: '/clients' },
  { icon: ClipboardList,   label: 'Check-ins', path: '/checkin-review' },
  { icon: MessageSquare,   label: 'Messages',  path: '/messages' },
];

export default function BottomNav() {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const unreadMessages = useUnreadMessages();
  const pendingCheckIns = usePendingCheckIns();

  const isMoreActive = location.pathname !== '/' &&
    !['/clients', '/checkin-review', '/messages'].some(p => location.pathname.startsWith(p));

  return (
    <>
      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden bg-white border-t border-[#E5E7EB]"
        style={{ height: '60px', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {PRIMARY_NAV.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const badge = item.path === '/messages' ? unreadMessages
            : item.path === '/checkin-review' ? pendingCheckIns : 0;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#2563EB]" />
              )}
              <div className="relative">
                <item.icon className={cn('w-5 h-5', isActive ? 'text-[#111827]' : 'text-[#9CA3AF]')} />
                {badge > 0 && (
                  <span className={cn(
                    'absolute -top-1 -right-1.5 min-w-[14px] h-3.5 rounded-full text-[9px] font-bold flex items-center justify-center px-0.5 text-white',
                    item.path === '/messages' ? 'bg-red-500' : 'bg-amber-500'
                  )}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={cn('text-[10px]', isActive ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF] font-medium')}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More */}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center justify-center flex-1 gap-0.5 relative transition-colors"
        >
          {isMoreActive && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#2563EB]" />
          )}
          <MoreHorizontal className={cn('w-5 h-5', isMoreActive ? 'text-[#111827]' : 'text-[#9CA3AF]')} />
          <span className={cn('text-[10px]', isMoreActive ? 'text-[#111827] font-semibold' : 'text-[#9CA3AF] font-medium')}>More</span>
        </button>
      </nav>
    </>
  );
}