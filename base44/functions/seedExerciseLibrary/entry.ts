import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const IMAGE_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const DATA_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

// Map dataset muscle names → our enum values
function mapMuscle(muscles = [], category = '') {
  const all = [...muscles].map(m => m.toLowerCase());
  const cat = category.toLowerCase();

  if (all.some(m => m.includes('pectoralis') || m.includes('chest')) || cat.includes('chest')) return 'chest';
  if (all.some(m => m.includes('latissimus') || m.includes('trapezius') || m.includes('rhomboid') || m.includes('erector')) || cat.includes('back')) return 'back';
  if (all.some(m => m.includes('deltoid') || m.includes('shoulder')) || cat.includes('shoulder')) return 'shoulders';
  if (all.some(m => m.includes('bicep')) || cat.includes('bicep')) return 'biceps';
  if (all.some(m => m.includes('tricep')) || cat.includes('tricep')) return 'triceps';
  if (all.some(m => m.includes('gluteus') || m.includes('glute')) || cat.includes('glute')) return 'glutes';
  if (all.some(m => m.includes('quadricep') || m.includes('hamstring') || m.includes('calf') || m.includes('gastrocnemius') || m.includes('soleus')) || cat.includes('leg') || cat.includes('quad') || cat.includes('hamstring')) return 'legs';
  if (all.some(m => m.includes('abdominal') || m.includes('oblique') || m.includes('core')) || cat.includes('core') || cat.includes('ab')) return 'core';
  if (cat.includes('cardio') || cat.includes('olympic')) return 'cardio';
  return 'full_body';
}

function mapEquipment(equipment = '') {
  const e = equipment.toLowerCase();
  if (e.includes('barbell') || e.includes('ez-bar') || e.includes('ez curl')) return 'barbell';
  if (e.includes('dumbbell')) return 'dumbbell';
  if (e.includes('cable')) return 'cable';
  if (e.includes('machine') || e.includes('lever')) return 'machine';
  if (e.includes('kettlebell')) return 'kettlebell';
  if (e.includes('resistance band') || e.includes('band')) return 'resistance_band';
  if (e.includes('trx') || e.includes('suspension')) return 'trx';
  if (!equipment || e.includes('body') || e.includes('none')) return 'bodyweight';
  return 'other';
}

function mapDifficulty(level = '') {
  const l = level.toLowerCase();
  if (l.includes('beginner') || l.includes('novice')) return 'beginner';
  if (l.includes('expert') || l.includes('advanced')) return 'advanced';
  return 'intermediate';
}

function buildImageUrl(images = []) {
  if (!images || images.length === 0) return '';
  const first = images[0];
  // Dataset images are like "3_4_Sit-Up/0.jpg"
  return IMAGE_BASE + first;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Only allow admin or the seeding to run once
    const existing = await base44.entities.ExerciseLibrary.list('created_date', 1);
    if (existing && existing.length >= 50) {
      return Response.json({ message: 'Library already seeded', count: existing.length });
    }

    // Fetch open-source dataset
    const res = await fetch(DATA_URL);
    if (!res.ok) return Response.json({ error: 'Failed to fetch exercise dataset' }, { status: 500 });

    const raw = await res.json();
    if (!Array.isArray(raw)) return Response.json({ error: 'Unexpected dataset format' }, { status: 500 });

    // Take up to 100 exercises with good data
    const subset = raw
      .filter(ex => ex.name && ex.instructions && ex.instructions.length > 0)
      .slice(0, 100);

    const created = [];
    for (let i = 0; i < subset.length; i++) {
      const ex = subset[i];
      const primaryMuscle = mapMuscle(ex.primaryMuscles || [], ex.category || '');
      const imageUrl = buildImageUrl(ex.images);

      const record = {
        name: ex.name,
        muscle_group: primaryMuscle,
        secondary_muscles: (ex.secondaryMuscles || []).slice(0, 5),
        equipment: mapEquipment(ex.equipment || ''),
        category: ex.category || '',
        difficulty: mapDifficulty(ex.level || ''),
        instructions: (ex.instructions || []).slice(0, 10),
        image_url: imageUrl,
        video_url: '',
        form_cues: [],
        common_mistakes: [],
        default_rest_seconds: 90,
        description: ex.mechanic ? `${ex.mechanic} · ${ex.force || ''}`.trim().replace(/·\s*$/, '') : '',
        is_coach_branded: false,
      };

      const result = await base44.entities.ExerciseLibrary.create(record);
      created.push({ id: result.id, name: ex.name });

      // Small delay every 10 records to avoid rate limiting
      if (i > 0 && i % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return Response.json({ success: true, count: created.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});