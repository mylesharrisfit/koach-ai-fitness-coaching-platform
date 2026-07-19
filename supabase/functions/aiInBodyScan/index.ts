// Supabase Edge Function: aiInBodyScan  (Migration Step 7 — frontend cutover)
//
// Per-purpose replacement for the vision `integrations.Core.InvokeLLM` call in
// components/progress/InBodyScanner. Takes the public Storage URL of an uploaded
// InBody scan image and extracts its metrics via Claude vision (imageUrls on the
// shared Anthropic client). Prompt ported verbatim from the frontend.
import { getCaller, cors, jsonResponse } from '../_shared/edgeClients.js';
import { invokeClaude } from '../_shared/anthropic.js';

const EXTRACT_PROMPT = `Extract all metrics from this InBody scan image and return ONLY a JSON object with no markdown fences:
{
  "scan_date": "YYYY-MM-DD or null",
  "weight_lbs": number or null,
  "weight_kg": number or null,
  "body_fat_percent": number or null,
  "fat_mass_lbs": number or null,
  "lean_mass_lbs": number or null,
  "muscle_mass_lbs": number or null,
  "bmi": number or null,
  "bmr": number or null,
  "visceral_fat_level": number or null,
  "total_body_water": number or null,
  "protein_kg": number or null,
  "minerals_kg": number or null,
  "right_arm_muscle": number or null,
  "left_arm_muscle": number or null,
  "trunk_muscle": number or null,
  "right_leg_muscle": number or null,
  "left_leg_muscle": number or null,
  "right_arm_fat": number or null,
  "left_arm_fat": number or null,
  "trunk_fat": number or null,
  "right_leg_fat": number or null,
  "left_leg_fat": number or null,
  "inbody_score": number or null,
  "raw_text": "brief 1-sentence summary of what was found on the scan"
}
Return null for any field not visible in the scan. Do not include markdown or code fences.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { fileUrl } = await req.json();
    if (!fileUrl) return jsonResponse({ error: 'Missing fileUrl' }, 400);

    const result = await invokeClaude({ expectJson: true, imageUrls: [fileUrl], prompt: EXTRACT_PROMPT });
    if (!result.ok) return jsonResponse({ error: result.error }, result.status ?? 500);
    return jsonResponse(result.parsed);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
