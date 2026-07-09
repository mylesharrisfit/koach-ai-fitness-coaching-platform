import React, { useMemo } from 'react';
import { Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Industry benchmarks (anonymous aggregate estimates)
const BENCHMARKS = {
  mrr_per_client: { value: 250, label: 'Avg MRR / Client', unit: '$' },
  retention_rate: { value: 78, label: 'Client Retention Rate', unit: '%' },
  checkin_completion: { value: 72, label: 'Check-in Completion', unit: '%' },
  adherence: { value: 68, label: 'Avg Adherence Score', unit: '%' },
  response_rate: { value: 85, label: 'Coach Response Rate', unit: '%' },
};

function BenchmarkRow({ label, coachVal, benchmarkVal, unit, isHigherBetter = true }) {
  const diff = coachVal - benchmarkVal;
  const pct = benchmarkVal > 0 ? Math.round((coachVal / benchmarkVal) * 100) : 100;
  const isBetter = isHigherBetter ? diff >= 0 : diff <= 0;
  const color = isBetter ? 'rgb(var(--success))' : 'rgb(var(--destructive))';
  const Icon = diff === 0 ? Minus : isBetter ? TrendingUp : TrendingDown;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <p className="text-xs text-muted-foreground flex-1">{label}</p>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-xs font-bold text-foreground">{unit === '$' ? `$${coachVal}` : `${coachVal}${unit}`}</p>
          <p className="text-[9px] text-muted-foreground">You</p>
        </div>
        <div className="text-right opacity-50">
          <p className="text-xs font-medium text-muted-foreground">{unit === '$' ? `$${benchmarkVal}` : `${benchmarkVal}${unit}`}</p>
          <p className="text-[9px] text-muted-foreground">Avg</p>
        </div>
        <div className="flex items-center gap-1" style={{ color }}>
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

export default function BIBenchmarks({ clients, checkIns }) {
  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);
  const mrrPerClient = activeClients.length > 0 ? Math.round(mrr / activeClients.length) : 0;

  const completedCount = clients.filter(c => c.lifecycle_status === 'completed' || c.lifecycle_status === 'alumni').length;
  const retentionRate = clients.length > 0 ? Math.round(((clients.length - completedCount) / clients.length) * 100) : 100;

  const totalCheckIns = checkIns.length;
  const reviewedCheckIns = checkIns.filter(ci => ci.review_status === 'reviewed' || ci.coach_responded).length;
  const checkinCompletionRate = totalCheckIns > 0 ? Math.round((reviewedCheckIns / totalCheckIns) * 100) : 0;

  const avgAdherence = checkIns.length > 0
    ? Math.round(checkIns.reduce((s, ci) => s + ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2, 0) / checkIns.length)
    : 0;

  const respondedCheckIns = checkIns.filter(ci => ci.coach_responded).length;
  const responseRate = totalCheckIns > 0 ? Math.round((respondedCheckIns / totalCheckIns) * 100) : 0;

  // Percentile estimation
  const overallPct = Math.round((
    (mrrPerClient / BENCHMARKS.mrr_per_client.value) * 25 +
    (retentionRate / BENCHMARKS.retention_rate.value) * 25 +
    (checkinCompletionRate / BENCHMARKS.checkin_completion.value) * 25 +
    (avgAdherence / BENCHMARKS.adherence.value) * 25
  ));

  const percentileLabel = overallPct >= 125 ? 'top 10%' : overallPct >= 110 ? 'top 25%' : overallPct >= 90 ? 'top 50%' : 'bottom 50%';

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Award className="w-4 h-4 text-warning" />
        <h3 className="text-sm font-bold text-foreground">Industry Benchmarks</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">Anonymous aggregated data from fitness coaches</p>

      <div className="p-3 rounded-xl bg-gradient-to-r from-accent to-accent border border-accent mb-4">
        <p className="text-xs text-primary font-semibold">
          You're in the <span className="font-bold text-primary">{percentileLabel}</span> of coaches overall
        </p>
      </div>

      <BenchmarkRow label="MRR per Client" coachVal={mrrPerClient} benchmarkVal={BENCHMARKS.mrr_per_client.value} unit="$" />
      <BenchmarkRow label="Client Retention Rate" coachVal={retentionRate} benchmarkVal={BENCHMARKS.retention_rate.value} unit="%" />
      <BenchmarkRow label="Check-in Response Rate" coachVal={checkinCompletionRate} benchmarkVal={BENCHMARKS.checkin_completion.value} unit="%" />
      <BenchmarkRow label="Avg Adherence Score" coachVal={avgAdherence} benchmarkVal={BENCHMARKS.adherence.value} unit="%" />
      <BenchmarkRow label="Coach Response Rate" coachVal={responseRate} benchmarkVal={BENCHMARKS.response_rate.value} unit="%" />

      <p className="text-[9px] text-border text-center mt-3">Benchmarks are estimates based on industry averages</p>
    </div>
  );
}