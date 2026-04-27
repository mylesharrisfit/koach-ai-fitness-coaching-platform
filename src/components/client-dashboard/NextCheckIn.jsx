import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NextCheckIn({ daysUntil, nextDate, lastCheckIn, clientId }) {
  const navigate = useNavigate();
  const overdue = daysUntil !== null && daysUntil < 0;
  const dueToday = daysUntil === 0;
  const soon = daysUntil !== null && daysUntil <= 2 && daysUntil > 0;

  const urgency = overdue ? 'overdue' : dueToday ? 'today' : soon ? 'soon' : 'upcoming';

  const configs = {
    overdue: {
      bg: 'bg-red-50 border-red-100',
      icon: 'bg-red-100 text-red-500',
      badge: 'bg-red-500 text-white',
      badgeText: 'Overdue',
      label: `${Math.abs(daysUntil)} days overdue`,
    },
    today: {
      bg: 'bg-primary/5 border-primary/20',
      icon: 'bg-primary/10 text-primary',
      badge: 'bg-primary text-white',
      badgeText: 'Due Today',
      label: 'Check-in is due today',
    },
    soon: {
      bg: 'bg-amber-50 border-amber-100',
      icon: 'bg-amber-50 text-amber-500',
      badge: 'bg-amber-100 text-amber-700',
      badgeText: `${daysUntil}d`,
      label: `Due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    },
    upcoming: {
      bg: 'bg-white border-border',
      icon: 'bg-secondary text-muted-foreground',
      badge: 'bg-secondary text-muted-foreground',
      badgeText: daysUntil !== null ? `${daysUntil}d` : '—',
      label: nextDate ? `Next check-in ${format(nextDate, 'MMM d')}` : 'No check-in scheduled',
    },
  };

  const c = configs[urgency];

  return (
    <div className={cn('rounded-2xl border shadow-sm overflow-hidden', c.bg)}>
      <button
        onClick={() => navigate(clientId ? `/submit-checkin?clientId=${clientId}` : '/submit-checkin')}
        className="w-full px-5 py-4 flex items-center gap-3 hover:opacity-90 transition-opacity active:scale-[0.99]"
      >
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', c.icon)}>
          {overdue || dueToday
            ? <Clock className="w-5 h-5" />
            : <ClipboardList className="w-5 h-5" />
          }
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Next Check-In</p>
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', c.badge)}>
              {c.badgeText}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{c.label}</p>
          {lastCheckIn && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Last: {format(new Date(lastCheckIn.date), 'MMM d')}
              {lastCheckIn.weight ? ` · ${lastCheckIn.weight} lbs` : ''}
            </p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {(overdue || dueToday) && (
        <div className="border-t border-current/10 px-5 py-3">
          <button
            onClick={() => navigate(clientId ? `/submit-checkin?clientId=${clientId}` : '/submit-checkin')}
            className={cn(
              'w-full py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98]',
              overdue ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-primary text-white hover:bg-primary/90'
            )}
          >
            {overdue ? 'Submit Now →' : 'Check In Today →'}
          </button>
        </div>
      )}
    </div>
  );
}