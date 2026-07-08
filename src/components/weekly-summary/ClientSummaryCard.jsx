import React from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { TrendingDown, TrendingUp, Minus, AlertTriangle, CheckCircle2, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

function WeightTrend({ checkIns }) {
  const withWeight = checkIns.filter(c => c.weight).sort((a, b) => new Date(a.date) - new Date(b.date));
  if (withWeight.length < 2) return null;

  const first = withWeight[withWeight.length - 2].weight;
  const last  = withWeight[withWeight.length - 1].weight;
  const diff  = +(last - first).toFixed(1);

  if (diff === 0) return <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Minus className="w-3.5 h-3.5" /> No change</span>;

  const loss = diff < 0;
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', loss ? 'text-emerald-600' : 'text-rose-500')}>
      {loss ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
      {loss ? '' : '+'}{diff} lbs
    </span>
  );
}

function ComplianceBar({ value, label, color }) {
  if (value == null) return null;
  const pct = Math.min(value, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className={cn('font-semibold', pct >= 80 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-500' : 'text-rose-500')}>{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ClientSummaryCard({ client, checkIns, sessions }) {
  const navigate = useNavigate();

  const sorted    = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latest    = sorted[0];
  const prev      = sorted[1];
  const lastCheckInDays = latest ? differenceInDays(new Date(), parseISO(latest.date)) : null;
  const missedCI  = lastCheckInDays === null || lastCheckInDays >= 7;

  // Workout adherence this week
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSessions = sessions.filter(s => s.client_id === client.id && new Date(s.completed_at || s.created_date) >= weekAgo);
  const weekWorkouts = weekSessions.length;

  // Weight trend (last 2 check-ins)
  const weightNow  = latest?.weight;
  const weightPrev = prev?.weight;
  const weightDiff = weightNow && weightPrev ? +(weightNow - weightPrev).toFixed(1) : null;

  // Flags
  const lowAdherence = latest && (latest.compliance_training != null && latest.compliance_training < 60);
  const lowNutrition = latest && (latest.compliance_nutrition != null && latest.compliance_nutrition < 60);
  const lowMood      = latest?.mood === 'stressed' || latest?.mood === 'tired';
  const hasFlags     = missedCI || lowAdherence || lowNutrition || lowMood;

  const statusColor = hasFlags ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/30';
  const avatarBg    = hasFlags ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

  return (
    <div className={cn('rounded-2xl border p-4 flex flex-col gap-3 shadow-sm bg-white transition-all hover:shadow-md', statusColor)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt={client.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0', avatarBg)}>
              {client.name?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-800 truncate">{client.name}</p>
            <p className="text-xs text-slate-400 capitalize">{client.goal?.replace('_', ' ') || 'General fitness'}</p>
          </div>
        </div>
        {hasFlags ? (
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-2.5 h-2.5" /> Needs attention
          </span>
        ) : (
          <span className="flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5" /> On track
          </span>
        )}
      </div>

      {/* Weight + Workout row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/80 border border-slate-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Weight</p>
          <p className="text-sm font-bold text-slate-700">{weightNow ? `${weightNow} lbs` : '—'}</p>
          {weightDiff !== null && (
            <p className={cn('text-[10px] font-semibold', weightDiff < 0 ? 'text-emerald-600' : weightDiff > 0 ? 'text-rose-500' : 'text-slate-400')}>
              {weightDiff > 0 ? '+' : ''}{weightDiff} lbs
            </p>
          )}
        </div>
        <div className="bg-white/80 border border-slate-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Workouts</p>
          <p className="text-sm font-bold text-slate-700">{weekWorkouts}</p>
          <p className="text-[10px] text-slate-400">this week</p>
        </div>
        <div className="bg-white/80 border border-slate-100 rounded-xl p-2.5 text-center">
          <p className="text-[10px] text-slate-400 font-medium mb-0.5">Check-in</p>
          {missedCI ? (
            <>
              <p className="text-sm font-bold text-rose-500">Missed</p>
              <p className="text-[10px] text-rose-400">{lastCheckInDays !== null ? `${lastCheckInDays}d ago` : 'Never'}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold text-emerald-600">Done</p>
              <p className="text-[10px] text-slate-400">{lastCheckInDays === 0 ? 'Today' : `${lastCheckInDays}d ago`}</p>
            </>
          )}
        </div>
      </div>

      {/* Compliance bars */}
      {latest && (
        <div className="space-y-1.5">
          <ComplianceBar value={latest.compliance_training} label="Training" color={latest.compliance_training >= 80 ? 'bg-emerald-500' : latest.compliance_training >= 60 ? 'bg-amber-400' : 'bg-rose-400'} />
          <ComplianceBar value={latest.compliance_nutrition} label="Nutrition" color={latest.compliance_nutrition >= 80 ? 'bg-emerald-500' : latest.compliance_nutrition >= 60 ? 'bg-amber-400' : 'bg-rose-400'} />
        </div>
      )}

      {/* Client notes snippet */}
      {latest?.notes && (
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
          <p className="text-[11px] text-blue-700 italic leading-relaxed line-clamp-2">"{latest.notes}"</p>
        </div>
      )}

      {/* Mood + mood flag */}
      {latest?.mood && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400">Mood:</span>
          <span className={cn('text-xs font-semibold capitalize', lowMood ? 'text-rose-500' : 'text-emerald-600')}>
            {latest.mood}
          </span>
          {latest.sleep_hours != null && (
            <span className="text-xs text-slate-400 ml-2">· Sleep: <span className={cn('font-semibold', latest.sleep_hours < 6 ? 'text-rose-500' : 'text-slate-600')}>{latest.sleep_hours}h</span></span>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => navigate(`/checkin-review`)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors"
        >
          <Clock className="w-3 h-3" /> Review Check-in
        </button>
        <button
          onClick={() => navigate(`/messages?clientId=${client.id}`)}
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}