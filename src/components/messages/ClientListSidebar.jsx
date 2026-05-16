import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Check, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';

const SORT_OPTIONS = [
  { key: 'recent', label: 'Most Recent' },
  { key: 'unread', label: 'Unread First' },
  { key: 'alpha', label: 'Alphabetical' },
  { key: 'at_risk', label: 'At-Risk First' },
];

function formatMsgTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: false }).replace('about ', '') + ' ago';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE'); // Mon, Tue, etc.
}

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

function isOnline(client, allMessages) {
  // Consider "online" if there's a client message in the last 5 minutes
  const recent = allMessages.find(
    m => m.client_id === client.id && m.sender === 'client' &&
    (Date.now() - new Date(m.created_date)) < 5 * 60 * 1000
  );
  return !!recent;
}

export default function ClientListSidebar({ clients, allMessages, selectedClientId, onSelectClient, onBroadcast }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Build per-client metadata
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

  // Search: name + message content
  const searched = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter(c => {
      if (c.name?.toLowerCase().includes(q)) return true;
      const lastMsg = clientMeta[c.id]?.lastMsg;
      if (lastMsg?.content?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [clients, search, clientMeta]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...searched];
    if (sortKey === 'alpha') {
      return arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    if (sortKey === 'unread') {
      return arr.sort((a, b) => {
        const ua = clientMeta[a.id]?.unread || 0;
        const ub = clientMeta[b.id]?.unread || 0;
        if (ub !== ua) return ub - ua;
        const ta = clientMeta[a.id]?.lastMsg?.created_date || '';
        const tb = clientMeta[b.id]?.lastMsg?.created_date || '';
        return tb.localeCompare(ta);
      });
    }
    if (sortKey === 'at_risk') {
      return arr.sort((a, b) => {
        const ar = (a.lifecycle_status === 'at_risk' || a.status === 'at_risk') ? 0 : 1;
        const br = (b.lifecycle_status === 'at_risk' || b.status === 'at_risk') ? 0 : 1;
        if (ar !== br) return ar - br;
        const ta = clientMeta[a.id]?.lastMsg?.created_date || '';
        const tb = clientMeta[b.id]?.lastMsg?.created_date || '';
        return tb.localeCompare(ta);
      });
    }
    // default: recent, unread float to top
    return arr.sort((a, b) => {
      const ua = clientMeta[a.id]?.unread || 0;
      const ub = clientMeta[b.id]?.unread || 0;
      if (ub > 0 && ua === 0) return 1;
      if (ua > 0 && ub === 0) return -1;
      const ta = clientMeta[a.id]?.lastMsg?.created_date || '';
      const tb = clientMeta[b.id]?.lastMsg?.created_date || '';
      return tb.localeCompare(ta);
    });
  }, [searched, sortKey, clientMeta]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#E7EAF3] flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg text-[#1F2A44]">Messages</h2>
          <div className="flex items-center gap-1.5">
            {/* Broadcast button */}
            <button
              onClick={onBroadcast}
              title="Broadcast message"
              className="p-1.5 rounded-lg border bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3] hover:bg-primary hover:text-white hover:border-primary transition-all"
            >
              <Megaphone className="w-3.5 h-3.5" />
            </button>
          {/* Sort button */}
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(v => !v)}
              className={cn(
                'p-1.5 rounded-lg border transition-all',
                showSortMenu || sortKey !== 'recent'
                  ? 'bg-primary text-white border-primary'
                  : 'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3] hover:text-[#1F2A44]'
              )}
              title="Sort clients"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-[#E7EAF3] rounded-xl shadow-lg z-30 w-44 py-1 overflow-hidden">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSortKey(opt.key); setShowSortMenu(false); }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium hover:bg-[#F6F7FB] text-[#374151] transition-colors"
                  >
                    {opt.label}
                    {sortKey === opt.key && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
          <Input
            placeholder="Search name or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-8 h-9 text-sm bg-[#F6F7FB] border-[#E7EAF3]"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-[#9CA3AF]" />
            </button>
          )}
        </div>
        {search.trim() && (
          <p className="text-[11px] text-[#9CA3AF] mt-1.5 font-medium">
            {sorted.length} result{sorted.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Client list */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Search className="w-5 h-5 text-[#C4C9D8] mb-2" />
            <p className="text-xs text-[#9CA3AF]">No clients found</p>
          </div>
        ) : (
          sorted.map(client => {
            const meta = clientMeta[client.id] || { lastMsg: null, unread: 0 };
            const { lastMsg, unread } = meta;
            const isSelected = selectedClientId === client.id;
            const online = isOnline(client, allMessages);
            const [avatarBg, avatarText] = getAvatarColor(client.name);
            const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
            const hasUnread = unread > 0;

            return (
              <button
                key={client.id}
                onClick={() => onSelectClient(client.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-b border-[#F0F2F8] relative',
                  isSelected
                    ? 'bg-[#EEF4FF]'
                    : 'hover:bg-[#F8F9FD]'
                )}
              >
                {/* Selected indicator — left border accent */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-r-full bg-primary" />
                )}

                {/* Avatar + online dot */}
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden',
                    client.avatar_url ? '' : `${avatarBg} ${avatarText}`
                  )}>
                    {client.avatar_url
                      ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                      : initials
                    }
                  </div>
                  {online && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <p className={cn(
                      'text-sm truncate leading-tight',
                      hasUnread ? 'font-bold text-[#1F2A44]' : 'font-semibold text-[#374151]'
                    )}>
                      {client.name}
                    </p>
                    {lastMsg && (
                      <span className={cn(
                        'text-[10px] flex-shrink-0 leading-tight',
                        hasUnread ? 'text-primary font-semibold' : 'text-[#9CA3AF]'
                      )}>
                        {formatMsgTime(lastMsg.created_date)}
                      </span>
                    )}
                  </div>
                  <p className={cn(
                    'text-xs truncate leading-tight',
                    hasUnread ? 'text-[#374151]' : 'text-[#9CA3AF]'
                  )}>
                    {lastMsg
                      ? (lastMsg.sender === 'coach' ? '↩ ' : '') + lastMsg.content
                      : <span className="italic">No messages yet</span>
                    }
                  </p>
                </div>

                {/* Unread badge */}
                {hasUnread && (
                  <div className="flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {unread > 99 ? '99+' : unread}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}