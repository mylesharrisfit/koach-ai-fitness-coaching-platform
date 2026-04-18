import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Settings, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DailyRings from '../components/client-dashboard/DailyRings';
import StreakBanner from '../components/client-dashboard/StreakBanner';
import TodayFocus from '../components/client-dashboard/TodayFocus';
import WinOfDay from '../components/client-dashboard/WinOfDay';
import QuickLog from '../components/client-dashboard/QuickLog';
import NotificationSettings from '../components/client-dashboard/NotificationSettings';

const today = format(new Date(), 'yyyy-MM-dd');
const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
const GreetIcon = hour < 17 ? Sun : Moon;

const defaultLog = {
  workout_done: false, meals_logged: 0, water_glasses: 0, steps: 0,
  habits_completed: [], focus_tasks: [], win_of_day: '', mindset_score: 0, streak_days: 0
};

export default function ClientDashboard() {
  const [log, setLog] = useState(defaultLog);
  const [logId, setLogId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [user, setUser] = useState(null);
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
    if (existingLog && existingLog.length > 0) {
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

  // Auto-save with debounce
  const saveLog = useCallback((updated) => {
    setLog(updated);
    const t = setTimeout(() => saveMutation.mutate(updated), 800);
    return () => clearTimeout(t);
  }, [logId, user]);

  // Compute streak from previous logs
  const { data: recentLogs = [] } = useQuery({
    queryKey: ['daily-logs-streak'],
    queryFn: () => base44.entities.DailyLog.filter({ client_id: user?.id || 'me' }, '-date', 60),
    enabled: !!user,
  });

  const streak = (() => {
    let count = 0;
    for (let i = 0; i < recentLogs.length; i++) {
      const l = recentLogs[i];
      if (l.workout_done || (l.meals_logged >= 2) || (l.water_glasses >= 4)) count++;
      else break;
    }
    return count;
  })();

  const completedToday = (log.workout_done ? 1 : 0) + (log.meals_logged >= 3 ? 1 : 0) + (log.water_glasses >= 6 ? 1 : 0) + (log.steps >= 8000 ? 1 : 0);
  const totalGoals = 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GreetIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{greeting}</p>
              <p className="font-heading font-bold text-sm leading-tight">{user?.full_name?.split(' ')[0] || 'Athlete'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">{format(new Date(), 'EEE, MMM d')}</div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5 pb-20">
        {/* Daily progress summary */}
        <div className="text-center py-2">
          <p className="text-3xl font-heading font-bold">{completedToday}/{totalGoals}</p>
          <p className="text-xs text-muted-foreground mt-1">daily goals complete</p>
          <div className="flex justify-center gap-1.5 mt-3">
            {[...Array(totalGoals)].map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 max-w-[40px] rounded-full transition-all ${i < completedToday ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </div>

        {/* Streak */}
        <StreakBanner streak={streak} />

        {/* Activity Rings */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Activity</p>
          </div>
          <DailyRings log={log} />
        </div>

        {/* Quick log */}
        {!showSettings && <QuickLog log={log} onChange={saveLog} />}

        {/* Today's Focus */}
        <TodayFocus
          tasks={log.focus_tasks || []}
          onChange={(tasks) => saveLog({ ...log, focus_tasks: tasks })}
        />

        {/* Win of the Day */}
        <WinOfDay
          win={log.win_of_day || ''}
          mindsetScore={log.mindset_score || 0}
          onWinChange={(v) => saveLog({ ...log, win_of_day: v })}
          onMindsetChange={(v) => saveLog({ ...log, mindset_score: v })}
        />

        {/* Notification Settings (expandable) */}
        {showSettings && (
          <div>
            <NotificationSettings />
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs text-muted-foreground" onClick={() => setShowSettings(false)}>
              Done
            </Button>
          </div>
        )}

        {!showSettings && (
          <button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border rounded-2xl hover:border-border/80 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" /> Manage reminders & notifications
          </button>
        )}
      </div>
    </div>
  );
}