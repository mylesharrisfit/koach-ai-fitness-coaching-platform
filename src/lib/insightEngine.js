import { differenceInDays, parseISO, format } from 'date-fns';
import { compositeAdherenceScore } from './adherence';

// ── Coaching Priority Score (1–10) ────────────────────────────────────────────
export function coachingPriorityScore(client, checkIns = [], messages = []) {
  let score = 0;
  const now = new Date();

  // Days since last coach interaction (message from coach)
  const lastCoachMsg = messages
    .filter(m => m.client_id === client.id && m.sender === 'coach')
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
  const daysSinceMsg = lastCoachMsg
    ? differenceInDays(now, new Date(lastCoachMsg.created_date))
    : 99;
  if (daysSinceMsg >= 14) score += 3;
  else if (daysSinceMsg >= 7) score += 1.5;

  // Adherence trend
  const sortedCI = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const adherence = compositeAdherenceScore(sortedCI);
  if (adherence !== null) {
    if (adherence < 50) score += 3;
    else if (adherence < 70) score += 1.5;
  }

  // Declining trend (last 3 check-ins)
  if (sortedCI.length >= 3) {
    const scores = sortedCI.slice(0, 3).map(ci =>
      ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2
    );
    if (scores[0] < scores[1] && scores[1] < scores[2]) score += 2;
  }

  // Days since last check-in
  const lastCI = sortedCI[0];
  if (!lastCI) score += 2;
  else {
    const daysSinceCI = differenceInDays(now, parseISO(lastCI.date));
    if (daysSinceCI >= 14) score += 2;
    else if (daysSinceCI >= 7) score += 1;
  }

  // At-risk lifecycle
  if (client.lifecycle_status === 'at_risk') score += 1.5;

  // Mood/energy decline
  if (sortedCI.length >= 3) {
    const moods = { great: 5, good: 4, okay: 3, tired: 2, stressed: 1 };
    const moodScores = sortedCI.slice(0, 3).map(ci => moods[ci.mood] || 3);
    if (moodScores[0] < moodScores[2] - 1) score += 1;
  }

  return Math.min(10, Math.round(score * 10) / 10);
}

// ── Full Insight Generator ────────────────────────────────────────────────────
export function generateInsights(clients, checkIns, messages = []) {
  const insights = [];
  const now = new Date();
  const dismissed = getDismissed();

  const addInsight = (insight) => {
    if (!dismissed.has(insight.id)) insights.push(insight);
  };

  // Build per-client maps
  const ciMap = {};
  const msgMap = {};
  checkIns.forEach(ci => {
    if (!ciMap[ci.client_id]) ciMap[ci.client_id] = [];
    ciMap[ci.client_id].push(ci);
  });
  Object.keys(ciMap).forEach(k => ciMap[k].sort((a, b) => new Date(b.date) - new Date(a.date)));
  messages.forEach(m => {
    if (!msgMap[m.client_id]) msgMap[m.client_id] = [];
    msgMap[m.client_id].push(m);
  });

  clients.forEach(client => {
    const cis = ciMap[client.id] || [];
    const msgs = msgMap[client.id] || [];
    const first = client.name?.split(' ')[0] || 'Client';
    const adherence = compositeAdherenceScore(cis);
    const lastCI = cis[0];
    const daysSinceCI = lastCI ? differenceInDays(now, parseISO(lastCI.date)) : 999;

    // ── PERFORMANCE INSIGHTS ─────────────────────────────────────────────────

    // Weight on-pace or ahead of schedule
    if (cis.length >= 3 && client.current_weight && client.target_weight) {
      const weeklyLoss = cis.slice(0, 4)
        .filter(ci => ci.weight)
        .reduce((acc, ci, i, arr) => {
          if (i === arr.length - 1) return acc;
          return acc + (arr[i].weight - arr[i + 1].weight);
        }, 0) / Math.max(1, cis.filter(ci => ci.weight).length - 1);

      if (weeklyLoss > 0.8 && client.goal === 'weight_loss') {
        const weeksToGoal = (client.current_weight - client.target_weight) / weeklyLoss;
        addInsight({
          id: `perf_weight_${client.id}`,
          type: 'performance',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} is ahead of schedule on weight loss`,
          body: `Losing ~${weeklyLoss.toFixed(1)} lbs/week. At this rate, they'll hit their goal weight of ${client.target_weight} lbs in ~${Math.round(weeksToGoal)} weeks — potentially 2 weeks early.`,
          confidence: 'High',
          actionLabel: 'View Progress',
          actionPath: `/client-profile?id=${client.id}`,
          actionAlt: 'Send Message',
          actionAltPath: `/messages`,
          priority: 2,
        });
      }
    }

    // 100% workout compliance for 4+ weeks
    if (cis.length >= 4) {
      const last4 = cis.slice(0, 4);
      const allPerfect = last4.every(ci => (ci.compliance_training || 0) >= 95);
      if (allPerfect) {
        addInsight({
          id: `perf_perfect_${client.id}`,
          type: 'celebration',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} completed 100% of workouts for 4 weeks 🏆`,
          body: `Four consecutive weeks of perfect training compliance. They may be ready for a program progression or added challenge.`,
          confidence: 'High',
          actionLabel: 'Upgrade Program',
          actionPath: `/programs`,
          actionAlt: 'Send Congrats',
          actionAltPath: `/messages`,
          priority: 1,
        });
      }
    }

    // ── RISK INSIGHTS ────────────────────────────────────────────────────────

    // Mood/energy declining for 3+ weeks
    if (cis.length >= 3) {
      const moods = { great: 5, good: 4, okay: 3, tired: 2, stressed: 1 };
      const moodTrend = cis.slice(0, 3).map(ci => moods[ci.mood] || 3);
      const energyTrend = cis.slice(0, 3).map(ci => ci.energy_level || 5);
      const moodDeclining = moodTrend[0] < moodTrend[1] && moodTrend[1] < moodTrend[2];
      const energyDeclining = energyTrend[0] < energyTrend[1] && energyTrend[1] < energyTrend[2];

      if (moodDeclining && energyDeclining) {
        addInsight({
          id: `risk_burnout_${client.id}`,
          type: 'risk',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} shows signs of burnout — 3 weeks declining`,
          body: `Mood and energy scores have dropped for 3 consecutive check-ins (mood: ${['great','good','okay','tired','stressed'][5-moodTrend[2]]||'ok'} → ${['great','good','okay','tired','stressed'][5-moodTrend[0]]||'low'}). Consider a deload week or lifestyle check-in.`,
          confidence: 'High',
          actionLabel: 'Schedule Call',
          actionPath: `/schedule`,
          actionAlt: 'Send Message',
          actionAltPath: `/messages`,
          priority: 0,
        });
      }
    }

    // Weight plateau with good adherence
    if (cis.length >= 4 && client.goal === 'weight_loss') {
      const last4 = cis.slice(0, 4).filter(ci => ci.weight);
      if (last4.length >= 3) {
        const weightChange = Math.abs(last4[0].weight - last4[last4.length - 1].weight);
        const avgAdherence = last4.reduce((a, ci) => a + ((ci.compliance_training || 0) + (ci.compliance_nutrition || 0)) / 2, 0) / last4.length;
        if (weightChange < 1 && avgAdherence > 75) {
          addInsight({
            id: `risk_plateau_${client.id}`,
            type: 'risk',
            clientId: client.id,
            clientName: client.name,
            headline: `${first}'s weight has stalled for 3 weeks despite good adherence`,
            body: `Weight has barely moved (${last4[0].weight}→${last4[last4.length-1].weight} lbs) despite ${Math.round(avgAdherence)}% compliance. They may need a diet break, refeed day, or calorie adjustment.`,
            confidence: 'High',
            actionLabel: 'Adjust Nutrition',
            actionPath: `/nutrition`,
            actionAlt: 'Send Message',
            actionAltPath: `/messages`,
            priority: 0,
          });
        }
      }
    }

    // Churn risk — inactive
    if (daysSinceCI >= 12 && (client.lifecycle_status === 'active' || client.status === 'active')) {
      addInsight({
        id: `risk_churn_${client.id}`,
        type: 'risk',
        clientId: client.id,
        clientName: client.name,
        headline: `${first} hasn't checked in for ${daysSinceCI} days — churn risk`,
        body: `No app activity in ${daysSinceCI} days. Active clients who go silent for 2+ weeks have a significantly higher churn rate. Reach out now.`,
        confidence: daysSinceCI >= 21 ? 'High' : 'Medium',
        actionLabel: 'Message Now',
        actionPath: `/messages`,
        actionAlt: 'Schedule Call',
        actionAltPath: `/schedule`,
        priority: 0,
      });
    }

    // Weekend nutrition drop pattern
    if (cis.length >= 4) {
      const dayOfWeekNutr = cis.reduce((acc, ci) => {
        const dow = new Date(ci.date).getDay();
        const isWeekend = dow === 0 || dow === 6;
        const nutr = ci.compliance_nutrition || 0;
        if (isWeekend) acc.weekend.push(nutr);
        else acc.weekday.push(nutr);
        return acc;
      }, { weekend: [], weekday: [] });
      const avgWeekend = dayOfWeekNutr.weekend.reduce((a, b) => a + b, 0) / (dayOfWeekNutr.weekend.length || 1);
      const avgWeekday = dayOfWeekNutr.weekday.reduce((a, b) => a + b, 0) / (dayOfWeekNutr.weekday.length || 1);
      if (dayOfWeekNutr.weekend.length >= 2 && avgWeekend < avgWeekday - 20) {
        addInsight({
          id: `risk_weekend_${client.id}`,
          type: 'risk',
          clientId: client.id,
          clientName: client.name,
          headline: `${first}'s nutrition drops every weekend`,
          body: `Weekend nutrition adherence averages ${Math.round(avgWeekend)}% vs ${Math.round(avgWeekday)}% on weekdays. A weekend meal prep strategy could close this gap.`,
          confidence: 'Medium',
          actionLabel: 'Adjust Plan',
          actionPath: `/nutrition`,
          actionAlt: 'Send Message',
          actionAltPath: `/messages`,
          priority: 1,
        });
      }
    }

    // ── OPPORTUNITY INSIGHTS ─────────────────────────────────────────────────

    // Long time on same program
    if (client.assigned_program_id && client.start_date) {
      const daysOnProgram = differenceInDays(now, parseISO(client.start_date));
      if (daysOnProgram >= 77) { // 11 weeks
        addInsight({
          id: `opp_program_${client.id}`,
          type: 'opportunity',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} has been on the same program for ${Math.round(daysOnProgram / 7)} weeks`,
          body: `They've been on their current program for ${Math.round(daysOnProgram / 7)} weeks. The body may be adapting — a new stimulus or program switch could reignite progress.`,
          confidence: 'High',
          actionLabel: 'Switch Program',
          actionPath: `/programs`,
          actionAlt: 'Message Client',
          actionAltPath: `/messages`,
          priority: 2,
        });
      }
    }

    // Goal achieved — upsell opportunity
    if (client.current_weight && client.target_weight && adherence !== null && adherence >= 80) {
      const weightDiff = Math.abs(client.current_weight - client.target_weight);
      if (weightDiff <= 2 && client.goal === 'weight_loss') {
        addInsight({
          id: `opp_upsell_${client.id}`,
          type: 'opportunity',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} is within 2 lbs of their goal — upsell moment`,
          body: `They're almost at their target weight with ${Math.round(adherence)}% adherence. This is the perfect moment to transition to a maintenance or performance package.`,
          confidence: 'High',
          actionLabel: 'View Packages',
          actionPath: `/sales`,
          actionAlt: 'Send Message',
          actionAltPath: `/messages`,
          priority: 2,
        });
      }
    }

    // ── CELEBRATION INSIGHTS ─────────────────────────────────────────────────

    // Weight loss milestones
    if (cis.length >= 2 && client.goal === 'weight_loss') {
      const startWeight = cis[cis.length - 1].weight || client.current_weight;
      const currentWeight = cis[0].weight || client.current_weight;
      if (startWeight && currentWeight) {
        const lost = startWeight - currentWeight;
        const milestones = [5, 10, 15, 20, 25, 30, 40, 50];
        const hit = milestones.filter(m => lost >= m);
        if (hit.length > 0) {
          const milestone = Math.max(...hit);
          addInsight({
            id: `celebrate_weight_${client.id}_${milestone}`,
            type: 'celebration',
            clientId: client.id,
            clientName: client.name,
            headline: `🎉 ${first} just lost ${milestone} lbs — send a celebration message!`,
            body: `They've hit their ${milestone}-lb milestone! Total lost: ${lost.toFixed(1)} lbs from ${startWeight} → ${currentWeight} lbs. Acknowledge it before they log in today.`,
            confidence: 'High',
            actionLabel: 'Send Congrats',
            actionPath: `/messages`,
            priority: 1,
          });
        }
      }
    }

    // Multiple PRs in last check-in
    if (lastCI && differenceInDays(now, parseISO(lastCI.date)) <= 7) {
      const prCount = (lastCI.exercise_logs || []).filter(ex =>
        ex.sets_completed?.some(s => s.is_pr)
      ).length;
      if (prCount >= 2 || (lastCI.compliance_training >= 100 && lastCI.energy_level >= 9)) {
        addInsight({
          id: `celebrate_pr_${client.id}`,
          type: 'celebration',
          clientId: client.id,
          clientName: client.name,
          headline: `${first} had their best week ever 🔥`,
          body: `${prCount >= 2 ? `Set ${prCount} new PRs this week with` : 'Hit 100% training compliance with'} energy level ${lastCI.energy_level || 9}/10. This is momentum — capitalize on it!`,
          confidence: 'Medium',
          actionLabel: 'Celebrate',
          actionPath: `/messages`,
          priority: 1,
        });
      }
    }
  });

  // ── PORTFOLIO-LEVEL INSIGHTS ──────────────────────────────────────────────

  // Stale leads
  const staleLeads = clients.filter(c => {
    if (c.lifecycle_status !== 'lead') return false;
    return differenceInDays(now, new Date(c.created_date || now)) >= 14;
  });
  if (staleLeads.length > 0) {
    const names = staleLeads.slice(0, 2).map(c => c.name.split(' ')[0]).join(', ');
    addInsight({
      id: `opp_leads`,
      type: 'opportunity',
      clientId: null,
      clientName: null,
      headline: `${staleLeads.length} lead${staleLeads.length > 1 ? 's' : ''} waiting 14+ days to convert`,
      body: `${names}${staleLeads.length > 2 ? ` +${staleLeads.length - 2} more` : ''} have been in your pipeline without converting. A personalized follow-up could close them this week.`,
      confidence: 'High',
      actionLabel: 'View Leads',
      actionPath: `/clients`,
      priority: 2,
    });
  }

  // Sort by priority (0 = highest)
  return insights.sort((a, b) => (a.priority ?? 2) - (b.priority ?? 2));
}

// ── Dismissed tracking (localStorage-based with 7-day expiry) ─────────────────
const DISMISSED_KEY = 'koach_dismissed_insights';

function getDismissed() {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
    const now = Date.now();
    const valid = {};
    Object.entries(raw).forEach(([id, ts]) => {
      if (now - ts < 7 * 24 * 60 * 60 * 1000) valid[id] = ts;
    });
    return new Set(Object.keys(valid));
  } catch { return new Set(); }
}

export function dismissInsight(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(DISMISSED_KEY) || '{}');
    raw[id] = Date.now();
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(raw));
  } catch {}
}

export function markNotRelevant(id, type) {
  const key = 'koach_not_relevant_types';
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]');
    if (!raw.includes(type)) raw.push(type);
    localStorage.setItem(key, JSON.stringify(raw));
    dismissInsight(id);
  } catch {}
}

export function getNotRelevantTypes() {
  try { return JSON.parse(localStorage.getItem('koach_not_relevant_types') || '[]'); }
  catch { return []; }
}