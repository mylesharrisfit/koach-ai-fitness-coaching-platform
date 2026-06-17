import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { BADGE_CONFIG, TIER_STYLES } from '@/lib/badges';
import { cn } from '@/lib/utils';
import { Plus, Bell, Dumbbell, Salad } from 'lucide-react';
import MetricsCard from './MetricsCard';
import BodyWeightChart from './BodyWeightChart';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

// Ring — blue accent for active week, muted gray for others
function Ring({ pct = 0, label, sublabel, size = 72, active = false }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(pct / 100, 1)) * circ;
  const activeColor = '#2563EB';
  const inactiveColor = '#9CA3AF';

  return (
    <div className={cn('flex flex-col items-center gap-1.5', active && 'scale-105')}>
      <div className="relative rounded-full">
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E7EB" strokeWidth={active ? 7 : 5} />
          {/* Progress */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={pct > 0 ? (active ? activeColor : inactiveColor) : '#E5E7EB'}
            strokeWidth={active ? 7 : 5}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums leading-none', active ? 'text-sm' : 'text-xs')}
            style={{ color: active ? activeColor : '#6B7280' }}>
            {pct}%
          </span>
          {sublabel && (
            <span className="text-[8px] leading-none mt-0.5" style={{ color: '#9CA3AF' }}>{sublabel}</span>
          )}
        </div>
      </div>
      <div className="text-center">
        <p className="text-[10px] font-semibold leading-tight"
          style={{ color: active ? '#0E1525' : '#9CA3AF' }}>
          {label}
        </p>
      </div>
    </div>
  );
}

// Week compliance helpers
function weekCompliance(checkIns, weekStart, weekEnd) {
  const inRange = checkIns.filter(ci => {
    const d = new Date(ci.date);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return 0;
  return Math.round(inRange.reduce((s, ci) => s + (ci.compliance_training ?? 0), 0) / inRange.length);
}
function weekNutritionCompliance(checkIns, weekStart, weekEnd) {
  const inRange = checkIns.filter(ci => {
    const d = new Date(ci.date);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return 0;
  return Math.round(inRange.reduce((s, ci) => s + (ci.compliance_nutrition ?? 0), 0) / inRange.length);
}

// Smart tag colors: red = warning, yellow = caution, green = positive, blue = info
function generateSmartTags(client, checkIns, messages) {
  const tags = [];
  const now = Date.now();
  const recent = checkIns.slice(0, 4);
  const avgNutrition = recent.length ? recent.reduce((s, c) => s + (c.compliance_nutrition ?? 50), 0) / recent.length : null;
  const avgTraining = recent.length ? recent.reduce((s, c) => s + (c.compliance_training ?? 50), 0) / recent.length : null;

  if (avgNutrition !== null && avgNutrition < 60) tags.push({ label: 'Low nutrition', type: 'red' });
  if (avgTraining !== null && avgTraining < 60) tags.push({ label: 'Low workouts', type: 'orange' });

  const lastCoachMsg = messages.find(m => m.sender === 'coach');
  if (!lastCoachMsg || (now - new Date(lastCoachMsg.created_date)) > 7 * 86400000) {
    tags.push({ label: 'No recent message', type: 'yellow' });
  }
  if (checkIns.length >= 2) {
    const latest = checkIns[0];
    const prev = checkIns[1];
    if (latest.weight && prev.weight && latest.weight < prev.weight) {
      tags.push({ label: 'Weight trending ↓', type: 'green' });
    }
  }
  if (client.assigned_nutrition_id) tags.push({ label: 'On meal plan', type: 'blue' });
  if (!client.assigned_program_id) tags.push({ label: 'No program', type: 'gray' });
  return tags;
}

const TAG_STYLES = {
  red:    { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  orange: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  yellow: { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
  green:  { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  blue:   { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  gray:   { bg: '#f9fafb', text: '#6b7280', border: '#e5e7eb' },
};

// ─────────────────────────────────────────────────────────
export default function SummaryTab({ client, checkIns, messages, program, nutritionPlan, workoutSessions, earnedBadges = [], onAwardBadge, onClientUpdated }) {
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const score = compositeAdherenceScore(checkIns);
  const smartTags = generateSmartTags(client, checkIns, messages);
  const lastCheckIn = checkIns[0];
  const lastMsgFromCoach = messages.find(m => m.sender === 'coach');
  const lastMsgFromClient = messages.find(m => m.sender === 'client');

  const now = new Date();
  const weeks = [
    { label: '2 Wks Ago', start: startOfWeek(subWeeks(now, 2)), end: endOfWeek(subWeeks(now, 2)) },
    { label: '1 Wk Ago',  start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) },
    { label: 'This Week', start: startOfWeek(now), end: endOfWeek(now), active: true },
    { label: 'Next Week', start: startOfWeek(new Date(now.getTime() + 7 * 86400000)), end: endOfWeek(new Date(now.getTime() + 7 * 86400000)) },
  ];

  const saveTag = async () => {
    if (!newTag.trim()) return;
    const existing = client.tags || [];
    await base44.entities.Client.update(client.id, { tags: [...existing, newTag.trim()] });
    toast.success('Tag added');
    setNewTag('');
    setAddingTag(false);
  };

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f8f9fa' }}>
      <div className="grid h-full min-h-0" style={{ gridTemplateColumns: '260px 1fr 280px' }}>

        {/* ═══════════════ LEFT COLUMN ═══════════════ */}
        <div className="border-r border-gray-200 bg-white overflow-y-auto p-5 space-y-5">

          {/* Contact info */}
          <div className="space-y-1">
            <InfoRow label="Goal" value={goalLabels[client.goal] || 'General Fitness'} />
            {client.phone && <InfoRow label="Phone" value={client.phone} />}
            {client.start_date && <InfoRow label="Client since" value={format(new Date(client.start_date), 'MMM d, yyyy')} />}
            {client.monthly_rate && <InfoRow label="Rate" value={`$${client.monthly_rate}/mo`} />}
          </div>

          <MetricsCard client={client} onUpdated={onClientUpdated} />

          <Section title="Activity">
            <InfoRow label="Last check-in" value={lastCheckIn ? formatDistanceToNow(new Date(lastCheckIn.date), { addSuffix: true }) : 'Never'} />
            <InfoRow label="Msg sent" value={lastMsgFromCoach ? formatDistanceToNow(new Date(lastMsgFromCoach.created_date), { addSuffix: true }) : 'Never'} />
            <InfoRow label="Msg received" value={lastMsgFromClient ? formatDistanceToNow(new Date(lastMsgFromClient.created_date), { addSuffix: true }) : 'Never'} />
          </Section>

          <Section title="Totals">
            <InfoRow label="Workouts done" value={workoutSessions.length || 0} />
            <InfoRow label="Check-ins" value={checkIns.length} />
          </Section>

          <Section title="Achievements">
            {earnedBadges.length === 0 ? (
              <p className="text-xs text-gray-400">No achievements yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {[...earnedBadges].sort((a,b) => new Date(b.earned_date) - new Date(a.earned_date)).slice(0, 8).map(b => {
                  const cfg = BADGE_CONFIG[b.badge_key];
                  const tier = cfg ? TIER_STYLES[cfg.tier] : null;
                  if (!cfg || !tier) return null;
                  return (
                    <div key={b.id}
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${tier.accent}15`, color: tier.accent, border: `1px solid ${tier.accent}35` }}
                      title={`${cfg.desc} · ${b.earned_date}`}
                    >
                      <span>{cfg.emoji}</span> {cfg.label}
                    </div>
                  );
                })}
              </div>
            )}
            {onAwardBadge && (
              <button onClick={onAwardBadge}
                className="flex items-center gap-1 text-[10px] font-semibold mt-1.5 hover:opacity-70"
                style={{ color: '#2563EB' }}>
                <Plus className="w-3 h-3" /> Award Badge
              </button>
            )}
          </Section>

          <Section title="Smart Tags">
            <div className="flex flex-wrap gap-1.5">
              {smartTags.map((t, i) => {
                const s = TAG_STYLES[t.type] || TAG_STYLES.gray;
                return (
                  <span key={i} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}>
                    {t.label}
                  </span>
                );
              })}
              {(client.tags || []).map((t, i) => (
                <span key={`c-${i}`} className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: '#f5f3ff', color: '#7c3aed', border: '1px solid #ddd6fe' }}>
                  #{t}
                </span>
              ))}
            </div>
            {addingTag ? (
              <div className="flex gap-1 mt-2">
                <input
                  autoFocus
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveTag()}
                  placeholder="Tag name…"
                  className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button onClick={saveTag} className="text-xs text-blue-500 font-semibold px-2">Save</button>
                <button onClick={() => setAddingTag(false)} className="text-xs text-gray-400 px-1">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddingTag(true)} className="flex items-center gap-1 text-[10px] font-semibold mt-1.5 hover:opacity-70"
                style={{ color: '#2563EB' }}>
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            )}
          </Section>

          <Section title="Integrations">
            {[
              { name: 'Apple Watch', icon: '⌚' },
              { name: 'Fitbit', icon: '📊' },
              { name: 'MyFitnessPal', icon: '🥗' },
              { name: 'Withings', icon: '⚖️' },
            ].map(app => (
              <div key={app.name} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{app.icon}</span>
                  <span className="text-xs text-gray-600">{app.name}</span>
                </div>
                <button className="text-[10px] font-semibold hover:opacity-70" style={{ color: '#2563EB' }}>Connect</button>
              </div>
            ))}
          </Section>

          <Section title="Threshold Alerts">
            <button className="flex items-center gap-1.5 text-xs font-semibold hover:opacity-70" style={{ color: '#2563EB' }}>
              <Bell className="w-3.5 h-3.5" /> Set up alerts
            </button>
          </Section>
        </div>

        {/* ═══════════════ MIDDLE COLUMN ═══════════════ */}
        <div className="overflow-y-auto p-5 space-y-4">

          {/* Program card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: '#94A3B8' }}>Current Program</p>
                {program ? (
                  <>
                    <p className="font-bold text-gray-800">{program.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {program.duration_weeks ? `${program.duration_weeks} weeks` : ''}
                      {client.start_date && program.duration_weeks ? ` · ${format(new Date(client.start_date), 'MMM d')} – ${format(new Date(new Date(client.start_date).getTime() + program.duration_weeks * 7 * 86400000), 'MMM d')}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No program assigned</p>
                )}
              </div>
              <Dumbbell className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
            </div>
            {nutritionPlan && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <Salad className="w-4 h-4 flex-shrink-0" style={{ color: '#2563EB' }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>Meal Plan</p>
                  <p className="text-xs font-semibold cursor-pointer hover:opacity-70" style={{ color: '#2563EB' }}>{nutritionPlan.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* Exercise compliance */}
          <ComplianceSection
            title="Exercise Compliance"
            weeks={weeks}
            checkIns={checkIns}
            type="training"
            planLabel={program ? `${program.days_per_week || '?'} days/wk` : null}
          />

          {/* Nutrition compliance */}
          <ComplianceSection
            title="Nutrition Compliance"
            weeks={weeks}
            checkIns={checkIns}
            type="nutrition"
            planLabel={nutritionPlan?.calories ? `${nutritionPlan.calories} kcal` : null}
          />

          {/* Body weight chart */}
          <BodyWeightChart client={client} onCurrentWeightUpdated={onClientUpdated} />
        </div>

        {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
        <div className="border-l border-gray-200 bg-white overflow-hidden flex flex-col">
          <NotesColumn client={client} />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──

function Section({ title, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-0.5 h-3 rounded-full" style={{ background: '#2563EB' }} />
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>{title}</p>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-xs text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-gray-700 text-right truncate">{value ?? '—'}</span>
    </div>
  );
}

function AchievementBadge({ emoji, label }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
      <span>{emoji}</span> {label}
    </div>
  );
}

function ComplianceSection({ title, weeks, checkIns, type, planLabel }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94A3B8' }}>
          {title}
        </p>
        {planLabel && <span className="text-[10px] text-gray-400 font-medium">{planLabel}</span>}
      </div>
      <div className="flex items-end justify-around gap-2">
        {weeks.map((w, i) => {
          const pct = type === 'training'
            ? weekCompliance(checkIns, w.start, w.end)
            : weekNutritionCompliance(checkIns, w.start, w.end);
          return (
            <Ring
              key={i}
              pct={pct}
              label={w.label}
              active={!!w.active}
              size={w.active ? 82 : 68}
            />
          );
        })}
      </div>
    </div>
  );
}

function NotesColumn({ client }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: notes = [], refetch } = useQuery({
    queryKey: ['notes-col', client?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => d.filter(ci => ci.coach_notes).sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  const save = async () => {
    if (!newNote.trim()) return;
    setSaving(true);
    await base44.entities.CheckIn.create({
      client_id: client.id,
      client_name: client.name,
      date: new Date().toISOString().split('T')[0],
      coach_notes: newNote.trim(),
      review_status: 'reviewed',
    });
    setNewNote('');
    refetch();
    setSaving(false);
    toast.success('Note saved');
  };

  return (
    <>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3.5 rounded-full" style={{ background: '#2563EB' }} />
          <p className="text-sm font-bold" style={{ color: '#0E1525' }}>Trainer Notes</p>
          {notes.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(37,99,235,0.1)', color: '#2563EB' }}>
              {notes.length}
            </span>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0" style={{ background: '#fafbff' }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Add a note</p>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Write a note about this client…"
            rows={3}
            className="w-full text-xs p-2.5 resize-none outline-none bg-transparent"
          />
        </div>
        <button
          onClick={save}
          disabled={saving || !newNote.trim()}
          className="mt-2 w-full text-white text-xs font-semibold py-2 rounded-lg transition-all disabled:opacity-40"
          style={{ background: '#2563EB' }}
        >
          {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-xs text-gray-400 text-center pt-4">No notes yet</p>
        ) : notes.map(ci => (
          <div key={ci.id} className="rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
            <p className="text-[10px] font-bold mb-1" style={{ color: '#2563EB' }}>
              {format(new Date(ci.date), 'MMM d, yyyy')}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{ci.coach_notes}</p>
          </div>
        ))}
      </div>
    </>
  );
}