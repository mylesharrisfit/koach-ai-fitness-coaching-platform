import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import { Trophy } from 'lucide-react';

export default function ChallengeCard({ challenge, myClient, queryClient }) {
  const daysLeft = challenge.end_date
    ? Math.max(0, differenceInDays(parseISO(challenge.end_date), new Date()))
    : null;

  const isJoined = (challenge.participants || []).includes(myClient?.id);
  const participantCount = (challenge.participants || []).length;

  const joinMutation = useMutation({
    mutationFn: () => {
      const participants = isJoined
        ? (challenge.participants || []).filter(id => id !== myClient?.id)
        : [...(challenge.participants || []), myClient?.id];
      return base44.entities.Challenge.update(challenge.id, { participants });
    },
    onSuccess: () => queryClient?.invalidateQueries({ queryKey: ['challenges-active'] }),
  });

  return (
    <div className="bg-white rounded-2xl p-4 border border-amber-100"
      style={{ boxShadow: '0 2px 16px rgba(245,158,11,0.1)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-amber-500" size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Weekly Challenge</p>
            <p className="text-slate-900 font-black text-sm">{challenge.title}</p>
          </div>
        </div>
        {daysLeft !== null && (
          <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black">
            {daysLeft}d left
          </span>
        )}
      </div>

      {challenge.description && (
        <p className="text-slate-500 text-xs leading-relaxed mb-3">{challenge.description}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs font-semibold">{participantCount} members joined</p>
        <button onClick={() => joinMutation.mutate()}
          className="px-4 py-2 rounded-xl text-xs font-black transition-all"
          style={isJoined
            ? { background: '#F0FDF4', color: '#16A34A', border: '1.5px solid #BBF7D0' }
            : { background: 'linear-gradient(135deg, #2563EB, #7C3AED)', color: 'white' }
          }>
          {isJoined ? '✓ Joined' : 'Join Challenge'}
        </button>
      </div>
    </div>
  );
}