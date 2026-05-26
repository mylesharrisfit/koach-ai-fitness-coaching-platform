import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Home, Dumbbell, Salad, TrendingUp, MessageSquare,
  CheckSquare, BarChart2, LogOut, ChevronRight,
} from 'lucide-react';
import PortalHome from '@/components/portal/PortalHome';
import PortalWorkouts from '@/pages/portal/PortalWorkouts';

/* ─── Nav config (5 tabs) ─── */
const NAV = [
  { icon: Home,         label: 'Home',      path: '/portal' },
  { icon: Dumbbell,     label: 'Workout',   path: '/portal/workouts' },
  { icon: Salad,        label: 'Nutrition', path: '/portal/nutrition' },
  { icon: TrendingUp,   label: 'Progress',  path: '/portal/progress' },
  { icon: MessageSquare,label: 'Messages',  path: '/portal/messages' },
];

/* ─── Shell (dark themed) ─── */
function PortalShell({ user, children }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0A12' }}>
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>
      {/* Fixed bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          background: 'rgba(10,10,18,0.95)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        {NAV.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/portal' && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}
              className="flex flex-col items-center justify-center flex-1 py-3 gap-1 transition-colors">
              <item.icon className="w-5 h-5" style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.25)' }} />
              <span className="text-[9px] font-semibold" style={{ color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.25)' }}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-8 h-0.5 rounded-full" style={{ background: '#3B82F6' }} />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/* ─── Placeholder section (dark themed) ─── */
function PortalSection({ title, icon: SectionIcon, children, user }) {
  return (
    <div className="pb-28 pt-12 px-5 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <SectionIcon className="w-4.5 h-4.5 text-blue-400" />
        </div>
        <h1 className="text-white font-bold text-xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ icon: EmptyIcon, title, body }) {
  return (
    <div className="py-16 text-center px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(59,130,246,0.1)' }}>
        <EmptyIcon className="w-6 h-6 text-blue-400/50" />
      </div>
      <p className="text-white/50 font-semibold text-sm">{title}</p>
      <p className="text-white/20 text-xs mt-1 leading-relaxed">{body}</p>
    </div>
  );
}

/* ─── Messages ─── */
function Messages({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
    select: d => d,
  });
  const myClient = clients[0];
  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages', user?.email],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient?.id || user?.email }, '-created_date', 30),
    enabled: !!(myClient?.id || user?.email),
    select: d => [...d].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
  });

  return (
    <PortalSection title="Messages" icon={MessageSquare} user={user}>
      {messages.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No messages yet" body="Messages from your coach will appear here." />
      ) : (
        <div className="space-y-2.5">
          {messages.map(m => (
            <div key={m.id} className="p-4 rounded-2xl"
              style={{ background: m.sender === 'coach' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold" style={{ color: m.sender === 'coach' ? '#60A5FA' : 'rgba(255,255,255,0.5)' }}>
                  {m.sender === 'coach' ? 'Coach' : 'You'}
                </span>
                <span className="text-[10px] text-white/20">
                  {m.created_date ? new Date(m.created_date).toLocaleDateString() : ''}
                </span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{m.content}</p>
            </div>
          ))}
        </div>
      )}
    </PortalSection>
  );
}

/* ─── Nutrition ─── */
function Nutrition({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];
  const { data: plans = [] } = useQuery({
    queryKey: ['portal-nutrition', myClient?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: myClient.assigned_nutrition_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_nutrition_id,
  });
  const plan = plans[0];

  return (
    <PortalSection title="Nutrition Plan" icon={Salad} user={user}>
      {plan ? (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="p-5 border-b border-white/5">
            <p className="text-white font-bold">{plan.title}</p>
            <div className="flex gap-4 mt-2">
              {[['Calories', plan.calories], ['Protein', plan.protein_g ? `${plan.protein_g}g` : null],
                ['Carbs', plan.carbs_g ? `${plan.carbs_g}g` : null], ['Fats', plan.fats_g ? `${plan.fats_g}g` : null]]
                .filter(([, v]) => v).map(([label, val]) => (
                <div key={label} className="text-center">
                  <p className="text-blue-400 font-bold text-sm">{val}</p>
                  <p className="text-white/30 text-[10px]">{label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {(plan.meals || []).map((m, i) => (
              <div key={i} className="px-5 py-3.5">
                <p className="text-white font-semibold text-sm">{m.meal_name}</p>
                {m.time && <p className="text-white/30 text-xs mt-0.5">{m.time}</p>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState icon={Salad} title="No nutrition plan yet" body="Your coach will assign your nutrition plan soon. 🥗" />
      )}
    </PortalSection>
  );
}

/* ─── Progress ─── */
function Progress({ user }) {
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];
  const { data: checkins = [] } = useQuery({
    queryKey: ['portal-checkins', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 20),
    enabled: !!myClient?.id,
    select: d => [...d].sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  return (
    <PortalSection title="Progress" icon={TrendingUp} user={user}>
      {checkins.length === 0 ? (
        <EmptyState icon={BarChart2} title="No check-ins yet" body="Submit your first check-in to start tracking progress." />
      ) : (
        <div className="space-y-2.5">
          {checkins.slice(0, 10).map(c => (
            <div key={c.id} className="p-4 rounded-2xl flex items-center justify-between"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <p className="text-white font-semibold text-sm">{c.date}</p>
                <p className="text-white/30 text-xs mt-0.5">
                  {c.weight ? `${c.weight} lbs` : ''}{c.mood ? ` · ${c.mood}` : ''}
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background: c.review_status === 'reviewed' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  color: c.review_status === 'reviewed' ? '#4ADE80' : '#FCD34D',
                }}>
                {c.review_status === 'reviewed' ? 'Reviewed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </PortalSection>
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
        <Route path="/workouts" element={<PortalWorkouts user={user} />} />
        <Route path="/nutrition" element={<Nutrition user={user} />} />
        <Route path="/progress" element={<Progress user={user} />} />
        <Route path="/messages" element={<Messages user={user} />} />
      </Routes>
    </PortalShell>
  );
}