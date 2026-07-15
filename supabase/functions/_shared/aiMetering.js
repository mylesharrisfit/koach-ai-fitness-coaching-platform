/**
 * Monthly AI-generation metering (Step 5d) — the guard Base44 inlined
 * identically into generateAIProgram / generateMealPlan / generateSmartMeals,
 * extracted so all three (and future AI functions) share one implementation.
 * The 402 payload shape is verbatim from those functions.
 *
 * Counters live on the caller's profiles row (ai_generation_count /
 * ai_generation_month). Those columns are NOT in the privileged-columns
 * trigger allowlist, but writes still go through the service client scoped to
 * the caller's own id, matching every other self-write in the ported
 * functions.
 *
 * Faithful scope note: Base44 metered only the three generators —
 * claudeAssistant / aiMessageAssistant / generateExerciseLibrary were
 * unmetered. The ports keep that behavior.
 */

export const TIER_AI_LIMITS = { starter: 15, pro: 50, elite: 150, enterprise: -1 };

/**
 * Check + increment the caller's monthly AI counter.
 * Returns { allowed: true } or { allowed: false, status: 402, body } with the
 * Base44-shaped upgrade message.
 */
export async function meterAiGeneration(svc, profile, now = new Date()) {
  const tier = profile.subscription_tier || 'starter';
  const aiLimit = TIER_AI_LIMITS[tier] ?? 15;
  if (aiLimit === -1) return { allowed: true, used: null, limit: -1 };

  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const storedMonth = profile.ai_generation_month || '';
  const count = storedMonth === currentMonth ? (profile.ai_generation_count || 0) : 0;

  if (count >= aiLimit) {
    const upgradeHint = {
      starter: 'upgrade to Pro for 50 AI generations/month',
      pro: 'upgrade to Elite for 150 AI generations/month',
      elite: 'upgrade to Enterprise for unlimited AI generations',
    };
    return {
      allowed: false,
      status: 402,
      body: {
        error: 'monthly_ai_limit_reached',
        message: `You've used ${count}/${aiLimit} AI generations this month — ${upgradeHint[tier] || 'upgrade your plan'}.`,
        used: count,
        limit: aiLimit,
      },
    };
  }

  const { error } = await svc.from('profiles')
    .update({ ai_generation_count: count + 1, ai_generation_month: currentMonth })
    .eq('id', profile.id);
  if (error) throw new Error(`meterAiGeneration: ${error.message}`);
  return { allowed: true, used: count + 1, limit: aiLimit };
}
