import React from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarHeader({ title, onPrev, onNext, onToday, view, onViewChange, onNewSession }) {
  const views = ['Day', 'Week', 'Month'];
  return (
    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#374151]" />
        </button>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#374151]" />
        </button>
        <button
          onClick={onToday}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#E7EAF3] bg-white hover:bg-[#F6F7FB] text-[#374151] transition-colors"
        >
          Today
        </button>
        <h2 className="text-lg font-bold text-[#1F2A44] font-heading ml-1">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-[#F6F7FB] border border-[#E7EAF3] rounded-xl p-1 gap-0.5">
          {views.map(v => (
            <button
              key={v}
              onClick={() => onViewChange(v.toLowerCase())}
              className={cn(
                'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                view === v.toLowerCase()
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1F2A44]'
              )}
            >
              {v}
            </button>
          ))}
        </div>

        {/* New Session button */}
        <button
          onClick={onNewSession}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white bg-gradient-to-r from-blue-500 to-violet-600 hover:opacity-90 transition-opacity shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>
    </div>
  );
}