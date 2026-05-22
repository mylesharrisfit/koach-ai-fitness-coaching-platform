import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CalendlyBookingWidget from './CalendlyBookingWidget';
import { format } from 'date-fns';
import { Video, Copy, ExternalLink, FileText, Check, Clock, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  scheduled:  { label: 'Upcoming',   className: 'bg-blue-50 text-blue-700 border-blue-100' },
  completed:  { label: 'Completed',  className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  cancelled:  { label: 'Cancelled',  className: 'bg-gray-50 text-gray-500 border-gray-200' },
  no_show:    { label: 'No Show',    className: 'bg-red-50 text-red-600 border-red-100' },
};

const TYPE_LABELS = {
  video_call:   'Video Call',
  in_person:    'In-Person',
  check_in:     'Check-in',
  consultation: 'Consultation',
  strategy:     'Strategy',
  assessment:   'Assessment',
  custom:       'Custom',
};

function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied!`);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-gray-50 transition-colors"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function SessionRow({ session }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notesValue, setNotesValue] = useState(session.notes || '');
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Session.update(session.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions-modal'] });
      toast.success('Notes saved');
      setShowNotes(false);
    },
  });

  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const hasZoom = !!session.zoom_join_url;

  let displayDate = '';
  try {
    if (session.date) displayDate = format(new Date(session.date + 'T12:00:00'), 'MMM d, yyyy');
  } catch {}

  return (
    <div className="border border-[#E5E7EB] rounded-xl bg-white overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        {/* Zoom icon or type icon */}
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
          hasZoom ? 'bg-[#2D8CFF]/10' : 'bg-gray-100'
        )}>
          <Video className={cn('w-4 h-4', hasZoom ? 'text-[#2D8CFF]' : 'text-gray-400')} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-[#111827] leading-tight">{session.title}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {displayDate}{session.time && ` · ${session.time}`} · {session.duration_minutes || 60} min · {TYPE_LABELS[session.type] || session.type}
              </p>
            </div>
            <span className={cn('text-[11px] font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0', statusCfg.className)}>
              {statusCfg.label}
            </span>
          </div>

          {/* Zoom links */}
          {hasZoom && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              <a
                href={session.zoom_start_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 bg-[#2D8CFF] text-white rounded-lg hover:bg-[#2681F2] transition-colors"
              >
                <Video className="w-3 h-3" /> Start Meeting
              </a>
              <CopyButton text={session.zoom_join_url} label="Copy Client Link" />
              {session.zoom_password && (
                <CopyButton text={session.zoom_password} label="Copy Password" />
              )}
            </div>
          )}

          {/* Notes */}
          {session.notes && !showNotes && (
            <p className="text-xs text-[#6B7280] mt-2 italic line-clamp-2">📝 {session.notes}</p>
          )}
        </div>

        {/* Log notes button */}
        <button
          onClick={() => setShowNotes(v => !v)}
          className="flex items-center gap-1 text-[11px] font-medium text-[#6B7280] hover:text-[#374151] transition-colors flex-shrink-0 mt-0.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Notes</span>
        </button>
      </div>

      {/* Notes editor */}
      {showNotes && (
        <div className="border-t border-[#E5E7EB] bg-[#F9FAFB] p-3 flex flex-col gap-2">
          <Textarea
            value={notesValue}
            onChange={e => setNotesValue(e.target.value)}
            placeholder="Add session notes, outcomes, next steps..."
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowNotes(false)}>Cancel</Button>
            <Button size="sm" onClick={() => updateMutation.mutate({ notes: notesValue })}
              disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionsTab({ client }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions-modal', client?.id],
    queryFn: () => base44.entities.Session.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => [...d].sort((a, b) => new Date(b.date + 'T' + (b.time || '00:00')) - new Date(a.date + 'T' + (a.time || '00:00'))),
  });

  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const past = sessions.filter(s => s.status !== 'scheduled');

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      <CalendlyBookingWidget client={client} />
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-3">
            <Video className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-[#374151]">No sessions yet</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Sessions will appear here once booked</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
                Upcoming ({upcoming.length})
              </p>
              <div className="space-y-2">
                {upcoming.map(s => <SessionRow key={s.id} session={s} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#9CA3AF] mb-3">
                Past ({past.length})
              </p>
              <div className="space-y-2">
                {past.map(s => <SessionRow key={s.id} session={s} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}