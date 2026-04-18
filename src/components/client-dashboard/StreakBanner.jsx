import React from 'react';
import { Flame } from 'lucide-react';

export default function StreakBanner({ streak = 0 }) {
  const msg = streak === 0
    ? "Start your streak today! 💪"
    : streak >= 30
    ? `${streak} day streak — unstoppable! 🔥🔥🔥`
    : streak >= 14
    ? `${streak} days strong — keep it up! 🔥`
    : streak >= 7
    ? `${streak} day streak — you're on fire! 🔥`
    : `${streak} day streak — great start!`;

  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl">
      <div className="relative">
        <Flame className="w-7 h-7 text-orange-400" />
        {streak >= 7 && <Flame className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />}
      </div>
      <div>
        <p className="font-heading font-bold text-orange-400 text-xl leading-none">{streak}</p>
        <p className="text-xs text-muted-foreground">{msg}</p>
      </div>
      {streak > 0 && (
        <div className="ml-auto flex gap-1">
          {[...Array(Math.min(7, streak))].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-orange-400 opacity-80" />
          ))}
        </div>
      )}
    </div>
  );
}