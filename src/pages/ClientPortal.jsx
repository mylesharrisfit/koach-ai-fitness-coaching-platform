import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Home, Dumbbell, Salad, BarChart2, MessageSquare, UserCircle } from 'lucide-react';
import PortalNutritionPage from '@/pages/portal/PortalNutrition';
import PortalCheckIn from '@/pages/portal/PortalCheckIn';
import PortalProgress from '@/pages/portal/PortalProgress';
import PortalMessages from '@/pages/portal/PortalMessages';
import { addDays, parseISO, differenceInDays } from 'date-fns';
import PortalHome from '@/components/portal/PortalHome';
import PortalProfile from '@/pages/portal/PortalProfile';
import PortalBilling from '@/pages/portal/PortalBilling';
import PortalWorkouts from '@/pages/portal/PortalWorkouts';

const NAV = [
  { icon: Home,         label: 'Home',      path: '/portal' },
  { icon: Dumbbell,     label: 'Train',     path: '/portal/workouts' },
  { icon: Salad,        label: 'Nutrition', path: '/portal/nutrition' },
  { icon: BarChart2,    label: 'Progress',  path: '/portal/progress' },
  { icon: MessageSquare,label: 'Coach',     path: '/portal/messages' },
];

function BottomNav({ user }) {
  const location = useLocation();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-nav', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-msgs-nav', myClient?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient.id }, '-created_date', 50),
    enabled: !!myClient?.id,
    refetchInterval: 30000,
  });

  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins-nav', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 5),
    enabled: !!myClient?.id,
  });

  const unreadMsgs = messages.filter(m => m.sender === 'coach' && !m.is_read).length;
  const lastCI = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  const nextDue = lastCI ? addDays(parseISO(lastCI.date), 7) : null;
  const checkInDue = !nextDue || differenceInDays(nextDue, new Date()) <= 0;

  const badges = {
    '/portal/messages': unreadMsgs > 0 ? unreadMsgs : null,
    '/portal/workouts': checkInDue ? '!' : null,
  };

  // Hide nav on profile and billing pages
  const hiddenPaths = ['/portal/profile', '/portal/billing'];
  if (hiddenPaths.some(p => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(8,10,18,0.97)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        {NAV.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/portal' && location.pathname.startsWith(item.path));
          const badge = badges[item.path];
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-2.5 gap-1 transition-all relative"
              style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.22)' }}>
              {isActive && (
                <motion.div layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }} />
              )}
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-all ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                {badge && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
                    style={{ background: badge === '!' ? '#EF4444' : '#3B82F6' }}>
                    {badge}
                  </motion.div>
                )}
              </div>
              <span className={`text-[10px] font-semibold transition-all ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function ClientPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0" style={{ background: '#080A12' }}>
      {/* Sign out — subtle */}
      <button
        onClick={() => base44.auth.logout()}
        className="absolute top-4 right-4 z-50 text-[10px]"
        style={{ color: 'rgba(255,255,255,0.1)' }}>
        Sign out
      </button>

      {/* Scrollable content */}
      <div className="absolute inset-0 overflow-y-auto">
        <Routes>
          <Route path="/"           element={<PortalHome user={user} />} />
          <Route path="/workouts"   element={<PortalWorkouts user={user} />} />
          <Route path="/nutrition"  element={<PortalNutritionPage user={user} />} />
          <Route path="/checkin"    element={<PortalCheckIn user={user} />} />
          <Route path="/progress"   element={<PortalProgress user={user} />} />
          <Route path="/messages"   element={<PortalMessages user={user} />} />
          <Route path="/profile"    element={<PortalProfile user={user} />} />
          <Route path="/billing"    element={<PortalBilling user={user} />} />
        </Routes>
      </div>

      <BottomNav user={user} />
    </div>
  );
}