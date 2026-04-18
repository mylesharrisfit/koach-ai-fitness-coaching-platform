/**
 * FitForge Subscription Tier System
 * Single source of truth for all tier definitions, limits, and feature flags.
 */

export const TIERS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    price: 29,
    color: 'text-slate-400',
    borderColor: 'border-slate-400/30',
    bgColor: 'bg-slate-400/10',
    gradient: 'from-slate-400 to-slate-500',
    badge: 'bg-slate-400/15 text-slate-300 border-slate-400/20',
    limits: {
      max_clients: 5,
      max_programs: 3,
      max_nutrition_plans: 3,
    },
    features: {
      clients: true,
      programs: true,
      nutrition: true,
      schedule: true,
      messages: true,
      progress: false,
      store: false,
      assistant: false,
      adherence: false,
      checkin_review: false,
      sales: false,
      community: false,
      client_dashboard: false,
      ai_suggestions: false,
      analytics: false,
      custom_branding: false,
      api_access: false,
    },
  },
  pro: {
    key: 'pro',
    name: 'Pro',
    price: 79,
    color: 'text-primary',
    borderColor: 'border-primary/30',
    bgColor: 'bg-primary/10',
    gradient: 'from-primary to-blue-400',
    badge: 'bg-primary/15 text-primary border-primary/20',
    popular: true,
    limits: {
      max_clients: 25,
      max_programs: 20,
      max_nutrition_plans: 20,
    },
    features: {
      clients: true,
      programs: true,
      nutrition: true,
      schedule: true,
      messages: true,
      progress: true,
      store: true,
      assistant: true,
      adherence: true,
      checkin_review: true,
      sales: false,
      community: false,
      client_dashboard: true,
      ai_suggestions: true,
      analytics: true,
      custom_branding: false,
      api_access: false,
    },
  },
  elite: {
    key: 'elite',
    name: 'Elite',
    price: 149,
    color: 'text-accent',
    borderColor: 'border-accent/30',
    bgColor: 'bg-accent/10',
    gradient: 'from-accent to-emerald-400',
    badge: 'bg-accent/15 text-accent border-accent/20',
    limits: {
      max_clients: 100,
      max_programs: -1, // unlimited
      max_nutrition_plans: -1,
    },
    features: {
      clients: true,
      programs: true,
      nutrition: true,
      schedule: true,
      messages: true,
      progress: true,
      store: true,
      assistant: true,
      adherence: true,
      checkin_review: true,
      sales: true,
      community: true,
      client_dashboard: true,
      ai_suggestions: true,
      analytics: true,
      custom_branding: true,
      api_access: false,
    },
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    price: 299,
    color: 'text-chart-4',
    borderColor: 'border-chart-4/30',
    bgColor: 'bg-chart-4/10',
    gradient: 'from-chart-4 to-amber-400',
    badge: 'bg-chart-4/15 text-chart-4 border-chart-4/20',
    limits: {
      max_clients: -1, // unlimited
      max_programs: -1,
      max_nutrition_plans: -1,
    },
    features: {
      clients: true,
      programs: true,
      nutrition: true,
      schedule: true,
      messages: true,
      progress: true,
      store: true,
      assistant: true,
      adherence: true,
      checkin_review: true,
      sales: true,
      community: true,
      client_dashboard: true,
      ai_suggestions: true,
      analytics: true,
      custom_branding: true,
      api_access: true,
    },
  },
};

export const TIER_ORDER = ['starter', 'pro', 'elite', 'enterprise'];

/** Feature display info for the upgrade modal */
export const FEATURE_INFO = {
  progress: {
    name: 'Progress Analytics',
    description: 'Track client body metrics, weight trends, and compliance charts over time.',
    icon: 'TrendingUp',
    minTier: 'pro',
  },
  store: {
    name: 'Digital Store',
    description: 'Sell workout programs and nutrition plans directly to clients online.',
    icon: 'ShoppingBag',
    minTier: 'pro',
  },
  assistant: {
    name: 'AI Coach Assistant',
    description: 'Generate programs, meal plans, and client check-in summaries with AI.',
    icon: 'Sparkles',
    minTier: 'pro',
  },
  adherence: {
    name: 'Adherence & Gamification',
    description: 'Track client compliance, award badges, and run leaderboards.',
    icon: 'Trophy',
    minTier: 'pro',
  },
  checkin_review: {
    name: 'Check-in Reviews',
    description: 'Review and respond to structured client check-ins with photos.',
    icon: 'ClipboardList',
    minTier: 'pro',
  },
  sales: {
    name: 'Sales & Revenue CRM',
    description: 'Manage your pipeline, track leads, and monitor recurring revenue.',
    icon: 'DollarSign',
    minTier: 'elite',
  },
  community: {
    name: 'Community Module',
    description: 'Build a client community with feeds, challenges, and leaderboards.',
    icon: 'Globe',
    minTier: 'elite',
  },
  client_dashboard: {
    name: 'Client Mobile Dashboard',
    description: 'Give clients a beautiful daily dashboard with rings, streaks, and logs.',
    icon: 'Smartphone',
    minTier: 'pro',
  },
  ai_suggestions: {
    name: 'AI Message Suggestions',
    description: 'Get AI-powered reply suggestions when messaging clients.',
    icon: 'Sparkles',
    minTier: 'pro',
  },
  custom_branding: {
    name: 'Custom Branding',
    description: 'White-label the platform with your logo, colors, and domain.',
    icon: 'Palette',
    minTier: 'elite',
  },
  api_access: {
    name: 'API Access',
    description: 'Connect FitForge to your own tools and workflows via REST API.',
    icon: 'Code',
    minTier: 'enterprise',
  },
  clients: {
    name: 'More Clients',
    description: 'Upgrade your plan to manage more clients and grow your business.',
    icon: 'Users',
    minTier: 'pro',
  },
};

/**
 * Get the tier config for a user. Defaults to 'starter'.
 */
export function getUserTier(user) {
  const tierKey = user?.subscription_tier || 'starter';
  return TIERS[tierKey] || TIERS.starter;
}

/**
 * Check if a user's tier has access to a feature.
 */
export function hasFeature(user, featureKey) {
  const tier = getUserTier(user);
  return tier.features[featureKey] === true;
}

/**
 * Check if a user's tier meets a minimum tier requirement.
 */
export function meetsMinTier(user, minTierKey) {
  const userTierIndex = TIER_ORDER.indexOf(user?.subscription_tier || 'starter');
  const minTierIndex = TIER_ORDER.indexOf(minTierKey);
  return userTierIndex >= minTierIndex;
}

/**
 * Get limit value (-1 = unlimited).
 */
export function getLimit(user, limitKey) {
  const tier = getUserTier(user);
  return tier.limits[limitKey] ?? -1;
}

/**
 * Check if a usage count is within the tier limit.
 */
export function withinLimit(user, limitKey, currentCount) {
  const limit = getLimit(user, limitKey);
  if (limit === -1) return true;
  return currentCount < limit;
}