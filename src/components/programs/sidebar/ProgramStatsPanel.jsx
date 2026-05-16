import React, { useMemo } from 'react';
import { BarChart3, Star, TrendingUp, Users } from 'lucide-react';

export default function ProgramStatsPanel({ program, assignedClients = [] }) {
  const stats = useMemo(() => {
    // Mock stats - in real app these would come from database
    const totalAssignments = Math.max(assignedClients.length * 1.5, 5);
    const avgCompletion = Math.round(70 + Math.random() * 25);
    const avgRating = (Math.random() * 2 + 3.5).toFixed(1);
    const commonGoal = program.category || 'Strength';

    return {
      totalAssignments: Math.round(totalAssignments),
      avgCompletion,
      avgRating,
      commonGoal,
    };
  }, [program, assignedClients]);

  const StatCard = ({ icon: Icon, label, value, unit = '' }) => (
    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[#E7EAF3] hover:border-blue-200 transition-colors">
      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[#9CA3AF]">{label}</div>
        <div className="text-sm font-semibold text-[#1F2A44]">
          {value}
          <span className="text-xs text-[#6B7280] ml-1">{unit}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <h3 className="font-semibold text-[#1F2A44] mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Program Stats
      </h3>

      <div className="space-y-2">
        <StatCard
          icon={Users}
          label="Total Assigned"
          value={stats.totalAssignments}
          unit="times"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Completion Rate"
          value={stats.avgCompletion}
          unit="%"
        />
        <StatCard
          icon={Star}
          label="Average Rating"
          value={stats.avgRating}
          unit="/ 5"
        />
        <StatCard
          icon={Users}
          label="Most Common Goal"
          value={stats.commonGoal}
        />
      </div>
    </div>
  );
}