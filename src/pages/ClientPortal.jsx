import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import KoachLogo from '@/components/brand/KoachLogo.jsx';
import {
  Dumbbell, Salad, CheckSquare, TrendingUp, MessageSquare,
  Home, LogOut, ChevronRight, Calendar, Flame, Droplets,
  Star, BarChart2
} from 'lucide-react';

/* ─── Nav config ─── */
const NAV = [
  { icon: Home,         label: 'Home',      path: '/portal' },
  { icon: Dumbbell,     label: 'Workouts',  path: '/portal/workouts' },
  { icon: Salad,        label: 'Nutrition', path: '/portal/nutrition' },
  { icon: CheckSquare,  label: 'Check-in',  path: '/portal/checkin' },
  { icon: MessageSquare,label: 'Messages',  path: '/portal/messages' },
  { icon: TrendingUp,   label: 'Progress',  path: '/portal/progress' },
];

/* ─── Portal Shell ─── */
function PortalShell({ user, children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F6FB' }}>
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <KoachLogo size={28} rounded="rounded-lg" bg />
          <div>
            <p className="text-xs font-bold text-gray-900 leading-none">KOACH AI</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Client Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-gray-500 font-medium hidden sm:block">
            {user?.full_name?.split(' ')[0] || 'Welcome'}
          </p>
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {NAV.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/portal' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-2.5 gap-0.5 transition-colors"
              style={{ color: isActive ? '#3B82F6' : '#9CA3AF' }}>
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Home ─── */
function PortalHome({ user }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const { data: logs = [] } = useQuery({
    queryKey: ['portal-logs', user?.email],
    queryFn: () => user?.email ? base44.entities.DailyLog.filter({ client_id: user.email }) : [],
  });

  const today = logs.find(l => l.date === new Date().toISOString().split('T')[0]);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
          {greeting}, {firstName} 👋
        </p>
        <h1 className="text-2xl font-bold text-gray-900 mt-0.5" style={{ letterSpacing: '-0.02em' }}>
          Your Dashboard
        </h1>
      </motion.div>

      {/* Today's rings */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Today's Progress</p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Flame, label: 'Workout', val: today?.workout_done ? 'Done ✓' : 'Pending', color: '#EF4444' },
            { icon: Salad, label: 'Meals', val: `${today?.meals_logged || 0} logged`, color: '#10B981' },
            { icon: Droplets, label: 'Water', val: `${today?.water_glasses || 0} glasses`, color: '#3B82F6' },
          ].map(({ icon: Icon, label, val, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800">{val}</p>
                <p className="text-[10px] text-gray-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Quick links */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
        className="space-y-2.5">
        {NAV.slice(1).map((item, i) => (
          <Link key={item.path} to={item.path}
            className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm hover:border-blue-200 transition-all">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
              <item.icon className="w-4.5 h-4.5 text-blue-500" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Placeholder sections ─── */
function PortalSection({ title, icon: Icon, description, children }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#EFF6FF' }}>
            <Icon className="w-4.5 h-4.5 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>{title}</h1>
        </div>
        {description && <p className="text-sm text-gray-500 mt-1 ml-12">{description}</p>}
      </motion.div>
      {children}
    </div>
  );
}

function Workouts({ user }) {
  const { data: client } = useQuery({
    queryKey: ['portal-client', user?.email],
    queryFn: () => user?.email ? base44.entities.Client.filter({ email: user.email }) : [],
    select: d => d?.[0],
  });

  const { data: program } = useQuery({
    queryKey: ['portal-program', client?.assigned_program_id],
    queryFn: () => client?.assigned_program_id ? base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }) : [],
    select: d => d?.[0],
    enabled: !!client?.assigned_program_id,
  });

  return (
    <PortalSection title="Your Workouts" icon={Dumbbell} description="Your coach-assigned training plan.">
      {program ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <p className="font-bold text-gray-900">{program.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {program.duration_weeks ? `${program.duration_weeks} weeks · ` : ''}{program.days_per_week || 0} days/week
            </p>
          </div>
          <div className="divide-y divide-gray-50">
            {(program.workouts || []).map((w, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{w.day_name || `Day ${w.day_number || i + 1}`}</p>
                  <p className="text-xs text-gray-400">{w.exercises?.length || 0} exercises</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <EmptyState icon={Dumbbell} title="No program assigned yet" body="Your coach will assign your training plan soon." />
      )}
    </PortalSection>
  );
}

function Nutrition({ user }) {
  const { data: client } = useQuery({
    queryKey: ['portal-client', user?.email],
    queryFn: () => user?.email ? base44.entities.Client.filter({ email: user.email }) : [],
    select: d => d?.[0],
  });

  const { data: plan } = useQuery({
    queryKey: ['portal-nutrition', client?.assigned_nutrition_id],
    queryFn: () => client?.assigned_nutrition_id ? base44.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id }) : [],
    select: d => d?.[0],
    enabled: !!client?.assigned_nutrition_id,
  });

  return (
    <PortalSection title="Nutrition Plan" icon={Salad} description="Your personalized meal plan from your coach.">
      {plan ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <p className="font-bold text-gray-900">{plan.title}</p>
            <div className="flex gap-4 mt-2">
              {[
                { label: 'Calories', val: plan.calories },
                { label: 'Protein', val: plan.protein_g ? `${plan.protein_g}g` : null },
                { label: 'Carbs', val: plan.carbs_g ? `${plan.carbs_g}g` : null },
                { label: 'Fats', val: plan.fats_g ? `${plan.fats_g}g` : null },
              ].filter(x => x.val).map(x => (
                <div key={x.label} className="text-center">
                  <p className="text-sm font-bold text-blue-600">{x.val}</p>
                  <p className="text-[10px] text-gray-400">{x.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {(plan.meals || []).map((m, i) => (
              <div key={i} className="px-5 py-3.5">
                <p className="text-sm font-semibold text-gray-800">{m.meal_name}</p>
                {m.time && <p className="text-xs text-gray-400">{m.time}</p>}
              </div>
            ))}
          </div>
        </motion.div>
      ) : (
        <EmptyState icon={Salad} title="No nutrition plan yet" body="Your coach will assign your nutrition plan soon." />
      )}
    </PortalSection>
  );
}

function CheckIn({ user }) {
  const navigate = useNavigate();
  return (
    <PortalSection title="Check-In" icon={CheckSquare} description="Submit your weekly check-in to your coach.">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Keep your coach updated on your progress, how you're feeling, and what needs adjusting.
        </p>
        <button
          onClick={() => navigate('/submit-checkin')}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' }}>
          Submit This Week's Check-In
        </button>
      </motion.div>
    </PortalSection>
  );
}

function Messages({ user }) {
  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages', user?.email],
    queryFn: () => user?.email ? base44.entities.Message.filter({ client_id: user.email }) : [],
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
  });

  return (
    <PortalSection title="Messages" icon={MessageSquare} description="Direct line to your coach.">
      {messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" body="Messages from your coach will appear here." />
      ) : (
        <div className="space-y-2.5">
          {messages.map(m => (
            <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                  {m.sender === 'coach' ? 'Coach' : 'You'}
                </span>
                <span className="text-[10px] text-gray-400">
                  {m.created_date ? new Date(m.created_date).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{m.content}</p>
            </motion.div>
          ))}
        </div>
      )}
    </PortalSection>
  );
}

function Progress({ user }) {
  const { data: checkins = [] } = useQuery({
    queryKey: ['portal-checkins', user?.email],
    queryFn: () => user?.email ? base44.entities.CheckIn.filter({ client_id: user.email }) : [],
    select: d => [...d].sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  return (
    <PortalSection title="Progress" icon={TrendingUp} description="Track your journey over time.">
      {checkins.length === 0 ? (
        <EmptyState icon={BarChart2} title="No check-ins yet" body="Submit your first check-in to start tracking progress." />
      ) : (
        <div className="space-y-2.5">
          {checkins.slice(0, 10).map(c => (
            <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800">{c.date}</p>
                <p className="text-xs text-gray-400">
                  {c.weight ? `${c.weight} lbs · ` : ''}{c.mood || ''}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: c.review_status === 'reviewed' ? '#ECFDF5' : '#FFF7ED',
                  color: c.review_status === 'reviewed' ? '#065F46' : '#92400E',
                }}>
                {c.review_status === 'reviewed' ? 'Reviewed' : 'Pending'}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </PortalSection>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="bg-white rounded-2xl py-14 border border-gray-100 shadow-sm text-center px-6">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: '#EFF6FF' }}>
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{body}</p>
    </motion.div>
  );
}

/* ─── Main Export ─── */
export default function ClientPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  return (
    <PortalShell user={user}>
      <Routes>
        <Route path="/" element={<PortalHome user={user} />} />
        <Route path="/workouts" element={<Workouts user={user} />} />
        <Route path="/nutrition" element={<Nutrition user={user} />} />
        <Route path="/checkin" element={<CheckIn user={user} />} />
        <Route path="/messages" element={<Messages user={user} />} />
        <Route path="/progress" element={<Progress user={user} />} />
      </Routes>
    </PortalShell>
  );
}