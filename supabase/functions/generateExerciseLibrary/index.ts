// Supabase Edge Function: generateExerciseLibrary  (Migration Step 5d)
//
// Re-platform of base44/functions/generateExerciseLibrary — one-shot AI seed
// of ~50 exercises into the CALLER's exercise_library (rows created with
// created_by = caller; Base44 used the user context). Unmetered, as in
// Base44. Direct Anthropic call → shared client.
import { getCaller, serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
import { invokeClaude, anthropicConfigured } from '../_shared/anthropic.js';

const PROMPT = `Return ONLY a valid JSON array of exactly 50 exercises with no additional text or markdown:
[
  {
    "name": "Exercise Name",
    "muscle_group": "legs|back|chest|shoulders|biceps|triceps|core|cardio|full_body",
    "secondary_muscles": ["muscle1", "muscle2"],
    "equipment": "barbell|dumbbell|cable|machine|bodyweight|kettlebell|resistance_band|trx|other",
    "movement_pattern": "push|pull|hinge|squat|carry|rotation|isometric|cardio",
    "difficulty": "beginner|intermediate|advanced",
    "description": "Brief description of the exercise",
    "form_cues": ["Cue 1", "Cue 2", "Cue 3"],
    "common_mistakes": ["Mistake 1", "Mistake 2"],
    "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "thumbnail_url": "https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg",
    "default_rest_seconds": 90
  }
]

Generate 50 exercises across these categories:
- 10 leg exercises (squats, deadlifts, lunges, leg press, leg curl variations)
- 10 chest exercises (bench variations, flyes, pushups, dips)
- 10 back exercises (rows, pullups, lat pulldown, deadlifts, face pulls)
- 8 shoulder exercises (overhead press, lateral raises, face pulls, shrugs)
- 6 arm exercises (curls, extensions, dips variations)
- 6 core exercises (planks, crunches, ab wheel, dead bugs)

Use REAL YouTube video IDs from actual tutorials. Get video IDs from these channels:
- Alan Thrall (AthleanX style education)
- Jeff Nippard (Renaissance Periodization style)
- Garage Strength (Olympic lifting)
- Script Junkies (Form focused)

Extract the video ID from URLs like https://www.youtube.com/watch?v=VIDEOID
Then use thumbnail: https://img.youtube.com/vi/VIDEOID/maxresdefault.jpg

CRITICAL: Return ONLY the JSON array, no markdown code blocks, no explanations.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
    if (!anthropicConfigured()) return jsonResponse({ error: 'API key not configured' }, 500);

    const llm = await invokeClaude({ prompt: PROMPT, maxTokens: 8000, expectJson: true });
    if (!llm.ok) return jsonResponse({ error: llm.error }, llm.status ?? 500);

    const exercises = llm.parsed;
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return jsonResponse({ error: 'Invalid exercise data received' }, 400);
    }

    const svc = serviceClient();
    const created = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const { data: result, error } = await svc.from('exercise_library').insert({
        name: ex.name,
        muscle_group: ex.muscle_group,
        secondary_muscles: ex.secondary_muscles || [],
        equipment: ex.equipment,
        movement_pattern: ex.movement_pattern,
        difficulty: ex.difficulty,
        description: ex.description,
        form_cues: ex.form_cues || [],
        common_mistakes: ex.common_mistakes || [],
        video_url: ex.video_url || '',
        thumbnail_url: ex.thumbnail_url || '',
        default_rest_seconds: ex.default_rest_seconds || 90,
        is_coach_branded: false,
        created_by: caller.auth.id,
      }).select('id').single();
      if (error) return jsonResponse({ error: error.message, created: created.length }, 500);
      created.push({ id: result.id, name: ex.name, index: i + 1 });
    }

    return jsonResponse({ success: true, count: created.length, exercises: created });
  } catch (error) {
    console.error('Error:', error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
