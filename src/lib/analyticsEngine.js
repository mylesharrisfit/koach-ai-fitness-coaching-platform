import { subMonths, format, parseISO, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Generate last N months as labels + date ranges
 */
export function getMonthRanges(n = 6) {
  return Array.from({ length: n }, (_, i) => {
    const date = subMonths(new Date(), n - 1 - i);
    return {
      label: format(date, 'MMM yy'),
      start: startOfMonth(date),
      end: endOfMonth(date),
    };
  });
}

/**
 * Retention rate: active clients / (active + completed/alumni) per month snapshot
 * We approximate using lifecycle_status on clients and start_date
 */
export function calcRetentionTrend(clients, months) {
  return months.map(({ label, start, end }) => {
    const enrolled = clients.filter(c => {
      const sd = c.start_date ? parseISO(c.start_date) : null;
      return sd && sd <= end;
    });
    const retained = enrolled.filter(c =>
      c.lifecycle_status === 'active' || c.lifecycle_status === 'alumni' || c.lifecycle_status === 'completed'
    );
    const total = enrolled.length;
    return { label, value: total > 0 ? Math.round((retained.length / total) * 100) : 0, total };
  });
}

/**
 * Churn rate: clients that went inactive or at_risk that month
 */
export function calcChurnTrend(clients, checkIns, months) {
  return months.map(({ label, start, end }) => {
    const atRisk = clients.filter(c => {
      const ud = c.updated_date ? parseISO(c.updated_date) : null;
      return ud && isWithinInterval(ud, { start, end }) && (c.lifecycle_status === 'at_risk');
    });
    const total = clients.filter(c => {
      const sd = c.start_date ? parseISO(c.start_date) : null;
      return sd && sd <= end;
    }).length;
    return { label, value: total > 0 ? Math.round((atRisk.length / total) * 100) : 0 };
  });
}

/**
 * Average adherence: mean of compliance_training and compliance_nutrition from check-ins that month
 */
export function calcAdherenceTrend(checkIns, months) {
  return months.map(({ label, start, end }) => {
    const monthCheckins = checkIns.filter(c => {
      const d = c.date ? parseISO(c.date) : null;
      return d && isWithinInterval(d, { start, end });
    });
    const scores = monthCheckins
      .map(c => {
        const vals = [c.compliance_training, c.compliance_nutrition].filter(v => v != null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      })
      .filter(v => v != null);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { label, value: avg };
  });
}

/**
 * Average weight change per client per month (vs their first check-in)
 */
export function calcWeightProgressTrend(checkIns, clients, months) {
  return months.map(({ label, start, end }) => {
    const deltas = [];
    clients.forEach(client => {
      const clientCIs = checkIns
        .filter(c => c.client_id === client.id && c.weight != null)
        .sort((a, b) => (a.date > b.date ? 1 : -1));
      if (clientCIs.length < 2) return;
      const first = clientCIs[0];
      const monthCI = clientCIs.find(c => {
        const d = c.date ? parseISO(c.date) : null;
        return d && isWithinInterval(d, { start, end });
      });
      if (monthCI) deltas.push(monthCI.weight - first.weight);
    });
    const avg = deltas.length
      ? Math.round((deltas.reduce((a, b) => a + b, 0) / deltas.length) * 10) / 10
      : 0;
    return { label, value: avg };
  });
}

/**
 * Summary stats (current snapshot)
 */
export function calcSummaryStats(clients, checkIns) {
  const active = clients.filter(c => c.lifecycle_status === 'active').length;
  const atRisk = clients.filter(c => c.lifecycle_status === 'at_risk').length;
  const total = clients.length || 1;
  const retentionRate = Math.round(((total - atRisk) / total) * 100);
  const churnRate = Math.round((atRisk / total) * 100);

  const last30 = subMonths(new Date(), 1);
  const recentCIs = checkIns.filter(c => c.date && parseISO(c.date) >= last30);
  const adherenceScores = recentCIs.flatMap(c =>
    [c.compliance_training, c.compliance_nutrition].filter(v => v != null)
  );
  const avgAdherence = adherenceScores.length
    ? Math.round(adherenceScores.reduce((a, b) => a + b, 0) / adherenceScores.length)
    : 0;

  // Weight progress: avg delta per client
  const weightDeltas = [];
  clients.forEach(client => {
    const cis = checkIns
      .filter(c => c.client_id === client.id && c.weight != null)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    if (cis.length >= 2) weightDeltas.push(cis[cis.length - 1].weight - cis[0].weight);
  });
  const avgWeightDelta = weightDeltas.length
    ? Math.round((weightDeltas.reduce((a, b) => a + b, 0) / weightDeltas.length) * 10) / 10
    : null;

  return { active, total: clients.length, retentionRate, churnRate, avgAdherence, avgWeightDelta, atRisk };
}