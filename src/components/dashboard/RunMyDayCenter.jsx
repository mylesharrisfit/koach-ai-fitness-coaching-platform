import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { differenceInDays, parseISO, format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import {
  MessageSquare, Dumbbell, ClipboardList, TrendingUp, CheckCircle2, Zap, ChevronDown, ChevronUp,
  Send, UserCheck, Eye, ArrowUpRight,
} from 'lucide-react';
import { compositeAdherenceScore } from '@/lib/adherence';

// ── Priority group configs ──────────────────────────────────────────────────
const GROUP_CONFIG = {
  critical: {
    label: 'Critical',
    border: 'rgb(var(--destructive))',
    badgeBg: 'rgb(var(--destructive))',
    badgeText: 'rgb(var(--destructive))',
    badgeBorder: 'rgb(var(--destructive))',
    headerBg: '#fff5f5',
    dot: 'rgb(var(--destructive))',
  },
  high: {
    label: 'High Priority',
    border: 'rgb(var(--warning))',
    badgeBg: 'rgb(var(--warning))',
    badgeText: 'rgb(var(--warning))',
    badgeBorder: 'rgb(var(--warning))',
    headerBg: '#fffdf0',
    dot: 'rgb(var(--warning))',
  },
  informational: {
    label: 'Informational',
    border: 'rgb(var(--primary))',
    badgeBg: 'rgb(var(--accent))',
    badgeText: 'rgb(var(--primary))',
    badgeBorder: 'rgb(var(--accent))',
    headerBg: 'rgb(var(--accent))',
    dot: 'rgb(var(--primary))',
  },
};

// ── Avatar helpers ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['rgb(var(--primary))', 'rgb(var(--accent))'], ['rgb(var(--ai))', 'rgb(var(--ai))'], ['rgb(var(--success))', 'rgb(var(--success))'],
  ['rgb(var(--warning))', 'rgb(var(--warning))'], ['rgb(var(--destructive))', 'rgb(var(--destructive))'],
];
function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Pill action button ──────────────────────────────────────────────────────
function Pill({ icon: Icon, label, onClick, variant = 'ghost' }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all shrink-0"
      style={variant === 'primary'
        ? { background: 'rgb(var(--primary))', color: 'rgb(var(--card))' }
        : { background: 'rgb(var(--muted))', color: 'rgb(var(--foreground))', border: '1px solid rgb(var(--border))' }
      }
    >
      <Icon className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </button>
  );
}

// ── Individual action card ──────────────────────────────────────────────────
function ActionCard({ id, name, subtitle, flaggedDaysAgo, badge, priority, actions, onResolve }) {
  const cfg = GROUP_CONFIG[priority] || GROUP_CONFIG.high;
  const [ringColor, avatarBg] = getAvatarColor(name);
  const initials = (name || '?').split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, x: 40, height: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-b-0 hover:bg-muted/60 transition-colors group"
      style={{ borderLeft: `3px solid ${cfg.border}` }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold mt-0.5"
        style={{ background: avatarBg, color: ringColor }}
      >
        {initials}
        {priority === 'critical' && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full border border-white animate-pulse" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground truncate max-w-[140px]">{name}</span>
          {badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
              style={{ background: cfg.badgeBg, color: cfg.badgeText, borderColor: cfg.badgeBorder }}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>
        {flaggedDaysAgo != null && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {flaggedDaysAgo === 0 ? 'Flagged today' : `Flagged ${flaggedDaysAgo}d ago`}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {actions}
          <button
            onClick={e => { e.stopPropagation(); onResolve(id); }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-all ml-auto shrink-0 opacity-0 group-hover:opacity-100"
            style={{ background: 'rgb(var(--success))', color: 'rgb(var(--success))', border: '1px solid rgb(var(--success))' }}
          >
            <CheckCircle2 className="w-2.5 h-2.5" /> Resolve
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Priority group collapsible section ─────────────────────────────────────
function PriorityGroup({ priority, items, onResolve }) {
  const [open, setOpen] = useState(true);
  const cfg = GROUP_CONFIG[priority];
  if (!items.length) return null;

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${cfg.badgeBorder}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors"
        style={{
          background: cfg.headerBg,
          borderBottom: open ? `1px solid ${cfg.badgeBorder}` : 'none',
        }}
      >
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
        <span className="text-sm font-bold text-foreground flex-1 text-left">{cfg.label}</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0"
          style={{ background: cfg.badgeBg, color: cfg.badgeText, borderColor: cfg.badgeBorder }}>
          {items.length}
        </span>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-card overflow-hidden"
          >
            <AnimatePresence>
              {items.map(item => (
                <ActionCard key={item.id} {...item} priority={priority} onResolve={onResolve} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function RunMyDayCenter({ clients, checkIns, messages, payments = [], refreshKey: externalRefreshKey = 0 }) {
  const navigate = useNavigate();
  const [resolvedIds, setResolvedIds] = useState(new Set());
  const [resolvedToday, setResolvedToday] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const go = (path) => navigate(path);
  const msgClient = (id, msg) =>
    navigate(`/messages?clientId=${id}${msg ? `&message=${encodeURIComponent(msg)}` : ''}`);

  const handleResolve = useCallback((id) => {
    setResolvedIds(prev => { const next = new Set(prev); next.add(id); return next; });
    setResolvedToday(n => n + 1);
  }, []);

  const handleRefresh = () => setRefreshKey(k => k + 1);

  // ── Build action items ──────────────────────────────────────────────────
  const items = useMemo(() => {
    const result = [];

    // Missed check-ins
    const active = clients.filter(c => c.status === 'active' || c.lifecycle_status === 'active');
    active.forEach(client => {
      const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = cis[0];
      const daysAgo = latest ? differenceInDays(new Date(), parseISO(latest.date)) : 999;
      if (daysAgo < 10) return;
      const priority = daysAgo >= 21 ? 'critical' : 'high';
      result.push({
        id: `checkin-${client.id}`,
        name: client.name,
        subtitle: daysAgo === 999 ? 'No check-in on record' : `No check-in in ${daysAgo} days`,
        badge: daysAgo === 999 ? 'Never' : `${daysAgo}d`,
        flaggedDaysAgo: Math.max(0, daysAgo - 10),
        priority,
        actions: (
          <>
            <Pill icon={Send} label="Send Nudge" variant="primary"
              onClick={() => msgClient(client.id, "Hey! Just checking in — haven't heard from you in a while. How's everything going? 💪")} />
            <Pill icon={ClipboardList} label="Log Check-in" onClick={() => go(`/checkin-detail?clientId=${client.id}`)} />
            <Pill icon={Eye} label="View Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
          </>
        ),
      });
    });

    // No program assigned
    clients.forEach(client => {
      if (client.assigned_program_id) return;
      if ((client.lifecycle_status || client.status) === 'lead') return;
      result.push({
        id: `noprog-${client.id}`,
        name: client.name,
        subtitle: 'No workout program assigned',
        badge: 'No Program',
        flaggedDaysAgo: differenceInDays(new Date(), parseISO(client.created_date || new Date().toISOString())),
        priority: 'critical',
        actions: (
          <>
            <Pill icon={Dumbbell} label="Assign Program" variant="primary"
              onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)} />
            <Pill icon={Eye} label="View Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
          </>
        ),
      });
    });

    // Payment overdue
    payments.filter(p => p.status === 'failed' || p.status === 'pending').forEach(p => {
      const client = clients.find(c => c.id === p.client_id);
      if (!client) return;
      result.push({
        id: `pay-${p.id}`,
        name: client.name,
        subtitle: `$${p.amount} · ${p.status === 'failed' ? 'Payment failed' : 'Payment overdue'}${p.due_date ? ` · Due ${format(parseISO(p.due_date), 'MMM d')}` : ''}`,
        badge: p.status === 'failed' ? 'Failed' : 'Overdue',
        flaggedDaysAgo: p.due_date ? Math.max(0, differenceInDays(new Date(), parseISO(p.due_date))) : 0,
        priority: 'critical',
        actions: (
          <>
            <Pill icon={MessageSquare} label="Send Invoice" variant="primary"
              onClick={() => msgClient(client.id, "Hi! Just a quick note about your upcoming payment — let me know if you have any questions 🙏")} />
            <Pill icon={Eye} label="View Profile" onClick={() => go('/revenue')} />
          </>
        ),
      });
    });

    // Inactive 7+ days (high)
    active.forEach(client => {
      const alreadyFlagged = result.some(r => r.id === `checkin-${client.id}`);
      if (alreadyFlagged) return;
      const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      const latest = cis[0];
      if (!latest) return;
      const daysAgo = differenceInDays(new Date(), parseISO(latest.date));
      if (daysAgo < 7 || daysAgo >= 10) return;
      result.push({
        id: `inactive-${client.id}`,
        name: client.name,
        subtitle: `No activity in ${daysAgo} days`,
        badge: `${daysAgo}d`,
        flaggedDaysAgo: 0,
        priority: 'high',
        actions: (
          <>
            <Pill icon={MessageSquare} label="Message" variant="primary" onClick={() => msgClient(client.id)} />
            <Pill icon={Eye} label="View Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
          </>
        ),
      });
    });

    // Low adherence (high)
    clients.forEach(client => {
      const alreadyFlagged = result.some(r => r.id.startsWith(`checkin-${client.id}`) || r.id.startsWith(`inactive-${client.id}`));
      if (alreadyFlagged) return;
      const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (cis.length < 2) return;
      const score = compositeAdherenceScore(cis);
      if (score === null || score >= 65) return;
      result.push({
        id: `adh-${client.id}`,
        name: client.name,
        subtitle: `${score}% composite adherence — below target`,
        badge: `${score}%`,
        flaggedDaysAgo: 0,
        priority: score < 40 ? 'critical' : 'high',
        actions: (
          <>
            <Pill icon={MessageSquare} label="Message" variant="primary"
              onClick={() => msgClient(client.id, "Hey, I want to make sure your plan is working for you — let's chat about any adjustments 🙌")} />
            <Pill icon={TrendingUp} label="View Progress" onClick={() => go(`/client-profile?id=${client.id}&tab=progress`)} />
            <Pill icon={Eye} label="View Profile" onClick={() => go(`/client-profile?id=${client.id}`)} />
          </>
        ),
      });
    });

    // Unread messages 3+ days (high)
    if (messages) {
      const unreadByClient = {};
      messages.filter(m => m.sender === 'client' && !m.is_read).forEach(m => {
        if (!unreadByClient[m.client_id]) unreadByClient[m.client_id] = [];
        unreadByClient[m.client_id].push(m);
      });
      Object.entries(unreadByClient).forEach(([clientId, msgs]) => {
        const oldest = msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date))[0];
        const daysOld = differenceInDays(new Date(), parseISO(oldest.created_date));
        if (daysOld < 3) return;
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        result.push({
          id: `msg-${clientId}`,
          name: client.name,
          subtitle: `${msgs.length} unread message${msgs.length > 1 ? 's' : ''} · oldest ${daysOld}d ago`,
          badge: `${msgs.length} unread`,
          flaggedDaysAgo: daysOld - 3,
          priority: 'high',
          actions: (
            <>
              <Pill icon={MessageSquare} label="Reply" variant="primary" onClick={() => go(`/messages?clientId=${clientId}`)} />
              <Pill icon={Eye} label="View Profile" onClick={() => go(`/client-profile?id=${clientId}`)} />
            </>
          ),
        });
      });
    }

    // Pending check-in reviews (informational)
    checkIns
      .filter(ci => !ci.coach_responded && !ci.coach_notes)
      .filter(ci => differenceInDays(new Date(), parseISO(ci.date)) <= 14)
      .slice(0, 8)
      .forEach(ci => {
        const daysAgo = differenceInDays(new Date(), parseISO(ci.date));
        result.push({
          id: `review-${ci.id}`,
          name: ci.client_name,
          subtitle: `Check-in submitted ${format(parseISO(ci.date), 'MMM d')} · ${daysAgo}d ago`,
          badge: daysAgo > 5 ? 'Overdue' : 'New',
          flaggedDaysAgo: daysAgo,
          priority: 'informational',
          actions: (
            <>
              <Pill icon={Zap} label="AI Review" variant="primary"
                onClick={() => go(`/checkin-detail?id=${ci.id}&clientId=${ci.client_id}`)} />
              <Pill icon={ArrowUpRight} label="Fast Review" onClick={() => go('/fast-review')} />
            </>
          ),
        });
      });

    // Ready for progression (informational)
    clients.forEach(client => {
      const cis = checkIns.filter(ci => ci.client_id === client.id).sort((a, b) => new Date(b.date) - new Date(a.date));
      if (cis.length < 3) return;
      const score = compositeAdherenceScore(cis);
      if (score === null || score < 80) return;
      result.push({
        id: `prog-${client.id}`,
        name: client.name,
        subtitle: `${score}% adherence — consistently crushing it`,
        badge: `${score}%`,
        flaggedDaysAgo: null,
        priority: 'informational',
        actions: (
          <>
            <Pill icon={Dumbbell} label="Assign Workout" variant="primary"
              onClick={() => go(`/client-profile?id=${client.id}&tab=programs`)} />
            <Pill icon={UserCheck} label="View Progress" onClick={() => go(`/client-profile?id=${client.id}`)} />
            <Pill icon={MessageSquare} label="Celebrate"
              onClick={() => msgClient(client.id, "Great work lately! You're crushing it — bumping up your program 🚀")} />
          </>
        ),
      });
    });

    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, checkIns, messages, payments, refreshKey, externalRefreshKey]);

  const visibleItems = useMemo(() => items.filter(i => !resolvedIds.has(i.id)), [items, resolvedIds]);

  const byPriority = useMemo(() => ({
    critical: visibleItems.filter(i => i.priority === 'critical'),
    high: visibleItems.filter(i => i.priority === 'high'),
    informational: visibleItems.filter(i => i.priority === 'informational'),
  }), [visibleItems]);

  const totalUnresolved = visibleItems.length;

  return (
    <div className="space-y-2.5">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {resolvedToday > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: 'rgb(var(--success))', color: 'rgb(var(--success))', border: '1px solid rgb(var(--success))' }}>
              ✓ {resolvedToday} resolved today
            </span>
          )}
        </div>
        {/* refresh handled by parent */}
      </div>

      {/* All clear */}
      {totalUnresolved === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl bg-card text-center"
          style={{ border: '1px solid rgb(var(--success))', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: 'rgb(var(--success))', border: '2px solid rgb(var(--success))' }}>
            <CheckCircle2 className="w-7 h-7 text-success" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">All clients are on track</p>
            <p className="text-sm text-muted-foreground mt-0.5">Great work, Coach! 🎉</p>
          </div>
        </motion.div>
      ) : (
        <>
          <PriorityGroup priority="critical" items={byPriority.critical} onResolve={handleResolve} />
          <PriorityGroup priority="high" items={byPriority.high} onResolve={handleResolve} />
          <PriorityGroup priority="informational" items={byPriority.informational} onResolve={handleResolve} />
        </>
      )}
    </div>
  );
}