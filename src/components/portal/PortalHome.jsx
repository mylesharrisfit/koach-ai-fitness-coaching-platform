import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, parseISO, addDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronRight, Play, Check, Droplets, Utensils, Dumbbell, ClipboardList, User } from 'lucide-react';

const TODAY = format(new Date(), 'yyyy-MM-dd');
const DEFAULT_LOG = { workout_done: false, meals_logged: 0, water_glasses: 0 };

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getWorkoutGradient(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('push') || n.includes('chest') || n.includes('shoulder')) return 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 50%, #1E40AF 100%)';
  if (n.includes('pull') || n.includes('back') || n.includes('bicep')) return 'linear-gradient(135deg, #065F46 0%, #10B981 50%, #047857 100%)';
  if (n.includes('leg') || n.includes('squat') || n.includes('glute')) return 'linear-gradient(135deg, #991B1B 0%, #EF4444 50%, #B91C1C 100%)';
  if (n.includes('rest') || n.includes('recover')) return 'linear-gradient(135deg, #1F2937 0%, #374151 50%, #111827 100%)';
  return 'linear-gradient(135deg, #312E81 0%, #6366F1 50%, #1E1B4B 100%)';
}

/* ── Daily Rings ── */
function DailyRings({ workoutDone, mealsLogged, totalMeals, waterGlasses, waterGoal, navigate }) {
  const rings = [
    { label: 'Workout', pct: workoutDone ? 100 : 0, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', icon: '💪', path: '/portal/workouts' },
    { label: 'Nutrition', pct: Math.min(100, Math.round((mealsLogged / Math.max(totalMeals, 1)) * 100)), color: '#22C55E', bg: 'rgba(34,197,94,0.15)', icon: '🥗', path: '/portal/nutrition' },
    { label: 'Water', pct: Math.min(100, Math.round((waterGlasses / waterGoal) * 100)), color: '#F97316', bg: 'rgba(249,115,22,0.15)', icon: '💧', path: '/portal/nutrition' },
  ];
  const allDone = rings.every(r => r.pct >= 100);

  return (
    <div className="px-5">
      <div className="p-4 rounded-2xl flex items-center justify-around" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        {rings.map((ring, i) => {
          const r = 22; const circ = 2 * Math.PI * r;
          return (
            <motion.button key={ring.label} onClick={() => navigate(ring.path)}
              whileTap={{ scale: 0.93 }} className="flex flex-col items-center gap-2">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="5" />
                  <motion.circle cx="26" cy="26" r={r} fill="none" stroke={ring.color} strokeWidth="5"
                    strokeLinecap="round" strokeDasharray={circ}
                    initial={{ strokeDashoffset: circ }}
                    animate={{ strokeDashoffset: circ - (ring.pct / 100) * circ }}
                    transition={{ duration: 1, delay: i * 0.15, ease: 'easeOut' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xl">{ring.icon}</div>
                {ring.pct >= 100 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: ring.color }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </motion.div>
                )}
              </div>
              <div className="text-center">
                <p className="text-white/60 text-[10px] font-semibold">{ring.label}</p>
                <p className="font-bold text-xs" style={{ color: ring.pct >= 100 ? ring.color : 'rgba(255,255,255,0.5)' }}>
                  {ring.pct}%
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-3 py-3 rounded-xl text-center"
            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(34,197,94,0.3)' }}>
            <p className="text-emerald-400 font-bold text-sm">🎉 Perfect Day! All rings complete!</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Stats Chips ── */
function StatsChips({ streak, weight, weeklyWorkouts, daysUntilCheckIn, navigate }) {
  const checkInColor = daysUntilCheckIn !== null && daysUntilCheckIn <= 0 ? '#EF4444' : daysUntilCheckIn !== null && daysUntilCheckIn <= 2 ? '#F59E0B' : 'rgba(255,255,255,0.4)';
  const checkInLabel = daysUntilCheckIn === null ? '—' : daysUntilCheckIn <= 0 ? 'Due today!' : `in ${daysUntilCheckIn}d`;

  // Fix weight display — clamp to realistic range
  const displayWeight = weight && weight > 0 && weight < 999 ? `${weight} lbs` : '—';

  const chips = [
    { emoji: '🔥', value: `${streak}d`, label: 'Streak', path: '/portal/progress' },
    { emoji: '⚖️', value: displayWeight, label: 'Weight', path: '/portal/progress' },
    { emoji: '💪', value: weeklyWorkouts, label: 'This week', path: '/portal/workouts' },
    { emoji: '📋', value: checkInLabel, label: 'Check-in', path: '/portal/checkin', valueColor: checkInColor },
  ];

  return (
    <div className="px-5">
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-1">
        {chips.map(chip => (
          <motion.button key={chip.label} whileTap={{ scale: 0.95 }} onClick={() => navigate(chip.path)}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-base">{chip.emoji}</span>
            <div className="text-left">
              <p className="font-bold text-sm leading-none" style={{ color: chip.valueColor || '#fff' }}>{chip.value}</p>
              <p className="text-white/30 text-[10px] mt-0.5">{chip.label}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ── Today's Focus Card ── */
function TodayFocusCard({ workout, program, workoutDone, onStart, navigate }) {
  const gradient = getWorkoutGradient(workout?.day_name);
  const exercises = workout?.exercises || [];
  const isRest = !workout || workout?.day_name?.toLowerCase().includes('rest');

  if (workoutDone) {
    return (
      <div className="px-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.1))', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(34,197,94,0.2)' }}>🎉</div>
            <div className="flex-1">
              <p className="text-emerald-400 font-black text-base">Workout Complete!</p>
              <p className="text-white/50 text-sm mt-0.5">{workout?.day_name || 'Great work today'}</p>
              <p className="text-emerald-300 text-xs mt-1 font-semibold">Keep the momentum going 🔥</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isRest) {
    return (
      <div className="px-5">
        <div className="p-5 rounded-3xl" style={{ background: 'linear-gradient(135deg, #1F2937, #111827)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-2">TODAY</p>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }}>🛌</div>
            <div>
              <p className="text-white font-black text-xl">Rest & Recover</p>
              <p className="text-white/40 text-sm mt-0.5">Recovery is where progress is made</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl overflow-hidden"
        style={{ background: gradient, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div className="p-5 pb-4" style={{ background: 'rgba(0,0,0,0.25)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">TODAY'S WORKOUT</p>
              <h2 className="text-white font-black text-2xl leading-tight mt-0.5">{workout.day_name}</h2>
              {program && <p className="text-white/50 text-xs mt-1">{program.title}{program.duration_weeks ? ` · ${program.duration_weeks}wk Program` : ''}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/60 text-xs mb-4">
            <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{exercises.length} exercises</span>
            <span>·</span>
            <span>~{Math.max(30, exercises.length * 4)} min</span>
          </div>

          {/* Exercise preview chips */}
          {exercises.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4">
              {exercises.slice(0, 3).map((ex, i) => (
                <span key={i} className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/80"
                  style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {ex.name}
                </span>
              ))}
              {exercises.length > 3 && (
                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white/50"
                  style={{ background: 'rgba(255,255,255,0.08)' }}>
                  +{exercises.length - 3} more
                </span>
              )}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={onStart}
            className="w-full py-4 rounded-2xl font-black text-white text-base flex items-center justify-center gap-2"
            style={{ background: 'rgba(255,255,255,0.95)', color: '#111' }}>
            <Play className="w-5 h-5" fill="#111" />
            START WORKOUT
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Coach Message Card ── */
function CoachMsgCard({ msg, navigate }) {
  if (!msg) return null;
  const age = msg.created_date ? differenceInDays(new Date(), new Date(msg.created_date)) : null;
  if (age !== null && age > 2) return null;
  const timeStr = msg.created_date ? format(new Date(msg.created_date), 'h:mm a') : '';

  return (
    <div className="px-5">
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => navigate('/portal/messages')}
        className="w-full p-4 rounded-2xl text-left relative overflow-hidden"
        style={{ background: 'rgba(59,130,246,0.1)', border: '1.5px solid rgba(59,130,246,0.3)' }}
        animate={{ borderColor: ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.55)', 'rgba(59,130,246,0.3)'] }}
        transition={{ duration: 2.5, repeat: Infinity }}>
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}>C</div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#080A12]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-white font-bold text-sm">Your Coach</p>
              <p className="text-white/30 text-[10px]">{timeStr}</p>
            </div>
            <p className="text-white/50 text-xs mt-0.5 line-clamp-1">{msg.content}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0" />
        </div>
      </motion.button>
    </div>
  );
}

/* ── Daily Tasks ── */
function DailyTasks({ tasks, onToggle }) {
  const done = tasks.filter(t => t.completed).length;
  const pct = tasks.length ? (done / tasks.length) * 100 : 0;

  return (
    <div className="px-5">
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold text-sm">Today's Tasks</p>
          <p className="text-white/40 text-xs">{done} of {tasks.length}</p>
        </div>
        <div className="h-1 rounded-full mb-4 overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }}
            className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }} />
        </div>
        <div className="space-y-2">
          {tasks.map(task => (
            <motion.button key={task.id} whileTap={{ scale: 0.98 }} onClick={() => onToggle(task.id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
              style={{ background: task.completed ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.04)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                style={{ background: task.completed ? '#22C55E' : 'rgba(255,255,255,0.07)', border: task.completed ? 'none' : '1.5px solid rgba(255,255,255,0.15)' }}>
                {task.completed
                  ? <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  : <span className="text-sm">{task.emoji}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold transition-all ${task.completed ? 'line-through text-white/30' : 'text-white/80'}`}>{task.label}</p>
                {task.sublabel && <p className="text-white/25 text-[10px] mt-0.5">{task.sublabel}</p>}
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Weekly Dots ── */
function WeeklyDots({ recentLogs, checkIns, streak }) {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const today = new Date();
  const todayIdx = today.getDay() === 0 ? 6 : today.getDay() - 1;

  const weekLogs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (todayIdx - i));
    const dateStr = format(d, 'yyyy-MM-dd');
    const log = recentLogs.find(l => l.date === dateStr);
    const ci = checkIns.find(c => c.date === dateStr);
    if (i > todayIdx) return 'upcoming';
    if (log?.workout_done || ci) return 'done';
    return 'missed';
  });

  const statusStyle = {
    done: { bg: '#22C55E', shadow: '0 0 8px rgba(34,197,94,0.5)' },
    missed: { bg: '#EF4444', shadow: 'none' },
    upcoming: { bg: 'rgba(255,255,255,0.1)', shadow: 'none' },
  };

  return (
    <div className="px-5">
      <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-white font-bold text-sm">This Week</p>
          {streak > 0 && <p className="text-orange-400 text-xs font-bold">🔥 {streak} day streak</p>}
        </div>
        <div className="flex items-center justify-between">
          {days.map((day, i) => {
            const status = weekLogs[i];
            const isToday = i === todayIdx;
            const style = statusStyle[status] || statusStyle.upcoming;
            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <motion.div
                  animate={isToday ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="rounded-full transition-all"
                  style={{
                    width: isToday ? 14 : 10,
                    height: isToday ? 14 : 10,
                    background: style.bg,
                    boxShadow: isToday ? `0 0 12px ${style.bg}88` : style.shadow,
                    border: isToday ? '2px solid rgba(255,255,255,0.3)' : 'none',
                  }} />
                <p className={`text-[9px] font-bold ${isToday ? 'text-white' : 'text-white/25'}`}>{day}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function PortalHome({ user }) {
  const [log, setLog] = useState(DEFAULT_LOG);
  const [logId, setLogId] = useState(null);
  const [tasksDone, setTasksDone] = useState(new Set());
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['portal-client-profile', user?.email],
    queryFn: () => base44.entities.Client.filter({ email: user.email }, '-created_date', 1),
    enabled: !!user?.email,
  });
  const myClient = clients[0];

  const { data: programs = [] } = useQuery({
    queryKey: ['portal-program', myClient?.assigned_program_id],
    queryFn: () => base44.entities.WorkoutProgram.filter({ id: myClient.assigned_program_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_program_id,
  });
  const myProgram = programs[0];

  const { data: nutritionPlans = [] } = useQuery({
    queryKey: ['portal-nutrition', myClient?.assigned_nutrition_id],
    queryFn: () => base44.entities.NutritionPlan.filter({ id: myClient.assigned_nutrition_id }, '-created_date', 1),
    enabled: !!myClient?.assigned_nutrition_id,
  });
  const myNutrition = nutritionPlans[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ['portal-checkins', myClient?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: myClient.id }, '-date', 20),
    enabled: !!myClient?.id,
  });

  const { data: existingLog } = useQuery({
    queryKey: ['portal-daily-log', TODAY],
    queryFn: () => base44.entities.DailyLog.filter({ date: TODAY }, '-created_date', 1),
    enabled: !!user,
  });
  useEffect(() => {
    if (existingLog?.length > 0) {
      const l = existingLog[0]; setLog({ ...DEFAULT_LOG, ...l }); setLogId(l.id);
    }
  }, [existingLog]);

  const { data: recentLogs = [] } = useQuery({
    queryKey: ['portal-recent-logs', user?.id],
    queryFn: () => base44.entities.DailyLog.filter({ client_id: user?.id || 'me' }, '-date', 30),
    enabled: !!user,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['portal-messages', myClient?.id],
    queryFn: () => base44.entities.Message.filter({ client_id: myClient?.id }, '-created_date', 20),
    enabled: !!myClient?.id,
  });
  const latestCoachMsg = messages.find(m => m.sender === 'coach');
  const unreadCount = messages.filter(m => m.sender === 'coach' && !m.is_read).length;

  const saveMutation = useMutation({
    mutationFn: (data) => logId
      ? base44.entities.DailyLog.update(logId, data)
      : base44.entities.DailyLog.create({ ...data, client_id: user?.id || 'me', date: TODAY }),
    onSuccess: (res) => { if (!logId && res?.id) setLogId(res.id); },
  });

  const saveLog = useCallback((updated) => {
    setLog(updated); saveMutation.mutate(updated);
  }, [logId]);

  // Today's workout
  const dayOfWeek = new Date().getDay();
  const workouts = myProgram?.workouts || [];
  const todayWorkout = workouts.length > 0 ? workouts[dayOfWeek % workouts.length] : null;

  // Streak
  const streak = (() => {
    let count = 0;
    for (const l of recentLogs) { if (l.workout_done || l.meals_logged >= 2) count++; else break; }
    return count;
  })();

  // Check-in
  const lastCheckIn = checkIns[0];
  const nextCheckInDate = lastCheckIn ? addDays(parseISO(lastCheckIn.date), 7) : null;
  const daysUntilCheckIn = nextCheckInDate ? differenceInDays(nextCheckInDate, new Date()) : null;
  const checkInDueToday = daysUntilCheckIn !== null && daysUntilCheckIn <= 0;

  // Motivation line
  const motivLine = checkInDueToday
    ? "Check-in day! Your coach is waiting 📋"
    : log.workout_done
      ? "Workout crushed today 🔥 Keep the momentum!"
      : "Let's make today count 💪";

  // Tasks
  const allTasks = [
    { id: 'workout', emoji: '💪', label: "Complete today's workout", sublabel: todayWorkout?.day_name, completed: log.workout_done || tasksDone.has('workout') },
    { id: 'meals', emoji: '🥗', label: 'Log your meals', sublabel: `${log.meals_logged} of ${myNutrition?.meals?.length || 3} logged`, completed: log.meals_logged >= (myNutrition?.meals?.length || 3) || tasksDone.has('meals') },
    { id: 'water', emoji: '💧', label: 'Hit your water goal', sublabel: `${log.water_glasses} of 8 glasses`, completed: log.water_glasses >= 8 || tasksDone.has('water') },
    ...(checkInDueToday ? [{ id: 'checkin', emoji: '📋', label: 'Weekly check-in due today!', sublabel: 'Tap to complete', completed: tasksDone.has('checkin') }] : []),
  ];

  const handleToggleTask = (id) => {
    if (id === 'checkin') { navigate('/portal/checkin'); return; }
    if (id === 'workout') { navigate('/portal/workouts'); return; }
    setTasksDone(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (id === 'meals') saveLog({ ...log, meals_logged: log.meals_logged >= 3 ? 0 : log.meals_logged + 1 });
    if (id === 'water') saveLog({ ...log, water_glasses: log.water_glasses >= 8 ? 0 : log.water_glasses + 1 });
  };

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const weeklyWorkouts = `${recentLogs.filter(l => l.workout_done).slice(0, 7).length}/7`;

  // Safe weight display
  const rawWeight = myClient?.current_weight;
  const safeWeight = rawWeight && rawWeight > 0 && rawWeight < 999 ? rawWeight : null;

  return (
    <div className="pb-32 space-y-4" style={{ background: '#080A12', minHeight: '100vh' }}>
      {/* Hero Header */}
      <div className="px-5 pt-14 pb-2">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <p className="text-white/40 text-xs font-semibold">{format(new Date(), 'EEEE, MMMM d')}</p>
            <h1 className="text-white font-black text-2xl leading-tight mt-0.5">
              {getGreeting()}, {firstName}! 👋
            </h1>
            <p className="text-blue-400 text-sm font-semibold mt-1">{motivLine}</p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {unreadCount > 0 && (
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/portal/messages')}
                className="relative w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                <Bell className="w-5 h-5 text-blue-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[9px] font-black text-white">{unreadCount}</span>
                </div>
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/portal/profile')}
              className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}>
              {user?.full_name
                ? <span className="text-white font-bold text-sm">{user.full_name[0]}</span>
                : <User className="w-5 h-5 text-white" />
              }
            </motion.button>
          </div>
        </div>
      </div>

      {/* Today's Focus */}
      <TodayFocusCard
        workout={todayWorkout}
        program={myProgram}
        workoutDone={log.workout_done}
        onStart={() => navigate('/portal/workouts')}
        navigate={navigate}
      />

      {/* Daily Rings */}
      <DailyRings
        workoutDone={log.workout_done}
        mealsLogged={log.meals_logged}
        totalMeals={myNutrition?.meals?.length || 3}
        waterGlasses={log.water_glasses}
        waterGoal={8}
        navigate={navigate}
      />

      {/* Stats Chips */}
      <StatsChips
        streak={streak}
        weight={safeWeight}
        weeklyWorkouts={weeklyWorkouts}
        daysUntilCheckIn={daysUntilCheckIn}
        navigate={navigate}
      />

      {/* Coach message */}
      <CoachMsgCard msg={latestCoachMsg} navigate={navigate} />

      {/* Daily Tasks */}
      <DailyTasks tasks={allTasks} onToggle={handleToggleTask} />

      {/* Weekly Dots */}
      <WeeklyDots recentLogs={recentLogs} checkIns={checkIns} streak={streak} />

      {/* Motivational quote */}
      <div className="px-5 pb-4">
        <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mb-1.5">Daily Motivation</p>
          <p className="text-white/50 text-sm leading-relaxed italic">
            "The pain you feel today will be the strength you feel tomorrow."
          </p>
        </div>
      </div>
    </div>
  );
}