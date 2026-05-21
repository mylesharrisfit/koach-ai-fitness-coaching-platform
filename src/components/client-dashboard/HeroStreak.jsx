import React from 'react';
import { cn } from '@/lib/utils';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const MESSAGES = [
  [0,  "Start your streak today"],
  [1,  "Day 1 — every legend starts here"],
  [3,  "Keep going! You're building a habit"],
  [7,  "One full week — you're on fire!"],
  [14, "Two weeks strong — unstoppable!"],
  [30, "30 days — absolute consistency"],
];

function getMessage(streak) {
  let msg = MESSAGES[0][1];
  for (const [min, m] of MESSAGES) {
    if (streak >= min) msg = m;
  }
  return msg;
}

export default function HeroStreak({ streak = 0, recentLogs = [] }) {
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0
  const dots = Array.from({ length: 7 }, (_, i) => {
    const log = recentLogs[6 - i];
    return log && (log.workout_done || log.meals_logged >= 2 || log.water_glasses >= 4);
  });

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <p className="text-base font-semibold text-[#111827]">
              <span className="text-2xl font-bold">{streak}</span> day streak
            </p>
            <p className="text-xs text-[#6B7280]">{getMessage(streak)}</p>
          </div>
        </div>
        {streak >= 7 && (
          <div className="px-2.5 py-1 bg-[#FEF3C7] rounded-full">
            <span className="text-xs font-semibold text-[#D97706]">Keep it up!</span>
          </div>
        )}
      </div>

      {/* 7 day dots */}
      <div className="flex gap-1.5">
        {dots.map((on, i) => {
          const isToday = i === todayIdx;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center',
                on ? 'bg-[#111827]' : isToday ? 'border-2 border-[#2563EB]' : 'bg-[#F3F4F6]'
              )}>
                {on && <span className="text-[9px] text-white font-bold">✓</span>}
              </div>
              <span className="text-[9px] text-[#9CA3AF]">{DAYS[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}