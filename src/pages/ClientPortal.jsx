import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Home, Dumbbell, Salad, BarChart2, MessageSquare,
  ChevronRight, ArrowLeft, Send
} from 'lucide-react';
import PortalNutritionPage from '@/pages/portal/PortalNutrition';
import { format, parseISO } from 'date-fns';
import PortalHome from '@/components/portal/PortalHome';

/* ── Bottom Nav ── */
const NAV = [
  { icon: Home,          label: 'Home',      path: '/portal' },
  { icon: Dumbbell,      label: 'Workout',   path: '/portal/workouts' },
  { icon: Salad,         label: 'Nutrition', path: '/portal/nutrition' },
  { icon: BarChart2,     label: 'Progress',  path: '/portal/progress' },
  { icon: MessageSquare, label: 'Messages',  path: '/portal/messages' },
];

function BottomNav() {
  const location = useLocation();
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
            className="flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors"
            style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.25)' }}>
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/* ── Workouts ── */
function PortalWorkouts({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-wk', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
    select: d => d,
  });
  const myClient = clients[0];
  const { data: programs = [] } = useQuery({
    queryKey: ['portal-program-wk', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
    select: d => d,
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

/* ── Nutrition → delegated to dedicated page ── */
function PortalNutrition({ user }) {
  return <PortalNutritionPage user={user} />;
}

/* ── Progress ── */
function PortalProgress({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-pg', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];
  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins-pg', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 20),
    enabled: !!myClient?.id,
  });

  return (
    <div className="px-5 pt-12 pb-28 space-y-4">
      <div className="mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Progress</p>
        <h1 className="text-white text-xl font-bold mt-0.5">Your Journey</h1>
      </div>
      {checkIns.length === 0 ? (
        <div className="p-6 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <BarChart2 className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50 text-sm font-semibold">No check-ins yet</p>
          <p className="text-white/25 text-xs mt-1">Submit your first check-in to start tracking progress.</p>
        </div>
      ) : (
        checkIns.slice(0, 12).map((ci, i) => (
          <motion.div key={ci.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-center flex-shrink-0 w-12">
              <p className="text-white/40 text-[9px]">{format(parseISO(ci.date), 'MMM')}</p>
              <p className="text-white font-bold text-lg leading-none">{format(parseISO(ci.date), 'd')}</p>
            </div>
            <div className="flex-1 min-w-0">
              {ci.weight && <p className="text-white/70 text-sm font-semibold">{ci.weight} lbs</p>}
              <p className="text-white/30 text-xs capitalize">{ci.mood || ''}</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg flex-shrink-0"
              style={{
                background: ci.review_status === 'reviewed' ? 'rgba(34,197,94,0.15)' : 'rgba(251,191,36,0.12)',
                color: ci.review_status === 'reviewed' ? '#22C55E' : '#FBB724',
              }}>
              {ci.review_status === 'reviewed' ? '✓ Reviewed' : 'Pending'}
            </span>
          </motion.div>
        ))
      )}
    </div>
  );
}

/* ── Messages ── */
function PortalMessages({ user }) {
  const [newMsg, setNewMsg] = useState('');
  const navigate = useNavigate();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-msg', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['portal-messages-tab', myClient?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient.id }, '-created_date', 50),
    enabled: !!myClient?.id,
  });

  const sorted = [...messages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const sendMsg = async () => {
    if (!newMsg.trim() || !myClient?.id) return;
    await base44.entities.Message.create({ client_id: myClient.id, client_name: myClient.name, sender: 'client', content: newMsg });
    setNewMsg('');
    refetch();
  };

  return (
    <div className="flex flex-col h-screen" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 60px)' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Messages</p>
        <h1 className="text-white text-xl font-bold mt-0.5">Coach Chat</h1>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {sorted.length === 0 && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-white/10 mx-auto mb-2" />
            <p className="text-white/30 text-sm">No messages yet</p>
          </div>
        )}
        {sorted.map(m => (
          <div key={m.id} className={`flex ${m.sender === 'client' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl"
              style={{
                background: m.sender === 'client' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${m.sender === 'client' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.1)'}`,
              }}>
              <p className="text-white text-sm leading-relaxed">{m.content}</p>
              <p className="text-white/25 text-[9px] mt-1">{m.created_date ? format(new Date(m.created_date), 'MMM d, h:mm a') : ''}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-3 flex items-center gap-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13,17,28,0.95)' }}>
        <input
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="Message your coach..."
          className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button onClick={sendMsg}
          disabled={!newMsg.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-30"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
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
      {/* Sign out button — top left, subtle */}
      <button
        onClick={() => base44.auth.logout()}
        className="absolute top-4 left-4 z-50 text-[10px] text-white/15 hover:text-white/40 transition-colors">
        Sign out
      </button>

      {/* Scrollable content area */}
      <div className="absolute inset-0 overflow-y-auto">
        <Routes>
          <Route path="/" element={<PortalHome user={user} />} />
          <Route path="/workouts" element={<PortalWorkouts user={user} />} />
          <Route path="/nutrition" element={<PortalNutrition user={user} />} />
          <Route path="/progress" element={<PortalProgress user={user} />} />
          <Route path="/messages" element={<PortalMessages user={user} />} />
        </Routes>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
}