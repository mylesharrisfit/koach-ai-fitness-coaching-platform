import React, { useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { differenceInDays, parseISO, subWeeks, format } from 'date-fns';
import {
  MessageSquare, ClipboardList, TrendingUp, Dumbbell,
  AlertTriangle, CheckCircle2, Sparkles, ArrowRight,
  ChevronDown, ChevronUp, Zap, Target, UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAtRiskClients } from '@/lib/riskEngine';
import { compositeAdherenceScore, averageAdherenceScore } from '@/lib/adherence';

/* ──────────────────────────────────────────
   Command Bar — top summary row
────────────────────────────────────────── */
function CommandBar({ sections }) {
  const totalActions = sections.reduce((sum, s) => sum + s.count, 0);
  const allClear = totalActions === 0;

  return (
    <div className={cn(
      'rounded-2xl border p-4',
      allClear ? 'bg-emerald-50 border-emerald-100' : 'bg-[#1F2A44] border-transparent'
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
          allClear ? 'bg-emerald-100' : 'bg-white/10'
        )}>
          {allClear
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            : <Zap className="w-5 h-5 text-white" />
          }
        </div>
        <div className="flex-1">
          <p className={cn('font-heading font-bold text-[15px]', allClear ? 'text-emerald-800' : 'text-white')}>
            {allClear ? 'All clear — great work! 🎉' : 'Run My Day'}
          </p>
          <p className={cn('text-xs mt-0.5', allClear ? 'text-emerald-600' : 'text-white/60')}>
            {allClear ? 'No actions needed today' : `${totalActions} action${totalActions !== 1 ? 's' : ''} need your attention`}
          </p>
        </div>
        {!allClear && (
          <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
        )}
      </div>

      {!allClear && (
        <div className="grid grid-cols-4 gap-2">
          {sections.map(s => (
            <div
              key={s.id}
              className={cn(
                'rounded-xl px-2 py-2.5 text-center border',
                s.count > 0 ? s.activeBg : 'bg-white/5 border-white/10'
              )}
            >
              <p className={cn('text-xl font-bold tabular-nums leading-none', s.count > 0 ? s.activeColor : 'text-white/30')}>
                {s.count}
              </p>
              <p className="text-[10px] mt-1 text-white/50 leading-tight">{s.shortLabel}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Section wrapper with collapse
────────────────────────────────────────── */
function Section({ icon: Icon, title, count, colorClass, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  if (count === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8F9FC] transition-colors"
      >
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0', colorClass.iconBg)}>
          <Icon className={cn('w-3.5 h-3.5', colorClass.iconColor)} />
        </div>
        <span className="text-sm font-semibold text-[#1F2A44] flex-1 text-left">{title}</span>
        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', colorClass.badge)}>
          {count}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-[#9CA3AF]" /> : <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />}
      </button>

      {open && (
        <div className="border-t border-[#F0F2F8] divide-y divide-[#F0F2F8]">
          {children}
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────
   Quick action button
────────────────────────────────────────── */
function ActionBtn({ icon: Icon, label, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
        primary
          ? 'bg-primary text-white hover:bg-primary/90'
          : 'bg-[#F6F7FB] border border-[#E7EAF3] text-[#374151] hover:bg-[#ECEEF4]'
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

/* ──────────────────────────────────────────
   Client row base
────────────────────────────────────────── */
function ClientRow({ name, subtitle, badge, badgeColor, actions }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-8 h-8 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0 text-sm font-bold text-primary">
        {name?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1F2A44] truncate">{name}</p>
          {badge && (
            <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0', badgeColor)}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-[#9CA3AF] mt-0.5 truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {actions}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────
   Main export
────────────────────────────────────────── */
export default function RunMyDayCenter({ clients, checkIns, messages }) {
  const navigate = useNavigate();

  /* ── Missed workouts: last check-in had training compliance < 50% ── */
  const missedWorkouts = useMemo(() => {
    return clients.filter(client => {
      const clientCIs = checkIns
        .filter(ci => ci.client_id === client.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = clientCIs[0];
      if (!latest) return false;
      const daysAgo = differenceInDays(new Date(), parseISO(latest.date));
      return daysAgo <= 14 && latest.compliance_training != null && latest.compliance_training < 50;
    }).slice(0, 6);
  }, [clients, checkIns]);

  /* ── Missed check-ins: active clients with no check-in in 10+ days ── */
  const missedCheckIns = useMemo(() => {
    const activeClients = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    return activeClients.filter(client => {
      const clientCIs = checkIns.filter(ci => ci.client_id === client.id);
      if (!clientCIs.length) return true;
      const latest = clientCIs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      return differenceInDays(new Date(), parseISO(latest.date)) >= 10;
    }).slice(0, 6);
  }, [clients, checkIns]);

  /* ── At risk: from riskEngine ── */
  const atRisk = useMemo(() => getAtRiskClients(clients, checkIns).slice(0, 6), [clients, checkIns]);

  /* ── Ready for progression: consistent high adherence (avg ≥80) ── */
  const readyForProgression = useMemo(() => {
    return clients.filter(client => {
      const clientCIs = checkIns
        .filter(ci => ci.client_id === client.id)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      if (clientCIs.length < 3) return false;
      const score = compositeAdherenceScore(clientCIs);
      return score !== null && score >= 80;
    }).slice(0, 6);
  }, [clients, checkIns]);

  /* ── Pending check-ins (unreviewed) ── */
  const pendingCheckIns = useMemo(() => {
    return checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 14)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);
  }, [checkIns]);

  const sections = [
    { id: 'pending', count: pendingCheckIns.length, shortLabel: 'Reviews', activeBg: 'bg-blue-500/20 border-blue-400/30', activeColor: 'text-blue-300' },
    { id: 'checkin', count: missedCheckIns.length, shortLabel: 'No Check-In', activeBg: 'bg-amber-500/20 border-amber-400/30', activeColor: 'text-amber-300' },
    { id: 'workout', count: missedWorkouts.length, shortLabel: 'Missed WO', activeBg: 'bg-red-500/20 border-red-400/30', activeColor: 'text-red-300' },
    { id: 'risk',    count: atRisk.length, shortLabel: 'At Risk', activeBg: 'bg-orange-500/20 border-orange-400/30', activeColor: 'text-orange-300' },
  ];

  const SECTION_COLORS = {
    workout: { iconBg: 'bg-red-50', iconColor: 'text-red-500', badge: 'bg-red-50 text-red-600 border-red-100' },
    checkin: { iconBg: 'bg-amber-50', iconColor: 'text-amber-500', badge: 'bg-amber-50 text-amber-600 border-amber-100' },
    risk:    { iconBg: 'bg-orange-50', iconColor: 'text-orange-500', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
    prog:    { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    pending: { iconBg: 'bg-blue-50', iconColor: 'text-primary', badge: 'bg-blue-50 text-primary border-blue-100' },
  };

  return (
    <div className="space-y-3">
      <CommandBar sections={sections} />

      {/* Missed Workouts */}
      <Section
        icon={Dumbbell}
        title="Missed Workouts"
        count={missedWorkouts.length}
        colorClass={SECTION_COLORS.workout}
      >
        {missedWorkouts.map(client => {
          const ci = checkIns.filter(c => c.client_id === client.id).sort((a,b) => new Date(b.date)-new Date(a.date))[0];
          return (
            <ClientRow
              key={client.id}
              name={client.name}
              subtitle={`${ci?.compliance_training ?? 0}% training · ${differenceInDays(new Date(), parseISO(ci?.date || new Date().toISOString()))}d ago`}
              badge={`${ci?.compliance_training ?? 0}%`}
              badgeColor="bg-red-50 text-red-600 border-red-100"
              actions={<>
                <ActionBtn icon={MessageSquare} label="Message" onClick={() => navigate(`/messages?clientId=${client.id}`)} />
                <ActionBtn icon={ClipboardList} label="Review" onClick={() => navigate(`/checkin-detail?id=${ci?.id}&clientId=${client.id}`)} primary />
              </>}
            />
          );
        })}
      </Section>

      {/* Missed Check-ins */}
      <Section
        icon={ClipboardList}
        title="Missed Check-ins"
        count={missedCheckIns.length}
        colorClass={SECTION_COLORS.checkin}
      >
        {missedCheckIns.map(client => {
          const clientCIs = checkIns.filter(c => c.client_id === client.id).sort((a,b) => new Date(b.date)-new Date(a.date));
          const lastCI = clientCIs[0];
          const daysAgo = lastCI ? differenceInDays(new Date(), parseISO(lastCI.date)) : null;
          return (
            <ClientRow
              key={client.id}
              name={client.name}
              subtitle={daysAgo !== null ? `Last check-in ${daysAgo}d ago` : 'No check-ins yet'}
              badge={daysAgo !== null ? `${daysAgo}d` : 'Never'}
              badgeColor={daysAgo > 21 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-amber-50 text-amber-600 border-amber-100'}
              actions={<>
                <ActionBtn icon={MessageSquare} label="Message" onClick={() => navigate(`/messages?clientId=${client.id}`)} />
                <ActionBtn icon={Sparkles} label="Nudge" onClick={() => navigate(`/messages?clientId=${client.id}&message=${encodeURIComponent("Hey! Just checking in — haven't heard from you in a while. How's everything going? 💪")}`)} primary />
              </>}
            />
          );
        })}
      </Section>

      {/* At Risk */}
      <Section
        icon={AlertTriangle}
        title="At Risk"
        count={atRisk.length}
        colorClass={SECTION_COLORS.risk}
      >
        {atRisk.map(({ client, flags, riskScore }) => {
          const topFlag = flags[0];
          return (
            <ClientRow
              key={client.id}
              name={client.name}
              subtitle={topFlag?.detail || topFlag?.label || 'Multiple risk factors'}
              badge={`${riskScore}%`}
              badgeColor={riskScore >= 60 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'}
              actions={<>
                <ActionBtn icon={MessageSquare} label="Message" onClick={() => navigate(`/messages?clientId=${client.id}`)} />
                <ActionBtn icon={Target} label="Adjust" onClick={() => navigate(`/client-profile?id=${client.id}`)} primary />
              </>}
            />
          );
        })}
      </Section>

      {/* Ready for Progression */}
      <Section
        icon={TrendingUp}
        title="Ready for Progression"
        count={readyForProgression.length}
        colorClass={SECTION_COLORS.prog}
        defaultOpen={false}
      >
        {readyForProgression.map(client => {
          const clientCIs = checkIns.filter(c => c.client_id === client.id).sort((a,b) => new Date(b.date)-new Date(a.date));
          const score = compositeAdherenceScore(clientCIs);
          return (
            <ClientRow
              key={client.id}
              name={client.name}
              subtitle={`${score}% adherence — consistent performance`}
              badge={`${score}%`}
              badgeColor="bg-emerald-50 text-emerald-700 border-emerald-100"
              actions={<>
                <ActionBtn icon={UserCheck} label="Assign" onClick={() => navigate(`/client-profile?id=${client.id}`)} primary />
                <ActionBtn icon={MessageSquare} label="Message" onClick={() => navigate(`/messages?clientId=${client.id}&message=${encodeURIComponent("Great work lately! I'd like to progress your program — check the updates when you get a chance 🚀")}`)} />
              </>}
            />
          );
        })}
      </Section>

      {/* Pending Check-in Reviews */}
      <Section
        icon={Sparkles}
        title="Pending Reviews"
        count={pendingCheckIns.length}
        colorClass={SECTION_COLORS.pending}
      >
        {pendingCheckIns.map(ci => {
          const daysAgo = differenceInDays(new Date(), parseISO(ci.date));
          return (
            <ClientRow
              key={ci.id}
              name={ci.client_name}
              subtitle={`Submitted ${format(parseISO(ci.date), 'MMM d')} · ${daysAgo}d ago${ci.weight ? ` · ${ci.weight} lbs` : ''}`}
              badge={daysAgo > 5 ? 'Overdue' : 'New'}
              badgeColor={daysAgo > 5 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-primary border-blue-100'}
              actions={<>
                <ActionBtn icon={Sparkles} label="AI Review" onClick={() => navigate(`/checkin-detail?id=${ci.id}&clientId=${ci.client_id}`)} primary />
                <ActionBtn icon={ArrowRight} label="Queue" onClick={() => navigate('/fast-review')} />
              </>}
            />
          );
        })}
      </Section>
    </div>
  );
}