import React, { useState, useMemo, useRef } from 'react';
import { X, Megaphone, Search, CheckSquare, Square, ChevronRight, ChevronLeft, Send, Calendar, Users, AlertTriangle, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const FILTERS = [
  { key: 'all', label: 'All Clients' },
  { key: 'active', label: 'Active' },
  { key: 'at_risk', label: 'At-Risk' },
  { key: 'no_program', label: 'No Program' },
  { key: 'lead', label: 'Leads' },
];

const TOKENS = [
  { token: '[First Name]', label: 'First Name' },
  { token: '[Goal]', label: 'Goal' },
  { token: '[Program Name]', label: 'Program' },
  { token: '[Last Check-in Date]', label: 'Last Check-in' },
  { token: '[Coach Name]', label: 'Coach Name' },
];

function resolveTokens(text, client, currentUser) {
  if (!client) return text;
  const firstName = (client.name || '').split(' ')[0];
  const goalMap = { weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength', endurance: 'Endurance', general_fitness: 'General Fitness' };
  return text
    .replace(/\[First Name\]/g, firstName || 'there')
    .replace(/\[Goal\]/g, goalMap[client.goal] || 'fitness')
    .replace(/\[Program Name\]/g, 'your program')
    .replace(/\[Last Check-in Date\]/g, 'recently')
    .replace(/\[Coach Name\]/g, currentUser?.full_name || 'your coach');
}

function getInitials(name = '') {
  return name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-purple-100 text-purple-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export default function BroadcastModal({ clients, allMessages, currentUser, onClose }) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const textareaRef = useRef(null);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !search || c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
      let matchFilter = true;
      if (activeFilter === 'active') matchFilter = c.lifecycle_status === 'active' || c.status === 'active';
      else if (activeFilter === 'at_risk') matchFilter = c.lifecycle_status === 'at_risk';
      else if (activeFilter === 'no_program') matchFilter = !c.assigned_program_id;
      else if (activeFilter === 'lead') matchFilter = c.lifecycle_status === 'lead';
      return matchSearch && matchFilter;
    });
  }, [clients, search, activeFilter]);

  const handleFilterChange = (key) => {
    setActiveFilter(key);
    const matching = clients.filter(c => {
      if (key === 'all') return true;
      if (key === 'active') return c.lifecycle_status === 'active' || c.status === 'active';
      if (key === 'at_risk') return c.lifecycle_status === 'at_risk';
      if (key === 'no_program') return !c.assigned_program_id;
      if (key === 'lead') return c.lifecycle_status === 'lead';
      return true;
    });
    setSelectedIds(new Set(matching.map(c => c.id)));
  };

  const toggleClient = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredClients.map(c => c.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const insertToken = (token) => {
    const ta = textareaRef.current;
    if (!ta) { setMessage(m => m + token); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newVal = message.slice(0, start) + token + message.slice(end);
    setMessage(newVal);
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + token.length, start + token.length); }, 0);
  };

  const sampleClient = useMemo(() => clients.find(c => selectedIds.has(c.id)) || clients[0], [clients, selectedIds]);
  const previewText = useMemo(() => resolveTokens(message, sampleClient, currentUser), [message, sampleClient, currentUser]);

  const selectedClients = clients.filter(c => selectedIds.has(c.id));

  const handleSend = async () => {
    if (!message.trim() || selectedIds.size === 0) return;
    setSending(true);
    try {
      await Promise.all(
        selectedClients.map(client =>
          base44.entities.Message.create({
            client_id: client.id,
            client_name: client.name || '',
            sender: 'coach',
            content: resolveTokens(message, client, currentUser),
            is_read: true,
            tag: 'general',
            media_type: 'text',
            is_broadcast: true,
          })
        )
      );
      toast.success(`Broadcast sent to ${selectedIds.size} client${selectedIds.size !== 1 ? 's' : ''} ✓`);
      onClose();
    } catch {
      toast.error('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0F2F8] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1F2A44]">Broadcast Message</h2>
              <p className="text-xs text-[#6B7280]">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F6F7FB] text-[#6B7280] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex px-6 py-3 gap-2 border-b border-[#F0F2F8] flex-shrink-0">
          {[{ n: 1, label: 'Select Recipients' }, { n: 2, label: 'Compose' }, { n: 3, label: 'Review & Send' }].map(({ n, label }) => (
            <div key={n} className="flex items-center gap-1.5">
              <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors',
                step === n ? 'bg-primary text-white' : step > n ? 'bg-emerald-500 text-white' : 'bg-[#F0F2F8] text-[#6B7280]'
              )}>
                {step > n ? <Check className="w-3 h-3" /> : n}
              </div>
              <span className={cn('text-xs hidden sm:block', step === n ? 'font-semibold text-[#1F2A44]' : 'text-[#9CA3AF]')}>{label}</span>
              {n < 3 && <ChevronRight className="w-3 h-3 text-[#D1D5DB]" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Step 1: Select Recipients ── */}
          {step === 1 && (
            <div className="p-6 space-y-4">
              {/* Filter buttons */}
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map(f => (
                  <button key={f.key} onClick={() => handleFilterChange(f.key)}
                    className={cn('text-xs px-3 py-1 rounded-full font-medium border transition-all',
                      activeFilter === f.key ? 'bg-primary text-white border-primary' : 'bg-white text-[#6B7280] border-[#E7EAF3] hover:border-primary'
                    )}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search + select all */}
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" className="pl-8 h-8 text-sm" />
                </div>
                <button onClick={selectAll} className="text-xs text-primary hover:underline whitespace-nowrap font-medium">Select All</button>
                <span className="text-[#D1D5DB]">·</span>
                <button onClick={deselectAll} className="text-xs text-[#6B7280] hover:underline whitespace-nowrap font-medium">Deselect All</button>
              </div>

              {/* Count */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm font-semibold text-[#1F2A44]">{selectedIds.size} client{selectedIds.size !== 1 ? 's' : ''} selected</span>
              </div>

              {/* Client list */}
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {filteredClients.map(client => {
                  const checked = selectedIds.has(client.id);
                  return (
                    <button key={client.id} onClick={() => toggleClient(client.id)}
                      className={cn('w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all border',
                        checked ? 'bg-[#EEF4FF] border-primary/20' : 'bg-white border-transparent hover:bg-[#F6F7FB]'
                      )}>
                      <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0', avatarColor(client.name))}>
                        {client.avatar_url ? <img src={client.avatar_url} alt={client.name} className="w-full h-full object-cover" /> : getInitials(client.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1F2A44] truncate">{client.name}</p>
                        <p className="text-[11px] text-[#9CA3AF] truncate">{client.email}</p>
                      </div>
                      {checked ? <CheckSquare className="w-4 h-4 text-primary flex-shrink-0" /> : <Square className="w-4 h-4 text-[#D1D5DB] flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 2: Compose ── */}
          {step === 2 && (
            <div className="p-6 space-y-4">
              {/* Token bar */}
              <div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Personalization Tokens</p>
                <div className="flex flex-wrap gap-1.5">
                  {TOKENS.map(({ token, label }) => (
                    <button key={token} onClick={() => insertToken(token)}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#EEF4FF] text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all font-medium">
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Compose area */}
              <div>
                <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Message</p>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={`Hey [First Name], just checking in on your [Goal] journey…`}
                  rows={5}
                  className="w-full rounded-xl border border-[#E7EAF3] bg-[#F9FAFB] text-sm text-[#1F2A44] p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-[#9CA3AF]"
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">{message.length} characters · {selectedIds.size} recipients</p>
              </div>

              {/* Live preview */}
              {message && sampleClient && (
                <div className="rounded-xl border border-[#E7EAF3] bg-[#F6F7FB] p-4">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">Preview — as seen by {sampleClient.name?.split(' ')[0]}</p>
                  <div className="flex gap-2">
                    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', avatarColor(sampleClient.name))}>
                      {getInitials(sampleClient.name)}
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 text-sm text-[#1F2A44] shadow-sm border border-[#E7EAF3] max-w-xs">
                      {previewText}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Review & Send ── */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="rounded-xl border border-[#E7EAF3] bg-[#F6F7FB] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm text-[#1F2A44]"><span className="font-bold">{selectedIds.size}</span> recipient{selectedIds.size !== 1 ? 's' : ''}</span>
                </div>
                <div className="border-t border-[#E7EAF3] pt-3">
                  <p className="text-[11px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Message Preview</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{message}</p>
                </div>
                <div className="border-t border-[#E7EAF3] pt-3 flex items-center gap-2">
                  <Send className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm text-[#374151]">{scheduleMode && scheduleDate ? `Scheduled: ${format(new Date(scheduleDate), 'MMM d, yyyy h:mm a')}` : 'Send immediately'}</span>
                </div>
              </div>

              {/* Warning */}
              {selectedClients.some(c => c.lifecycle_status === 'completed' || c.lifecycle_status === 'alumni') && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    {selectedClients.filter(c => c.lifecycle_status === 'completed' || c.lifecycle_status === 'alumni').length} selected client(s) are completed/alumni and may not be expecting messages.
                  </p>
                </div>
              )}

              {/* Schedule toggle */}
              <div>
                <button onClick={() => setScheduleMode(v => !v)}
                  className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
                  <Calendar className="w-4 h-4" />
                  {scheduleMode ? 'Cancel scheduling' : 'Schedule for later'}
                </button>
                {scheduleMode && (
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                    className="mt-2 block w-full rounded-xl border border-[#E7EAF3] bg-white text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                )}
              </div>

              {/* Send buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSend}
                  disabled={sending || selectedIds.size === 0 || !message.trim()}
                  className="flex-1 h-10 font-semibold"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #6366F1)' }}
                >
                  {sending ? 'Sending…' : `Send Now to ${selectedIds.size} Client${selectedIds.size !== 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#F0F2F8] flex-shrink-0 bg-[#FAFBFC]">
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1F2A44] font-medium transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 && (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 ? selectedIds.size === 0 : !message.trim()}
              size="sm"
              className="gap-1.5"
            >
              Continue <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}