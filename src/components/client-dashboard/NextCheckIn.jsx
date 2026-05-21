import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function NextCheckIn({ daysUntil, nextDate, lastCheckIn, clientId }) {
  const navigate = useNavigate();
  const overdue = daysUntil !== null && daysUntil < 0;
  const dueToday = daysUntil === 0;
  const noCheckIn = daysUntil === null;

  const go = () => navigate(clientId ? `/submit-checkin?clientId=${clientId}` : '/submit-checkin');

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
            <ClipboardList className="w-5 h-5 text-[#6B7280]" />
          </div>
          <div>
            <p className="text-xs text-[#6B7280]">Next Check-In</p>
            <p className="text-base font-semibold text-[#111827]">
              {noCheckIn
                ? 'No check-in scheduled'
                : overdue
                ? `${Math.abs(daysUntil)} days overdue`
                : dueToday
                ? 'Due today'
                : `${daysUntil} day${daysUntil !== 1 ? 's' : ''} away`}
            </p>
            {nextDate && !noCheckIn && (
              <p className="text-xs text-[#9CA3AF] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" /> {format(nextDate, 'EEE, MMM d')}
              </p>
            )}
          </div>
        </div>
        {(overdue || dueToday) && (
          <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', overdue ? 'bg-[#FEE2E2] text-[#DC2626]' : 'bg-[#DBEAFE] text-[#2563EB]')}>
            {overdue ? 'Overdue' : 'Due Today'}
          </span>
        )}
      </div>

      {lastCheckIn && (
        <p className="text-xs text-[#9CA3AF] mb-3">
          Last check-in: {format(new Date(lastCheckIn.date), 'MMM d')}
          {lastCheckIn.weight ? ` · ${lastCheckIn.weight} lbs` : ''}
        </p>
      )}

      <button
        onClick={go}
        className={cn('w-full py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1.5',
          overdue || dueToday
            ? 'bg-[#111827] text-white hover:bg-[#1F2937]'
            : 'border border-[#E5E7EB] text-[#374151] hover:border-[#111827]'
        )}
      >
        Submit Check-in <ChevronRight className="w-3.5 h-3.5 opacity-60" />
      </button>
    </div>
  );
}