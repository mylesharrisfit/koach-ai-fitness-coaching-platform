import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // ── AI generation metering — all tiers (mirrors validateSubscription.js TIER_LIMITS) ──
    const TIER_AI_LIMITS = { starter: 15, pro: 50, elite: 150, enterprise: -1 };
    const tier = user.subscription_tier || 'starter';
    const aiLimit = TIER_AI_LIMITS[tier] ?? 15;

    if (aiLimit !== -1) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
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

      // Increment counter for all metered tiers
      const newCount = count + 1;
      await base44.asServiceRole.entities.User.update(user.id, {
        ai_generation_count: newCount,
        ai_generation_month: currentMonth,
      });
    }

    const body = await req.json();
    const {
      age, sex, weightKg, goal, diet, allergies, dislikedFoods, lovedFoods,
      calories, protein, carbs, fats,
      trainingDaysPerWeek, trainingTime, mealsPerDay, preWorkout, postWorkout,
      wakeTime, sleepTime, supplements, supplementDosages,
    } = body;

    const numMeals = Math.min(Number(mealsPerDay) || 4, 5);
    const restCalories = Math.round(Number(calories) * 0.9);
    const restCarbs    = Math.round(Number(carbs) * 0.8);
    const restFats     = Math.round(Number(fats) * 1.15);

    const goalFoods = {
      fat_loss:    'Use: chicken breast, egg whites, tuna, tilapia, ground turkey, sweet potato (small), oats, broccoli, spinach, peppers, cucumber. High protein, moderate carbs, vegs at every meal.',
      muscle_gain: 'Use: chicken breast, ground beef 90/10, salmon, whole eggs, Greek yogurt, white rice, sweet potato, oats, banana, bread, avocado, peanut butter. More carbs for energy.',
      recomp:      'Use: chicken breast, eggs, cottage cheese, Greek yogurt, sweet potato, white rice (around training), oats, broccoli, spinach. Balance protein and carbs.',
      performance: 'Use: chicken, salmon, eggs, white rice, pasta, oats, banana, sweet potato, olive oil. Carbs as primary fuel, high carb pre/post workout.',
      maintenance: 'Use: chicken, fish, eggs, lean beef, rice, potatoes, oats, olive oil, nuts, vegetables. Balanced variety.',
    };

    const supplementNote = supplements && supplements.filter(s => s !== 'None').length > 0
      ? `Supplements to include in instructions: ${supplements.filter(s => s !== 'None').join(', ')}`
      : '';

    const prompt = `Generate a meal plan as JSON only. No markdown, no text outside JSON.

Client: ${age}yr ${sex}, ${weightKg}kg, goal: ${goal}, diet: ${diet || 'Standard'}
Targets (training day): ${calories} kcal | P:${protein}g | C:${carbs}g | F:${fats}g
Targets (rest day): ${restCalories} kcal | P:${protein}g | C:${restCarbs}g | F:${restFats}g
Meals: ${numMeals} per day | Wake: ${wakeTime || '07:00'} | Sleep: ${sleepTime || '22:00'}
Training time: ${trainingTime || 'Morning'}, ${trainingDaysPerWeek || 4} days/week
Pre-workout meal: ${preWorkout ? 'yes' : 'no'} | Post-workout: ${postWorkout ? 'yes' : 'no'}
Avoid: ${allergies || 'none'}, ${dislikedFoods || 'none'}
Preferred: ${lovedFoods || 'any'}
Food guide: ${goalFoods[goal] || goalFoods.maintenance}
${supplementNote}

Return this exact JSON (fill in all numbers accurately):
{"training_day":{"meals":[{"id":"meal_1","name":"Breakfast","time":"8:00 AM","calories":0,"protein":0,"carbs":0,"fats":0,"instructions":"","why_this_meal":"","option_b":"","foods":[{"name":"","amount":0,"unit":"g","amount_household":"","prep_method":"","calories":0,"protein":0,"carbs":0,"fats":0}]}]},"rest_day":{"meals":[]},"hydration":{"daily_oz":80,"morning":"16 oz before eating","post_workout":"24 oz after training","electrolytes":"Add electrolytes on hard training days"},"coach_notes":{"why_these_calories":"","key_priorities":"","first_2_weeks":""},"client_notes":"","shopping_list":[],"macro_flexibility_rules":["Hit protein first","Adjust carbs/fats as needed"],"weekly_overview":{"training_days":${trainingDaysPerWeek || 4},"rest_days":${7 - (trainingDaysPerWeek || 4)},"avg_daily_calories":${Math.round((Number(calories) * (trainingDaysPerWeek || 4) + restCalories * (7 - (trainingDaysPerWeek || 4))) / 7)},"weekly_protein_target":${Number(protein) * 7},"estimated_weekly_cost_usd":75}}

Rules:
- ${numMeals} meals in training_day.meals, ${numMeals} meals in rest_day.meals
- Each food: amount is grams (number), amount_household is "1 cup / 4 oz" style string
- Food macros must sum to meal totals; meal totals must sum to daily targets ±5%
- Real food names only (e.g. "Chicken Breast", "White Rice cooked", "Broccoli")
- Keep each meal's foods list to 3-4 items max to stay within token limit`;

    const parsed = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          training_day: { type: 'object' },
          rest_day: { type: 'object' },
          hydration: { type: 'object' },
          coach_notes: { type: 'object' },
          client_notes: { type: 'string' },
          shopping_list: { type: 'array', items: { type: 'string' } },
          macro_flexibility_rules: { type: 'array', items: { type: 'string' } },
          weekly_overview: { type: 'object' },
        },
      },
    });

    if (!parsed || !parsed.training_day) {
      return Response.json({ error: 'AI returned an invalid meal plan structure' }, { status: 500 });
    }

    const trainingMeals = parsed.training_day?.meals || [];
    const restMeals     = parsed.rest_day?.meals || [];
    console.log(`Generated ${trainingMeals.length} training meals, ${restMeals.length} rest meals`);

    // Append the standard supplement protocol to every generated plan
    const defaultSupplements = [
      { name: 'Multivitamin',           dosage: '1 serving',        timing: 'Morning', purpose: 'Micronutrient insurance' },
      { name: 'Vitamin D3',             dosage: '2,000–5,000 IU',   timing: 'Morning', purpose: 'Testosterone, immunity, bone health' },
      { name: 'Omega-3 Fish Oil',       dosage: '2–3g EPA+DHA',     timing: 'Morning', purpose: 'Inflammation, joints, recovery' },
      { name: 'Creatine Monohydrate',   dosage: '5g daily',         timing: 'Morning', purpose: 'Strength, power, muscle retention' },
      { name: 'Vitamin C',              dosage: '500–1,000mg',      timing: 'Morning', purpose: 'Immune support, collagen synthesis' },
      { name: 'Magnesium Glycinate',    dosage: '200–400mg',        timing: 'Night',   purpose: 'Sleep, muscle recovery, stress' },
      { name: 'Zinc',                   dosage: '15–30mg',          timing: 'Night',   purpose: 'Testosterone, immune health, protein synthesis' },
      { name: 'Ashwagandha KSM-66',     dosage: '300–600mg',        timing: 'Night',   purpose: 'Cortisol, sleep quality, testosterone' },
    ];
    parsed.supplements = defaultSupplements;

    return Response.json({ meals: trainingMeals, plan: parsed });

  } catch (error) {
    console.error('generateMealPlan error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});