import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    const prompt = `Return ONLY a valid JSON array of exactly 50 exercises with no additional text or markdown:
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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: 'Claude API error: ' + error }, { status: 500 });
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    
    // Parse JSON from response (may have whitespace/markdown)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return Response.json({ error: 'Failed to parse exercise data from Claude' }, { status: 400 });
    }

    const exercises = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(exercises) || exercises.length === 0) {
      return Response.json({ error: 'Invalid exercise data received' }, { status: 400 });
    }

    // Create exercises in database
    const created = [];
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      const result = await base44.entities.ExerciseLibrary.create({
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
      });
      created.push({ id: result.id, name: ex.name, index: i + 1 });
    }

    return Response.json({
      success: true,
      count: created.length,
      exercises: created,
    });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});