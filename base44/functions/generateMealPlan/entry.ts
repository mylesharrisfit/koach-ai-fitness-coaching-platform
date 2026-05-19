import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { age, sex, weightKg, goal, diet, calories, protein, carbs, fats,
            mealsPerDay, preWorkout, preWorkoutCarbs, postWorkout, restrictions, supplements,
            supplementDosages, mealComplexity, condiments } = await req.json();

    const mealCount = mealsPerDay + (preWorkout ? 1 : 0) + (postWorkout ? 1 : 0);

    const complexityLine = mealComplexity
      ? `Meal complexity: ${mealComplexity} — adjust recipe complexity accordingly. Very Basic means plain grilled/boiled foods with minimal prep. Gourmet means sophisticated techniques, marinades, complex flavors.`
      : '';

    const condimentsLine = condiments && condiments.length > 0
      ? `Condiments/seasonings to incorporate: ${condiments.join(', ')}. Include these in the HOW TO PREPARE instructions for relevant meals.`
      : '';

    const supplementsLine = supplements && supplements.filter(s => s !== 'None').length > 0
      ? `Supplements & timing:\n${supplements.filter(s => s !== 'None').map(s => `- ${s}: ${(supplementDosages && supplementDosages[s]) || s}`).join('\n')}\n\nInclude supplement timing in meal instructions. For each meal that coincides with a supplement dose, add a note at the end of the instructions formatted as: "💊 Supplements with this meal: [supplement name] - [dose]". For example, add Creatine note to the post-workout meal, Vitamin D to a meal with fats, Magnesium to the last meal, Caffeine/Pre-Workout to the pre-workout meal.`
      : '';

    const prompt = `Create a one-day meal plan as a JSON array only. No markdown, no explanations.

Stats: ${age}yr ${sex}, ${weightKg}kg | Goal: ${goal} | Diet: ${diet || 'Standard'}
Targets: ${calories}kcal, P${protein}g, C${carbs}g, F${fats}g
Meals: ${mealCount} total (${mealsPerDay} regular${preWorkout ? ', 1 pre-workout' : ''}${postWorkout ? ', 1 post-workout' : ''})
Restrictions: ${restrictions || 'None'}
${complexityLine}
${condimentsLine}
${supplementsLine}

IMPORTANT: Every food object must have a "name" field (string) with the food name. Every meal object must have a "name" field with the meal name.
Each meal: {"name","time","calories","protein","carbs","fats","foods":[{"name","amount","calories","protein","carbs","fats"}],"instructions","prepTime"}
Keep foods array to 3-4 items max per meal. Keep instructions under 30 words.
${preWorkout ? 'Pre-workout: carb-heavy.' : ''} ${postWorkout ? 'Post-workout: high protein+carbs.' : ''}
Return ONLY the JSON array.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Anthropic API error: ${response.status} ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const meals = JSON.parse(cleaned);

    return Response.json({ meals });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});