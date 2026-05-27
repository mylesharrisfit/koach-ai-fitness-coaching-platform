import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, User, CreditCard, ExternalLink, AlertCircle } from 'lucide-react';
import ProfileHeader from '@/components/portal/profile/ProfileHeader';
import ProfileQuickStats from '@/components/portal/profile/ProfileQuickStats';
import ProfileMyInfo from '@/components/portal/profile/ProfileMyInfo';
import ProfileBodyStats from '@/components/portal/profile/ProfileBodyStats';
import ProfileFitnessProfile from '@/components/portal/profile/ProfileFitnessProfile';
import ProfileNutritionPrefs from '@/components/portal/profile/ProfileNutritionPrefs';
import ProfileNotifications from '@/components/portal/profile/ProfileNotifications';
import ProfileAppearance from '@/components/portal/profile/ProfileAppearance';
import ProfilePrivacy from '@/components/portal/profile/ProfilePrivacy';
import ProfileSupport from '@/components/portal/profile/ProfileSupport';
import ProfileCoachCard from '@/components/portal/profile/ProfileCoachCard';
import ProfileConnectedApps from '@/components/portal/profile/ProfileConnectedApps';
import ProfileSecurity from '@/components/portal/profile/ProfileSecurity';
import ProfileCompletionCard from '@/components/portal/profile/ProfileCompletionCard';
import SignOutModal from '@/components/portal/profile/SignOutModal';

function BillingShortcut({ client, onNavigate }) {
  const { data: invoices = [] } = useQuery({
    queryKey: ['portal-unpaid-invoices', client?.id],
    queryFn: () => base44.entities.Invoice.filter({ client_id: client.id }, '-issue_date', 50),
    enabled: !!client?.id,
  });
  const unpaidCount = invoices.filter(i => ['sent', 'viewed', 'overdue', 'draft'].includes(i.status)).length;

  return (
    <div className="px-5 mt-4">
      <button onClick={onNavigate}
        className="w-full flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.1))', border: `1px solid ${unpaidCount > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(37,99,235,0.25)'}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative" style={{ background: 'rgba(37,99,235,0.2)' }}>
          <CreditCard className="w-5 h-5 text-blue-400" />
          {unpaidCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-[9px] font-black text-white">{unpaidCount}</span>
            </div>
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-white font-bold text-sm">Billing & Payments</p>
          <p className={`text-xs mt-0.5 ${unpaidCount > 0 ? 'text-orange-400 font-semibold' : 'text-white/40'}`}>
            {unpaidCount > 0 ? `${unpaidCount} invoice${unpaidCount > 1 ? 's' : ''} require payment` : 'Invoices, payment methods, history'}
          </p>
        </div>
        <ExternalLink className="w-4 h-4 text-white/25" />
      </button>
    </div>
  );
}

export default function PortalProfile({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSignOut, setShowSignOut] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: programs = [] } = useQuery({
    queryKey: ['portal-program-profile', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
  });
  const myProgram = programs[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins-profile', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 100),
    enabled: !!myClient?.id,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ['portal-badges-profile', myClient?.id],
    queryFn: () => base44.entities.ClientBadge.filter({ client_id: myClient.id }, '-earned_date', 50),
    enabled: !!myClient?.id,
  });

  const { data: workoutSessions = [] } = useQuery({
    queryKey: ['portal-ws-profile', myClient?.id],
    queryFn: () => base44.entities.WorkoutSession.filter({ client_id: myClient.id }, '-completed_at', 100),
    enabled: !!myClient?.id,
  });

  // Streak calc
  const streak = (() => {
    let count = 0;
    const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const ci of sorted) {
      if (ci.weight || ci.mood) count++;
      else break;
    }
    return count;
  })();

  const sections = [
    { id: 'info', label: 'My Information', icon: '👤' },
    { id: 'body', label: 'Body Stats', icon: '⚖️' },
    { id: 'fitness', label: 'Fitness Profile', icon: '💪' },
    { id: 'nutrition', label: 'Nutrition Preferences', icon: '🥗' },
    { id: 'apps', label: 'Connected Apps & Devices', icon: '📱' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'appearance', label: 'Appearance & Preferences', icon: '🎨' },
    { id: 'privacy', label: 'Privacy & Data', icon: '🔒' },
    { id: 'security', label: 'Account Security', icon: '🛡️' },
    { id: 'support', label: 'About & Support', icon: '💬' },
  ];

  return (
    <div className="pb-32 min-h-screen" style={{ background: '#F8F9FA' }}>
      {/* Back nav */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 bg-white" style={{ boxShadow: '0 1px 0 #F1F5F9' }}>
        <button onClick={() => navigate('/portal')} className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className="text-slate-900 font-black text-lg">Profile & Settings</h1>
      </div>

      {/* Completion card */}
      <ProfileCompletionCard client={myClient} user={user} />

      {/* Profile header */}
      <ProfileHeader user={user} client={myClient} program={myProgram} checkIns={checkIns} />

      {/* Quick stats */}
      <ProfileQuickStats
        workouts={workoutSessions.length}
        checkIns={checkIns.length}
        streak={streak}
        achievements={badges.length}
        onNavigate={navigate}
      />

      {/* Billing & Payments shortcut */}
      <BillingShortcut client={myClient} onNavigate={() => navigate('/portal/billing')} />

      {/* Coach card */}
      <ProfileCoachCard client={myClient} onMessage={() => navigate('/portal/messages')} />

      {/* Sections */}
      <div className="px-5 mt-5 space-y-3">
        <ProfileMyInfo user={user} client={myClient} queryClient={queryClient} />
        <ProfileBodyStats client={myClient} checkIns={checkIns} queryClient={queryClient} />
        <ProfileFitnessProfile client={myClient} queryClient={queryClient} />
        <ProfileNutritionPrefs client={myClient} queryClient={queryClient} />
        <ProfileConnectedApps />
        <ProfileNotifications user={user} />
        <ProfileAppearance />
        <ProfilePrivacy client={myClient} />
        <ProfileSecurity />
        <ProfileSupport />
      </div>

      {/* Sign out */}
      <div className="px-5 mt-8">
        <button
          onClick={() => setShowSignOut(true)}
          className="w-full py-4 rounded-2xl font-bold text-red-500 text-base border border-red-100"
          style={{ background: '#FEF2F2' }}>
          Sign Out
        </button>
      </div>

      <AnimatePresence>
        {showSignOut && <SignOutModal onCancel={() => setShowSignOut(false)} />}
      </AnimatePresence>
    </div>
  );
}