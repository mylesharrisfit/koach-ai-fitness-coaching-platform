import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BADGE_CONFIG } from '@/lib/badges';
import { format } from 'date-fns';
import { Trophy, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ClientAchievements({ clientId }) {
  const navigate = useNavigate();

  const { data: badges = [] } = useQuery({
    queryKey: ['client-badges', clientId],
    queryFn: () => base44.entities.ClientBadge.filter({ client_id: clientId }, '-created_date', 10),
    enabled: !!clientId,
  });

  const recent = badges.slice(0, 3);

  if (recent.length === 0) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D97706]" />
          <p className="text-base font-semibold text-[#111827]">Your Achievements</p>
        </div>
        <button
          onClick={() => navigate('/adherence')}
          className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#111827] transition-colors"
        >
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {recent.map(b => {
          const config = BADGE_CONFIG[b.badge_key] || {};
          return (
            <div key={b.id} className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg p-3 text-center">
              <div className="text-2xl mb-1">{config.emoji || '🏅'}</div>
              <p className="text-xs font-semibold text-[#111827] leading-tight">{config.label || b.badge_key}</p>
              {b.created_date && (
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">{format(new Date(b.created_date), 'MMM d')}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}