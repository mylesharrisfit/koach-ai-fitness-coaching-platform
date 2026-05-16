import React, { useState, useMemo, useRef } from 'react';
import { X, Megaphone, Search, Check, ChevronRight, ChevronLeft, Send, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const FILTERS = [
  { key: 'all', label: 'All Clients' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At-Risk' },
  { key: 'no_program', label: 'No Program' },
  { key: 'lead', label: 'Leads' },
];

const TOKENS = [
  { label: '[First Name]', value: '[First Name]' },
  { label: '[Goal]', value: '[Goal]' },
  { label: '[Program Name]', value: '[Program Name]' },
  { label: '[Last Check-in Date]', value: '[Last Check-in Date]' },
  { label: '[Coach Name]', value: '[Coach Name]' },
];

const AVATAR_COLORS = [
  ['bg-blue-100', 'text-blue-700'],
  ['bg-violet-100', 'text-violet-700'],
  ['bg-emerald-100', 'text-emerald-700'],
  ['bg-amber-100', 'text-amber-700'],
  ['bg-rose-100', 'text-rose-700'],
];

function getAvatarColor(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
}

function previewMessage(message, sampleClient) {
  if (!sampleClient) return message;
  return message
    .replace(/\[First Name\]/g, sampleClient.name?.split(' ')[0] || sampleClient.name)
    .replace(/\[Goal\]/g, sampleClient.goal?.replace('_', ' ') || 'your goal')
    .replace(/\[Program Name\]/g, sampleClient.assigned_program_id ? 'your program' : 'your plan')
    .replace(/\[Last Check-in Date\]/g, format(new Date(), 'MMM d'))
    .replace(/\[Coach Name\]/g, 'Coach');
}

export default function BroadcastModal({ clients, onClose, onSend }) {
  const [step, setStep] = useState(1);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const textareaRef = useRef(null);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (filter === 'active') list = list.filter(c => c.lifecycle_status === 'active' || c.status === 'active');
    else if (filter === 'at_risk') list = list.filter(c => c.lifecycle_status === 'at_risk');
    else if (filter === 'no_program') list = list.filter(c => !c.assigned_program_id);
    else if (filter === 'lead') list = list.filter(c => c.lifecycle_status === 'lead' || c.status === 'prospect');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c => c.name?.toLowerCase().includes(q));
    }
    return list;
  }, [clients, filter, search]);

  const handleFilterChange = (key) => {
    setFilter(key);
    const matches = clients.filter(c => {
      if (key === 'all') return true;
      if (key === 'active') return c.lifecycle_status === 'active' || c.status === 'active';
      if (key === 'at_risk') return c.lifecycle_status === 'at_risk';
      if (key === 'no_program') return !c.assigned_program_id;
      if (key === 'lead') return c.lifecycle_status === 'lead' || c.status === 'prospect';
      return true;
    });
    setSelected(new Set(matches.map(c => c.id)));
  };

  const toggleClient = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(filteredClients.map(c => c.id)));
  const deselectAll = () => setSelected(new Set());

  const insertToken = (token) => {
    const el = textareaRef.current;
    if (!el) {
      setMessage(m => m + token);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const newVal = message.slice(0, start) + token + message.slice(end);
    setMessage(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    }, 0);
  };

  const sampleClient = clients.find(c => selected.has(c.id)) || clients[0];

  const handleSend = async () => {
    if (selected.size === 0 || !message.trim()) return;
    setSending(true);
    await onSend([...selected], message);
    setSending(false);
    toast.success(`Broadcast sent to ${selected.size} client${selected.size !== 1 ? 's' : ''} ✓`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7EAF3] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1F2A44]">Broadcast Message</p>
              <p className="text-[11px] text-[#9CA3AF]">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-[#6B7280]" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 px-5 py-3 border-b border-[#F0F2F8] flex-shrink-0">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={cn(
                'flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all',
                step === s ? 'bg-primary text-white' : step > s ? 'bg-green-100 text-green-700' : 'bg-[#F6F7FB] text-[#9CA3AF]'
              )}>
                {step > s ? <Check className="w-3 h-3" /> : s}
                {s === 1 ? 'Recipients' : s === 2 ? 'Compose' : 'Review'}
              </div>
              {s < 3 && <div className="flex-1 h-px bg-[#E7EAF3]" />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Step 1: Recipients ── */}
          {step === 1 && (
            <div className="p-5 space-y-3">
              {/* Filter chips */}
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => handleFilterChange(f.key)}
                    className={cn(
                      'text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all',
                      filter === f.key
                        ? 'bg-primary text-white border-primary'
                        : 'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3] hover:border-primary/40 hover:text-primary'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search + select all/none */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <input
                    placeholder="Search clients…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E7EAF3] bg-[#F6F7FB] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
                  />
                </div>
                <button onClick={selectAll} className="text-[11px] text-primary font-semibold hover:underline whitespace-nowrap">All</button>
                <button onClick={deselectAll} className="text-[11px] text-[#9CA3AF] font-semibold hover:underline whitespace-nowrap">None</button>
              </div>

              {/* Counter */}
              <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
                <Users className="w-3.5 h-3.5" />
                <span><span className="font-bold text-primary">{selected.size}</span> client{selected.size !== 1 ? 's' : ''} selected</span>
              </div>

              {/* Client list */}
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredClients.map(client => {
                  const [bg, text] = getAvatarColor(client.name);
                  const initials = (client.name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
                  const isChecked = selected.has(client.id);
                  return (
                    <button
                      key={client.id}
                      onClick={() => toggleClient(client.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left',
                        isChecked ? 'border-primary/30 bg-[#EEF4FF]' : 'border-[#E7EAF3] bg-white hover:bg-[#F6F7FB]'
                      )}
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0', bg, text)}>
                        {client.avatar_url
                          ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <span className="flex-1 text-sm font-medium text-[#1F2A44] truncate">{client.name}</span>
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        isChecked ? 'bg-primary border-primary' : 'border-[#D1D5DB]'
                      )}>
                        {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </button>
                  );
                })}
                {filteredClients.length === 0 && (
                  <p className="text-xs text-center text-[#9CA3AF] py-6">No clients found</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Compose ── */}
          {step === 2 && (
            <div className="p-5 space-y-4">
              {/* Token bar */}
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280] mb-2">Personalization tokens — click to insert:</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOKENS.map(t => (
                    <button
                      key={t.value}
                      onClick={() => insertToken(t.value)}
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message textarea */}
              <div>
                <p className="text-[11px] font-semibold text-[#6B7280] mb-1.5">Message</p>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Hey [First Name], just wanted to check in on your [Goal] journey…"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-[#E7EAF3] bg-[#F9FAFB] px-4 py-3 text-sm text-[#1F2A44] placeholder-[#9CA3AF] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-[#9CA3AF] mt-1 text-right">{message.length} chars</p>
              </div>

              {/* Live preview */}
              {message.trim() && sampleClient && (
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] mb-1.5">Preview (for {sampleClient.name?.split(' ')[0]}):</p>
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 px-4 py-3">
                    <p className="text-sm text-white leading-relaxed">{previewMessage(message, sampleClient)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Review & Send ── */}
          {step === 3 && (
            <div className="p-5 space-y-4">
              {/* Summary card */}
              <div className="rounded-xl border border-[#E7EAF3] bg-[#F9FAFB] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-[#1F2A44]">{selected.size} recipient{selected.size !== 1 ? 's' : ''}</span>
                </div>
                <div>
                  <p className="text-[11px] text-[#9CA3AF] mb-1">Message preview:</p>
                  <div className="rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 px-3 py-2">
                    <p className="text-xs text-white leading-relaxed line-clamp-4">
                      {sampleClient ? previewMessage(message, sampleClient) : message}
                    </p>
                  </div>
                </div>
                {!scheduleMode && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <Send className="w-3.5 h-3.5" />
                    Sends immediately to all selected clients
                  </div>
                )}
                {scheduleMode && scheduleDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280]">
                    <Calendar className="w-3.5 h-3.5" />
                    Scheduled for {format(new Date(scheduleDate), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
              </div>

              {/* Schedule send toggle */}
              <div>
                <button
                  onClick={() => setScheduleMode(m => !m)}
                  className={cn(
                    'w-full text-xs font-semibold py-2 rounded-xl border transition-all flex items-center justify-center gap-2',
                    scheduleMode
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-[#F6F7FB] text-[#6B7280] border-[#E7EAF3] hover:border-primary/30 hover:text-primary'
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {scheduleMode ? 'Switch to Send Now' : 'Schedule Send'}
                </button>
                {scheduleMode && (
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                    className="mt-2 w-full text-xs rounded-xl border border-[#E7EAF3] bg-[#F9FAFB] px-3 py-2 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E7EAF3] flex items-center justify-between gap-3 flex-shrink-0">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="flex items-center gap-1 text-sm text-[#6B7280] hover:text-[#1F2A44] font-medium transition-colors"
          >
            {step === 1 ? (
              'Cancel'
            ) : (
              <><ChevronLeft className="w-4 h-4" /> Back</>
            )}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={(step === 1 && selected.size === 0) || (step === 2 && !message.trim())}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={sending || selected.size === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? 'Sending…' : scheduleMode && scheduleDate ? 'Schedule Broadcast' : `Send to ${selected.size} Client${selected.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}