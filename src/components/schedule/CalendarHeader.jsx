import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarHeader({ title, onPrev, onNext, onToday, view, onViewChange, onNewSession, onAvailability }) {
  const views = ['Day', 'Week', 'Month'];
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Navigation row */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onPrev}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] transition-colors min-h-[44px] min-w-[44px]"
          >
            <ChevronLeft className="w-4 h-4 text-[#374151]" />
          </button>
          <button
            onClick={onNext}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] transition-colors min-h-[44px] min-w-[44px]"
          >
            <ChevronRight className="w-4 h-4 text-[#374151]" />
          </button>
          <button
            onClick={onToday}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] text-[#374151] transition-colors min-h-[44px]"
          >
            Today
          </button>
        </div>
        <h2 className="text-sm sm:text-base font-bold text-[#1F2A44] font-heading ml-1 truncate">{title}</h2>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-1 gap-0.5">
          {views.map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v.toLowerCase())}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all min-h-[36px]',
                view === v.toLowerCase()
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1F2A44]'
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Availability - icon on mobile */}
        <button
          onClick={onAvailability}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] text-[#374151] transition-colors min-h-[44px]"
        >
          <Clock className="w-4 h-4 sm:hidden flex-shrink-0" />
          <span className="hidden sm:inline">Set Availability</span>
        </button>

        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 text-sm font-semibold px-3 sm:px-4 py-2 rounded-xl text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:opacity-90 transition-opacity shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" /> <span className="hidden xs:inline">New Session</span><span className="xs:hidden">Book</span>
        </button>
      </div>
    </div>
  );
}