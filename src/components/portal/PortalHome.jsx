import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import PortalHeader from './PortalHeader';
import TodayHeroCard from './TodayHeroCard';
import DailyTasks from './DailyTasks';
import StatsStrip from './StatsStrip';
import CoachMessageCard from './CoachMessageCard';
import WeeklySnapshot from './WeeklySnapshot';
import UpcomingSchedule from './UpcomingSchedule';
import RecentWins from './RecentWins';
import ProgramRing from './ProgramRing';
import { calculateStreak, averageAdherenceScore } from '@/lib/adherence';

const TODAY = format(new Date(), 'yyyy-MM-dd');

const DEFAULT_LOG = { workout_done: false, meals_logged: 0, water_glasses: 0, steps: 0 };

export default function PortalHome({ user }) {
  const [log, setLog] = useState(DEFAULT_LOG);
  const [logId, setLogId] = useState(null);
  const [tasksDone, setTasksDone] = useState(new Set());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Client profile
  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  // Program
  const { data: programs = [] } = useQuery({
    queryKey: ['portal-program', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
  });
  const myProgram = programs[0];

  // Nutrition plan
  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['portal-nutrition', myClient?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: myClient.assigned_nutrition_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_nutrition_id,
  });
  const myNutrition = nutritionPlans[0];

  // Check-ins
  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 20),
    enabled: !!myClient?.id,
  });

  // Daily log
  const { data: existingLog } = useQuery({
    queryKey: ['portal-daily-log', TODAY],
    queryFn: () => base44.entities.DailyLog.filter({ date: TODAY }, '-created_date', 1),
    enabled: !!user,
  });
  useEffect(() => {
    if (existingLog?.length > 0) {
      const l = existingLog[0];
      setLog({ ...DEFAULT_LOG, ...l });
      setLogId(l.id);
    }
  }, [existingLog]);

  // Recent logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['portal-recent-logs', user?.id],
    queryFn: () => base44.entities.DailyLog.filter({ client_id: user?.id || 'me' }, '-date', 30),
    enabled: !!user,
  });

  // Messages (coach → client)
  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages', user?.email],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient?.id || user?.email }, '-created_date', 20),
    enabled: !!(myClient?.id || user?.email),
  });
  const latestCoachMsg = messages.find(m => m.sender === 'coach');
  const unreadCount = messages.filter(m => m.sender === 'coach' && !m.is_read).length;

  // Badges
  const { data: badges = [] } = useQuery({
    queryKey: ['portal-badges', myClient?.id],
    queryFn: () => base44.entities.ClientBadge.filter({ client_id: myClient.id }, '-earned_date', 10),
    enabled: !!myClient?.id,
  });

  // Save log mutation
  const saveMutation = useMutation({
    mutationFn: (data) => logId
      ? base44.entities.DailyLog.update(logId, data)
      : base44.entities.DailyLog.create({ ...data, client_id: user?.id || 'me', date: TODAY }),
    onSuccess: (res) => {
      if (!logId && res?.id) setLogId(res.id);
      queryClient.invalidateQueries({ queryKey: ['portal-daily-log'] });
    },
  });

  const saveLog = useCallback((updated) => {
    setLog(updated);
    saveMutation.mutate(updated);
  }, [logId]);

  // Today's workout
  const dayOfWeek = new Date().getDay();
  const workoutsInProgram = myProgram?.workouts || [];
  const todayWorkout = workoutsInProgram.length > 0
    ? workoutsInProgram[dayOfWeek % workoutsInProgram.length]
    : null;

  // Streak
  const streak = (() => {
    let count = 0;
    for (const l of recentLogs) {
      if (l.workout_done || l.meals_logged >= 2) count++;
      else break;
    }
    return count;
  })();

  // Next check-in
  const lastCheckIn = checkIns[0];
  const nextCheckInDate = lastCheckIn ? addDays(parseISO(lastCheckIn.date), 7) : null;
  const daysUntilCheckIn = nextCheckInDate ? differenceInDays(nextCheckInDate, new Date()) : null;
  const checkInDueToday = daysUntilCheckIn !== null && daysUntilCheckIn <= 0;

  // Adherence
  const adherencePct = averageAdherenceScore(checkIns);

  // Stats strip
  const stats = [
    { id: 'streak', emoji: '🔥', value: `${streak}d`, label: 'Streak', path: '/portal/progress' },
    { id: 'weight', emoji: '⚖️', value: myClient?.current_weight ? `${myClient.current_weight} lbs` : '—', label: 'Weight', path: '/portal/progress' },
    { id: 'workouts', emoji: '💪', value: `${recentLogs.filter(l => l.workout_done).length}/7`, label: 'This week', path: '/portal/workouts' },
    { id: 'calories', emoji: '🥗', value: myNutrition?.calories ? `${myNutrition.calories} cal` : `${log.meals_logged} meals`, label: 'Nutrition', path: '/portal/nutrition' },
    { id: 'adherence', emoji: '📈', value: adherencePct !== null ? `${adherencePct}%` : '—', label: 'Adherence', path: '/portal/progress' },
  ];

  // Daily tasks
  const allTasks = [
    { id: 'workout', emoji: '💪', label: 'Complete today\'s workout', sublabel: todayWorkout?.day_name, completed: log.workout_done || tasksDone.has('workout') },
    { id: 'meals', emoji: '🥗', label: 'Log your meals', sublabel: `${log.meals_logged} of 3 logged`, completed: log.meals_logged >= 3 || tasksDone.has('meals') },
    { id: 'water', emoji: '💧', label: 'Log water intake', sublabel: `${log.water_glasses} of 8 glasses`, completed: log.water_glasses >= 8 || tasksDone.has('water') },
    ...(checkInDueToday ? [{ id: 'checkin', emoji: '📋', label: 'Weekly check-in due today!', sublabel: 'Tap to complete', completed: tasksDone.has('checkin') }] : []),
  ];

  const handleToggleTask = (id) => {
    setTasksDone(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
    if (id === 'workout') saveLog({ ...log, workout_done: !log.workout_done });
    if (id === 'checkin') navigate('/submit-checkin');
  };

  return (
    <div className="pb-28 space-y-5">
      <PortalHeader user={user} unreadCount={unreadCount} onMessagesTap={() => navigate('/portal/messages')} />

      <TodayHeroCard
        program={myProgram}
        todayWorkout={todayWorkout}
        workoutDone={log.workout_done}
        onStartWorkout={() => navigate('/portal/workouts')}
      />

      <StatsStrip stats={stats} />

      {latestCoachMsg && (
        <CoachMessageCard
          message={latestCoachMsg}
          coachName="Your Coach"
          onReply={() => navigate('/portal/messages')}
        />
      )}

      <DailyTasks tasks={allTasks} onToggle={handleToggleTask} />

      {myProgram && <ProgramRing program={myProgram} startDate={myClient?.start_date} />}

      <WeeklySnapshot recentLogs={recentLogs} checkIns={checkIns} program={myProgram} />

      <UpcomingSchedule program={myProgram} />

      <RecentWins badges={badges} />

      {/* Motivational quote */}
      <div className="mx-5 p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-white/30 text-[10px] font-semibold uppercase tracking-wider mb-1.5">Daily Motivation</p>
        <p className="text-white/60 text-sm leading-relaxed italic">
          "The pain you feel today will be the strength you feel tomorrow."
        </p>
      </div>
    </div>
  );
}