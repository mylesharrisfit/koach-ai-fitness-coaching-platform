import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  MessageSquare, Dumbbell, ClipboardList, TrendingUp,
  AlertTriangle, CheckCircle2, Zap, ChevronDown, ChevronUp,
  Send, UserCheck, RefreshCw, CreditCard, Eye, ArrowUpRight,
  Flame, Star, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore } from '@/lib/adherence';

/* ─── urgency levels ──────────────────────────────── */
const URGENCY = { critical: 0, high: 1, medium: 2, low: 3 };

/* ─── Section colors ──────────────────────────────── */
const COLORS = {
  checkin:  { dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200',  ring: 'ring-amber-100',  icon: 'text-amber-500 bg-amber-50',   label: 'No Check-In' },
  workout:  { dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200',        ring: 'ring-red-100',    icon: 'text-red-500 bg-red-50',       label: 'Missed WO'   },
  adherence:{ dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200', ring: 'ring-orange-100', icon: 'text-orange-500 bg-orange-50', label: 'Adherence'  },
  payment:  { dot: 'bg-rose-600',    badge: 'bg-rose-50 text-rose-700 border-rose-200',     ring: 'ring-rose-100',   icon: 'text-rose-600 bg-rose-50',     label: 'Payment'     },
  review:   { dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',     ring: 'ring-blue-100',   icon: 'text-blue-500 bg-blue-50',     label: 'Reviews'     },
  prog:     { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ring: 'ring-emerald-100', icon: 'text-emerald-600 bg-emerald-50', label: 'Progression' },
};

/* ─── Quick action pill ───────────────────────────── */
function Pill({ icon: Icon, label, onClick, variant = 'ghost' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0"
      style={variant === 'primary'
        ? { background: '#3B82F6', color: '#fff' }
        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }
      }
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

/* ─── Urgency dot ─────────────────────────────────── */
function UrgencyDot({ level }) {
  if (level === 'critical') return <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />;
  if (level === 'high')     return <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />;
  return null;
}

/* ─── Action card ─────────────────────────────────── */
function ActionCard({ avatar, name, subtitle, badge, badgeClass, urgency, actions, colorKey }) {
  const color = COLORS[colorKey];
  return (
    <div
      className="group flex items-start gap-3 px-4 py-3.5 transition-colors"
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold relative mt-0.5', color.icon)}>
        {name?.[0]?.toUpperCase()}
        {urgency === 'critical' && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-white truncate max-w-[120px]">{name}</span>
          {badge && (
            <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0', badgeClass || color.badge)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs mt-0.5 truncate leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>{subtitle}</p>
        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {actions}
        </div>
      </div>
    </div>
  );
}

/* ─── Section ─────────────────────────────────────── */
function Section({ colorKey, icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = COLORS[colorKey];
  if (count === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
        style={{ borderBottom: open ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div className={cn('w-6 h-6 rounded-md flex items-center justify-center shrink-0', color.icon)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-semibold text-white flex-1 text-left">{title}</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border shrink-0', color.badge)}>
          {count}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Command bar ─────────────────────────────────── */
function CommandBar({ items }) {
  const critical = items.filter(i => i.urgency === 'critical').length;
  const high = items.filter(i => i.urgency === 'high').length;
  const total = items.length;
  const allClear = total === 0;

  if (allClear) {
    return (
      <div className="rounded-xl px-4 py-4 flex items-center gap-3"
        style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(34,197,94,0.1)' }}>
          <CheckCircle2 className="w-4 h-4" style={{ color: '#22C55E' }} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">All clear — great work!</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>No actions needed today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl px-4 py-4" style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.12)' }}>
          <Zap className="w-4 h-4" style={{ color: '#3B82F6' }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-white">Action Required</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{total} client{total !== 1 ? 's' : ''} need attention</p>
        </div>
        {critical > 0 && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#EF4444' }} />
            <span className="text-xs font-bold" style={{ color: '#EF4444' }}>{critical} critical</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Critical', count: critical, color: critical > 0 ? '#EF4444' : 'rgba(255,255,255,0.2)', bg: critical > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)' },
          { label: 'High', count: high, color: high > 0 ? '#F59E0B' : 'rgba(255,255,255,0.2)', bg: high > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)' },
          { label: 'Total', count: total, color: '#fff', bg: 'rgba(255,255,255,0.04)' },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-2 py-2.5 text-center"
            style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-lg font-bold tabular-nums leading-none" style={{ color: s.color }}>{s.count}</p>
            <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────
   Main export
────────────────────────────────────────────────────── */
export default function RunMyDayCenter({ clients, checkIns, messages, payments = [] }) {
  const navigate = useNavigate();

  const go = (path) => navigate(path);
  const msgClient = (id, msg) =>
    navigate(`/messages?clientId=${id}${msg ? `&message=${encodeURIComponent(msg)}` : ''}`);

  /* ── 1. Missed check-ins ──────────────────────────── */
  const missedCheckIns = useMemo(() => {
    const active = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    return active
      .map(client => {
        const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = cis[0];
        const daysAgo = latest ? differenceInDays(new Date(), parseISO(latest.date)) : 999;
        if (daysAgo < 10) return null;
        return { client, daysAgo, urgency: daysAgo >= 21 ? 'critical' : 'high' };
      })
      .filter(Boolean)
      .sort((a, b) => b.daysAgo - a.daysAgo)
      .slice(0, 8);
  }, [clients, checkIns]);

  /* ── 2. Missed workouts ───────────────────────────── */
  const missedWorkouts = useMemo(() => {
    return clients
      .map(client => {
        const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = cis[0];
        if (!latest) return null;
        const daysAgo = differenceInDays(new Date(), parseISO(latest.date));
        if (daysAgo > 14) return null;
        if (latest.compliance_training == null || latest.compliance_training >= 60) return null;
        return { client, ci: latest, pct: latest.compliance_training, urgency: latest.compliance_training < 30 ? 'critical' : 'high' };
      })
      .filter(Boolean)
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 8);
  }, [clients, checkIns]);

  /* ── 3. Low adherence ─────────────────────────────── */
  const lowAdherence = useMemo(() => {
    return clients
      .map(client => {
        const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (cis.length < 2) return null;
        const score = compositeAdherenceScore(cis);
        if (score === null || score >= 65) return null;
        // Exclude if already in missedWorkouts (avoid double listing)
        const alreadyMissed = missedWorkouts.some(m => m.client.id === client.id);
        if (alreadyMissed) return null;
        return { client, score, urgency: score < 40 ? 'critical' : 'high' };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
  }, [clients, checkIns, missedWorkouts]);

  /* ── 4. Payment issues ────────────────────────────── */
  const paymentIssues = useMemo(() => {
    const overdue = payments.filter(p => p.status === 'failed' || p.status === 'pending');
    return overdue
      .map(p => {
        const client = clients.find(c => c.id === p.client_id);
        if (!client) return null;
        return { client, payment: p, urgency: p.status === 'failed' ? 'critical' : 'high' };
      })
      .filter(Boolean)
      .slice(0, 6);
  }, [payments, clients]);

  /* ── 5. Pending reviews ───────────────────────────── */
  const pendingReviews = useMemo(() => {
    return checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 14)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(ci => {
        const daysAgo = differenceInDays(new Date(), parseISO(ci.date));
        return { ci, daysAgo, urgency: daysAgo > 5 ? 'high' : 'medium' };
      })
      .slice(0, 8);
  }, [checkIns]);

  /* ── 6. Ready for progression ─────────────────────── */
  const readyForProgression = useMemo(() => {
    return clients
      .map(client => {
        const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (cis.length < 3) return null;
        const score = compositeAdherenceScore(cis);
        if (score === null || score < 80) return null;
        return { client, score, urgency: 'low' };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [clients, checkIns]);

  /* ── All items (for command bar) ─────────────────── */
  const allItems = useMemo(() => [
    ...missedCheckIns,
    ...missedWorkouts,
    ...lowAdherence,
    ...paymentIssues,
    ...pendingReviews,
    ...readyForProgression,
  ], [missedCheckIns, missedWorkouts, lowAdherence, paymentIssues, pendingReviews, readyForProgression]);

  return (
    <div className="space-y-2.5">
      <CommandBar items={allItems} />

      {/* ── Missed Check-ins ─────────────────────────── */}
      <Section colorKey="checkin" icon={ClipboardList} title="Missed Check-ins" count={missedCheckIns.length}>
        {missedCheckIns.map(({ client, daysAgo, urgency }) => (
          <ActionCard
            key={client.id}
            colorKey="checkin"
            name={client.name}
            subtitle={daysAgo === 999 ? 'No check-ins on record' : `Last check-in ${daysAgo} days ago`}
            badge={daysAgo === 999 ? 'Never' : `${daysAgo}d`}
            urgency={urgency}
            actions={<>
              <Pill
                icon={Send}
                label="Nudge"
                variant="primary"
                onClick={() => msgClient(client.id, "Hey! Just checking in — haven't heard from you in a while. How's everything going? 💪")}
              />
              <Pill
                icon={MessageSquare}
                label="Message"
                onClick={() => msgClient(client.id)}
              />
              <Pill
                icon={Eye}
                label="Profile"
                onClick={() => go(`/client-profile?id=${client.id}`)}
              />
            </>}
          />
        ))}
      </Section>

      {/* ── Missed Workouts ──────────────────────────── */}
      <Section colorKey="workout" icon={Dumbbell} title="Missed Workouts" count={missedWorkouts.length}>
        {missedWorkouts.map(({ client, ci, pct, urgency }) => (
          <ActionCard
            key={client.id}
            colorKey="workout"
            name={client.name}
            subtitle={`${pct}% training compliance · ${differenceInDays(new Date(), parseISO(ci.date))}d ago`}
            badge={`${pct}%`}
            urgency={urgency}
            actions={<>
              <Pill
                icon={ClipboardList}
                label="Review"
                variant="primary"
                onClick={() => go(`/checkin-detail?id=${ci.id}&clientId=${client.id}`)}
              />
              <Pill
                icon={Dumbbell}
                label="Assign Workout"
                onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)}
              />
              <Pill
                icon={MessageSquare}
                label="Message"
                onClick={() => msgClient(client.id, "Hey, noticed your training compliance was low this week — anything I can help adjust? 💪")}
              />
            </>}
          />
        ))}
      </Section>

      {/* ── Low Adherence ────────────────────────────── */}
      <Section colorKey="adherence" icon={AlertTriangle} title="Low Adherence" count={lowAdherence.length}>
        {lowAdherence.map(({ client, score, urgency }) => (
          <ActionCard
            key={client.id}
            colorKey="adherence"
            name={client.name}
            subtitle={`${score}% composite adherence (below 65%)`}
            badge={`${score}%`}
            urgency={urgency}
            actions={<>
              <Pill
                icon={RefreshCw}
                label="Adjust Plan"
                variant="primary"
                onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)}
              />
              <Pill
                icon={MessageSquare}
                label="Check In"
                onClick={() => msgClient(client.id, "Hey, I want to make sure your plan is working for you — let's chat about any adjustments 🙌")}
              />
              <Pill
                icon={Eye}
                label="Profile"
                onClick={() => go(`/client-profile?id=${client.id}`)}
              />
            </>}
          />
        ))}
      </Section>

      {/* ── Payment Issues ───────────────────────────── */}
      <Section colorKey="payment" icon={CreditCard} title="Payment Issues" count={paymentIssues.length}>
        {paymentIssues.map(({ client, payment, urgency }) => (
          <ActionCard
            key={payment.id}
            colorKey="payment"
            name={client.name}
            subtitle={`$${payment.amount} · ${payment.status === 'failed' ? 'Payment failed' : 'Payment overdue'}${payment.due_date ? ` · Due ${format(parseISO(payment.due_date), 'MMM d')}` : ''}`}
            badge={payment.status === 'failed' ? 'Failed' : 'Overdue'}
            urgency={urgency}
            actions={<>
              <Pill
                icon={MessageSquare}
                label="Message"
                variant="primary"
                onClick={() => msgClient(client.id, "Hi! Just a quick note about your upcoming payment — let me know if you have any questions 🙏")}
              />
              <Pill
                icon={Eye}
                label="View"
                onClick={() => go(`/revenue`)}
              />
            </>}
          />
        ))}
      </Section>

      {/* ── Pending Reviews ──────────────────────────── */}
      <Section colorKey="review" icon={Zap} title="Pending Reviews" count={pendingReviews.length}>
        {pendingReviews.map(({ ci, daysAgo, urgency }) => (
          <ActionCard
            key={ci.id}
            colorKey="review"
            name={ci.client_name}
            subtitle={`Submitted ${format(parseISO(ci.date), 'MMM d')} · ${daysAgo}d ago${ci.weight ? ` · ${ci.weight} lbs` : ''}${ci.mood ? ` · mood: ${ci.mood}` : ''}`}
            badge={daysAgo > 5 ? 'Overdue' : 'New'}
            urgency={urgency}
            actions={<>
              <Pill
                icon={Zap}
                label="AI Review"
                variant="primary"
                onClick={() => go(`/checkin-detail?id=${ci.id}&clientId=${ci.client_id}`)}
              />
              <Pill
                icon={ArrowUpRight}
                label="Queue"
                onClick={() => go('/fast-review')}
              />
              <Pill
                icon={MessageSquare}
                label="Message"
                onClick={() => msgClient(ci.client_id)}
              />
            </>}
          />
        ))}
      </Section>

      {/* ── Ready for Progression ────────────────────── */}
      <Section colorKey="prog" icon={TrendingUp} title="Ready for Progression" count={readyForProgression.length} defaultOpen={false}>
        {readyForProgression.map(({ client, score }) => (
          <ActionCard
            key={client.id}
            colorKey="prog"
            name={client.name}
            subtitle={`${score}% adherence — crushing it consistently`}
            badge={`${score}%`}
            urgency="low"
            actions={<>
              <Pill
                icon={Dumbbell}
                label="Assign Workout"
                variant="primary"
                onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)}
              />
              <Pill
                icon={UserCheck}
                label="Progress Plan"
                onClick={() => go(`/client-profile?id=${client.id}`)}
              />
              <Pill
                icon={MessageSquare}
                label="Celebrate"
                onClick={() => msgClient(client.id, "Great work lately! You're crushing it — I'm bumping up your program to match your progress 🚀")}
              />
            </>}
          />
        ))}
      </Section>
    </div>
  );
}