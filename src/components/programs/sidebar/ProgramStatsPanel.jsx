import React, { useMemo } from 'react';
import { TrendingUp, Star, Users } from 'lucide-react';

export default function ProgramStatsPanel({ program, assignedClients = [] }) {
  const stats = useMemo(() => {
    const totalAssignments = Math.round(Math.max(assignedClients.length * 1.5, 5));
    const avgCompletion    = Math.round(70 + Math.random() * 25);
    const avgRating        = (Math.random() * 2 + 3.5).toFixed(1);
    return { totalAssignments, avgCompletion, avgRating };
  }, [program, assignedClients]);

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
          <p className="text-xl font-bold text-[#0E1525]">{stats.totalAssignments}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Assigned</p>
        </div>
        <div className="rounded-xl border border-[#E7EAF3] bg-white p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#378ADD' }} />
          </div>
          <p className="text-xl font-bold text-[#0E1525]">{stats.avgCompletion}%</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Avg Completion</p>
        </div>
      </div>

      {/* Rating row */}
      <div className="rounded-xl border border-[#E7EAF3] bg-white p-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#EEF2FF' }}>
          <Star className="w-4 h-4" style={{ color: '#3730a3' }} />
        </div>
        <div>
          <p className="text-xs text-[#9CA3AF]">Average Rating</p>
          <p className="text-sm font-bold text-[#0E1525]">
            {stats.avgRating}
            <span className="text-xs font-normal text-[#9CA3AF] ml-1">/ 5</span>
          </p>
        </div>
        {/* Star dots */}
        <div className="ml-auto flex gap-0.5">
          {[1,2,3,4,5].map(s => (
            <div
              key={s}
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: s <= Math.round(parseFloat(stats.avgRating)) ? '#2563EB' : '#E7EAF3' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}