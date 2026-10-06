/**
 * THE definition of an "AI generation", and which plan each AI feature needs.
 * (Client mirror of the counted list: src/lib/aiPolicy.js — a test fails if they differ.)
 *
 * COUNTED — each successful-to-start call is exactly 1 generation against the
 * coach's monthly allowance (TIER_LIMITS[tier].max_ai_generations_per_month);
 * regenerating counts again:
 *   - generateAIProgram   a workout program
 *   - generateMealPlan    a meal plan
 *   - generateSmartMeals  a smart-meals set
 * (AI onboarding is these same calls, so it is counted too, and needs Pro+.)
 *
 * NOT COUNTED — check-in summaries, draft replies, the full assistant, insights,
 * scans and import mapping never touch the monthly counter. They are limited by
 * the plan's feature flag (`feature`) AND by a per-tenant daily call cap
 * (AI_DAILY_CALL_CAP below, metered by public.meter_ai_daily), both checked
 * server-side in guardAiUse().
 *
 * Comped / admin accounts are evaluated as Enterprise (see effectiveTier).
 */
export const AI_POLICY = {
  // counted generations
  generateAIProgram:   { counted: true,  feature: 'ai_program_builder' },
  generateMealPlan:    { counted: true,  feature: 'ai_meal_plan_builder' },
  generateSmartMeals:  { counted: true,  feature: 'ai_meal_plan_builder' },
  // not counted, plan-gated
  'checkin.analyze':   { counted: false, feature: 'ai_checkin_summary' },   // auto check-in summary (Pro+)
  aiCheckInInsights:   { counted: false, feature: 'ai_checkin_summary' },   // check-in summary + suggested reply (Pro+)
  aiMessageAssistant:  { counted: false, feature: 'ai_suggestions' },       // AI-drafted replies / message writing (Pro+)
  claudeAssistant:     { counted: false, feature: 'ai_assistant_full' },    // full AI assistant
  aiNutritionInsights: { counted: false, feature: 'ai_calorie_suggestions' },
  aiProgressInsights:  { counted: false, feature: 'ai_features' },
  aiBusinessInsights:  { counted: false, feature: 'ai_features' },
  aiInBodyScan:        { counted: false, feature: 'ai_features' },
  // not counted, not plan-gated (still need an active subscription)
  mapImportColumns:    { counted: false, feature: null },
  // admin-only (the edge function refuses everyone else); no UI calls it
  generateExerciseLibrary: { counted: false, feature: null },
};

/**
 * Spend backstop for the NOT COUNTED functions: at most this many calls per
 * paying account (the coach; a portal client's coach) per UTC day, across all
 * of them combined, on every plan. It is not a plan limit and is not shown on
 * pricing — it only stops runaway or scripted use. Override without a redeploy
 * via the AI_DAILY_CALL_CAP function secret (-1 = uncapped).
 */
export const AI_DAILY_CALL_CAP = 500;

export function aiDailyCallCap() {
  const raw = globalThis.Deno?.env?.get?.('AI_DAILY_CALL_CAP');
  const n = raw == null || raw === '' ? NaN : Number(raw);
  return Number.isInteger(n) && n >= -1 ? n : AI_DAILY_CALL_CAP;
}

/** Feature required when the generators are used for AI onboarding (Pro+). */
export const ONBOARDING_FEATURE = 'ai_onboarding';

export const COUNTED_AI_FUNCTIONS = Object.keys(AI_POLICY).filter((k) => AI_POLICY[k].counted);

/** First day of next month, UTC (YYYY-MM-DD) — when the monthly counter resets. */
export function aiResetDate(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
}
