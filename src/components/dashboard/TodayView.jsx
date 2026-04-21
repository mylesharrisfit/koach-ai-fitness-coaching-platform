import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  ClipboardList, MessageSquare, AlertTriangle, CheckCircle2,
  ArrowRight, Sparkles, Flame, Moon, Zap, Zap as FastIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore, scoreColor } from '@/lib/adherence';
import RecommendationsWidget from './RecommendationsWidget';
import RunMyDayBanner from './RunMyDayBanner';

/* ─── Priority config ─── */
const PRIORITY = {
  red:    { bg: 'bg-destructive/10',  border: 'border-destructive/30',  dot: 'bg-destructive',  label: 'Urgent' },
  yellow: { bg: 'bg-amber-500/10',    border: 'border-amber-500/30',    dot: 'bg-amber-400',    label: 'Attention' },
  green:  { bg: 'bg-emerald-500/10',  border: 'border-emerald-500/30',  dot: 'bg-emerald-400',  label: 'Follow-up' },
};

/* ─── Section header ─── */
function SectionHeader({ icon: Icon, title, count, priority }) {
  const cfg = PRIORITY[priority];
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
        <Icon className={cn('w-4 h-4', priority === 'red' ? 'text-destructive' : priority === 'yellow' ? 'text-amber-400' : 'text-emerald-400')} />
      </div>
      <h2 className="text-sm font-bold flex-1">{title}</h2>
      {count > 0 && (
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', cfg.bg, cfg.border,
          priority === 'red' ? 'text-destructive' : priority === 'yellow' ? 'text-amber-400' : 'text-emerald-400'
        )}>
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
    <div className={cn('rounded-xl border p-3.5 space-y-3', cfg.bg, cfg.border)}>
      <div className="flex items-start gap-3">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{client.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {flags[0]?.detail || flags[0]?.label}
            {lastCI !== null && <span className="ml-2 opacity-70">{lastCI}d ago</span>}
          </p>
          {highFlags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {highFlags.slice(0, 3).map(f => (
                <span key={f.key} className="text-[10px] font-medium bg-destructive/10 text-destructive border border-destructive/20 px-1.5 py-0.5 rounded-full">
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Quick actions */}
      <div className="flex gap-2">
        <button
          onClick={() => navigate('/messages')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground active:scale-95 transition-all min-h-[40px]"
        >
          <MessageSquare className="w-3.5 h-3.5" /> Message
        </button>
        <button
          onClick={() => navigate('/checkin-review')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground active:scale-95 transition-all min-h-[40px]"
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
    <div className={cn('rounded-xl border p-3.5 space-y-3', cfg.bg, cfg.border)}>
      <div className="flex items-center gap-3">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{checkIn.client_name}</p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardList className="w-3 h-3" /> {format(parseISO(checkIn.date), 'MMM d')}
            </span>
            {daysAgo > 0 && (
              <span className={cn('text-xs font-medium', daysAgo > 7 ? 'text-destructive' : daysAgo > 3 ? 'text-amber-400' : 'text-muted-foreground')}>
                {daysAgo}d ago
              </span>
            )}
            {checkIn.weight && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" /> {checkIn.weight} lbs
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/checkin-detail?id=${checkIn.id}&clientId=${checkIn.client_id}`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground active:scale-95 transition-all min-h-[40px]"
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Feedback
        </button>
        <button
          onClick={() => navigate('/checkin-review')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-card border border-border text-xs font-semibold text-foreground active:scale-95 transition-all min-h-[40px]"
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
    urgent: 'text-destructive bg-destructive/10 border-destructive/20',
    check_in: 'text-primary bg-primary/10 border-primary/20',
    nutrition: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    training: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  };

  return (
    <button
      onClick={() => navigate('/messages')}
      className="w-full rounded-xl border border-border bg-card p-3.5 text-left active:bg-secondary/40 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold">{message.client_name}</p>
            {message.tag && TAG_COLORS[message.tag] && (
              <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', TAG_COLORS[message.tag])}>
                {message.tag.replace('_', ' ')}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{message.content}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
      </div>
    </button>
  );
}

/* ─── Empty state ─── */
function AllClear() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
      </div>
      <div>
        <p className="text-base font-bold">All clear!</p>
        <p className="text-sm text-muted-foreground mt-0.5">No pending actions for today</p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export default function TodayView({ clients, checkIns, messages }) {
  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns), [clients, checkIns]);

  // Pending = no coach response, within last 14 days
  const pendingCheckIns = useMemo(() => {
    return checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 14)
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // oldest first = most urgent
      .slice(0, 8);
  }, [checkIns]);

  // Deduplicate messages by client — show one per client
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
    <div className="px-4 py-5 sm:px-6 sm:py-8 max-w-2xl mx-auto w-full overflow-x-hidden space-y-6 pb-24">

      {/* ── Header ── */}
      <div className="fade-up">
        <h1 className="text-2xl font-heading font-bold tracking-tight">Today</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{format(new Date(), 'EEEE, MMMM d')}</p>
      </div>

      {/* ── Run My Day Banner ── */}
      <div className="fade-up fade-up-delay-1">
        <RunMyDayBanner
          atRiskCount={atRisk.length}
          pendingCheckIns={pendingCheckIns.length}
          unreadMessages={unreadMessages.length}
        />
      </div>

      {/* ── ⚡ Recommendations ── */}
      {checkIns.length > 0 && clients.length > 0 && (
        <div className="fade-up fade-up-delay-1">
          <RecommendationsWidget clients={clients} checkIns={checkIns} />
        </div>
      )}

      {totalActions === 0 && <AllClear />}

      {/* ── 🔴 At-risk clients ── */}
      {atRisk.length > 0 && (
        <div className="fade-up fade-up-delay-1">
          <SectionHeader icon={AlertTriangle} title="Clients Needing Attention" count={atRisk.length} priority={atRisk.some(e => e.riskScore >= 60) ? 'red' : 'yellow'} />
          <div className="space-y-2.5">
            {atRisk.slice(0, 5).map((entry, i) => (
              <div key={entry.client.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <AtRiskRow entry={entry} />
              </div>
            ))}
          </div>
          {atRisk.length > 5 && (
            <Link to="/checkin-review" className="flex items-center justify-center gap-1.5 mt-2.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              +{atRisk.length - 5} more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* ── 🟡 Pending check-ins ── */}
      {pendingCheckIns.length > 0 && (
        <div className="fade-up fade-up-delay-2">
          <div className="flex items-center justify-between mb-3">
            <SectionHeader icon={ClipboardList} title="Pending Check-ins" count={pendingCheckIns.length} priority="yellow" />
          </div>
          {/* Quick Review CTA */}
          <Link to="/fast-review"
            className="flex items-center justify-between w-full bg-primary/10 border border-primary/25 rounded-xl px-4 py-3 mb-3 hover:bg-primary/15 active:scale-[0.98] transition-all">
            <div>
              <p className="text-sm font-bold text-primary">Start Quick Review</p>
              <p className="text-xs text-primary/70 mt-0.5">Review all {pendingCheckIns.length} check-in{pendingCheckIns.length !== 1 ? 's' : ''} one by one</p>
            </div>
            <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
          </Link>
          <div className="space-y-2.5">
            {pendingCheckIns.slice(0, 3).map((ci, i) => (
              <div key={ci.id} className="fade-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <PendingCheckInRow checkIn={ci} />
              </div>
            ))}
          </div>
          {pendingCheckIns.length > 3 && (
            <Link to="/fast-review" className="flex items-center justify-center gap-1.5 mt-2.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
              +{pendingCheckIns.length - 3} more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      )}

      {/* ── 🟢 Unread messages ── */}
      {unreadMessages.length > 0 && (
        <div className="fade-up fade-up-delay-3">
          <SectionHeader icon={MessageSquare} title="Unread Messages" count={unreadMessages.length} priority="green" />
          <div className="space-y-2.5">
            {unreadMessages.map((m, i) => (
              <div key={m.id} className="fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <UnreadMessageRow message={m} />
              </div>
            ))}
          </div>
          <Link to="/messages" className="flex items-center justify-center gap-1.5 mt-2.5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Open inbox <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}