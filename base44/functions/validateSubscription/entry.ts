import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const TIER_ORDER = ['starter', 'pro', 'elite', 'enterprise'];

const TIER_LIMITS = {
  starter:    { max_clients: 10, max_programs: -1, max_nutrition_plans: -1 },
  pro:        { max_clients: 25, max_programs: -1, max_nutrition_plans: -1 },
  elite:      { max_clients: 75, max_programs: -1, max_nutrition_plans: -1 },
  enterprise: { max_clients: -1, max_programs: -1, max_nutrition_plans: -1 },
};

const ELITE_FEATURES = [
  'clients', 'programs', 'nutrition', 'schedule', 'messages',
  'progress', 'store', 'assistant', 'adherence', 'checkin_review',
  'sales', 'community', 'client_dashboard',
  'ai_suggestions', 'analytics', 'custom_branding', 'voice_video_messages',
  'program_templates', 'analytics_graphs', 'ai_features',
  'adherence_scoring', 'checkin_automation', 'basic_notifications',
  'ai_calorie_suggestions', 'ai_workout_progression', 'ai_checkin_responses',
  'auto_progression_rules', 'trigger_notifications', 'revenue_dashboard',
];

const TIER_FEATURES = {
  starter: [
    'clients', 'programs', 'nutrition', 'schedule', 'messages',
  ],
  pro: [
    'clients', 'programs', 'nutrition', 'schedule', 'messages',
    'progress', 'adherence', 'checkin_review', 'client_dashboard',
    'analytics', 'voice_video_messages', 'program_templates',
    'analytics_graphs', 'adherence_scoring', 'checkin_automation', 'basic_notifications',
  ],
  elite: ELITE_FEATURES,
  enterprise: [...ELITE_FEATURES, 'api_access'],
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { action, entity, count } = body;

    const userTier = user.subscription_tier || 'starter';
    const limits = TIER_LIMITS[userTier] || TIER_LIMITS.starter;
    const features = TIER_FEATURES[userTier] || TIER_FEATURES.starter;

    // Feature access check (read-only, no 403)
    if (action === 'check_feature') {
      const allowed = features.includes(entity);
      return Response.json({ allowed, tier: userTier });
    }

    // Hard gate — returns 403 if feature is not in the user's tier.
    // Call this at the top of any backend function that requires a premium feature.
    // e.g. { action: 'guard_feature', entity: 'ai_suggestions' }
    if (action === 'guard_feature') {
      const allowed = features.includes(entity);
      if (!allowed) {
        return Response.json({
          error: `This feature requires a higher subscription tier. Current: ${userTier}.`,
          required_feature: entity,
          tier: userTier,
          upgrade_required: true,
        }, { status: 403 });
      }
      return Response.json({ allowed: true, tier: userTier });
    }

    // Usage limit check
    if (action === 'check_limit') {
      const limitKey = `max_${entity}`;
      const limit = limits[limitKey] ?? -1;
      const allowed = limit === -1 || (count !== undefined ? count < limit : true);
      return Response.json({ allowed, limit, tier: userTier });
    }

    // Validate before creating a client
    if (action === 'validate_create_client') {
      const clientCount = await base44.entities.Client.list().then(r => r.length).catch(() => 0);
      const limit = limits.max_clients;
      if (limit !== -1 && clientCount >= limit) {
        return Response.json({
          allowed: false,
          error: `Client limit reached (${limit} on ${userTier} plan)`,
          limit,
          current: clientCount,
          tier: userTier,
        });
      }
      return Response.json({ allowed: true, tier: userTier });
    }

    // Validate before creating a program
    if (action === 'validate_create_program') {
      const programCount = await base44.entities.WorkoutProgram.list().then(r => r.length).catch(() => 0);
      const limit = limits.max_programs;
      if (limit !== -1 && programCount >= limit) {
        return Response.json({
          allowed: false,
          error: `Program limit reached (${limit} on ${userTier} plan)`,
          limit,
          current: programCount,
          tier: userTier,
        });
      }
      return Response.json({ allowed: true, tier: userTier });
    }

    // Validate before creating a nutrition plan
    if (action === 'validate_create_nutrition') {
      const planCount = await base44.entities.NutritionPlan.list().then(r => r.length).catch(() => 0);
      const limit = limits.max_nutrition_plans;
      if (limit !== -1 && planCount >= limit) {
        return Response.json({
          allowed: false,
          error: `Nutrition plan limit reached (${limit} on ${userTier} plan)`,
          limit,
          current: planCount,
          tier: userTier,
        });
      }
      return Response.json({ allowed: true, tier: userTier });
    }

    // Return full tier info
    if (action === 'get_tier_info') {
      return Response.json({ tier: userTier, limits, features });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});