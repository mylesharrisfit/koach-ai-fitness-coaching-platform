import React from 'react';
import { Settings, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const hour = new Date().getHours();
const greeting = hour < 5 ? 'Good night' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const PILLS = [
  { key: 'workout', emoji: '💪', label: 'Workout', done: (log) => log.workout_done },
  { key: 'meals',   emoji: '🥗', label: 'Meals',   done: (log) => (log.meals_logged || 0) >= 3 },
  { key: 'water',   emoji: '💧', label: 'Water',   done: (log) => (log.water_glasses || 0) >= 6 },
  { key: 'steps',   emoji: '👟', label: 'Steps',   done: (log) => (log.steps || 0) >= 8000 },
];

export default function DashboardHeader({ user, streak, log, onSettings }) {
  const firstName = user?.full_name?.split(' ')[0] || 'Athlete';
  const initial = user?.full_name?.[0]?.toUpperCase() || 'A';

  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ background: 'rgb(var(--sidebar))' }}
    >
      {/* Subtle background orb */}
      <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, rgb(var(--primary)), transparent)' }} />
      <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full opacity-5"
        style={{ background: 'radial-gradient(circle, rgb(var(--primary)), transparent)' }} />

      {/* Top row: avatar + greeting + streak + settings */}
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0"
            style={{ background: 'rgb(var(--primary) / 0.25)', color: 'rgb(var(--primary))', border: '1.5px solid rgb(var(--primary) / 0.35)' }}>
            {initial}
          </div>
          <div>
            <p className="text-white/50 text-xs font-medium">{greeting}</p>
            <p className="text-white font-bold text-lg leading-tight" style={{ letterSpacing: '-0.02em' }}>
              {firstName}
            </p>
            <p className="text-white/35 text-[11px] mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Streak badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: streak > 0 ? 'rgba(251,146,60,0.15)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(251,146,60,0.3)' }}>
            <span className="text-sm">🔥</span>
            <span className="text-white font-bold text-sm">{streak}</span>
            <span className="text-white/50 text-[11px]">streak</span>
          </div>

          {/* Settings */}
          <button
            onClick={onSettings}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Settings className="w-3.5 h-3.5 text-white/50" />
          </button>
        </div>
      </div>

      {/* Bottom row: quick stat pills */}
      <div className="grid grid-cols-4 gap-2 relative z-10">
        {PILLS.map(({ key, emoji, label, done }) => {
          const isDone = done(log);
          return (
            <div
              key={key}
              className="flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all"
              style={{
                background: isDone ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.07)',
                border: isDone ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span className={`text-[10px] font-semibold leading-none ${isDone ? 'text-foreground' : 'text-white/55'}`}>
                {label}
              </span>
              {isDone && (
                <CheckCircle2 className="w-3 h-3 text-success" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}