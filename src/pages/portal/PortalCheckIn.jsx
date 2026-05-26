import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, CheckCircle2, AlertCircle, Clock, ChevronRight, MessageSquare } from 'lucide-react';
import CheckInForm from '@/components/portal/checkin/CheckInForm';
import CheckInDetail from '@/components/portal/checkin/CheckInDetailView';
import CheckInSuccess from '@/components/portal/checkin/CheckInSuccess';

const TODAY = format(new Date(), 'yyyy-MM-dd');

function getDueStatus(lastCheckIn) {
  if (!lastCheckIn) return { status: 'due', daysOverdue: 0 };
  const lastDate = parseISO(lastCheckIn.date);
  const nextDue = addDays(lastDate, 7);
  const diff = differenceInDays(new Date(), nextDue);
  if (diff > 0) return { status: 'overdue', daysOverdue: diff };
  if (diff === 0) return { status: 'due', daysOverdue: 0 };
  return { status: 'upcoming', daysUntil: Math.abs(diff) };
}

function StatusCard({ lastCheckIn, todayCheckIn, onStart }) {
  const { status, daysOverdue, daysUntil } = getDueStatus(lastCheckIn);
  const submittedToday = todayCheckIn && todayCheckIn.date === TODAY;

  if (submittedToday) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 p-5 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(34,197,94,0.2)' }}>
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="flex-1">
            <p className="text-emerald-400 font-bold text-sm">Check-in Submitted ✓</p>
            <p className="text-white/40 text-xs mt-0.5">
              {todayCheckIn.created_date ? format(new Date(todayCheckIn.created_date), 'h:mm a') : 'Today'}
            </p>
          </div>
          <span className="text-xs px-3 py-1.5 rounded-xl font-semibold"
            style={{ background: todayCheckIn.review_status === 'reviewed' ? 'rgba(34,197,94,0.2)' : 'rgba(251,191,36,0.15)', color: todayCheckIn.review_status === 'reviewed' ? '#22C55E' : '#FBB724' }}>
            {todayCheckIn.review_status === 'reviewed' ? 'Reviewed ✓' : 'Awaiting Review'}
          </span>
        </div>
      </motion.div>
    );
  }

  if (status === 'overdue') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="mx-5 p-5 rounded-2xl"
        style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.2)' }}>
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-red-400 font-bold text-base">Check-in Overdue</p>
            <p className="text-white/40 text-xs mt-0.5">{daysOverdue} day{daysOverdue !== 1 ? 's' : ''} late — your coach is waiting</p>
          </div>
        </div>
        <button onClick={onStart}
          className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}>
          Submit Now →
        </button>
      </motion.div>
    );
  }

  if (status === 'due') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        className="mx-5 p-5 rounded-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))', border: '1px solid rgba(59,130,246,0.35)' }}>
        {/* Pulsing glow */}
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(59,130,246,0.25) 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-wider">Due Today</p>
          </div>
          <h2 className="text-white text-xl font-bold">Check-in Due Today!</h2>
          <p className="text-white/40 text-xs mt-1">Takes just 2 minutes — your coach needs this 📋</p>
          <button onClick={onStart}
            className="w-full mt-4 py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>
            Start Now →
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="mx-5 p-5 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <Clock className="w-6 h-6 text-white/30" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Next Check-in in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</p>
          <p className="text-white/30 text-xs mt-0.5">
            {lastCheckIn ? `Last: ${format(parseISO(lastCheckIn.date), 'MMM d')}` : 'No check-ins yet'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function CheckInHistoryItem({ checkIn, onTap }) {
  const statusColor = checkIn.review_status === 'reviewed'
    ? { bg: 'rgba(34,197,94,0.12)', text: '#22C55E', label: '✓ Reviewed' }
    : checkIn.review_status === 'flagged'
    ? { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', label: '⚑ Flagged' }
    : { bg: 'rgba(251,191,36,0.1)', text: '#FBB724', label: 'Pending' };

  const moodEmoji = { great: '😄', good: '🙂', okay: '😐', tired: '😕', stressed: '😫' }[checkIn.mood] || '—';

  return (
    <motion.button onClick={onTap} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="w-full p-4 rounded-2xl text-left flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      whileTap={{ scale: 0.98 }}>
      {/* Date block */}
      <div className="w-12 text-center flex-shrink-0">
        <p className="text-white/30 text-[9px] uppercase">{format(parseISO(checkIn.date), 'MMM')}</p>
        <p className="text-white font-bold text-xl leading-none">{format(parseISO(checkIn.date), 'd')}</p>
      </div>
      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base">{moodEmoji}</span>
          {checkIn.weight && <span className="text-white/70 text-sm font-semibold">{checkIn.weight} lbs</span>}
          {checkIn.energy_level && <span className="text-white/30 text-xs">⚡{checkIn.energy_level}/10</span>}
        </div>
        {checkIn.coach_responded && (
          <div className="flex items-center gap-1 mt-1">
            <MessageSquare className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-[10px] font-semibold">Coach responded</span>
          </div>
        )}
      </div>
      {/* Status + chevron */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-[10px] font-bold px-2 py-1 rounded-lg"
          style={{ background: statusColor.bg, color: statusColor.text }}>
          {statusColor.label}
        </span>
        <ChevronRight className="w-4 h-4 text-white/20" />
      </div>
    </motion.button>
  );
}

export default function PortalCheckIn({ user }) {
  const [view, setView] = useState('home'); // home | form | detail | success
  const [selectedCheckIn, setSelectedCheckIn] = useState(null);
  const [submittedCheckIn, setSubmittedCheckIn] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-ci', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: checkIns = [], refetch } = useQuery({
    queryKey: ['portal-checkins-ci', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 30),
    enabled: !!myClient?.id,
  });

  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCheckIn = sorted[0];
  const todayCheckIn = sorted.find(ci => ci.date === TODAY);

  const handleSubmitted = (newCheckIn) => {
    setSubmittedCheckIn(newCheckIn);
    setView('success');
    refetch();
    queryClient.invalidateQueries({ queryKey: ['portal-checkins'] });
  };

  if (view === 'form') {
    return (
      <CheckInForm
        client={myClient}
        lastCheckIn={lastCheckIn}
        totalCheckIns={checkIns.length}
        onSubmitted={handleSubmitted}
        onExit={() => setView('home')}
      />
    );
  }

  if (view === 'detail' && selectedCheckIn) {
    return (
      <CheckInDetail
        checkIn={selectedCheckIn}
        client={myClient}
        onBack={() => setView('home')}
        onMessage={() => navigate('/portal/messages')}
      />
    );
  }

  if (view === 'success') {
    return (
      <CheckInSuccess
        checkIn={submittedCheckIn}
        totalCheckIns={checkIns.length + 1}
        streak={sorted.length + 1}
        onDashboard={() => navigate('/portal')}
        onMessage={() => navigate('/portal/messages')}
      />
    );
  }

  return (
    <div className="px-0 pt-12 pb-28 space-y-5">
      {/* Header */}
      <div className="px-5 mb-2">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">Check-ins</p>
        <h1 className="text-white text-xl font-bold mt-0.5">Weekly Check-in</h1>
      </div>

      {/* Status card */}
      <StatusCard
        lastCheckIn={lastCheckIn}
        todayCheckIn={todayCheckIn}
        onStart={() => setView('form')}
      />

      {/* History */}
      {sorted.length > 0 && (
        <div className="px-5 space-y-3">
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-wider">History</p>
          {sorted.map(ci => (
            <CheckInHistoryItem key={ci.id} checkIn={ci} onTap={() => { setSelectedCheckIn(ci); setView('detail'); }} />
          ))}
        </div>
      )}

      {sorted.length === 0 && !myClient && (
        <div className="px-5">
          <div className="p-8 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <ClipboardList className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 text-sm font-semibold">No check-ins yet</p>
            <p className="text-white/20 text-xs mt-1">Your coach will set up your check-in schedule</p>
          </div>
        </div>
      )}
    </div>
  );
}