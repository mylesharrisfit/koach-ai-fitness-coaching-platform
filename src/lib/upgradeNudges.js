/**
 * Behavior-based upgrade nudge definitions.
 * Each nudge has: id, condition fn, message, cta, featureKey, dismissable.
 * Nudges are stored as dismissed in localStorage to avoid re-showing.
 */

export const NUDGE_DISMISS_KEY = 'fitforge_dismissed_nudges';

export function getDismissedNudges() {
  try {
    return JSON.parse(localStorage.getItem(NUDGE_DISMISS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function dismissNudge(id) {
  const dismissed = getDismissedNudges();
  if (!dismissed.includes(id)) {
    localStorage.setItem(NUDGE_DISMISS_KEY, JSON.stringify([...dismissed, id]));
  }
}

export function isNudgeDismissed(id) {
  return getDismissedNudges().includes(id);
}

/**
 * Evaluate which nudges apply given the current context.
 * Returns an array of nudge objects to show (max 1 at a time).
 */
export function getActiveNudges({ user, clientCount, checkInCount }) {
  const tier = user?.subscription_tier || 'starter';
  const nudges = [];

  // 1. 80% of client limit → suggest upgrade
  const limits = {
    starter: 20,
    pro: 75,
  };
  const limit = limits[tier];
  if (limit && clientCount >= Math.floor(limit * 0.8) && clientCount < limit) {
    nudges.push({
      id: `client_limit_80_${tier}`,
      icon: 'Users',
      title: `You're at ${clientCount}/${limit} clients`,
      message: 'You\'re growing fast! Upgrade now to make sure you never hit a wall.',
      cta: 'Unlock More Clients',
      featureKey: 'clients',
      color: 'amber',
    });
  }

  // 2. 10+ clients on Starter → suggest Pro
  if (tier === 'starter' && clientCount >= 10) {
    nudges.push({
      id: 'starter_10_clients',
      icon: 'TrendingUp',
      title: 'Your client roster is growing',
      message: 'Pro unlocks progress tracking, adherence scores, and check-in reviews — perfect for managing larger rosters.',
      cta: 'Explore Pro',
      featureKey: 'progress',
      color: 'blue',
    });
  }

  // 3. Coach manually writing many check-in responses → suggest AI assistant
  if ((tier === 'starter' || tier === 'pro') && checkInCount >= 5) {
    nudges.push({
      id: `checkin_ai_hint_${tier}`,
      icon: 'Sparkles',
      title: 'Spending time on check-in replies?',
      message: 'Elite\'s AI Assistant drafts personalized responses for each client in seconds.',
      cta: 'Try AI Check-ins',
      featureKey: 'assistant',
      color: 'purple',
    });
  }

  // Filter out dismissed nudges, return highest-priority one
  return nudges.filter(n => !isNudgeDismissed(n.id));
}