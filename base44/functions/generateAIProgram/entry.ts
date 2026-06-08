import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile, preferences } = await req.json();

    // Fetch the coach's exercise library to ground the AI in real exercises
    const exerciseLibrary = await base44.entities.ExerciseLibrary.list();
    const libraryNames = exerciseLibrary.map(e => e.name).filter(Boolean);
    const libraryByName = {};
    exerciseLibrary.forEach(e => { if (e.name) libraryByName[e.name.toLowerCase()] = e; });

    // Determine split recommendation based on days
    const dpw = Number(profile.days_per_week) || 4;
    const preferredSplit = profile.preferred_split || 'Let AI decide';

    const splitGuidance = (() => {
      if (preferredSplit && preferredSplit !== 'Let AI decide') return preferredSplit;
      if (dpw <= 3) return 'Full Body (3x/week) or Upper/Lower (2x/week)';
      if (dpw === 4) return 'Upper/Lower split (2x upper, 2x lower)';
      if (dpw === 5) return 'Push/Pull/Legs + Upper + Lower or PPL + Full Body';
      return 'Push/Pull/Legs or Body Part Split';
    })();

    const levelVolumeGuidance = (() => {
      const level = profile.fitness_level;
      if (level === 'complete_beginner' || level === 'beginner') {
        return 'Total weekly sets per muscle group: 8–12. Use compound movements predominantly. Keep rep ranges 8–15. RPE 6–8.';
      }
      if (level === 'intermediate') {
        return 'Total weekly sets per muscle group: 12–18. Mix compounds and accessories. Strength days: 4–6 reps RPE 8–9. Hypertrophy: 8–12 reps RPE 7–8.';
      }
      return 'Total weekly sets per muscle group: 16–22. Periodize rep ranges. Include intensity techniques (dropsets, supersets). Strength blocks: 1–5 reps RPE 9. Hypertrophy: 6–12 reps RPE 8–9.';
    })();

    const goalGuidance = (() => {
      const g = profile.goal;
      if (g === 'strength') return 'Prioritize compound lifts at 1–6 reps, RPE 8–10. Accessories at 6–10 reps. Minimal cardio. Linear load progression each week.';
      if (g === 'muscle_gain') return 'Main lifts 4–8 reps RPE 8. Accessories 8–15 reps RPE 7–8. Volume drives hypertrophy. Progress by adding reps then weight.';
      if (g === 'fat_loss') return 'Maintain strength with compounds at 6–10 reps. Higher rep accessories 12–20 for metabolic effect. Supersets where possible. Include conditioning.';
      if (g === 'athletic') return 'Mix power (2–5 reps explosive), strength (3–6 reps), and hypertrophy (8–12 reps). Include sport-specific movement patterns.';
      return 'Balanced volume across rep ranges 8–15. Prioritize consistency and movement quality.';
    })();

    const strengthContext = (() => {
      const parts = [];
      if (profile.current_squat) parts.push(`Squat: ${profile.current_squat}`);
      if (profile.current_bench) parts.push(`Bench: ${profile.current_bench}`);
      if (profile.current_deadlift) parts.push(`Deadlift: ${profile.current_deadlift}`);
      if (profile.current_ohp) parts.push(`OHP: ${profile.current_ohp}`);
      return parts.length > 0 ? parts.join(', ') : 'not provided';
    })();

    const libraryContext = libraryNames.length > 0
      ? `EXERCISE LIBRARY (use these names EXACTLY where appropriate — they have demo videos and thumbnails):\n${libraryNames.slice(0, 80).join(', ')}`
      : '';

    const prompt = `You are an elite strength and conditioning coach with 20 years of experience programming for athletes and general population clients. Generate a highly specific, expert-quality workout program.

CLIENT PROFILE:
- Primary Goal: ${profile.goal}
- Experience Level: ${profile.fitness_level} (${profile.years_lifting ? profile.years_lifting + ' years lifting' : 'years unspecified'})
- Age: ${profile.age || 'not specified'}, Gender: ${profile.gender || 'not specified'}
- Training Days: ${dpw}x/week
- Session Length: ${profile.session_length} minutes
- Equipment: ${(profile.equipment || []).join(', ') || 'full gym'}
- Injuries/Limitations: ${profile.injuries || 'none'}
- Movements to Avoid: ${profile.movements_to_avoid || 'none'}
- Priority Muscles: ${(profile.priority_muscles || []).join(', ') || 'balanced'}
- Preferred Split: ${preferredSplit}
- Current Strength (1RM or working): ${strengthContext}

PROGRAM PREFERENCES:
- Duration: ${preferences.duration} weeks
- Progression Model: ${preferences.progression_style}
- Deload: ${preferences.include_deload ? 'yes, ' + (preferences.deload_frequency || 'every 4 weeks').replace(/_/g, ' ') : 'no'}
- Cardio: ${preferences.include_cardio ? `yes (${preferences.cardio_type})` : 'no'}
- Extra notes: ${preferences.extra_notes || 'none'}

PROGRAMMING GUIDELINES:
Split: ${splitGuidance}
Volume: ${levelVolumeGuidance}
Goal-specific prescription: ${goalGuidance}

${libraryContext}

REQUIREMENTS FOR THE PROGRAM:
1. Choose the optimal training split for this client's days/week and goal. Assign which muscle groups go on which day.
2. Sequence exercises WITHIN each day: warmup first, then compound movements (section: "main"), then accessories (section: "main" with lower priority), then finisher if appropriate (section: "finisher"). Cooldown at end if needed.
3. For EVERY exercise specify: exact sets, rep range as a string (e.g. "4-6", "8-12", "12-15"), rest in seconds, and RPE as a string (e.g. "8", "7-8", "9").
4. Set notes = concrete coaching cue for that exercise (e.g. "Drive through heels, brace core through entire ROM").
5. Apply progression week over week: notes or prescription should indicate how to progress (add 2.5kg when reps hit top of range, etc.).
6. Generate the TEMPLATE WEEK (one full week) — the builder handles repeating it across all weeks.
7. If injuries or movements to avoid are listed, NEVER include those movements.
8. Use exercises from the provided library where possible (exact name match). You may add exercises not in the library but prefer library names.
9. Include a coach_rationale field at the top level explaining: split choice, weekly volume per key muscle group, rep-range rationale, progression approach.

Return ONLY valid JSON (no markdown, no code blocks) with this EXACT structure:
{
  "title": "Descriptive program name (e.g. '12-Week Intermediate Upper/Lower Hypertrophy')",
  "description": "2-3 sentence description of the program philosophy",
  "category": "strength|hypertrophy|fat_loss|athletic|mobility|custom",
  "difficulty": "beginner|intermediate|advanced|elite",
  "duration_weeks": number,
  "days_per_week": number,
  "coach_rationale": {
    "split": "Why this split was chosen",
    "weekly_volume": "Key muscle group: X sets/week (e.g. Chest: 14 sets, Back: 16 sets, Legs: 18 sets)",
    "rep_range_rationale": "Why these rep ranges match the goal",
    "progression_approach": "How load/volume progresses"
  },
  "workouts": [
    {
      "day_name": "Day 1 — Upper Strength (Chest/Back focus)",
      "day_number": 1,
      "workout_notes": "Brief focus/intent for this session",
      "exercises": [
        {
          "name": "Exercise name (match library if possible)",
          "sets": number,
          "reps": "rep range string e.g. '4-6' or '10-12'",
          "rest_seconds": number,
          "rpe": "RPE string e.g. '8' or '7-8'",
          "section": "warmup|main|finisher|cooldown",
          "notes": "Specific coaching cue for this exercise",
          "prescription": "Full prescription string e.g. '4 × 4-6 @ RPE 8'"
        }
      ]
    }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'claude_sonnet_4_6',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          difficulty: { type: 'string' },
          duration_weeks: { type: 'number' },
          days_per_week: { type: 'number' },
          coach_rationale: {
            type: 'object',
            properties: {
              split: { type: 'string' },
              weekly_volume: { type: 'string' },
              rep_range_rationale: { type: 'string' },
              progression_approach: { type: 'string' },
            },
          },
          workouts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day_name: { type: 'string' },
                day_number: { type: 'number' },
                workout_notes: { type: 'string' },
                exercises: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      sets: { type: 'number' },
                      reps: { type: 'string' },
                      rest_seconds: { type: 'number' },
                      rpe: { type: 'string' },
                      section: { type: 'string' },
                      notes: { type: 'string' },
                      prescription: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Enrich exercises with library thumbnails where available
    if (result && result.workouts) {
      result.workouts = result.workouts.map(workout => ({
        ...workout,
        exercises: (workout.exercises || []).map(ex => {
          const libMatch = libraryByName[ex.name?.toLowerCase()];
          if (libMatch) {
            return {
              ...ex,
              library_id: libMatch.id,
              image_url: libMatch.thumbnail_url || libMatch.image_url || ex.image_url,
              video_url: libMatch.video_url || ex.video_url,
              muscle_group: libMatch.muscle_group || ex.muscle_group,
            };
          }
          return ex;
        }),
      }));
    }

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});