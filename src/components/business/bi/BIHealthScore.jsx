import React, { useMemo } from 'react';
import { parseISO, subMonths, startOfMonth } from 'date-fns';

function ScoreRing({ score, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = score >= 75 ? '#22C55E' : score >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F3F4F6" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${progress} ${circumference}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-bold" style={{ color }}>{score}</p>
        <p className="text-[9px] text-gray-400 font-medium">/ 100</p>
      </div>
    </div>
  );
}

function CategoryBar({ label, score, color }) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-xs text-gray-600 w-28 flex-shrink-0">{label}</p>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-bold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function BIHealthScore({ clients, checkIns, leads }) {
  const activeClients = useMemo(() => clients.filter(c => c.lifecycle_status === 'active' || c.status === 'active'), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_rate || 0), 0), [activeClients]);

  const scores = useMemo(() => {
    // Revenue Health (0-100)
    const hasRevenue = mrr > 0 ? 40 : 0;
    const revenueGrowth = clients.filter(c => {
      const sd = c.start_date ? parseISO(c.start_date) : null;
      return sd && sd >= startOfMonth(subMonths(new Date(), 1));
    }).length > 0 ? 30 : 0;
    const paymentHealth = 30; // assume good without payment failure data
    const revenueScore = Math.min(100, hasRevenue + revenueGrowth + paymentHealth);

    // Client Health (0-100)
    const atRiskCount = clients.filter(c => c.lifecycle_status === 'at_risk').length;
    const atRiskPenalty = Math.min(40, atRiskCount * 10);
    const avgAdherence = checkIns.length > 0
      ? checkIns.reduce((s, ci) => s + ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2, 0) / checkIns.length
      : 50;
    const clientScore = Math.max(0, Math.min(100, Math.round(avgAdherence) - atRiskPenalty + 20));

    // Growth Health (0-100)
    const pipelineLeads = leads.filter(l => l.stage === 'lead' || l.stage === 'booked').length;
    const converted = leads.filter(l => l.stage === 'active_client').length;
    const convRate = leads.length > 0 ? converted / leads.length : 0;
    const growthScore = Math.min(100, Math.round(
      (pipelineLeads > 0 ? 30 : 0) +
      (convRate > 0.3 ? 40 : convRate > 0.15 ? 25 : 10) +
      (activeClients.length > 0 ? 30 : 0)
    ));

    // Operational Health (0-100)
    const reviewedCheckIns = checkIns.filter(ci => ci.review_status === 'reviewed').length;
    const reviewRate = checkIns.length > 0 ? reviewedCheckIns / checkIns.length : 0;
    const respondedCheckIns = checkIns.filter(ci => ci.coach_responded).length;
    const responseRate = checkIns.length > 0 ? respondedCheckIns / checkIns.length : 0;
    const operationalScore = Math.min(100, Math.round((reviewRate * 50) + (responseRate * 50)));

    const overall = Math.round((revenueScore + clientScore + growthScore + operationalScore) / 4);

    return { overall, revenueScore, clientScore, growthScore, operationalScore };
  }, [clients, checkIns, leads, mrr]);

  const categories = [
    { label: 'Revenue Health', score: scores.revenueScore, color: scores.revenueScore >= 70 ? '#22C55E' : scores.revenueScore >= 40 ? '#F59E0B' : '#EF4444' },
    { label: 'Client Health', score: scores.clientScore, color: scores.clientScore >= 70 ? '#22C55E' : scores.clientScore >= 40 ? '#F59E0B' : '#EF4444' },
    { label: 'Growth Health', score: scores.growthScore, color: scores.growthScore >= 70 ? '#22C55E' : scores.growthScore >= 40 ? '#F59E0B' : '#EF4444' },
    { label: 'Operational', score: scores.operationalScore, color: scores.operationalScore >= 70 ? '#22C55E' : scores.operationalScore >= 40 ? '#F59E0B' : '#EF4444' },
  ];

  const label = scores.overall >= 75 ? 'Excellent' : scores.overall >= 60 ? 'Good' : scores.overall >= 40 ? 'Needs Work' : 'Critical';
  const labelColor = scores.overall >= 75 ? '#22C55E' : scores.overall >= 60 ? '#3B82F6' : scores.overall >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Business Health Score</h3>
      <div className="flex items-center gap-6 mb-5">
        <ScoreRing score={scores.overall} />
        <div>
          <p className="text-lg font-bold" style={{ color: labelColor }}>{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">Overall business health</p>
          <p className="text-xs text-gray-500 mt-2">
            {scores.overall < 60 ? 'Focus on client retention and pipeline growth to improve your score.' :
              scores.overall < 75 ? 'Good foundation — increase check-in review rate for a boost.' :
              'Excellent! Keep maintaining strong client relationships.'}
          </p>
        </div>
      </div>
      <div className="space-y-2.5">
        {categories.map(c => <CategoryBar key={c.label} {...c} />)}
      </div>
    </div>
  );
}