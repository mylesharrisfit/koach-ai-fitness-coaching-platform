import React from 'react';
import {
  Mail, Phone, Target, Calendar, DollarSign,
  Scale, TrendingUp, TrendingDown, Minus,
  AlertTriangle, Activity,
  Moon, Zap, ClipboardCheck, Tag
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

const goalLabels = {
  weight_loss: 'Weight Loss', muscle_gain: 'Muscle Gain', strength: 'Strength',
  endurance: 'Endurance', flexibility: 'Flexibility', general_fitness: 'General Fitness',
};

function SectionCard({ title, icon: Icon, iconClass, children, className }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden', className)}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F6F7FB]">
        {Icon && (
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', iconClass || 'bg-[#F6F7FB]')}>
            <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
          </div>
        )}
        <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function MetricRow({ label, value, sub, bar, barColor, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-[#F6F7FB] last:border-0">
      {Icon && <Icon className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />}
      <span className="text-xs text-[#9CA3AF] w-28 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">
        {bar !== undefined ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#F0F2F8] rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full', barColor || 'bg-primary')} style={{ width: `${bar}%` }} />
            </div>
            <span className="text-xs font-bold text-[#1F2A44] w-8 text-right tabular-nums">{bar}%</span>
          </div>
        ) : (
          <span className="text-sm font-semibold text-[#1F2A44]">{value}</span>
        )}
        {sub && <p className="text-[10px] text-[#9CA3AF] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function ProfileOverviewTab({ client, checkIns, score }) {
  const lastCI = checkIns[0];
  const daysSinceCI = lastCI ? differenceInDays(new Date(), new Date(lastCI.date)) : null;

  // Weight change
  const sorted = [...checkIns].filter(ci => ci.weight).sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstWeight = sorted[0]?.weight;
  const latestWeight = sorted[sorted.length - 1]?.weight;
  const weightDelta = firstWeight && latestWeight ? +(latestWeight - firstWeight).toFixed(1) : null;

  // Alerts
  const alerts = [];
  if (daysSinceCI !== null && daysSinceCI > 7) {
    alerts.push({ type: 'warning', text: `No check-in for ${daysSinceCI} days` });
  }
  if (lastCI) {
    if (lastCI.compliance_training != null && lastCI.compliance_training < 60) {
      alerts.push({ type: 'warning', text: `Training compliance low: ${lastCI.compliance_training}%` });
    }
    if (lastCI.compliance_nutrition != null && lastCI.compliance_nutrition < 60) {
      alerts.push({ type: 'warning', text: `Nutrition compliance low: ${lastCI.compliance_nutrition}%` });
    }
    if (lastCI.sleep_hours != null && lastCI.sleep_hours < 6) {
      alerts.push({ type: 'info', text: `Sleep under 6 hrs last check-in` });
    }
  }
  const pendingCount = checkIns.filter(ci => !ci.review_status || ci.review_status === 'pending').length;

  const scoreColor = score === null ? 'text-[#9CA3AF]' : score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-4">

      {/* ── Alerts / needs attention ── */}
      {(alerts.length > 0 || pendingCount > 0) && (
        <div className="bg-white rounded-2xl border border-[#E7EAF3] overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#F6F7FB]">
            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <h3 className="text-xs font-bold text-[#374151] uppercase tracking-wider">Needs Attention</h3>
          </div>
          <div className="p-4 space-y-2">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="text-xs font-medium text-[#1F2A44] flex-1">{pendingCount} check-in{pendingCount > 1 ? 's' : ''} awaiting review</span>
              </div>
            )}
            {alerts.map((a, i) => (
              <div key={i} className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 border text-xs font-medium',
                a.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-blue-50 border-blue-100 text-blue-700'
              )}>
                <AlertTriangle className={cn('w-3.5 h-3.5 flex-shrink-0', a.type === 'warning' ? 'text-amber-500' : 'text-blue-500')} />
                {a.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick snapshot ── */}
      <SectionCard title="Snapshot" icon={Activity} iconClass="bg-blue-50">
        <div className="grid grid-cols-2 gap-3 mb-1">
          {/* Adherence big */}
          <div className="bg-[#F6F7FB] rounded-xl p-4 text-center col-span-1">
            <Activity className="w-4 h-4 mx-auto mb-1 text-[#9CA3AF]" />
            <p className={cn('text-2xl font-bold tabular-nums', scoreColor)}>{score !== null ? `${score}%` : '—'}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Adherence Score</p>
          </div>
          {/* Goal */}
          <div className="bg-[#F6F7FB] rounded-xl p-4 text-center col-span-1">
            <Target className="w-4 h-4 mx-auto mb-1 text-[#9CA3AF]" />
            <p className="text-sm font-bold text-[#1F2A44] leading-snug">{goalLabels[client.goal] || 'General Fitness'}</p>
            <p className="text-[10px] text-[#9CA3AF] mt-0.5">Goal</p>
          </div>
        </div>

        {/* Weight summary */}
        {(latestWeight || client.target_weight) && (
          <div className="mt-3 border border-[#F0F2F8] rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider">Weight Progress</span>
              {weightDelta !== null && (
                <span className={cn('flex items-center gap-1 text-[11px] font-bold',
                  weightDelta < 0 ? 'text-emerald-600' : weightDelta > 0 ? 'text-red-500' : 'text-[#9CA3AF]')}>
                  {weightDelta < 0 ? <TrendingDown className="w-3 h-3" /> : weightDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                  {weightDelta > 0 ? '+' : ''}{weightDelta} lbs
                </span>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>Current: <strong className="text-[#1F2A44]">{latestWeight || '—'} lbs</strong></span>
              {client.target_weight && <span>Target: <strong className="text-[#1F2A44]">{client.target_weight} lbs</strong></span>}
            </div>
            {latestWeight && client.target_weight && (
              <div className="mt-2 w-full bg-[#F0F2F8] rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0,
                      Math.abs((client.current_weight - latestWeight) / (client.current_weight - client.target_weight)) * 100
                    ))}%`
                  }}
                />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ── Latest check-in summary ── */}
      {lastCI && (
        <SectionCard title="Latest Check-in" icon={ClipboardCheck} iconClass="bg-emerald-50">
          <p className="text-[10px] text-[#9CA3AF] mb-3">{format(new Date(lastCI.date), 'MMMM d, yyyy')}</p>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {lastCI.weight && (
              <div className="bg-[#F6F7FB] rounded-xl p-2.5 text-center">
                <Scale className="w-3.5 h-3.5 mx-auto mb-1 text-[#9CA3AF]" />
                <p className="text-sm font-bold text-[#1F2A44] tabular-nums">{lastCI.weight}</p>
                <p className="text-[9px] text-[#9CA3AF]">lbs</p>
              </div>
            )}
            {lastCI.sleep_hours && (
              <div className="bg-[#F6F7FB] rounded-xl p-2.5 text-center">
                <Moon className="w-3.5 h-3.5 mx-auto mb-1 text-indigo-400" />
                <p className="text-sm font-bold text-[#1F2A44] tabular-nums">{lastCI.sleep_hours}</p>
                <p className="text-[9px] text-[#9CA3AF]">hrs sleep</p>
              </div>
            )}
            {lastCI.energy_level && (
              <div className="bg-[#F6F7FB] rounded-xl p-2.5 text-center">
                <Zap className="w-3.5 h-3.5 mx-auto mb-1 text-amber-400" />
                <p className="text-sm font-bold text-[#1F2A44] tabular-nums">{lastCI.energy_level}<span className="text-[9px] text-[#9CA3AF]">/10</span></p>
                <p className="text-[9px] text-[#9CA3AF]">energy</p>
              </div>
            )}
          </div>

          {(lastCI.compliance_training != null || lastCI.compliance_nutrition != null) && (
            <div className="space-y-2">
              {lastCI.compliance_training != null && (
                <MetricRow label="Training" bar={lastCI.compliance_training} barColor="bg-primary" />
              )}
              {lastCI.compliance_nutrition != null && (
                <MetricRow label="Nutrition" bar={lastCI.compliance_nutrition} barColor="bg-emerald-500" />
              )}
            </div>
          )}

          {lastCI.notes && (
            <div className="mt-3 bg-[#F6F7FB] rounded-xl p-3">
              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wide mb-1">Client Notes</p>
              <p className="text-xs text-[#374151] leading-relaxed line-clamp-3">{lastCI.notes}</p>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Client details ── */}
      <SectionCard title="Details" icon={Mail} iconClass="bg-[#F6F7FB]">
        {client.email && <MetricRow icon={Mail} label="Email" value={client.email} />}
        {client.phone && <MetricRow icon={Phone} label="Phone" value={client.phone} />}
        {client.start_date && (
          <MetricRow icon={Calendar} label="Start Date" value={format(new Date(client.start_date), 'MMM d, yyyy')} />
        )}
        {client.monthly_rate && (
          <MetricRow icon={DollarSign} label="Monthly Rate" value={`$${client.monthly_rate}/mo`} />
        )}
        {client.height && <MetricRow icon={Scale} label="Height" value={client.height} />}
      </SectionCard>

      {/* ── Tags ── */}
      {client.tags?.length > 0 && (
        <SectionCard title="Tags" icon={Tag} iconClass="bg-[#F6F7FB]">
          <div className="flex flex-wrap gap-1.5">
            {client.tags.map(tag => (
              <span key={tag} className="text-xs bg-[#EEF4FF] text-primary border border-blue-100 rounded-lg px-2.5 py-1 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Coach notes ── */}
      {client.notes && (
        <SectionCard title="Coach Notes" icon={ClipboardCheck} iconClass="bg-[#F6F7FB]">
          <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{client.notes}</p>
        </SectionCard>
      )}
    </div>
  );
}