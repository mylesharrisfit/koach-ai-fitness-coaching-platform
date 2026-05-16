import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, formatDistanceToNow, differenceInDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { compositeAdherenceScore } from '@/lib/adherence';
import { cn } from '@/lib/utils';
import { Plus, Link as LinkIcon, Bell, Trophy, Watch, Dumbbell, Salad } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness'
};

// ── Circular progress ring ──
function Ring({ pct = 0, label, sublabel, size = 72, active = false }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className={cn('flex flex-col items-center gap-1.5', active && 'scale-105')}>
      <div className={cn('relative rounded-full', active && 'shadow-lg shadow-blue-100')}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={active ? '#DBEAFE' : '#F0F2F8'} strokeWidth={6} />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none"
            stroke={active ? '#3b82f6' : pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'}
            strokeWidth={6}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('font-bold tabular-nums', active ? 'text-sm text-blue-600' : 'text-xs text-[#374151]')}>{pct}%</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn('text-[10px] font-semibold leading-tight', active ? 'text-blue-600' : 'text-[#6B7280]')}>{label}</p>
        {sublabel && <p className="text-[9px] text-[#9CA3AF] leading-tight">{sublabel}</p>}
      </div>
    </div>
  );
}

// ── Compute week compliance from check-ins ──
function weekCompliance(checkIns, weekStart, weekEnd) {
  const inRange = checkIns.filter(ci => {
    const d = new Date(ci.date);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return 0;
  const avg = inRange.reduce((s, ci) => s + (ci.compliance_training ?? 0), 0) / inRange.length;
  return Math.round(avg);
}
function weekNutritionCompliance(checkIns, weekStart, weekEnd) {
  const inRange = checkIns.filter(ci => {
    const d = new Date(ci.date);
    return d >= weekStart && d <= weekEnd;
  });
  if (!inRange.length) return 0;
  const avg = inRange.reduce((s, ci) => s + (ci.compliance_nutrition ?? 0), 0) / inRange.length;
  return Math.round(avg);
}

// ── Smart tag generation ──
function generateSmartTags(client, checkIns, messages) {
  const tags = [];
  const now = Date.now();
  const recent = checkIns.slice(0, 4);

  const avgNutrition = recent.length ? recent.reduce((s, c) => s + (c.compliance_nutrition ?? 50), 0) / recent.length : null;
  const avgTraining = recent.length ? recent.reduce((s, c) => s + (c.compliance_training ?? 50), 0) / recent.length : null;

  if (avgNutrition !== null && avgNutrition < 60) tags.push({ label: 'Low nutrition compliance', color: 'bg-red-50 text-red-600 border-red-100' });
  if (avgTraining !== null && avgTraining < 60) tags.push({ label: 'Low workout compliance', color: 'bg-orange-50 text-orange-600 border-orange-100' });

  const lastCoachMsg = messages.find(m => m.sender === 'coach');
  if (!lastCoachMsg || (now - new Date(lastCoachMsg.created_date)) > 7 * 86400000) {
    tags.push({ label: 'Not messaged lately', color: 'bg-amber-50 text-amber-600 border-amber-100' });
  }

  // Personal best: weight improvement last week
  if (checkIns.length >= 2) {
    const latest = checkIns[0];
    const prev = checkIns[1];
    if (latest.weight && prev.weight && latest.weight < prev.weight) {
      tags.push({ label: 'Weight trending down ↓', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' });
    }
  }

  if (client.assigned_nutrition_id) tags.push({ label: 'On nutrition plan', color: 'bg-blue-50 text-blue-600 border-blue-100' });
  if (!client.assigned_program_id) tags.push({ label: 'No program assigned', color: 'bg-gray-50 text-gray-500 border-gray-100' });

  return tags;
}

// ─────────────────────────────────────────────────────────
export default function SummaryTab({ client, checkIns, messages, program, nutritionPlan, workoutSessions }) {
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const score = compositeAdherenceScore(checkIns);
  const smartTags = generateSmartTags(client, checkIns, messages);
  const lastCheckIn = checkIns[0];
  const lastMsgFromCoach = messages.find(m => m.sender === 'coach');
  const lastMsgFromClient = messages.find(m => m.sender === 'client');

  // Weekly compliance rings
  const now = new Date();
  const weeks = [
    { label: '2 Wks Ago', start: startOfWeek(subWeeks(now, 2)), end: endOfWeek(subWeeks(now, 2)) },
    { label: '1 Wk Ago', start: startOfWeek(subWeeks(now, 1)), end: endOfWeek(subWeeks(now, 1)) },
    { label: 'This Week', start: startOfWeek(now), end: endOfWeek(now), active: true },
    { label: 'Next Week', start: startOfWeek(new Date(now.getTime() + 7 * 86400000)), end: endOfWeek(new Date(now.getTime() + 7 * 86400000)) },
  ];

  // Weight chart
  const weightData = [...checkIns]
    .filter(ci => ci.weight)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-16)
    .map(ci => ({ date: format(new Date(ci.date), 'MMM d'), weight: ci.weight }));

  const currentWeight = client.current_weight || checkIns.find(ci => ci.weight)?.weight;

  // Add custom tag
  const saveTag = async () => {
    if (!newTag.trim()) return;
    const existing = client.tags || [];
    await base44.entities.Client.update(client.id, { tags: [...existing, newTag.trim()] });
    toast.success('Tag added');
    setNewTag('');
    setAddingTag(false);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="grid grid-cols-3 gap-0 h-full min-h-0" style={{ gridTemplateColumns: '260px 1fr 280px' }}>

        {/* ═══════════════ LEFT COLUMN ═══════════════ */}
        <div className="border-r border-[#E5E7EB] bg-white overflow-y-auto p-5 space-y-5">

          {/* Contact info */}
          <div className="space-y-1">
            <InfoRow label="Goal" value={goalLabels[client.goal] || 'General Fitness'} />
            {client.phone && <InfoRow label="Phone" value={client.phone} />}
            {client.start_date && <InfoRow label="Client since" value={format(new Date(client.start_date), 'MMM d, yyyy')} />}
            {client.monthly_rate && <InfoRow label="Monthly rate" value={`$${client.monthly_rate}`} />}
          </div>

          {/* Timestamps */}
          <Section title="Activity">
            <InfoRow label="Last check-in" value={lastCheckIn ? formatDistanceToNow(new Date(lastCheckIn.date), { addSuffix: true }) : 'Never'} />
            <InfoRow label="Msg sent" value={lastMsgFromCoach ? formatDistanceToNow(new Date(lastMsgFromCoach.created_date), { addSuffix: true }) : 'Never'} />
            <InfoRow label="Msg received" value={lastMsgFromClient ? formatDistanceToNow(new Date(lastMsgFromClient.created_date), { addSuffix: true }) : 'Never'} />
          </Section>

          {/* Totals */}
          <Section title="Totals">
            <InfoRow label="Workouts done" value={workoutSessions.length || 0} />
            <InfoRow label="Check-ins" value={checkIns.length} />
          </Section>

          {/* Badges */}
          <Section title="Achievements">
            {checkIns.length === 0 ? (
              <p className="text-xs text-[#9CA3AF]">No achievements yet</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {checkIns.length >= 1 && <Badge emoji="🏅" label="First Check-in" />}
                {checkIns.length >= 4 && <Badge emoji="🔥" label="4-Week Streak" />}
                {score !== null && score >= 80 && <Badge emoji="⭐" label="High Adherence" />}
              </div>
            )}
          </Section>

          {/* Smart tags */}
          <Section title="Smart Tags">
            <div className="flex flex-wrap gap-1.5">
              {smartTags.map((t, i) => (
                <span key={i} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border', t.color)}>{t.label}</span>
              ))}
              {(client.tags || []).map((t, i) => (
                <span key={`custom-${i}`} className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-600 border-purple-100">#{t}</span>
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
                  className="flex-1 text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={saveTag} className="text-xs text-primary font-semibold px-2">Save</button>
                <button onClick={() => setAddingTag(false)} className="text-xs text-[#9CA3AF] px-1">✕</button>
              </div>
            ) : (
              <button onClick={() => setAddingTag(true)} className="flex items-center gap-1 text-[10px] text-primary font-semibold mt-1.5 hover:opacity-70">
                <Plus className="w-3 h-3" /> Add Tag
              </button>
            )}
          </Section>

          {/* Integrations */}
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
                  <span className="text-xs text-[#374151]">{app.name}</span>
                </div>
                <button className="text-[10px] text-primary font-semibold hover:opacity-70">Ask to Connect</button>
              </div>
            ))}
          </Section>

          {/* Threshold Alerts */}
          <Section title="Threshold Alerts">
            <button className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:opacity-70">
              <Bell className="w-3.5 h-3.5" /> Set up alerts
            </button>
          </Section>
        </div>

        {/* ═══════════════ MIDDLE COLUMN ═══════════════ */}
        <div className="overflow-y-auto p-5 space-y-6">

          {/* Program info */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1">Current Program</p>
                {program ? (
                  <>
                    <p className="font-bold text-[#1F2A44]">{program.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      {program.duration_weeks ? `${program.duration_weeks} weeks` : ''}
                      {client.start_date && program.duration_weeks ? ` · ${format(new Date(client.start_date), 'MMM d')} – ${format(new Date(new Date(client.start_date).getTime() + program.duration_weeks * 7 * 86400000), 'MMM d')}` : ''}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No program assigned</p>
                )}
              </div>
              <Dumbbell className="w-5 h-5 text-[#9CA3AF] flex-shrink-0 mt-0.5" />
            </div>
            {nutritionPlan && (
              <div className="mt-3 pt-3 border-t border-[#F0F2F8] flex items-center gap-2">
                <Salad className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide">Meal Plan</p>
                  <p className="text-xs font-semibold text-primary underline underline-offset-2 cursor-pointer hover:opacity-70">{nutritionPlan.title}</p>
                </div>
              </div>
            )}
          </div>

          {/* Exercise compliance rings */}
          <ComplianceSection
            title="Exercise Compliance"
            weeks={weeks}
            checkIns={checkIns}
            type="training"
            plan={program}
            planLabel={program ? `${program.days_per_week || '?'} days/wk plan` : null}
          />

          {/* Nutrition compliance rings */}
          <ComplianceSection
            title="Nutrition Compliance"
            weeks={weeks}
            checkIns={checkIns}
            type="nutrition"
            plan={nutritionPlan}
            planLabel={nutritionPlan?.calories ? `${nutritionPlan.calories} kcal · ${nutritionPlan.protein_g || '?'}g protein` : null}
          />

          {/* Body weight chart */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">Body Weight</p>
              {currentWeight && <span className="text-sm font-bold text-[#1F2A44]">{currentWeight} lbs</span>}
            </div>
            {weightData.length >= 2 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={weightData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F2F8" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E5E7EB', padding: '4px 8px' }} />
                  <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2.5, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-28 flex items-center justify-center text-xs text-[#9CA3AF]">
                Not enough weight data yet
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════ RIGHT COLUMN ═══════════════ */}
        <div className="border-l border-[#E5E7EB] bg-white overflow-hidden flex flex-col">
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
      <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5">
      <span className="text-xs text-[#9CA3AF] flex-shrink-0">{label}</span>
      <span className="text-xs font-semibold text-[#374151] text-right truncate">{value ?? '—'}</span>
    </div>
  );
}

function Badge({ emoji, label }) {
  return (
    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-semibold px-2 py-0.5 rounded-full">
      <span>{emoji}</span> {label}
    </div>
  );
}

function ComplianceSection({ title, weeks, checkIns, type, plan, planLabel }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wide">{title}</p>
        {planLabel && <span className="text-[10px] text-[#6B7280] font-medium">{planLabel}</span>}
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
              size={w.active ? 80 : 68}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Inline notes column ──
function NotesColumn({ client }) {
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: checkIns = [], refetch } = useQuery({
    queryKey: ['notes-col', client?.id],
    queryFn: () => base44.entities.CheckIn.filter({ client_id: client.id }),
    enabled: !!client?.id,
    select: d => d.filter(ci => ci.coach_notes).sort((a, b) => new Date(b.date) - new Date(a.date)),
  });

  // We store notes as coach_notes on a special "note" check-in or use a separate field
  // For simplicity: create a CheckIn record with just coach_notes & today's date
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
      <div className="px-4 py-3 border-b border-[#F0F2F8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-[#1F2A44]">Trainer Notes</p>
          {checkIns.length > 0 && (
            <span className="text-[10px] bg-[#EEF4FF] text-primary font-bold px-1.5 py-0.5 rounded-full">{checkIns.length}</span>
          )}
        </div>
      </div>

      {/* Add note */}
      <div className="px-4 py-3 border-b border-[#F0F2F8] flex-shrink-0 bg-[#FAFBFD]">
        <p className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wide mb-1.5">Add today's note</p>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Write a note about this client…"
          rows={3}
          className="w-full text-xs border border-[#E5E7EB] rounded-lg p-2.5 resize-none outline-none focus:ring-1 focus:ring-primary bg-white"
        />
        <button
          onClick={save}
          disabled={saving || !newNote.trim()}
          className="mt-2 w-full bg-[#1F2A44] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-[#2d3a55] transition-colors disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Note'}
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {checkIns.length === 0 ? (
          <p className="text-xs text-[#9CA3AF] text-center pt-4">No notes yet</p>
        ) : checkIns.map(ci => (
          <div key={ci.id} className="border border-[#F0F2F8] rounded-xl p-3 bg-white">
            <p className="text-[10px] font-bold text-[#9CA3AF] mb-1">{format(new Date(ci.date), 'MMM d, yyyy')}</p>
            <p className="text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">{ci.coach_notes}</p>
          </div>
        ))}
      </div>
    </>
  );
}