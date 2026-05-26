import React from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

function getGreeting(firstName) {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning, ${firstName}! ☀️`;
  if (h >= 12 && h < 17) return `Good afternoon, ${firstName}! 👋`;
  if (h >= 17 && h < 21) return `Good evening, ${firstName}! 🌙`;
  return `Still up, ${firstName}? 🌟`;
}

export default function PortalHeader({ user, unreadCount, onMessagesTap }) {
  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const greeting = getGreeting(firstName);
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-12 pb-4 flex items-start justify-between">
      <div>
        <p className="text-white font-bold text-xl leading-tight">{greeting}</p>
        <p className="text-white/40 text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>
      <div className="flex items-center gap-3 mt-1">
        <button onClick={onMessagesTap} className="relative">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-white/70" />
          </div>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-[9px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
            </div>
          )}
        </button>
        <button onClick={() => navigate('/portal/profile')}
          className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm">
          {firstName[0]?.toUpperCase()}
        </button>
      </div>
    </div>
  );
}