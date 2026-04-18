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
      max_clients: 20,
      max_programs: 3,
      max_nutrition_plans: 3,
    },
    features: {
      // Pages
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
      // Granular feature flags
      ai_suggestions: false,
      analytics: false,
      custom_branding: false,
      api_access: false,
      voice_video_messages: false,
      program_templates: false,
      analytics_graphs: false,
      ai_features: false,
      adherence_scoring: false,
      checkin_automation: false,
      basic_notifications: false,
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
      max_clients: 75,
      max_programs: 30,
      max_nutrition_plans: 30,
    },
    features: {
      // Pages
      clients: true,
      programs: true,
      nutrition: true,
      schedule: true,
      messages: true,
      progress: true,
      store: false,
      assistant: false,        // Advanced AI locked to Elite+
      adherence: true,
      checkin_review: true,
      sales: false,            // Sales pipeline locked to Elite+
      community: false,
      client_dashboard: true,
      // Granular
      ai_suggestions: false,   // Advanced AI locked
      analytics: true,
      custom_branding: false,
      api_access: false,
      voice_video_messages: true,
      program_templates: true,
      analytics_graphs: true,
      ai_features: false,      // Advanced AI locked
      adherence_scoring: true,
      checkin_automation: true,
      basic_notifications: true,
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
      max_clients: -1,      // Unlimited
      max_programs: -1,
      max_nutrition_plans: -1,
    },
    features: {
      // Pages
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
      // Granular — all Pro features
      ai_suggestions: true,
      analytics: true,
      custom_branding: true,       // White-label branding
      api_access: false,
      voice_video_messages: true,
      program_templates: true,
      analytics_graphs: true,
      ai_features: true,
      adherence_scoring: true,
      checkin_automation: true,
      basic_notifications: true,
      // Elite-exclusive
      ai_calorie_suggestions: true,      // AI calorie adjustment suggestions
      ai_workout_progression: true,      // AI workout progression suggestions
      ai_checkin_responses: true,        // Auto-generated check-in responses
      auto_progression_rules: true,      // Auto progression rules for workouts
      trigger_notifications: true,       // Trigger-based notifications
      revenue_dashboard: true,           // MRR & revenue dashboard
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
      max_clients: -1,
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
      voice_video_messages: true,
      program_templates: true,
      analytics_graphs: true,
      ai_features: true,
      adherence_scoring: true,
      checkin_automation: true,
      basic_notifications: true,
      ai_calorie_suggestions: true,
      ai_workout_progression: true,
      ai_checkin_responses: true,
      auto_progression_rules: true,
      trigger_notifications: true,
      revenue_dashboard: true,
    },
  },
};

export const TIER_ORDER = ['starter', 'pro', 'elite', 'enterprise'];

/** Feature display info for the upgrade modal */
export const FEATURE_INFO = {
  // Pro-tier features
  progress: {
    name: 'Progress Analytics',
    description: 'Track client body metrics, weight trends, and compliance charts over time.',
    icon: 'TrendingUp',
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
  client_dashboard: {
    name: 'Client Mobile Dashboard',
    description: 'Give clients a beautiful daily dashboard with rings, streaks, and logs.',
    icon: 'Smartphone',
    minTier: 'pro',
  },
  voice_video_messages: {
    name: 'Voice & Video Messages',
    description: 'Send voice notes and video messages to clients.',
    icon: 'Mic',
    minTier: 'pro',
  },
  program_templates: {
    name: 'Program Templates & Automation',
    description: 'Use pre-built templates and automate program delivery to clients.',
    icon: 'LayoutTemplate',
    minTier: 'pro',
  },
  analytics_graphs: {
    name: 'Analytics & Charts',
    description: 'Visual trend charts for weight, compliance, body composition, and more.',
    icon: 'TrendingUp',
    minTier: 'pro',
  },
  adherence_scoring: {
    name: 'Adherence Scoring',
    description: 'Automated adherence scores and gamification for client motivation.',
    icon: 'Trophy',
    minTier: 'pro',
  },
  checkin_automation: {
    name: 'Check-in Automation',
    description: 'Automate client check-in forms and reminders.',
    icon: 'ClipboardList',
    minTier: 'pro',
  },
  basic_notifications: {
    name: 'Basic Notifications',
    description: 'Alerts for missed workouts and low client compliance.',
    icon: 'Bell',
    minTier: 'pro',
  },
  clients: {
    name: 'More Clients',
    description: 'Upgrade your plan to manage more clients and grow your business.',
    icon: 'Users',
    minTier: 'pro',
  },
  // Elite-tier features
  store: {
    name: 'Digital Store',
    description: 'Sell workout programs and nutrition plans directly to clients online.',
    icon: 'ShoppingBag',
    minTier: 'elite',
  },
  assistant: {
    name: 'AI Coach Assistant',
    description: 'Full AI assistant with calorie adjustments, workout progression, and check-in responses.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  ai_features: {
    name: 'Advanced AI Features',
    description: 'AI-powered suggestions, summaries, and content generation.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  ai_suggestions: {
    name: 'AI Message Suggestions',
    description: 'Get AI-powered reply suggestions when messaging clients.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  ai_calorie_suggestions: {
    name: 'AI Calorie Adjustments',
    description: 'Get smart calorie and macro adjustment suggestions based on client progress.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  ai_workout_progression: {
    name: 'AI Workout Progression',
    description: 'Automatic workout progression suggestions based on client performance.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  ai_checkin_responses: {
    name: 'Auto Check-in Responses',
    description: 'AI-generated personalized responses to client weekly check-ins.',
    icon: 'Sparkles',
    minTier: 'elite',
  },
  auto_progression_rules: {
    name: 'Auto Progression Rules',
    description: 'Set rules to automatically progress workouts as clients hit milestones.',
    icon: 'Zap',
    minTier: 'elite',
  },
  trigger_notifications: {
    name: 'Trigger-Based Notifications',
    description: 'Set automated alerts based on client behavior and performance triggers.',
    icon: 'Bell',
    minTier: 'elite',
  },
  revenue_dashboard: {
    name: 'Revenue Dashboard',
    description: 'Monitor MRR, active clients, churn risk, and business growth metrics.',
    icon: 'DollarSign',
    minTier: 'elite',
  },
  sales: {
    name: 'Sales Pipeline CRM',
    description: 'Track leads from first contact through close with notes and status management.',
    icon: 'DollarSign',
    minTier: 'elite',
  },
  community: {
    name: 'Community Module',
    description: 'Build a client community with feeds, challenges, and leaderboards.',
    icon: 'Globe',
    minTier: 'elite',
  },
  custom_branding: {
    name: 'White-Label Branding',
    description: 'Customize the platform with your own logo, colors, and domain.',
    icon: 'Palette',
    minTier: 'elite',
  },
  // Enterprise-tier features
  api_access: {
    name: 'API Access',
    description: 'Connect FitForge to your own tools and workflows via REST API.',
    icon: 'Code',
    minTier: 'enterprise',
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