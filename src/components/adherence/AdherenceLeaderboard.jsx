import React from 'react';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function AdherenceLeaderboard({ clients, checkIns }) {
  const cisByClient = {};
  for (const ci of checkIns) (cisByClient[ci.client_id] = cisByClient[ci.client_id] || []).push(ci);

  const ranked = clients
    .map(c => {
      const cis = (cisByClient[c.id] || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      return { client: c, score: averageAdherenceScore(cis), streak: calculateStreak(cis) };
    })
    .filter(x => x.score !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (!ranked.length) return null;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-[#111827]">Top Performers This Period</h3>
        </div>
      </div>
      <div className="flex gap-3">
        {ranked.map(({ client, score, streak }, i) => (
          <div key={client.id} className={cn(
            'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl text-center border',
            i === 0 ? 'bg-gradient-to-b from-amber-50 to-yellow-50 border-amber-200' : 'bg-[#F9FAFB] border-[#E5E7EB]'
          )}>
            <span className="text-2xl">{MEDALS[i]}</span>
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm',
              i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' : 'bg-gradient-to-br from-[#2563EB] to-[#7C3AED]')}>
              {client.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#111827] truncate max-w-[80px]">{client.name}</p>
              <p className={cn('text-xl font-black', i === 0 ? 'text-amber-600' : 'text-[#2563EB]')}>{score}%</p>
              <p className="text-[10px] text-[#9CA3AF]">{streak >= 7 ? '🔥' : ''} {streak}w streak</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}