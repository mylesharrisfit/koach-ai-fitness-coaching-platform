import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { age, sex, weightKg, goal, diet, calories, protein, carbs, fats,
            mealsPerDay, preWorkout, preWorkoutCarbs, postWorkout, restrictions, supplements } = await req.json();

    const prompt = `Generate a detailed one-day meal plan as JSON only, no markdown.

Client stats: ${age}yr ${sex}, ${weightKg}kg, goal: ${goal}, diet: ${diet || 'Standard'}
Daily targets: ${calories} kcal, ${protein}g protein, ${carbs}g carbs, ${fats}g fats
Meals per day: ${mealsPerDay}
Include pre-workout meal: ${preWorkout}
Include post-workout meal: ${postWorkout}
Restrictions: ${restrictions || 'None'}
Supplements: ${(supplements || []).join(', ') || 'None'}

Return ONLY a JSON array of meals like this:
[
  {
    "name": "Breakfast",
    "time": "7:00 AM",
    "type": "main",
    "calories": 520,
    "protein": 42,
    "carbs": 55,
    "fats": 12,
    "foods": [
      {
        "name": "Scrambled Eggs",
        "amount": "3 large eggs",
        "calories": 234,
        "protein": 18,
        "carbs": 2,
        "fats": 16,
        "prep": "Whisk and cook in non-stick pan with cooking spray"
      }
    ],
    "instructions": "Prepare eggs first, then oats. Can be meal prepped the night before.",
    "prepTime": "10 mins"
  }
]

Make foods realistic, match the dietary preference, hit the macro targets closely.
Pre-workout meal should be carb-heavy if carb focus is ${preWorkoutCarbs}.
Post-workout meal should be protein + carbs focused.
Return ONLY the JSON array, no other text.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Anthropic API error: ${response.status} ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '[]';

    // Strip any markdown fences if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const meals = JSON.parse(cleaned);

    return Response.json({ meals });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});