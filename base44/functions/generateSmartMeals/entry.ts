import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TIER_AI_LIMITS = { starter: 15, pro: 50, elite: 150, enterprise: -1 };

// Compact single-meal schema — keeps each InvokeLLM response small and fast
const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    meal_name: { type: 'string' },
    time:      { type: 'string' },
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          foods: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                food_name: { type: 'string' },
                portion:   { type: 'string' },
                calories:  { type: 'number' },
                protein:   { type: 'number' },
                carbs:     { type: 'number' },
                fats:      { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};

const MEALS_ARRAY_SCHEMA = {
  type: 'object',
  properties: { meals: { type: 'array', items: MEAL_SCHEMA } },
};

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'];

/**
 * Build a compact prompt for a subset of meals (a "batch").
 * Keeping each prompt to 2-3 meals stays well under the token threshold
 * that causes slow responses, and runs in ~5-7s per call.
 */
function buildBatchPrompt(mealNames, calories, protein_g, carbs_g, fats_g, options_count, totalMeals) {
  const perMealCal = Math.round(calories / totalMeals);
  return `You are a sports dietitian. Generate exactly ${mealNames.length} meal(s): ${mealNames.join(', ')}.
Each meal must have ${options_count} distinct options.
Per-meal target: ~${perMealCal} kcal, proportional protein/carbs/fats from daily totals of ${protein_g}g P / ${carbs_g || 'balanced'} C / ${fats_g || 'balanced'} F.
Each option: 2-4 foods with accurate macros. Give each a short label (e.g. "High Protein", "Quick & Easy").
Return JSON with a "meals" array (${mealNames.length} item${mealNames.length > 1 ? 's' : ''}).`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── Parse body ──────────────────────────────────────────────────────────
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'invalid_request_body' }, { status: 400 });
    }
    const {
      calories, protein_g, carbs_g, fats_g,
      meal_count, options_count,
      mode, meal,
      client_id,        // optional — used for persisting the draft plan
      nutrition_plan_id // optional — update an existing draft instead of creating
    } = body;

    // ── AI generation metering ───────────────────────────────────────────────
    const tier    = user.subscription_tier || 'starter';
    const aiLimit = TIER_AI_LIMITS[tier] ?? 15;

    if (aiLimit !== -1) {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const storedMonth  = user.ai_generation_month || '';
      const count        = storedMonth === currentMonth ? (user.ai_generation_count || 0) : 0;

      if (count >= aiLimit) {
        const upgradeHint = {
          starter: 'upgrade to Pro for 50 AI generations/month',
          pro:     'upgrade to Elite for 150 AI generations/month',
          elite:   'upgrade to Enterprise for unlimited AI generations',
        };
        return Response.json({
          error: 'monthly_ai_limit_reached',
          message: `You've used ${count}/${aiLimit} AI generations this month — ${upgradeHint[tier] || 'upgrade your plan'}.`,
          used: count,
          limit: aiLimit,
        }, { status: 402 });
      }

      const newCount = count + 1;
      await base44.asServiceRole.entities.User.update(user.id, {
        ai_generation_count: newCount,
        ai_generation_month: currentMonth,
      });
    }

    // ── Single-meal regeneration ─────────────────────────────────────────────
    if (mode === 'regenerate' && meal) {
      const prompt = `Regenerate the "${meal.meal_name}" meal with ${options_count} distinct options.
Daily targets: ${calories}kcal, ${protein_g}g protein, ${carbs_g || 'balanced'}g carbs, ${fats_g || 'balanced'}g fats.
This meal = roughly 1/${meal.total_meals || 4} of daily totals.
Each option should have similar calories/macros. Give each option a short label.
Return a single meal JSON object.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: MEAL_SCHEMA,
      });

      return Response.json({ meal: result });
    }

    // ── Full plan generation — batched into two parallel InvokeLLM calls ────
    //
    // Strategy: split meal names into two halves and fire both simultaneously.
    // A 6-meal plan (worst case) becomes two 3-meal calls running in parallel.
    // Each call targets ~5-8s, so total latency stays well under 12s.
    //
    const totalMeals = Number(meal_count);
    const allMealNames = MEAL_ORDER.slice(0, totalMeals);

    // Split into two balanced halves
    const midpoint  = Math.ceil(allMealNames.length / 2);
    const firstHalf = allMealNames.slice(0, midpoint);
    const secondHalf = allMealNames.slice(midpoint);

    // Build parallel promises — both fire at the same time
    const batchPromises = [
      base44.integrations.Core.InvokeLLM({
        prompt: buildBatchPrompt(firstHalf, calories, protein_g, carbs_g, fats_g, options_count, totalMeals),
        response_json_schema: MEALS_ARRAY_SCHEMA,
      }),
    ];
    if (secondHalf.length > 0) {
      batchPromises.push(
        base44.integrations.Core.InvokeLLM({
          prompt: buildBatchPrompt(secondHalf, calories, protein_g, carbs_g, fats_g, options_count, totalMeals),
          response_json_schema: MEALS_ARRAY_SCHEMA,
        })
      );
    }

    // Await both in parallel
    const [firstResult, secondResult] = await Promise.all(batchPromises);

    const meals = [
      ...(firstResult?.meals || []),
      ...(secondResult?.meals || []),
    ];

    // ── Persist to NutritionPlan (draft) before returning ────────────────────
    //
    // This ensures the result survives even if the HTTP response is dropped
    // due to a proxy timeout. The frontend can re-fetch the draft on reload.
    //
    if (meals.length > 0) {
      const planData = {
        title: `AI Smart Plan — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        status: 'draft',
        is_draft: true,
        ai_generated: true,
        calories:   Number(calories)  || 0,
        protein_g:  Number(protein_g) || 0,
        carbs_g:    Number(carbs_g)   || 0,
        fats_g:     Number(fats_g)    || 0,
        meals,
      };
      if (client_id) planData.client_id = client_id;

      // Fire-and-forget persist — don't let a DB error block the response
      const persistPromise = nutrition_plan_id
        ? base44.asServiceRole.entities.NutritionPlan.update(nutrition_plan_id, { meals, status: 'draft' })
        : base44.entities.NutritionPlan.create(planData);

      // Await it — we want it saved before we return so the ID is available
      const savedPlan = await persistPromise;
      return Response.json({ meals, draft_plan_id: savedPlan?.id || null });
    }

    return Response.json({ meals });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});