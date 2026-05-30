import React, { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { X, Mail, Phone, Instagram, MapPin, Flame, Zap, Snowflake, Plus, Pin, CheckCircle, Clock, AlertCircle, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, format, isValid } from 'date-fns';
import { KANBAN_STAGES } from './KanbanBoard';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const SOURCE_LABELS = {
  instagram: 'Instagram', referral: 'Referral', store_purchase: 'Store Purchase',
  website: 'Website', cold_outreach: 'Cold Outreach', dm: 'DM',
  tiktok: 'TikTok', youtube: 'YouTube', other: 'Other',
};

const ACTIVITY_ICONS = {
  note: '📝', call: '📞', stage_change: '➡️', message: '💬', meeting: '🤝',
};

function ScoreRing({ score }) {
  const color = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const r = 22, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <svg width="52" height="52" className="absolute -top-1 -left-1 -rotate-90">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#F3F4F6" strokeWidth="4" />
      <circle cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

function getTemperature(lead) {
  if (!lead.last_contact_date) return 'cold';
  const days = differenceInDays(new Date(), new Date(lead.last_contact_date));
  if (days <= 1) return 'hot';
  if (days <= 3) return 'warm';
  return 'cold';
}

export default function LeadDetailDrawer({ lead, open, onClose, onUpdate, onDelete }) {
  const [newNote, setNewNote] = useState('');
  const [activityType, setActivityType] = useState('note');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNote, setFollowUpNote] = useState('');

  if (!lead) return null;

  const avatarColors = ['#6366F1', '#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EC4899', '#14B8A6'];
  const avatarColor = avatarColors[lead.name.charCodeAt(0) % avatarColors.length];
  const initials = lead.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const temp = getTemperature(lead);
  const score = lead.lead_score || 50;
  const scoreColor = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';
  const currentStage = KANBAN_STAGES.find(s => s.key === lead.stage);

  const handleStageChange = (stage) => {
    if (stage === 'closed_won') confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    onUpdate(lead.id, { stage, stage_changed_at: new Date().toISOString() });
    const stageLabel = KANBAN_STAGES.find(s => s.key === stage)?.label || stage;
    toast.success(`Moved to ${stageLabel} ✓`);
  };

  const logActivity = () => {
    if (!newNote.trim()) return;
    const log = lead.activity_log || [];
    const entry = { type: activityType, note: newNote.trim(), date: new Date().toISOString() };
    onUpdate(lead.id, {
      activity_log: [entry, ...log],
      last_contact_date: new Date().toISOString(),
    });
    setNewNote('');
    toast.success('Activity logged ✓');
  };

  const saveFollowUp = () => {
    if (!followUpDate) return;
    onUpdate(lead.id, { follow_up_date: followUpDate, follow_up_note: followUpNote });
    toast.success('Follow-up reminder set ✓');
  };

  const convertToClient = () => {
    onUpdate(lead.id, { stage: 'closed_won', stage_changed_at: new Date().toISOString() });
    confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    toast.success(`${lead.name} converted! 🎉`);
    onClose();
  };

  const followUpOverdue = lead.follow_up_date && new Date(lead.follow_up_date) < new Date();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-md p-0 overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="bg-[#111827] p-5 text-white flex-shrink-0">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: avatarColor }}>
                  {initials}
                </div>
                <ScoreRing score={score} />
              </div>
              <div>
                <h2 className="text-lg font-bold">{lead.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  {lead.source && (
                    <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                      {SOURCE_LABELS[lead.source] || lead.source}
                    </span>
                  )}
                  <span className="text-[10px] text-white/50">
                    {lead.created_date ? `Added ${format(new Date(lead.created_date), 'MMM d, yyyy')}` : ''}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
          </div>

          {/* Temperature + Stage */}
          <div className="flex items-center gap-2 mb-3">
            {temp === 'hot' && <span className="flex items-center gap-1 text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full"><Flame className="w-3 h-3" /> Hot</span>}
            {temp === 'warm' && <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded-full"><Zap className="w-3 h-3" /> Warm</span>}
            {temp === 'cold' && <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full"><Snowflake className="w-3 h-3" /> Cold</span>}
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: currentStage?.bg, color: currentStage?.color }}>
              {currentStage?.label || lead.stage}
            </span>
          </div>

          {/* Stage selector */}
          <Select value={lead.stage} onValueChange={handleStageChange}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white text-sm h-9">
              <SelectValue placeholder="Move stage…" />
            </SelectTrigger>
            <SelectContent>
              {KANBAN_STAGES.map(s => (
                <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Convert button */}
          {lead.stage !== 'closed_won' && (
            <button
              onClick={convertToClient}
              className="mt-3 w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
            >
              <UserCheck className="w-4 h-4" /> Convert to Client →
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Contact details */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Contact</p>
            {lead.email && <div className="flex items-center gap-2.5 text-sm text-[#374151]"><Mail className="w-4 h-4 text-[#9CA3AF]" />{lead.email}</div>}
            {lead.phone && <div className="flex items-center gap-2.5 text-sm text-[#374151]"><Phone className="w-4 h-4 text-[#9CA3AF]" />{lead.phone}</div>}
            {lead.instagram && <div className="flex items-center gap-2.5 text-sm text-[#374151]"><Instagram className="w-4 h-4 text-[#9CA3AF]" />@{lead.instagram}</div>}
            {lead.location && <div className="flex items-center gap-2.5 text-sm text-[#374151]"><MapPin className="w-4 h-4 text-[#9CA3AF]" />{lead.location}</div>}
          </div>

          {/* Goal / notes */}
          {(lead.goal || lead.notes) && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">Notes</p>
              {lead.pinned_note && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800">{lead.pinned_note}</p>
                </div>
              )}
              {lead.goal && <p className="text-sm text-[#374151]"><span className="font-semibold">Goal:</span> {lead.goal}</p>}
              {lead.notes && <p className="text-sm text-[#374151] leading-relaxed">{lead.notes}</p>}
            </div>
          )}

          {/* Lead score */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Lead Score</p>
            <div className="flex items-center gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
              <div className="text-3xl font-black" style={{ color: scoreColor }}>{score}</div>
              <div className="flex-1">
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${score}%`, background: scoreColor }} />
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1">
                  {score >= 70 ? '🟢 High quality lead' : score >= 40 ? '🟡 Moderate — follow up soon' : '🔴 Cold — needs re-engagement'}
                </p>
              </div>
            </div>
          </div>

          {/* Deal value */}
          {lead.deal_value > 0 && (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-sm font-semibold text-emerald-700">Potential Value</span>
              <span className="text-lg font-black text-emerald-700">${lead.deal_value.toLocaleString()}/mo</span>
            </div>
          )}

          {/* Follow-up */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Follow-Up Reminder</p>
            {lead.follow_up_date && (
              <div className={cn(
                'flex items-center gap-2 p-2 rounded-lg mb-2 text-xs',
                followUpOverdue ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
              )}>
                {followUpOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                <span>
                  {followUpOverdue ? 'Overdue: ' : 'Scheduled: '}
                  {isValid(new Date(lead.follow_up_date)) ? format(new Date(lead.follow_up_date), 'MMM d, yyyy h:mm a') : ''}
                </span>
                {lead.follow_up_note && <span className="text-[#9CA3AF]"> — {lead.follow_up_note}</span>}
              </div>
            )}
            <div className="flex gap-2">
              <Input type="datetime-local" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="flex-1 text-xs" />
              <button onClick={saveFollowUp} className="px-3 py-2 bg-[#111827] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors">Set</button>
            </div>
            <Input className="mt-1 text-xs" placeholder="Reminder note…" value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} />
          </div>

          {/* Log activity */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Log Activity</p>
            <div className="flex gap-1 mb-2">
              {['note', 'call', 'message', 'meeting'].map(t => (
                <button
                  key={t}
                  onClick={() => setActivityType(t)}
                  className={cn('px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-all', activityType === t ? 'bg-[#111827] text-white' : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]')}
                >
                  {ACTIVITY_ICONS[t]} {t}
                </button>
              ))}
            </div>
            <Textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="What happened? Add a note…"
              rows={2}
              className="text-sm"
            />
            <button onClick={logActivity} disabled={!newNote.trim()} className="mt-2 w-full py-2 bg-[#111827] text-white text-xs font-bold rounded-xl hover:bg-black transition-colors disabled:opacity-40">
              Log Activity
            </button>
          </div>

          {/* Activity timeline */}
          {lead.activity_log?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-2">Activity Timeline</p>
              <div className="space-y-2">
                {lead.activity_log.map((entry, i) => (
                  <div key={i} className="flex gap-2.5 text-xs">
                    <span className="text-base leading-none mt-0.5">{ACTIVITY_ICONS[entry.type] || '📝'}</span>
                    <div className="flex-1">
                      <p className="text-[#374151] leading-relaxed">{entry.note}</p>
                      <p className="text-[#9CA3AF] mt-0.5">
                        {entry.date && isValid(new Date(entry.date)) ? format(new Date(entry.date), 'MMM d, h:mm a') : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete */}
          <button
            onClick={() => { onDelete(lead.id); onClose(); }}
            className="w-full py-2.5 text-red-500 text-xs font-semibold border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
          >
            Delete Lead
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}