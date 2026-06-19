import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TIER_AI_LIMITS = { starter: 15, pro: 50, elite: 150, enterprise: -1 };

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    meal_name: { type: 'string' },
    time: { type: 'string' },
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
                portion: { type: 'string' },
                calories: { type: 'number' },
                protein: { type: 'number' },
                carbs: { type: 'number' },
                fats: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: 'invalid_request_body' }, { status: 400 });
    }
    const { calories, protein_g, carbs_g, fats_g, meal_count, options_count, mode, meal } = body;

    // ── AI generation metering — mirrors validateSubscription.js TIER_LIMITS ──
    const tier = user.subscription_tier || 'starter';
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

    // ── Single-meal regeneration ──
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

    // ── Full plan generation ──
    const mealOrder = ['Breakfast', 'Lunch', 'Dinner', 'Pre-Workout', 'Post-Workout', 'Snack'];
    const mealNames = mealOrder.slice(0, Number(meal_count));

    const prompt = `You are a professional sports dietitian. Generate a ${meal_count}-meal nutrition plan with ${options_count} distinct OPTIONS per meal.

Daily targets:
- Calories: ${calories} kcal
- Protein: ${protein_g}g
- Carbs: ${carbs_g || 'balanced'}g
- Fats: ${fats_g || 'balanced'}g

Meals: ${mealNames.join(', ')}

Rules:
- Each meal has exactly ${options_count} options. Options are DIFFERENT meal choices (e.g., Option 1 = eggs & oats, Option 2 = yogurt & fruit).
- All options for the same meal must have similar calorie/macro totals (within 5% of each other).
- Each option has 2-4 food items with accurate individual macros.
- Give each option a short label (e.g., "High Protein", "Plant-Based", "Quick & Easy").
- All meals combined should hit the daily targets.

Return JSON with a "meals" array.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: { meals: { type: 'array', items: MEAL_SCHEMA } },
      },
    });

    return Response.json({ meals: result?.meals || [] });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});