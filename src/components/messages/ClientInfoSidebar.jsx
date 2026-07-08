import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { differenceInDays, parseISO, format } from 'date-fns';
import { ExternalLink, ClipboardList, Salad } from 'lucide-react';
import { BADGE_CONFIG } from '@/lib/badges';
import AIFollowUpChip from './AIFollowUpChip';

const AVATAR_COLORS = [
  ['bg-blue-100', 'text-blue-700'],
  ['bg-violet-100', 'text-violet-700'],
  ['bg-emerald-100', 'text-emerald-700'],
  ['bg-amber-100', 'text-amber-700'],
  ['bg-rose-100', 'text-rose-700'],
  ['bg-cyan-100', 'text-cyan-700'],
];
function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  at_risk: 'bg-red-100 text-red-600',
  lead: 'bg-blue-100 text-blue-700',
  completed: 'bg-violet-100 text-violet-700',
  alumni: 'bg-gray-100 text-gray-600',
};

const GOAL_LABELS = {
  fat_loss: 'Fat Loss', muscle_gain: 'Muscle Gain', hybrid: 'Hybrid', strength: 'Strength',
  endurance: 'Endurance', general_fitness: 'General Fitness',
};

export default function ClientInfoSidebar({ client, checkIns = [], badges = [], allMessages = [], onInsertMessage }) {
  const navigate = useNavigate();
  const [note, setNote] = useState('');

  if (!client) return null;

  const [avatarBg, avatarText] = getAvatarColor(client.name);
  const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const sortedCIs = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCI = sortedCIs[0];
  const avgAdherence = lastCI ? Math.round(((lastCI.compliance_training || 0) + (lastCI.compliance_nutrition || 0)) / 2) : null;
  const daysSinceCI = lastCI ? differenceInDays(new Date(), parseISO(lastCI.date)) : null;

  const clientBadges = badges.filter(b => b.client_id === client.id).slice(0, 3);

  return (
    <div className="h-full bg-white border-l border-[#E5E7EB] flex flex-col overflow-y-auto">
      {/* Client header */}
      <div className="p-4 border-b border-[#E5E7EB] text-center">
        <div className={cn('w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3 overflow-hidden', client.avatar_url ? '' : `${avatarBg} ${avatarText}`)}>
          {client.avatar_url ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" /> : initials}
        </div>
        <p className="font-semibold text-[#111827] text-sm">{client.name}</p>
        {client.email && <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{client.email}</p>}
        {client.lifecycle_status && (
          <span className={cn('inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-2 capitalize', STATUS_COLORS[client.lifecycle_status] || 'bg-gray-100 text-gray-600')}>
            {client.lifecycle_status.replace('_', ' ')}
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-[#E5E7EB] space-y-3">
        {client.goal && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Goal</span>
            <span className="text-xs font-semibold text-[#374151]">{GOAL_LABELS[client.goal] || client.goal}</span>
          </div>
        )}
        {lastCI && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#9CA3AF]">Last check-in</span>
            <span className={cn('text-xs font-semibold', daysSinceCI > 14 ? 'text-red-500' : daysSinceCI > 7 ? 'text-amber-600' : 'text-[#374151]')}>
              {daysSinceCI === 0 ? 'Today' : daysSinceCI === 1 ? 'Yesterday' : `${daysSinceCI}d ago`}
            </span>
          </div>
        )}
        {avgAdherence !== null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#9CA3AF]">Adherence</span>
              <span className={cn('text-xs font-bold', avgAdherence >= 80 ? 'text-emerald-600' : avgAdherence >= 60 ? 'text-amber-600' : 'text-red-500')}>
                {avgAdherence}%
              </span>
            </div>
            <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', avgAdherence >= 80 ? 'bg-emerald-500' : avgAdherence >= 60 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${avgAdherence}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* AI Follow-up Chip */}
      {onInsertMessage && (
        <div className="pt-3">
          <AIFollowUpChip
            client={client}
            allMessages={allMessages}
            checkIns={checkIns}
            onInsert={onInsertMessage}
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="p-4 border-b border-[#E5E7EB] space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Quick Actions</p>
        <button onClick={() => navigate(`/client-profile?clientId=${client.id}`)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F0F4FF] hover:text-[#2563EB] transition-colors text-sm text-[#374151] font-medium">
          <ExternalLink className="w-3.5 h-3.5" /> View Full Profile
        </button>
        <button onClick={() => navigate(`/checkin-review?clientId=${client.id}`)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F0F4FF] hover:text-[#2563EB] transition-colors text-sm text-[#374151] font-medium">
          <ClipboardList className="w-3.5 h-3.5" /> View Check-ins
        </button>
        <button onClick={() => navigate('/nutrition')}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-[#F9FAFB] hover:bg-[#F0F4FF] hover:text-[#2563EB] transition-colors text-sm text-[#374151] font-medium">
          <Salad className="w-3.5 h-3.5" /> View Nutrition
        </button>
      </div>

      {/* Recent badges */}
      {clientBadges.length > 0 && (
        <div className="p-4 border-b border-[#E5E7EB]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Recent Achievements</p>
          <div className="space-y-2">
            {clientBadges.map(b => {
              const cfg = BADGE_CONFIG?.[b.badge_key];
              return (
                <div key={b.id} className="flex items-center gap-2">
                  <span className="text-lg">{cfg?.emoji || '🏅'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#374151] truncate">{cfg?.label || b.badge_key}</p>
                    {b.awarded_at && <p className="text-[10px] text-[#9CA3AF]">{format(parseISO(b.awarded_at), 'MMM d')}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Coach notes */}
      <div className="p-4 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] mb-2">Quick Notes</p>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Jot a note about this client…"
          rows={4}
          className="w-full text-xs rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2 resize-none outline-none focus:border-[#2563EB]/40 focus:ring-1 focus:ring-[#2563EB]/20 transition-all text-[#374151] placeholder-[#D1D5DB]"
        />
      </div>
    </div>
  );
}