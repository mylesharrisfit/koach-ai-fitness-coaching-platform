import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import {
  MessageSquare, Dumbbell, ClipboardList, TrendingUp,
  AlertTriangle, CheckCircle2, Zap, ChevronDown, ChevronUp,
  Send, UserCheck, RefreshCw, CreditCard, Eye, ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore } from '@/lib/adherence';

const URGENCY = { critical: 0, high: 1, medium: 2, low: 3 };

const COLORS = {
  checkin:   { dot: '#F59E0B', badgeBg: '#FFFBEB', badgeText: '#92400E', badgeBorder: '#FDE68A', iconBg: '#FFFBEB', iconColor: '#D97706', label: 'No Check-In' },
  workout:   { dot: '#EF4444', badgeBg: '#FEF2F2', badgeText: '#991B1B', badgeBorder: '#FECACA', iconBg: '#FEF2F2', iconColor: '#DC2626', label: 'Missed WO' },
  adherence: { dot: '#F97316', badgeBg: '#FFF7ED', badgeText: '#9A3412', badgeBorder: '#FED7AA', iconBg: '#FFF7ED', iconColor: '#EA580C', label: 'Adherence' },
  payment:   { dot: '#E11D48', badgeBg: '#FFF1F2', badgeText: '#9F1239', badgeBorder: '#FECDD3', iconBg: '#FFF1F2', iconColor: '#BE123C', label: 'Payment' },
  review:    { dot: '#3B82F6', badgeBg: '#EFF6FF', badgeText: '#1E40AF', badgeBorder: '#BFDBFE', iconBg: '#EFF6FF', iconColor: '#2563EB', label: 'Reviews' },
  prog:      { dot: '#16A34A', badgeBg: '#F0FDF4', badgeText: '#14532D', badgeBorder: '#BBF7D0', iconBg: '#F0FDF4', iconColor: '#16A34A', label: 'Progression' },
};

function Pill({ icon: Icon, label, onClick, variant = 'ghost' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0"
      style={variant === 'primary'
        ? { background: '#3B82F6', color: '#fff' }
        : { background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }
      }
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

function ActionCard({ name, subtitle, badge, urgency, actions, colorKey }) {
  const color = COLORS[colorKey];
  return (
    <div className="group flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold relative mt-0.5"
        style={{ background: color.iconBg, color: color.iconColor }}>
        {name?.[0]?.toUpperCase()}
        {urgency === 'critical' && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{name}</span>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
              style={{ background: color.badgeBg, color: color.badgeText, borderColor: color.badgeBorder }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate leading-relaxed">{subtitle}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {actions}
        </div>
      </div>
    </div>
  );
}

function Section({ colorKey, icon: Icon, title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = COLORS[colorKey];
  if (count === 0) return null;

  return (
    <div className="bg-white rounded-xl overflow-hidden"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
        style={{ borderBottom: open ? '1px solid #F3F4F6' : 'none' }}
      >
        <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
          style={{ background: color.iconBg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: color.iconColor }} />
        </div>
        <span className="text-sm font-semibold text-gray-900 flex-1 text-left">{title}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
          style={{ background: color.badgeBg, color: color.badgeText, borderColor: color.badgeBorder }}>
          {count}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>

      {open && (
        <div className="divide-y divide-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

function CommandBar({ items }) {
  const critical = items.filter(i => i.urgency === 'critical').length;
  const high = items.filter(i => i.urgency === 'high').length;
  const total = items.length;

  if (total === 0) {
    return (
      <div className="bg-white rounded-xl px-4 py-4 flex items-center gap-3"
        style={{ border: '1px solid #BBF7D0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-green-50">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">All clear — great work!</p>
          <p className="text-xs text-gray-400 mt-0.5">No actions needed today</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl px-4 py-4"
      style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-blue-50">
          <Zap className="w-4 h-4 text-blue-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900">Action Required</p>
          <p className="text-xs text-gray-400 mt-0.5">{total} client{total !== 1 ? 's' : ''} need attention</p>
        </div>
        {critical > 0 && (
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-bold text-red-600">{critical} critical</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Critical', count: critical, textColor: critical > 0 ? '#DC2626' : '#9CA3AF', bg: critical > 0 ? '#FEF2F2' : '#F9FAFB' },
          { label: 'High', count: high, textColor: high > 0 ? '#D97706' : '#9CA3AF', bg: high > 0 ? '#FFFBEB' : '#F9FAFB' },
          { label: 'Total', count: total, textColor: '#111827', bg: '#F3F4F6' },
        ].map(s => (
          <div key={s.label} className="rounded-lg px-2 py-2.5 text-center"
            style={{ background: s.bg, border: '1px solid #E5E7EB' }}>
            <p className="text-lg font-bold tabular-nums leading-none" style={{ color: s.textColor }}>{s.count}</p>
            <p className="text-[10px] mt-1 text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RunMyDayCenter({ clients, checkIns, messages, payments = [] }) {
  const navigate = useNavigate();

  const go = (path) => navigate(path);
  const msgClient = (id, msg) =>
    navigate(`/messages?clientId=${id}${msg ? `&message=${encodeURIComponent(msg)}` : ''}`);

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

  const lowAdherence = useMemo(() => {
    return clients
      .map(client => {
        const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (cis.length < 2) return null;
        const score = compositeAdherenceScore(cis);
        if (score === null || score >= 65) return null;
        const alreadyMissed = missedWorkouts.some(m => m.client.id === client.id);
        if (alreadyMissed) return null;
        return { client, score, urgency: score < 40 ? 'critical' : 'high' };
      })
      .filter(Boolean)
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
  }, [clients, checkIns, missedWorkouts]);

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

  const allItems = useMemo(() => [
    ...missedCheckIns, ...missedWorkouts, ...lowAdherence,
    ...paymentIssues, ...pendingReviews, ...readyForProgression,
  ], [missedCheckIns, missedWorkouts, lowAdherence, paymentIssues, pendingReviews, readyForProgression]);

  return (
    <div className="space-y-2.5">
      <CommandBar items={allItems} />

      <Section colorKey="checkin" icon={ClipboardList} title="Missed Check-ins" count={missedCheckIns.length}>
        {missedCheckIns.map(({ client, daysAgo, urgency }) => (
          <ActionCard key={client.id} colorKey="checkin" name={client.name}
            subtitle={daysAgo === 999 ? 'No check-ins on record' : `Last check-in ${daysAgo} days ago`}
            badge={daysAgo === 999 ? 'Never' : `${daysAgo}d`} urgency={urgency}
            actions={<>
              <Pill icon={Send} label="Nudge" variant="primary"
                onClick={() => msgClient(client.id, "Hey! Just checking in — haven't heard from you in a while. How's everything going? 💪")} />
              <Pill icon={MessageSquare} label="Message" onClick={() => msgClient(client.id)} />
              <Pill icon={Eye} label="Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
            </>}
          />
        ))}
      </Section>

      <Section colorKey="workout" icon={Dumbbell} title="Missed Workouts" count={missedWorkouts.length}>
        {missedWorkouts.map(({ client, ci, pct, urgency }) => (
          <ActionCard key={client.id} colorKey="workout" name={client.name}
            subtitle={`${pct}% training compliance · ${differenceInDays(new Date(), parseISO(ci.date))}d ago`}
            badge={`${pct}%`} urgency={urgency}
            actions={<>
              <Pill icon={ClipboardList} label="Review" variant="primary"
                onClick={() => go(`/checkin-detail?id=${ci.id}&clientId=${client.id}`)} />
              <Pill icon={Dumbbell} label="Adjust" onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)} />
              <Pill icon={MessageSquare} label="Message"
                onClick={() => msgClient(client.id, "Hey, noticed your training compliance was low this week — anything I can help adjust? 💪")} />
            </>}
          />
        ))}
      </Section>

      <Section colorKey="adherence" icon={AlertTriangle} title="Low Adherence" count={lowAdherence.length}>
        {lowAdherence.map(({ client, score, urgency }) => (
          <ActionCard key={client.id} colorKey="adherence" name={client.name}
            subtitle={`${score}% composite adherence (below 65%)`}
            badge={`${score}%`} urgency={urgency}
            actions={<>
              <Pill icon={RefreshCw} label="Adjust Plan" variant="primary"
                onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)} />
              <Pill icon={MessageSquare} label="Check In"
                onClick={() => msgClient(client.id, "Hey, I want to make sure your plan is working for you — let's chat about any adjustments 🙌")} />
              <Pill icon={Eye} label="Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
            </>}
          />
        ))}
      </Section>

      <Section colorKey="payment" icon={CreditCard} title="Payment Issues" count={paymentIssues.length}>
        {paymentIssues.map(({ client, payment, urgency }) => (
          <ActionCard key={payment.id} colorKey="payment" name={client.name}
            subtitle={`$${payment.amount} · ${payment.status === 'failed' ? 'Payment failed' : 'Payment overdue'}${payment.due_date ? ` · Due ${format(parseISO(payment.due_date), 'MMM d')}` : ''}`}
            badge={payment.status === 'failed' ? 'Failed' : 'Overdue'} urgency={urgency}
            actions={<>
              <Pill icon={MessageSquare} label="Message" variant="primary"
                onClick={() => msgClient(client.id, "Hi! Just a quick note about your upcoming payment — let me know if you have any questions 🙏")} />
              <Pill icon={Eye} label="View" onClick={() => go('/revenue')} />
            </>}
          />
        ))}
      </Section>

      <Section colorKey="review" icon={Zap} title="Pending Reviews" count={pendingReviews.length}>
        {pendingReviews.map(({ ci, daysAgo, urgency }) => (
          <ActionCard key={ci.id} colorKey="review" name={ci.client_name}
            subtitle={`Submitted ${format(parseISO(ci.date), 'MMM d')} · ${daysAgo}d ago${ci.weight ? ` · ${ci.weight} lbs` : ''}${ci.mood ? ` · mood: ${ci.mood}` : ''}`}
            badge={daysAgo > 5 ? 'Overdue' : 'New'} urgency={urgency}
            actions={<>
              <Pill icon={Zap} label="AI Review" variant="primary"
                onClick={() => go(`/checkin-detail?id=${ci.id}&clientId=${ci.client_id}`)} />
              <Pill icon={ArrowUpRight} label="Queue" onClick={() => go('/fast-review')} />
              <Pill icon={MessageSquare} label="Message" onClick={() => msgClient(ci.client_id)} />
            </>}
          />
        ))}
      </Section>

      <Section colorKey="prog" icon={TrendingUp} title="Ready for Progression" count={readyForProgression.length} defaultOpen={false}>
        {readyForProgression.map(({ client, score }) => (
          <ActionCard key={client.id} colorKey="prog" name={client.name}
            subtitle={`${score}% adherence — crushing it consistently`}
            badge={`${score}%`} urgency="low"
            actions={<>
              <Pill icon={Dumbbell} label="Assign Workout" variant="primary"
                onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)} />
              <Pill icon={UserCheck} label="Progress Plan" onClick={() => go(`/client-profile?id=${client.id}`)} />
              <Pill icon={MessageSquare} label="Celebrate"
                onClick={() => msgClient(client.id, "Great work lately! You're crushing it — I'm bumping up your program to match your progress 🚀")} />
            </>}
          />
        ))}
      </Section>
    </div>
  );
}