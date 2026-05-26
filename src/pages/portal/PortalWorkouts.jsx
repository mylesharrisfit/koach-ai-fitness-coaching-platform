import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfWeek, addDays, subDays, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import WorkoutProgramHeader from '@/components/portal/workout/WorkoutProgramHeader';
import WeekScheduleSelector from '@/components/portal/workout/WeekScheduleSelector';
import WorkoutCard from '@/components/portal/workout/WorkoutCard';
import WorkoutHistory from '@/components/portal/workout/WorkoutHistory';
import ActiveWorkout from '@/components/portal/workout/ActiveWorkout';
import WorkoutComplete from '@/components/portal/workout/WorkoutComplete';
import MissedWorkoutBanner from '@/components/portal/workout/MissedWorkoutBanner';
import { useNavigate } from 'react-router-dom';

const today = new Date();
const todayDayOfWeek = today.getDay(); // 0=Sun
const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Mon

// Map Mon-Sun index (0-6) to JS day of week
function weekIdxToProgIdx(weekDayIdx, workoutsLength) {
  // weekDayIdx: 0=Mon, 6=Sun
  // JS getDay: 0=Sun, 1=Mon ... 6=Sat
  return weekDayIdx % workoutsLength;
}

function getTodayWeekIdx() {
  const d = today.getDay(); // 0=Sun
  return d === 0 ? 6 : d - 1; // Mon=0 ... Sun=6
}

export default function PortalWorkouts({ user }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const startTimeRef = useRef(Date.now());

  const [activeMode, setActiveMode] = useState(false);
  const [completeMode, setCompleteMode] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState({});
  const [selectedWeekDayIdx, setSelectedWeekDayIdx] = useState(getTodayWeekIdx());
  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'history'

  // Client
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

  // Workout sessions
  const { data: sessions = [] } = useQuery({
    queryKey: ['portal-sessions', myClient?.id],
    queryFn: () => base44.entities.WorkoutSession.filter({ client_id: myClient.id }, '-completed_at', 50),
    enabled: !!myClient?.id,
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.entities.WorkoutSession.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['portal-sessions'] }),
  });

  const workouts = myProgram?.workouts || [];
  const todayWeekIdx = getTodayWeekIdx();
  const selectedProgIdx = weekIdxToProgIdx(selectedWeekDayIdx, workouts.length || 1);
  const selectedWorkout = workouts[selectedProgIdx];
  const todayProgIdx = weekIdxToProgIdx(todayWeekIdx, workouts.length || 1);
  const todayWorkout = workouts[todayProgIdx];

  const selectedDay = addDays(weekStart, selectedWeekDayIdx);
  const isToday = selectedWeekDayIdx === todayWeekIdx;

  // Check if today's workout is done
  const todayDoneSession = sessions.find(s => {
    const d = s.completed_at ? new Date(s.completed_at) : null;
    return d && isSameDay(d, today);
  });
  const isTodayDone = !!todayDoneSession;

  // Missed yesterday?
  const yesterday = subDays(today, 1);
  const yesterdayProgIdx = weekIdxToProgIdx(todayWeekIdx === 0 ? 6 : todayWeekIdx - 1, workouts.length || 1);
  const yesterdayWorkout = workouts[yesterdayProgIdx];
  const missedYesterday = yesterdayWorkout && !sessions.find(s => {
    const d = s.completed_at ? new Date(s.completed_at) : null;
    return d && isSameDay(d, yesterday);
  });

  const handleStartWorkout = () => {
    startTimeRef.current = Date.now();
    setExerciseLogs({});
    setActiveMode(true);
  };

  const handleFinishWorkout = (logs) => {
    setExerciseLogs(logs);
    setActiveMode(false);
    setCompleteMode(true);
  };

  const handleSaveSession = (rating, note) => {
    const durationMin = Math.round((Date.now() - startTimeRef.current) / 60000);
    const workout = workouts[selectedProgIdx];
    saveMutation.mutate({
      client_id: myClient?.id || user?.id || 'me',
      program_id: myProgram?.id,
      workout_day_name: workout?.day_name || '',
      workout_day_index: selectedProgIdx,
      completed_at: new Date().toISOString(),
      duration_minutes: durationMin,
      session_rating: rating,
      session_note: note,
      exercise_logs: (workout?.exercises || []).map((ex, i) => ({
        exercise_name: ex.name,
        sets_completed: exerciseLogs[i]?.sets_completed || [],
      })),
    });
    setCompleteMode(false);
  };

  if (!myProgram) {
    return (
      <div className="pb-24 pt-12 px-5 text-center">
        <p className="text-white/20 text-5xl mb-4">🏋️</p>
        <p className="text-white font-bold text-lg">No program assigned yet</p>
        <p className="text-white/40 text-sm mt-2">Your coach is setting up your training plan — check back soon!</p>
      </div>
    );
  }

  return (
    <>
      {/* Active workout full-screen mode */}
      <AnimatePresence>
        {activeMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ActiveWorkout
              workout={selectedWorkout}
              onFinish={handleFinishWorkout}
              onExit={() => setActiveMode(false)}
            />
          </motion.div>
        )}
        {completeMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WorkoutComplete
              workout={selectedWorkout}
              exerciseLogs={exerciseLogs}
              durationSeconds={Math.round((Date.now() - startTimeRef.current) / 1000)}
              onClose={handleSaveSession}
              onMessageCoach={() => { setCompleteMode(false); navigate('/portal/messages'); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-28 pt-12 space-y-5">
        {/* Page header */}
        <div className="px-5">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">My Program</p>
          <h1 className="text-white font-bold text-2xl leading-tight mt-0.5">{myProgram.title}</h1>
        </div>

        {/* Program progress header */}
        <WorkoutProgramHeader program={myProgram} client={myClient} />

        {/* Missed workout banner */}
        {missedYesterday && !isTodayDone && (
          <MissedWorkoutBanner
            workoutName={yesterdayWorkout?.day_name}
            onDoNow={() => { setSelectedWeekDayIdx(todayWeekIdx === 0 ? 6 : todayWeekIdx - 1); handleStartWorkout(); }}
            onSkip={() => {}}
          />
        )}

        {/* Tabs */}
        <div className="px-4 flex gap-2">
          {['schedule', 'history'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn('flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize')}
              style={{
                background: activeTab === tab ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab ? '#60A5FA' : 'rgba(255,255,255,0.3)',
                border: activeTab === tab ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
              }}>
              {tab === 'schedule' ? '📅 Schedule' : '📋 History'}
            </button>
          ))}
        </div>

        {activeTab === 'schedule' ? (
          <>
            {/* Week selector */}
            <WeekScheduleSelector
              program={myProgram}
              workoutSessions={sessions}
              selectedDay={selectedWeekDayIdx}
              onSelectDay={setSelectedWeekDayIdx}
            />

            {/* Today's / selected workout card */}
            <WorkoutCard
              workout={selectedWorkout}
              isToday={isToday}
              dayDate={selectedDay}
              isDone={isToday && isTodayDone}
              onStart={handleStartWorkout}
            />
          </>
        ) : (
          <WorkoutHistory sessions={sessions} />
        )}
      </div>
    </>
  );
}