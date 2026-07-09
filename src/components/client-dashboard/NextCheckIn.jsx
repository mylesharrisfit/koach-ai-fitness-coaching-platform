import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NextCheckIn({ daysUntil, nextDate, lastCheckIn, clientId }) {
  const navigate = useNavigate();
  const overdue = daysUntil !== null && daysUntil < 0;
  const dueToday = daysUntil === 0;
  const noCheckIn = daysUntil === null;
  const urgent = overdue || dueToday;

  const go = () => navigate(clientId ? `/submit-checkin?clientId=${clientId}` : '/submit-checkin');

  return (
    <div className={cn(
      'rounded-2xl border shadow-sm overflow-hidden',
      urgent ? 'bg-warning/10 border-warning' : 'bg-card border-border'
    )}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
              urgent ? 'bg-warning' : 'bg-muted')}>
              {urgent
                ? <AlertCircle className="w-5 h-5 text-[#EA580C]" />
                : <ClipboardList className="w-5 h-5 text-muted-foreground" />
              }
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Weekly Check-In</p>
              <p className={cn('text-base font-bold leading-tight', urgent ? 'text-[#9A3412]' : 'text-foreground')}>
                {noCheckIn
                  ? 'No check-in scheduled'
                  : overdue
                  ? `${Math.abs(daysUntil)} days overdue`
                  : dueToday
                  ? 'Due today!'
                  : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
              </p>
              {nextDate && !noCheckIn && (
                <p className={cn('text-xs flex items-center gap-1 mt-0.5', urgent ? 'text-[#C2410C]' : 'text-muted-foreground')}>
                  <Calendar className="w-3 h-3" /> {format(nextDate, 'EEE, MMM d')}
                </p>
              )}
            </div>
          </div>

          {urgent && (
            <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full',
              overdue ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning')}>
              {overdue ? 'Overdue' : 'Due Today'}
            </span>
          )}
        </div>

        {lastCheckIn && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-white/60 border border-white">
            <p className="text-xs text-muted-foreground">
              Last check-in: <span className="font-semibold text-foreground">{format(new Date(lastCheckIn.date), 'MMM d')}</span>
              {lastCheckIn.weight ? <span className="text-muted-foreground"> · {lastCheckIn.weight} lbs</span> : ''}
            </p>
          </div>
        )}

        <button
          onClick={go}
          className={cn(
            'w-full h-12 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98]',
            urgent
              ? 'text-white shadow-sm'
              : 'border border-border text-foreground hover:border-foreground bg-card'
          )}
          style={urgent ? { background: 'linear-gradient(135deg, #EA580C, #C2410C)' } : {}}
        >
          Submit Check-in <ChevronRight className="w-4 h-4 opacity-60" />
        </button>
      </div>
    </div>
  );
}