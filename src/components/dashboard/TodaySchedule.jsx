import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, parseISO, isToday } from 'date-fns';
import { Calendar, Video, MapPin, Phone, Clipboard, MessageSquare, Play, CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const TYPE_LABELS = {
  video_call:   { label: 'Video Call',      Icon: Video },
  in_person:    { label: 'In-Person',        Icon: MapPin },
  check_in:     { label: 'Check-in Call',    Icon: Phone },
  consultation: { label: 'Consultation',     Icon: Clipboard },
};

const STATUS_CONFIG = {
  scheduled:  { label: 'Upcoming',   style: { background: '#eff6ff', color: '#2563eb', border: '#bfdbfe' } },
  completed:  { label: 'Completed',  style: { background: '#f9fafb', color: '#6b7280', border: '#e5e7eb' } },
  cancelled:  { label: 'Cancelled',  style: { background: '#fef2f2', color: '#dc2626', border: '#fecaca' } },
  no_show:    { label: 'No Show',    style: { background: '#fef2f2', color: '#dc2626', border: '#fecaca' } },
};

const AVATAR_COLORS = [
  ['#3b82f6', '#dbeafe'],
  ['#8b5cf6', '#ede9fe'],
  ['#10b981', '#d1fae5'],
  ['#f59e0b', '#fef3c7'],
  ['#ef4444', '#fee2e2'],
];
function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function parseSessionTime(timeStr) {
  if (!timeStr) return null;
  // Handles "14:00", "2:00 PM", "14:00:00"
  const clean = timeStr.trim();
  const match12 = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const ampm = match12[3].toUpperCase();
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return { h, m };
  }
  const match24 = clean.match(/^(\d{1,2}):(\d{2})/);
  if (match24) return { h: parseInt(match24[1]), m: parseInt(match24[2]) };
  return null;
}

function formatDisplayTime(timeStr) {
  const t = parseSessionTime(timeStr);
  if (!t) return timeStr || '';
  const ampm = t.h >= 12 ? 'PM' : 'AM';
  const h = t.h % 12 || 12;
  return `${h}:${String(t.m).padStart(2, '0')} ${ampm}`;
}

function minutesUntil(timeStr) {
  const t = parseSessionTime(timeStr);
  if (!t) return null;
  const now = new Date();
  const sessionMinutes = t.h * 60 + t.m;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return sessionMinutes - nowMinutes;
}

function isInProgress(session) {
  const minsUntil = minutesUntil(session.time);
  if (minsUntil === null) return false;
  return minsUntil <= 0 && minsUntil >= -(session.duration_minutes || 60);
}

function SessionCard({ session, clients, onMessage }) {
  const navigate = useNavigate();
  const minsUntil = minutesUntil(session.time);
  const inProgress = isInProgress(session);
  const startingSoon = minsUntil !== null && minsUntil > 0 && minsUntil <= 30;

  const client = clients.find(c => c.id === session.client_id);
  const clientName = client?.name || session.client_name || 'Unknown Client';
  const [ringColor, avatarBg] = getAvatarColor(clientName);
  const initials = clientName.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  const typeConfig = TYPE_LABELS[session.type] || { label: session.type, Icon: Calendar };
  const TypeIcon = typeConfig.Icon;

  // Status: override with in-progress if applicable
  let statusKey = session.status || 'scheduled';
  const statusCfg = STATUS_CONFIG[statusKey] || STATUS_CONFIG.scheduled;
  const displayTime = formatDisplayTime(session.time);

  return (
    <div
      className="flex-shrink-0 w-64 rounded-xl p-4 flex flex-col gap-3 bg-white transition-all"
      style={{
        border: startingSoon
          ? '1.5px solid #00d4ff'
          : inProgress
          ? '1.5px solid #00ff88'
          : '1px solid #e5e7eb',
        boxShadow: startingSoon
          ? '0 0 16px rgba(0,212,255,0.2), 0 2px 6px rgba(0,0,0,0.06)'
          : '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      {/* Top: avatar + name + badges */}
      <div className="flex items-start gap-2.5">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
          style={{ background: avatarBg, color: ringColor }}
        >
          {client?.avatar_url
            ? <img src={client.avatar_url} alt={clientName} className="w-full h-full object-cover rounded-full" />
            : initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 truncate leading-tight">{clientName}</p>
          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
            <div className="flex items-center gap-1">
              <TypeIcon className="w-3 h-3 text-gray-400" />
              <span className="text-[10px] text-gray-400 font-medium">{typeConfig.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Time + status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-bold text-gray-700">{displayTime}</span>

        {/* In-progress badge */}
        {inProgress && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            In Progress
          </span>
        )}

        {/* Starting soon badge */}
        {startingSoon && !inProgress && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(0,212,255,0.1)', color: '#0891b2', border: '1px solid rgba(0,212,255,0.3)' }}>
            Starting Soon
          </span>
        )}

        {/* Normal status badge (only if not starting soon / in progress) */}
        {!startingSoon && !inProgress && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: statusCfg.style.background,
              color: statusCfg.style.color,
              border: `1px solid ${statusCfg.style.border}`,
            }}>
            {statusCfg.label}
          </span>
        )}
      </div>

      {/* Actions */}
      {session.status !== 'completed' && session.status !== 'cancelled' && session.status !== 'no_show' && (
        <div className="flex gap-1.5 mt-auto">
          {session.zoom_start_url ? (
            <a
              href={session.zoom_start_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-all"
              style={{ background: '#2D8CFF', color: 'white' }}
            >
              <Video className="w-3 h-3" /> Start Zoom
            </a>
          ) : (
            <button
              onClick={() => navigate(`/schedule`)}
              className="flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #6366f1)', color: 'white' }}
            >
              <Play className="w-3 h-3" /> Start
            </button>
          )}
          <button
            onClick={() => onMessage && onMessage(session.client_id)}
            className="flex items-center justify-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all hover:bg-gray-50"
            style={{ border: '1px solid #e5e7eb', color: '#374151' }}
          >
            <MessageSquare className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function TodaySchedule({ clients = [] }) {
  const navigate = useNavigate();
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['sessions-today'],
    queryFn: () => base44.entities.Session.filter({ date: todayStr }),
  });

  const todaySessions = useMemo(() => {
    return [...sessions]
      .filter(s => s.date === todayStr)
      .sort((a, b) => {
        const ta = parseSessionTime(a.time);
        const tb = parseSessionTime(b.time);
        if (!ta || !tb) return 0;
        return (ta.h * 60 + ta.m) - (tb.h * 60 + tb.m);
      });
  }, [sessions, todayStr]);

  const handleMessage = (clientId) => {
    navigate(`/messages?client=${clientId}`);
  };

  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-sm overflow-hidden"
      style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(99,102,241,0.15))' }}>
            <Calendar className="w-3.5 h-3.5" style={{ color: '#6366f1' }} />
          </div>
          <h2 className="text-sm font-bold text-gray-900">Today's Schedule</h2>
          <span className="text-xs text-gray-400 font-medium">{format(new Date(), 'EEEE, MMM d')}</span>
        </div>
        <button
          onClick={() => navigate('/schedule')}
          className="text-xs font-semibold hover:opacity-70 transition-opacity"
          style={{ color: '#6366f1' }}
        >
          View Calendar →
        </button>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-64 h-36 rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : todaySessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: '#f8f9fa' }}>
              <Calendar className="w-5 h-5 text-gray-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-500">No sessions scheduled today</p>
              <p className="text-xs text-gray-400 mt-0.5">Enjoy the day! 🌟</p>
            </div>
            <button
              onClick={() => navigate('/schedule')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all hover:bg-gray-50"
              style={{ border: '1px solid #e5e7eb', color: '#6b7280' }}
            >
              <CalendarPlus className="w-3 h-3 inline mr-1" />
              Schedule a Session
            </button>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {todaySessions.map(session => (
              <SessionCard
                key={session.id}
                session={session}
                clients={clients}
                onMessage={handleMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}