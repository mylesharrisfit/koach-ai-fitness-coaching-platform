import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      age, sex, weightKg, heightCm, bodyFatPct, bodyType,
      goal, goalSubtype, goalWeight, timeline,
      diet, allergies, dislikedFoods, lovedFoods, culturalPreference, cookingSkill,
      calories, protein, carbs, fats,
      trainingDaysPerWeek, trainingTime, trainingType, trainingDuration, trainingIntensity,
      mealsPerDay, preWorkout, postWorkout,
      occupationType, wakeTime, sleepTime, workHours, haslunchBreak, canMealPrep,
      cookingTimePerDay, hasKitchenAtWork, travelFrequency,
      eatingOutFrequency, fastFoodNeeded, favoriteFastFood,
      digestiveIssues, hungerLevel, energyCrashes, sleepQuality,
      supplements, supplementDosages, mealComplexity, condiments,
      restrictions, notes,
    } = body;

    // Body type strategy
    const bodyTypeNotes = {
      ectomorph:    'ECTOMORPH: Higher calorie density foods, 5-6 meals/day, more carbs throughout, liquid calories/smoothies acceptable, larger portions.',
      mesomorph:    'MESOMORPH: Balanced macros, carb cycling works well, 4-5 meals/day, moderate portion sizes.',
      endomorph:    'ENDOMORPH: Vegetables at every meal, carbs mainly around training, more protein for satiety, 3-4 meals, no liquid calories.',
      ecto_meso:    'ECTO-MESO: Slightly higher carbs, moderate portions, 4-5 meals, some liquid calories acceptable.',
      endo_meso:    'ENDO-MESO: Moderate carbs with carb cycling, vegetables at most meals, 4 meals, whole food focus.',
    };

    // Cultural food preferences
    const culturalNotes = {
      latin_caribbean: 'Use Latin/Caribbean foods: rice and beans, plantains, yuca, ground beef, chicken, sofrito seasoning, adobo, sazon. Fast food: Chipotle, Pollo Tropical.',
      asian:           'Use Asian foods: rice as primary carb, noodles, tofu, fish, chicken, stir-fry methods, soy sauce, ginger, sesame.',
      mediterranean:   'Use Mediterranean foods: olive oil, legumes, fish, whole grains, lots of vegetables, simple fresh ingredients.',
      african:         'Use African foods: rice, plantains, yams, stews, groundnut-based dishes, grilled meats, leafy greens.',
      middle_eastern:  'Use Middle Eastern foods: rice, lentils, hummus, grilled meats, pita, tahini, za\'atar.',
      indian:          'Use Indian foods: rice, lentils (dal), chicken, paneer, spices (cumin, turmeric, coriander), naan/roti.',
      american:        'Use American foods: grilled proteins, potatoes, salads, sandwiches, burgers. Fast food: Chipotle, Chick-fil-A, McDonald\'s.',
    };

    // Hunger strategy
    const hungerNotes = {
      always_hungry:  'HIGH HUNGER: Vegetables at every meal for volume, protein at every meal, high fiber carbs, more frequent meals, zero-calorie snacks between meals (cucumber, pickles, celery).',
      normal:         'NORMAL HUNGER: Standard meal spacing, balanced meals.',
      low_appetite:   'LOW APPETITE: Calorie-dense foods (nuts, avocado, nut butter, oils), fewer larger meals, smoothies and shakes count as meals, liquid meals acceptable.',
    };

    // Cooking time strategy
    const cookingNotes = {
      under_15: 'VERY LIMITED COOKING: Pre-made foods (rotisserie chicken, canned tuna, Greek yogurt, protein bars). 5 ingredients max. Air fryer and microwave only. Fast food every meal option.',
      '15_30':  'LIMITED COOKING: Simple pan/air fryer recipes, meal prep options, 5-6 ingredients max.',
      '30_60':  'MODERATE COOKING: Standard home cooking, meal prep Sundays, varied methods.',
      over_60:  'ENJOYS COOKING: Complex recipes, marinating, multiple components, gourmet preparations.',
    };

    // Shift worker note
    const isShiftWorker = occupationType === 'shift_worker';
    const shiftNote = isShiftWorker
      ? `SHIFT WORKER: Do NOT use breakfast/lunch/dinner labels. Use Meal 1, Meal 2, Meal 3 etc. with actual times based on their schedule. Include pre-sleep meal. Work schedule: ${workHours || 'irregular'}.`
      : '';

    const wakeNote = wakeTime ? `Client wakes at ${wakeTime}. First meal within 30-60 min of waking.` : '';
    const sleepNote = sleepTime ? `Client sleeps at ${sleepTime}. Last meal 1-2 hours before sleep.` : '';
    const lunchNote = haslunchBreak === false ? 'Client has NO lunch break. Plan meals around this — no midday meal.' : '';

    const trainingTimeNote = trainingTime
      ? `Training time: ${trainingTime}. Pre-workout meal: 60-90 min before. Post-workout meal: within 45 min after.`
      : '';

    const travelNote = travelFrequency === 'frequently' || travelFrequency === 'always'
      ? 'Client travels frequently. Include portable, grab-and-go options that work in hotels and airports.'
      : '';

    const fastFoodNote = fastFoodNeeded
      ? `Include fast food alternatives for every meal. Favorite restaurants: ${favoriteFastFood || 'any major chain'}.`
      : '';

    const digestNote = digestiveIssues
      ? `Digestive issues: ${digestiveIssues}. Avoid foods that commonly worsen this. Choose easily digestible options.`
      : '';

    const energyNote = energyCrashes
      ? `Client has energy crashes. Avoid large blood sugar spikes. Prioritize complex carbs, protein, and fat at meals to sustain energy.`
      : '';

    const trainingDayCarbs = trainingType && trainingDaysPerWeek > 0 ? Math.round(carbs * 1.2) : carbs;
    const restDayCarbs     = trainingDaysPerWeek > 0 ? Math.round(carbs * 0.8) : carbs;
    const restDayFats      = Math.round(fats * 1.15);

    const supplementsSection = supplements && supplements.filter(s => s !== 'None').length > 0
      ? `SUPPLEMENTS TO INCLUDE IN PLAN:
${supplements.filter(s => s !== 'None').map(s => `- ${s}: ${(supplementDosages && supplementDosages[s]) || ''}`).join('\n')}
Include supplement timing at the meal they should be taken. Add note: "💊 With this meal: [supplement] - [dose]"`
      : '';

    const prompt = `You are a board-certified sports nutritionist creating a fully personalized meal plan. Generate a COMPLETE, DETAILED 2-day plan: one TRAINING DAY and one REST DAY. Output ONLY valid JSON, no markdown.

## CLIENT PROFILE
- Age: ${age}yr | Sex: ${sex} | Weight: ${weightKg}kg | Height: ${heightCm || 'not provided'}cm
- Body fat: ${bodyFatPct ? bodyFatPct + '%' : 'not provided'} | Body type: ${bodyType || 'not specified'}
- Goal: ${goal} (${goalSubtype || ''}) | Timeline: ${timeline || 'ongoing'}
- Goal weight: ${goalWeight || 'not specified'}

## CALCULATED TARGETS
Training day: ${calories}kcal | Protein: ${protein}g | Carbs: ${trainingDayCarbs}g | Fats: ${fats}g
Rest day: ${Math.round(calories * 0.9)}kcal | Protein: ${protein}g | Carbs: ${restDayCarbs}g | Fats: ${restDayFats}g

## TRAINING SCHEDULE
- Days/week: ${trainingDaysPerWeek || 4} | Time: ${trainingTime || 'morning'} | Type: ${trainingType || 'weights'}
- Duration: ${trainingDuration || '60 min'} | Intensity: ${trainingIntensity || 'moderate'}
${trainingTimeNote}

## LIFESTYLE
- Occupation: ${occupationType || 'desk job'} | Wake: ${wakeTime || '7am'} | Sleep: ${sleepTime || '10pm'}
- Work hours: ${workHours || '9am-5pm'} ${lunchNote}
- Meal prep: ${canMealPrep || 'sometimes'} | Cooking time: ${cookingTimePerDay || '30-60 min'}
- Kitchen at work: ${hasKitchenAtWork || 'no'} | Travel: ${travelFrequency || 'never'}
${shiftNote}
${wakeNote}
${sleepNote}
${travelNote}

## FOOD PROFILE
- Diet: ${diet || 'Standard'} | Allergies: ${allergies || 'None'}
- Dislikes: ${dislikedFoods || 'None'} | Loves: ${lovedFoods || 'Not specified'}
- Cultural preference: ${culturalPreference || 'no preference'} | Cooking skill: ${cookingSkill || 'intermediate'}
- Eating out: ${eatingOutFrequency || 'occasionally'}
${fastFoodNote}
${digestNote}

## HEALTH & HUNGER
- Hunger: ${hungerLevel || 'normal'} | Sleep quality: ${sleepQuality || 'average'}
${energyNote}
- Extra notes: ${notes || 'None'}

## BODY TYPE STRATEGY
${bodyTypeNotes[bodyType] || 'Balanced approach with standard macro distribution.'}

## CULTURAL FOODS
${culturalNotes[culturalPreference] || 'Use universally accessible whole foods.'}

## HUNGER STRATEGY
${hungerNotes[hungerLevel] || ''}

## COOKING STRATEGY
${cookingNotes[cookingTimePerDay] || ''}

## MEAL COMPLEXITY
${mealComplexity || 'moderate'} — adjust recipe sophistication accordingly.

## CONDIMENTS/SEASONINGS
${condiments && condiments.length > 0 ? condiments.join(', ') : 'standard herbs and spices'}

${supplementsSection}

## OUTPUT FORMAT
Return a JSON object with this EXACT structure:

{
  "training_day": {
    "day_type": "Training Day",
    "total_calories": number,
    "total_protein": number,
    "total_carbs": number,
    "total_fats": number,
    "meals": [
      {
        "name": "Meal name (e.g. Breakfast, Pre-Workout, Post-Workout, Lunch, Dinner)",
        "type": "breakfast|pre_workout|post_workout|lunch|dinner|snack|evening",
        "time": "7:00 AM",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fats": number,
        "prep_time": "10 min",
        "why_this_meal": "Brief coach note explaining why this meal at this time",
        "foods": [
          {
            "name": "Full food name",
            "amount_grams": number,
            "amount_household": "1 cup / 4 oz / 2 tbsp",
            "prep_method": "grilled / raw / air fried / microwaved",
            "calories": number,
            "protein": number,
            "carbs": number,
            "fats": number
          }
        ],
        "instructions": "Step by step prep in 30 words max",
        "option_b": "Quick alternative hitting same macros within 10% (e.g. canned tuna + rice cakes)",
        "option_c": "${fastFoodNeeded ? 'Exact fast food order: e.g. Chipotle bowl - double chicken, brown rice, black beans, fajita veggies, salsa' : 'Simple whole food swap'}"
      }
    ]
  },
  "rest_day": {
    "day_type": "Rest Day",
    "total_calories": number,
    "total_protein": number,
    "total_carbs": number,
    "total_fats": number,
    "meals": [ ... same structure, no pre/post workout meals, lower carbs, more even spacing ... ]
  },
  "hydration": {
    "daily_oz": number,
    "morning": "16-20 oz before anything else",
    "pre_workout": "16 oz 30 min before training",
    "during_workout": "8 oz every 20 min",
    "post_workout": "20 oz within 30 min",
    "electrolytes": "recommendation based on training intensity"
  },
  "macro_flexibility_rules": [
    "If you hit your protein target, everything else is more flexible",
    "High fat meal → reduce carbs by equivalent calories that day",
    "Missed a meal → spread remaining macros across next meals, don't skip"
  ],
  "coach_notes": {
    "why_these_calories": "Explanation of the calorie target",
    "key_priorities": "Top 3 things this client must focus on",
    "first_2_weeks": "What to watch for and expect",
    "reassess_at": "When and why to reassess",
    "body_type_advice": "Specific advice for their body type and goal"
  },
  "client_notes": "Plain English summary for the client — 3-4 sentences max, friendly tone",
  "shopping_list": ["item 1 with quantity", "item 2 with quantity"],
  "weekly_overview": {
    "training_days": ${trainingDaysPerWeek || 4},
    "rest_days": ${7 - (trainingDaysPerWeek || 4)},
    "avg_daily_calories": number,
    "weekly_protein_target": number,
    "estimated_weekly_cost_usd": number
  }
}

CRITICAL RULES:
1. Every food must show BOTH grams AND household measurements
2. Pre-workout meal: high carb, moderate protein, low fat, fast-digesting
3. Post-workout meal: high protein, high carb, VERY low fat
4. Rest day meals: lower carbs, higher fats, evenly spaced, no pre/post timing
5. All options (A/B/C) must hit within 10% of the same macros
6. Never include foods from the dislikes or allergies list
7. Every meal must have at least one protein source
8. Macros must add up accurately — total should match targets within 5%
9. Be specific: "175g grilled chicken breast" not "chicken"
10. Return ONLY the JSON object, no markdown backticks`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY'),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return Response.json({ error: `Anthropic API error: ${response.status} ${errText}` }, { status: 500 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Normalize: also expose flat meals array for backward compatibility
    const trainingMeals = parsed.training_day?.meals || [];
    return Response.json({
      meals: trainingMeals, // backward compat
      plan: parsed,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});