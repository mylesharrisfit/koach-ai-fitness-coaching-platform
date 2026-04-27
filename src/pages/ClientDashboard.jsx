import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { Settings, Sun, Moon, Star, ChevronRight } from 'lucide-react';
import HeroStreak from '@/components/client-dashboard/HeroStreak';
import TodayWorkout from '@/components/client-dashboard/TodayWorkout';
import NutritionPanel from '@/components/client-dashboard/NutritionPanel';
import StepGoal from '@/components/client-dashboard/StepGoal';
import NextCheckIn from '@/components/client-dashboard/NextCheckIn';
import DailyGoalRings from '@/components/client-dashboard/DailyGoalRings';
import NotificationSettings from '@/components/client-dashboard/NotificationSettings';

const today = format(new Date(), 'yyyy-MM-dd');
const hour = new Date().getHours();
const greeting = hour < 5 ? 'Still up?' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const GreetIcon = hour < 17 ? Sun : Moon;

const defaultLog = {
  workout_done: false, meals_logged: 0, water_glasses: 0, steps: 0,
  habits_completed: [], focus_tasks: [], win_of_day: '', mindset_score: 0, streak_days: 0
};

export default function ClientDashboard() {
  const [log, setLog] = useState(defaultLog);
  const [logId, setLogId] = useState(null);
  const [user, setUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: existingLog } = useQuery({
    queryKey: ['daily-log', today],
    queryFn: () => base44.entities.DailyLog.filter({ date: today }, '-created_date', 1),
    enabled: !!user,
  });

  useEffect(() => {
    if (existingLog?.length > 0) {
      const l = existingLog[0];
      setLog({ ...defaultLog, ...l });
      setLogId(l.id);
    }
  }, [existingLog]);

  const saveMutation = useMutation({
    mutationFn: (data) => logId
      ? base44.entities.DailyLog.update(logId, data)
      : base44.entities.DailyLog.create({ ...data, client_id: user?.id || 'me', date: today }),
    onSuccess: (res) => {
      if (!logId && res?.id) setLogId(res.id);
      queryClient.invalidateQueries({ queryKey: ['daily-log'] });
    },
  });

  const saveLog = useCallback((updated) => {
    setLog(updated);
    const t = setTimeout(() => saveMutation.mutate(updated), 600);
    return () => clearTimeout(t);
  }, [logId, user]);

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['daily-logs-streak', user?.id],
    queryFn: () => base44.entities.DailyLog.filter({ client_id: user?.id || 'me' }, '-date', 60),
    enabled: !!user,
  });

  // Streak calculation
  const streak = (() => {
    let count = 0;
    for (let i = 0; i < recentLogs.length; i++) {
      const l = recentLogs[i];
      if (l.workout_done || l.meals_logged >= 2 || l.water_glasses >= 4) count++;
      else break;
    }
    return count;
  })();

  // Fetch assigned program for today's workout
  const { data: clients = [] } = useQuery({
    queryKey: ['my-client-profile'],
    queryFn: () => base44.entities.Client.filter({ email: user?.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: programs = [] } = useQuery({
    queryKey: ['my-program', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
  });
  const myProgram = programs[0];

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['my-nutrition', myClient?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: myClient.assigned_nutrition_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_nutrition_id,
  });
  const myNutrition = nutritionPlans[0];

  // Next check-in: look for next session or use 7-day interval from last check-in
  const { data: checkIns = [] } = useQuery({
    queryKey: ['my-checkins'],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient?.id }, '-date', 5),
    enabled: !!myClient?.id,
  });
  const lastCheckIn = checkIns[0];
  const nextCheckInDate = lastCheckIn
    ? addDays(parseISO(lastCheckIn.date), 7)
    : null;
  const daysUntilCheckIn = nextCheckInDate
    ? differenceInDays(nextCheckInDate, new Date())
    : null;

  // Today's workout day (day of week index into program)
  const dayOfWeek = new Date().getDay(); // 0=Sun
  const workoutsInProgram = myProgram?.workouts || [];
  const todayWorkout = workoutsInProgram.length > 0
    ? workoutsInProgram[dayOfWeek % workoutsInProgram.length]
    : null;

  // Goal completion
  const goals = [
    log.workout_done,
    log.meals_logged >= 3,
    log.water_glasses >= 6,
    log.steps >= 8000,
  ];
  const completed = goals.filter(Boolean).length;
  const pct = Math.round((completed / goals.length) * 100);

  if (showSettings) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border px-5 py-4">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <h2 className="font-heading font-bold text-base">Notifications</h2>
            <button onClick={() => setShowSettings(false)} className="text-sm text-primary font-medium">Done</button>
          </div>
        </div>
        <div className="max-w-lg mx-auto px-5 py-6">
          <NotificationSettings />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-sm">
              <GreetIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">{greeting}</p>
              <p className="font-heading font-bold text-sm leading-none text-foreground">
                {user?.full_name?.split(' ')[0] || 'Athlete'} 👋
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{format(new Date(), 'EEE, MMM d')}</span>
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 pb-24 space-y-4">

        {/* ── Hero goal ring ── */}
        <DailyGoalRings
          log={log}
          onChange={saveLog}
          completed={completed}
          total={goals.length}
          pct={pct}
          streak={streak}
        />

        {/* ── Streak ── */}
        <HeroStreak streak={streak} recentLogs={recentLogs} />

        {/* ── Today's workout ── */}
        <TodayWorkout
          workout={todayWorkout}
          program={myProgram}
          done={log.workout_done}
          onToggle={() => saveLog({ ...log, workout_done: !log.workout_done })}
        />

        {/* ── Nutrition ── */}
        <NutritionPanel
          plan={myNutrition}
          mealsLogged={log.meals_logged}
          waterGlasses={log.water_glasses}
          onMealsChange={(v) => saveLog({ ...log, meals_logged: v })}
          onWaterChange={(v) => saveLog({ ...log, water_glasses: v })}
        />

        {/* ── Step goal ── */}
        <StepGoal
          steps={log.steps}
          goal={10000}
          onChange={(v) => saveLog({ ...log, steps: Math.max(0, v) })}
        />

        {/* ── Next check-in ── */}
        <NextCheckIn
          daysUntil={daysUntilCheckIn}
          nextDate={nextCheckInDate}
          lastCheckIn={lastCheckIn}
          clientId={myClient?.id}
        />

      </div>
    </div>
  );
}