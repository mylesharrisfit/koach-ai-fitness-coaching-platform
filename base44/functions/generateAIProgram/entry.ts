import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile, preferences } = await req.json();

    const prompt = `Generate a detailed workout program as JSON based on this:

CLIENT PROFILE:
- Goal: ${profile.goal}
- Fitness Level: ${profile.fitness_level}
- Age: ${profile.age || 'not specified'}
- Days Available: ${profile.days_per_week}x/week
- Session Length: ${profile.session_length} minutes
- Equipment: ${profile.equipment.join(', ') || 'none'}
- Injuries: ${profile.injuries || 'none'}
- Focus Areas: ${profile.focus_areas || 'balanced'}

PROGRAM PREFERENCES:
- Duration: ${preferences.duration} weeks
- Progression: ${preferences.progression_style}
- Intensity: ${['Light', 'Moderate', 'Intense', 'Very Intense'][preferences.intensity]}
- Include Cardio: ${preferences.include_cardio ? `yes (${preferences.cardio_type})` : 'no'}
- Include Rest Activities: ${preferences.include_rest_activities ? 'yes' : 'no'}

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "title": "Program name",
  "description": "2-3 sentence description",
  "category": "strength|hypertrophy|fat_loss|athletic|mobility|custom",
  "difficulty": "beginner|intermediate|advanced|elite",
  "duration_weeks": number,
  "days_per_week": number,
  "workouts": [
    {
      "day_name": "Day 1 / Upper / etc",
      "day_number": 1,
      "exercises": [
        {
          "name": "Exercise name",
          "sets": number,
          "reps": "string like 8-10 or 5",
          "rest_seconds": number,
          "tempo": "optional like 3-1-2-0",
          "rpe": "optional 1-10",
          "section": "warmup|main|finisher|cooldown",
          "notes": "coaching cues"
        }
      ]
    }
  ]
}

Generate a realistic, progressive program optimized for the client's goals and constraints.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          difficulty: { type: 'string' },
          duration_weeks: { type: 'number' },
          days_per_week: { type: 'number' },
          workouts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day_name: { type: 'string' },
                day_number: { type: 'number' },
                exercises: { type: 'array' },
              },
            },
          },
        },
      },
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});