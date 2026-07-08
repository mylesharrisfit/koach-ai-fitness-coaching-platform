import React from 'react';
import { TrendingUp, Gauge, Users } from 'lucide-react';

export default function ProgramStatsPanel({ stats = {} }) {
  const {
    assignedCount = 0,
    completedSessions = 0,
    totalSessions = 0,
    completionRate = null,
    avgDifficulty = null,
    loaded = false,
  } = stats;

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#9CA3AF] mb-4">
        Program Stats
      </h3>

      {/* Two metric cards side by side */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div className="rounded-xl border border-[#E7EAF3] bg-white p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5" style={{ color: '#378ADD' }} />
          </div>
          <p className="text-xl font-bold text-[#0E1525]">{assignedCount}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Assigned</p>
        </div>
        <div className="rounded-xl border border-[#E7EAF3] bg-white p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#378ADD' }} />
          </div>
          <p className="text-xl font-bold text-[#0E1525]">
            {completionRate != null ? `${completionRate}%` : '—'}
          </p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Completion</p>
        </div>
      </div>

      {/* Sessions logged — real data, honest empty state */}
      <div className="rounded-xl border border-[#E7EAF3] bg-white p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
          <Gauge className="w-4 h-4" style={{ color: '#3730a3' }} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-[#9CA3AF]">Sessions Logged</p>
          {loaded && totalSessions === 0 ? (
            <p className="text-sm font-semibold text-[#9CA3AF]">No sessions yet</p>
          ) : (
            <p className="text-sm font-bold text-[#0E1525]">
              {completedSessions}
              <span className="text-xs font-normal text-[#9CA3AF] ml-1">/ {totalSessions} completed</span>
            </p>
          )}
        </div>
        {avgDifficulty != null && (
          <div className="ml-auto text-right">
            <p className="text-[10px] text-[#9CA3AF]">Avg difficulty</p>
            <p className="text-sm font-bold text-[#0E1525]">
              {avgDifficulty}<span className="text-xs font-normal text-[#9CA3AF]"> / 10</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
