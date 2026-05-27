import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Home, Dumbbell, Salad, BarChart2, MessageSquare, ClipboardList, UserCircle
} from 'lucide-react';
import PortalNutritionPage from '@/pages/portal/PortalNutrition';
import PortalCheckIn from '@/pages/portal/PortalCheckIn';
import PortalProgress from '@/pages/portal/PortalProgress';
import PortalMessages from '@/pages/portal/PortalMessages';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import PortalHome from '@/components/portal/PortalHome';
import PortalProfile from '@/pages/portal/PortalProfile';
import PortalBilling from '@/pages/portal/PortalBilling';

/* ── Bottom Nav ── */
function BottomNav({ user }) {
  const location = useLocation();

  // Fetch unread messages count
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

  const NAV = [
    { icon: Home, label: 'Home', path: '/portal' },
    { icon: Dumbbell, label: 'Workout', path: '/portal/workouts' },
    { icon: ClipboardList, label: 'Check-in', path: '/portal/checkin', badge: checkInDue ? '!' : null, badgeColor: '#EF4444' },
    { icon: BarChart2, label: 'Progress', path: '/portal/progress' },
    { icon: MessageSquare, label: 'Messages', path: '/portal/messages', badge: unreadMsgs > 0 ? unreadMsgs : null },
    { icon: UserCircle, label: 'Profile', path: '/portal/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(13,17,28,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
      {NAV.map(item => {
        const isActive = location.pathname === item.path ||
          (item.path !== '/portal' && location.pathname.startsWith(item.path));
        return (
          <Link key={item.path} to={item.path}
            className="flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors relative"
            style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.25)' }}>
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge && (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                  style={{ background: item.badgeColor || '#3B82F6' }}>
                  {item.badge}
                </motion.div>
              )}
            </div>
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Workouts (simple inline, full view is in PortalWorkouts page) ── */
function PortalWorkouts({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-wk', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];
  const { data: programs = [] } = useQuery({
    queryKey: ['portal-program-wk', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
  });
  const program = programs[0];

  return (
    <div className="px-5 pt-12 pb-28 space-y-5">
      <div className="mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Workouts</p>
        <h1 className="text-white text-xl font-bold mt-0.5">{program?.title || 'Your Training'}</h1>
      </div>
      {!program ? (
        <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Dumbbell className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm font-semibold">No program assigned yet</p>
          <p className="text-white/25 text-xs mt-1">Your coach will set up your training plan soon.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {(program.workouts || []).map((w, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-bold text-sm">{w.day_name || `Day ${i + 1}`}</p>
                <span className="text-white/30 text-[10px]">{w.exercises?.length || 0} exercises</span>
              </div>
              {(w.exercises || []).slice(0, 4).map((ex, j) => (
                <div key={j} className="flex items-center gap-2 py-1 border-t border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  <p className="text-white/50 text-xs flex-1">{ex.name}</p>
                  <p className="text-white/25 text-[10px]">{ex.sets}×{ex.reps}</p>
                </div>
              ))}
              {(w.exercises?.length || 0) > 4 && (
                <p className="text-white/20 text-[10px] mt-1 pl-3.5">+{w.exercises.length - 4} more</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main Export ── */
export default function ClientPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <div className="fixed inset-0" style={{ background: '#0A0F1A' }}>
      {/* Sign out button — top right, subtle */}
      <button
        onClick={() => base44.auth.logout()}
        className="absolute top-4 right-4 z-50 text-[10px] text-white/15 hover:text-white/40 transition-colors">
        Sign out
      </button>

      {/* Scrollable content area */}
      <div className="absolute inset-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<PortalHome user={user} />} />
          <Route path="/workouts" element={<PortalWorkouts user={user} />} />
          <Route path="/nutrition" element={<PortalNutritionPage user={user} />} />
          <Route path="/checkin" element={<PortalCheckIn user={user} />} />
          <Route path="/progress" element={<PortalProgress user={user} />} />
          <Route path="/messages" element={<PortalMessages user={user} />} />
          <Route path="/profile" element={<PortalProfile user={user} />} />
          <Route path="/billing" element={<PortalBilling user={user} />} />
        </Routes>
      </div>

      {/* Bottom Nav */}
      <BottomNav user={user} />
    </div>
  );
}