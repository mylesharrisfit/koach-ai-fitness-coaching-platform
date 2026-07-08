import React, { useMemo } from 'react';
import { Pencil, Trash2, Flame, EyeOff } from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';

const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

// Last N days as YYYY-MM-DD strings (today first in reverse, or oldest-first for display)
function getRecentDays(n = 7) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return days; // oldest → newest (left → right)
}

// Is this date a scheduled day for this habit?
function isScheduled(habit, dateStr) {
  if (habit.frequency === 'daily') return true;
  const dow = parseISO(dateStr).getDay(); // 0=Sun
  return (habit.days_of_week || []).includes(dow);
}

// Compute streak (consecutive scheduled days completed, counting back from today)
function computeStreak(habit, completionsMap) {
  let streak = 0;
  let cursor = new Date();
  // Walk back up to 365 days
  for (let i = 0; i < 365; i++) {
    const dateStr = format(cursor, 'yyyy-MM-dd');
    if (!isScheduled(habit, dateStr)) {
      cursor = subDays(cursor, 1);
      continue;
    }
    if (completionsMap[dateStr]) {
      streak++;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }
  return streak;
}

// Completion % over the last 7 scheduled days
function computeAdherence(habit, completionsMap, windowDays = 7) {
  const days = getRecentDays(windowDays);
  const scheduled = days.filter(d => isScheduled(habit, d));
  if (scheduled.length === 0) return 0;
  const done = scheduled.filter(d => completionsMap[d]).length;
  return Math.round((done / scheduled.length) * 100);
}

export default function HabitCard({ habit, completions, onToggleDay, onEdit, onDelete }) {
  const recentDays = useMemo(() => getRecentDays(7), []);

  // Map date → completed boolean for quick lookup
  const completionsMap = useMemo(() => {
    const m = {};
    (completions || []).forEach(c => { if (c.completed) m[c.date] = true; });
    return m;
  }, [completions]);

  const streak    = useMemo(() => computeStreak(habit, completionsMap), [habit, completionsMap]);
  const adherence = useMemo(() => computeAdherence(habit, completionsMap), [habit, completionsMap]);

  const isInactive = habit.is_active === false;

  // Frequency label
  const freqLabel = habit.frequency === 'daily'
    ? 'Every day'
    : (habit.days_of_week || []).sort().map(d => DAY_LABELS[d]).join(' · ');

  return (
    <div className={`bg-white rounded-xl border shadow-sm p-4 transition-opacity ${isInactive ? 'opacity-50 border-gray-100' : 'border-gray-100'}`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {habit.emoji && <span className="text-xl flex-shrink-0">{habit.emoji}</span>}
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-800 leading-tight">{habit.name}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{freqLabel}</p>
          </div>
          {isInactive && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">
              <EyeOff className="w-2.5 h-2.5" /> Inactive
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Streak */}
          <div className="text-center">
            <div className="flex items-center gap-0.5 justify-center">
              <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-orange-400' : 'text-gray-200'}`} />
              <span className={`text-sm font-bold ${streak > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{streak}</span>
            </div>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Streak</p>
          </div>
          {/* Adherence */}
          <div className="text-center">
            <p className={`text-sm font-bold ${adherence >= 70 ? 'text-emerald-500' : adherence >= 40 ? 'text-amber-500' : 'text-red-400'}`}>{adherence}%</p>
            <p className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">7-day</p>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-0.5 ml-1">
            <button onClick={() => onEdit(habit)} title="Edit"
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Pencil className="w-3 h-3" />
            </button>
            <button onClick={() => onDelete(habit)} title="Delete"
              className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Day dots row */}
      <div className="flex items-end gap-1.5">
        {recentDays.map(dateStr => {
          const scheduled = isScheduled(habit, dateStr);
          const done      = !!completionsMap[dateStr];
          const today     = dateStr === format(new Date(), 'yyyy-MM-dd');
          const dow       = parseISO(dateStr).getDay();
          const label     = DAY_LABELS[dow];

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1 flex-1">
              <span className={`text-[9px] font-semibold ${today ? 'text-purple-600' : 'text-gray-300'}`}>{label}</span>
              <button
                onClick={() => scheduled && onToggleDay(habit, dateStr, done)}
                disabled={!scheduled}
                title={scheduled ? (done ? 'Mark incomplete' : 'Mark complete') : 'Not scheduled'}
                className={`w-full aspect-square max-w-[28px] rounded-full border-2 transition-all ${
                  !scheduled
                    ? 'border-gray-100 bg-gray-50 cursor-default'
                    : done
                    ? 'border-purple-500 bg-purple-500 hover:bg-purple-600'
                    : today
                    ? 'border-purple-300 bg-white hover:bg-purple-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                {done && scheduled && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  </div>
                )}
              </button>
              {today && (
                <span className="text-[8px] font-bold text-purple-500 uppercase">Today</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Adherence bar */}
      <div className="mt-3 h-1 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${adherence}%`,
            background: adherence >= 70 ? '#10b981' : adherence >= 40 ? '#f59e0b' : '#ef4444',
          }}
        />
      </div>
    </div>
  );
}