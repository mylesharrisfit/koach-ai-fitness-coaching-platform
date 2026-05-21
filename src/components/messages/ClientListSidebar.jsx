import React, { useState, useMemo } from 'react';
import { Megaphone, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

const FILTER_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'lead', label: 'Leads' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At-Risk' },
];

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

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: false }).replace('about ', '') + ' ago';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE');
}

function isCheckedInToday(client, checkIns = []) {
  if (!checkIns) return false;
  const today = format(new Date(), 'yyyy-MM-dd');
  return checkIns.some(ci => ci.client_id === client.id && ci.date === today);
}

export default function ClientListSidebar({ clients, allMessages, checkIns = [], selectedClientId, onSelectClient, onBroadcast }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const clientMeta = useMemo(() => {
    const meta = {};
    allMessages.forEach(m => {
      if (!meta[m.client_id]) meta[m.client_id] = { lastMsg: null, unread: 0 };
      const cm = meta[m.client_id];
      if (!cm.lastMsg || new Date(m.created_date) > new Date(cm.lastMsg.created_date)) {
        cm.lastMsg = m;
      }
      if (!m.is_read && m.sender === 'client') cm.unread++;
    });
    return meta;
  }, [allMessages]);

  const filtered = useMemo(() => {
    let list = [...clients];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q) || clientMeta[c.id]?.lastMsg?.content?.toLowerCase().includes(q));
    }
    if (filter === 'unread') list = list.filter(c => (clientMeta[c.id]?.unread || 0) > 0);
    else if (filter === 'lead') list = list.filter(c => c.lifecycle_status === 'lead');
    else if (filter === 'active') list = list.filter(c => c.lifecycle_status === 'active');
    else if (filter === 'at_risk') list = list.filter(c => c.lifecycle_status === 'at_risk');
    // Sort: unread first, then by most recent message
    return list.sort((a, b) => {
      const ua = clientMeta[a.id]?.unread || 0;
      const ub = clientMeta[b.id]?.unread || 0;
      if (ub > 0 && ua === 0) return 1;
      if (ua > 0 && ub === 0) return -1;
      const ta = clientMeta[a.id]?.lastMsg?.created_date || a.created_date || '';
      const tb = clientMeta[b.id]?.lastMsg?.created_date || b.created_date || '';
      return tb.localeCompare(ta);
    });
  }, [clients, search, filter, clientMeta]);

  return (
    <div className="flex flex-col h-full">
      {/* Dark header */}
      <div className="bg-[#111827] p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">Messages</h2>
          <button
            onClick={onBroadcast}
            title="Broadcast message"
            className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
          >
            <Megaphone className="w-3.5 h-3.5" />
          </button>
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full bg-white/10 text-white placeholder-white/40 rounded-lg px-3 py-1.5 text-sm border-0 outline-none focus:bg-white/15 transition-colors"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-[#E7EAF3] overflow-x-auto flex-shrink-0 bg-white">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            className={cn(
              'text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap transition-all',
              filter === chip.key
                ? 'bg-[#111827] text-white'
                : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
            )}
          >
            {chip.label}
            {chip.key === 'unread' && (() => {
              const total = clients.reduce((s, c) => s + (clientMeta[c.id]?.unread || 0), 0);
              return total > 0 ? <span className="ml-1 bg-blue-500 text-white text-[9px] font-bold rounded-full px-1">{total}</span> : null;
            })()}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto bg-white">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-xs text-[#9CA3AF]">No conversations found</p>
          </div>
        ) : filtered.map(client => {
          const meta = clientMeta[client.id] || { lastMsg: null, unread: 0 };
          const { lastMsg, unread } = meta;
          const isSelected = selectedClientId === client.id;
          const hasUnread = unread > 0;
          const online = isCheckedInToday(client, checkIns);
          const [avatarBg, avatarText] = getAvatarColor(client.name);
          const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

          return (
            <button
              key={client.id}
              onClick={() => onSelectClient(client.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-[#F3F4F6] relative',
                isSelected ? 'bg-[#F0F4FF]' : 'hover:bg-[#F9FAFB]'
              )}
            >
              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full bg-[#2563EB]" />}
              <div className="relative flex-shrink-0">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden', client.avatar_url ? '' : `${avatarBg} ${avatarText}`)}>
                  {client.avatar_url ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" /> : initials}
                </div>
                {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <p className={cn('text-sm truncate leading-tight', hasUnread ? 'font-bold text-[#111827]' : 'font-medium text-[#374151]')}>
                    {client.name}
                  </p>
                  {lastMsg && (
                    <span className={cn('text-[10px] flex-shrink-0', hasUnread ? 'text-[#2563EB] font-semibold' : 'text-[#9CA3AF]')}>
                      {formatMsgTime(lastMsg.created_date)}
                    </span>
                  )}
                </div>
                <p className={cn('text-xs truncate leading-tight', hasUnread ? 'text-[#374151] font-medium' : 'text-[#9CA3AF]')}>
                  {lastMsg ? (lastMsg.sender === 'coach' ? '↩ ' : '') + lastMsg.content : <span className="italic">No messages yet</span>}
                </p>
              </div>
              {hasUnread && (
                <div className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center px-1">
                  {unread > 99 ? '99+' : unread}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}