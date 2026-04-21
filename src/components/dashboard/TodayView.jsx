import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ClipboardList, MessageSquare, AlertTriangle, CheckCircle2,
  ArrowRight, Sparkles, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAtRiskClients } from '@/lib/riskEngine';
import RecommendationsWidget from './RecommendationsWidget';
import RunMyDayBanner from './RunMyDayBanner';

/* ─── Priority config ─── */
const PRIORITY = {
  red:    { bg: 'bg-red-50',    border: 'border-red-100',    dot: 'bg-red-400',    text: 'text-red-500' },
  yellow: { bg: 'bg-amber-50',  border: 'border-amber-100',  dot: 'bg-amber-400',  text: 'text-amber-500' },
  green:  { bg: 'bg-emerald-50',border: 'border-emerald-100',dot: 'bg-emerald-400',text: 'text-emerald-600' },
};

/* ─── Section header ─── */
function SectionHeader({ icon: Icon, title, count, color = 'text-[#374151]' }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className={cn('w-4 h-4', color)} />
      <h2 className="text-sm font-semibold text-[#1F2A44] flex-1">{title}</h2>
      {count > 0 && (
        <span className="text-xs font-semibold text-[#374151] bg-[#F6F7FB] border border-[#E7EAF3] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  );
}

/* ─── At-risk client row ─── */
function AtRiskRow({ entry }) {
  const navigate = useNavigate();
  const { client, flags, riskScore, lastCheckInDate } = entry;
  const highFlags = flags.filter(f => f.severity === 'high');
  const priority = riskScore >= 60 ? 'red' : 'yellow';
  const cfg = PRIORITY[priority];
  const lastCI = lastCheckInDate ? differenceInDays(new Date(), parseISO(lastCheckInDate)) : null;

  return (
    <div className={cn('rounded-2xl border p-4', cfg.bg, cfg.border)}>
      <div className="flex items-start gap-3 mb-3">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2A44]">{client.name}</p>
          <p className="text-xs text-[#374151] mt-0.5 line-clamp-1">
            {flags[0]?.detail || flags[0]?.label}
            {lastCI !== null && <span className="ml-2">{lastCI}d ago</span>}
          </p>
          {highFlags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {highFlags.slice(0, 3).map(f => (
                <span key={f.key} className="text-[10px] font-medium bg-red-100 text-red-500 border border-red-200 px-1.5 py-0.5 rounded-lg">
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/messages')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-[#E7EAF3] text-xs font-semibold text-[#1F2A44] hover:bg-[#F6F7FB] transition-colors min-h-[40px]"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Message
        </button>
        <button
          onClick={() => navigate('/checkin-review')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-[#E7EAF3] text-xs font-semibold text-[#1F2A44] hover:bg-[#F6F7FB] transition-colors min-h-[40px]"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Review
        </button>
      </div>
    </div>
  );
}

/* ─── Pending check-in row ─── */
function PendingCheckInRow({ checkIn }) {
  const navigate = useNavigate();
  const daysAgo = differenceInDays(new Date(), parseISO(checkIn.date));
  const priority = daysAgo > 7 ? 'red' : daysAgo > 3 ? 'yellow' : 'green';
  const cfg = PRIORITY[priority];

  return (
    <div className={cn('rounded-2xl border p-4', cfg.bg, cfg.border)}>
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#1F2A44]">{checkIn.client_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-[#374151]">{format(parseISO(checkIn.date), 'MMM d')}</span>
            {daysAgo > 0 && (
              <span className={cn('text-xs font-medium', cfg.text)}>{daysAgo}d ago</span>
            )}
            {checkIn.weight && (
              <span className="text-xs text-[#374151]">{checkIn.weight} lbs</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/checkin-detail?id=${checkIn.id}&clientId=${checkIn.client_id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors min-h-[40px]"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Feedback
        </button>
        <button
          onClick={() => navigate('/checkin-review')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-[#E7EAF3] text-xs font-semibold text-[#1F2A44] hover:bg-[#F6F7FB] transition-colors min-h-[40px]"
        >
          <ClipboardList className="w-3.5 h-3.5" /> Review
        </button>
      </div>
    </div>
  );
}

/* ─── Unread message row ─── */
function UnreadMessageRow({ message }) {
  const navigate = useNavigate();
  const TAG_COLORS = {
    urgent:   'text-red-500 bg-red-50 border-red-200',
    check_in: 'text-primary bg-blue-50 border-blue-200',
    nutrition:'text-orange-500 bg-orange-50 border-orange-200',
    training: 'text-blue-500 bg-blue-50 border-blue-200',
  };

  return (
    <button
      onClick={() => navigate('/messages')}
      className="w-full rounded-2xl border border-[#E7EAF3] bg-white p-4 text-left hover:bg-[#F6F7FB] transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-[#1F2A44]">{message.client_name}</p>
            {message.tag && TAG_COLORS[message.tag] && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-lg border', TAG_COLORS[message.tag])}>
                {message.tag.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-[#374151] line-clamp-2">{message.content}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[#374151] flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

/* ─── Empty state ─── */
function AllClear() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="w-7 h-7 text-emerald-500" />
      </div>
      <div>
        <p className="text-base font-semibold text-[#1F2A44]">All clear!</p>
        <p className="text-sm text-[#374151] mt-0.5">No pending actions for today</p>
      </div>
    </div>
  );
}

/* ─── Card wrapper ─── */
function Card({ children, className }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-[#E7EAF3] p-4 shadow-sm', className)}>
      {children}
    </div>
  );
}

/* ─── Main component ─── */
export default function TodayView({ clients, checkIns, messages }) {
  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns), [clients, checkIns]);

  const pendingCheckIns = useMemo(() => {
    return checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 14)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 8);
  }, [checkIns]);

  const unreadMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter(m => {
      if (seen.has(m.client_id)) return false;
      seen.add(m.client_id);
      return true;
    }).slice(0, 6);
  }, [messages]);

  const totalActions = atRisk.length + pendingCheckIns.length + unreadMessages.length;

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full space-y-4 pb-24">

      {/* ── Header ── */}
      <div className="fade-up mb-2">
        <h1 className="text-2xl font-heading font-bold text-[#1F2A44]">Good morning 👋</h1>
        <p className="text-sm text-[#374151] mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* ── Run My Day ── */}
      <div className="fade-up fade-up-delay-1">
        <RunMyDayBanner
          atRiskCount={atRisk.length}
          pendingCheckIns={pendingCheckIns.length}
          unreadMessages={unreadMessages.length}
        />
      </div>

      {/* ── Recommendations ── */}
      {checkIns.length > 0 && clients.length > 0 && (
        <div className="fade-up fade-up-delay-1">
          <RecommendationsWidget clients={clients} checkIns={checkIns} />
        </div>
      )}

      {totalActions === 0 && <AllClear />}

      {/* ── At-risk clients ── */}
      {atRisk.length > 0 && (
        <Card className="fade-up fade-up-delay-1">
          <SectionHeader icon={AlertTriangle} title="Clients Needing Attention" count={atRisk.length} color="text-red-400" />
          <div className="space-y-2">
            {atRisk.slice(0, 5).map((entry) => (
              <AtRiskRow key={entry.client.id} entry={entry} />
            ))}
          </div>
          {atRisk.length > 5 && (
            <Link to="/checkin-review" className="flex items-center justify-center gap-1.5 mt-3 py-2 text-xs font-semibold text-[#374151] hover:text-primary transition-colors">
              +{atRisk.length - 5} more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </Card>
      )}

      {/* ── Pending check-ins ── */}
      {pendingCheckIns.length > 0 && (
        <Card className="fade-up fade-up-delay-2">
          <SectionHeader icon={ClipboardList} title="Pending Check-ins" count={pendingCheckIns.length} color="text-amber-400" />
          <Link to="/fast-review"
            className="flex items-center justify-between w-full bg-primary/5 border border-primary/15 rounded-xl px-4 py-3 mb-3 hover:bg-primary/10 transition-colors">
            <div>
              <p className="text-sm font-semibold text-primary">Start Quick Review</p>
              <p className="text-xs text-primary/70 mt-0.5">Review all {pendingCheckIns.length} check-in{pendingCheckIns.length !== 1 ? 's' : ''}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </Link>
          <div className="space-y-2">
            {pendingCheckIns.slice(0, 3).map((ci) => (
              <PendingCheckInRow key={ci.id} checkIn={ci} />
            ))}
          </div>
          {pendingCheckIns.length > 3 && (
            <Link to="/fast-review" className="flex items-center justify-center gap-1.5 mt-3 py-2 text-xs font-semibold text-[#374151] hover:text-primary transition-colors">
              +{pendingCheckIns.length - 3} more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </Card>
      )}

      {/* ── Unread messages ── */}
      {unreadMessages.length > 0 && (
        <Card className="fade-up fade-up-delay-3">
          <SectionHeader icon={MessageSquare} title="Unread Messages" count={unreadMessages.length} color="text-primary" />
          <div className="space-y-2">
            {unreadMessages.map((m) => (
              <UnreadMessageRow key={m.id} message={m} />
            ))}
          </div>
          <Link to="/messages" className="flex items-center justify-center gap-1.5 mt-3 py-2 text-xs font-semibold text-[#374151] hover:text-primary transition-colors">
            Open inbox <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Card>
      )}
    </div>
  );
}