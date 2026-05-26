import React from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';

export default function UpcomingSchedule({ program }) {
  if (!program?.workouts?.length) return null;

  const workouts = program.workouts;
  const today = new Date();
  const dayOfWeek = today.getDay();

  const upcomingDays = Array.from({ length: 3 }, (_, i) => {
    const day = addDays(today, i + 1);
    const idx = (dayOfWeek + i + 1) % workouts.length;
    return {
      day,
      dayLabel: format(day, 'EEE'),
      dateLabel: format(day, 'MMM d'),
      workout: workouts[idx],
    };
  });

  return (
    <div className="mx-5">
      <p className="text-white font-bold text-base mb-3">Coming Up</p>
      <div className="space-y-2">
        {upcomingDays.map(({ dayLabel, dateLabel, workout }, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
            className="flex items-center gap-3 p-3.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-10 text-center flex-shrink-0">
              <p className="text-white/40 text-[10px] font-semibold uppercase">{dayLabel}</p>
              <p className="text-white font-bold text-sm">{dateLabel.split(' ')[1]}</p>
            </div>
            <div className="w-px h-8 bg-white/10 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-semibold truncate">{workout?.day_name || 'Rest Day'}</p>
              {workout && <p className="text-white/30 text-[10px] mt-0.5">{workout.exercises?.length || 0} exercises</p>}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}