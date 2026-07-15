// Supabase Edge Function: aiMessageAssistant  (Migration Step 5d)
//
// Re-platform of base44/functions/aiMessageAssistant: four prompt-only
// actions (generateReply / generateBroadcast / generateCheckInResponse /
// followUpSuggestions). No DB reads or writes — all context arrives in the
// request body, exactly as in Base44 — so the only change is
// InvokeLLM → the shared Anthropic client. Unmetered, as in Base44.
import { getCaller, cors, jsonResponse } from '../_shared/edgeClients.js';
import { invokeClaude } from '../_shared/anthropic.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { action, client, tone, conversationMessages, checkIn, recentCheckIns, selectedClientIds, clients, broadcastContext } = body;

    // ── ACTION: generateReply ──
    if (action === 'generateReply') {
      const toneInstruction = {
        motivational: 'Be highly energetic, celebratory, use fire/muscle emojis, pump the client up.',
        empathetic: 'Be gentle, understanding, validate feelings, show genuine care and warmth.',
        direct: 'Be concise and actionable, skip fluff, get straight to the point.',
        casual: 'Be relaxed and friendly, like texting a friend, use natural language.',
        professional: 'Be polished and structured, minimal emojis, clear coaching language.',
      }[tone as string] || 'Be warm, motivational, and human.';

      const convo = (conversationMessages || [])
        .slice(-6)
        .map((m: { sender: string; content: string }) => `${m.sender === 'coach' ? 'Coach' : (client?.name || 'Client')}: ${m.content}`)
        .join('\n');

      const lastCI = checkIn;
      const ciCtx = lastCI
        ? `\nLatest check-in (${lastCI.date}):
- Mood: ${lastCI.mood || 'N/A'} | Energy: ${lastCI.energy_level || 'N/A'}/10 | Stress: ${lastCI.stress_level || 'N/A'}/10
- Weight: ${lastCI.weight ? lastCI.weight + ' lbs' : 'N/A'} | Sleep: ${lastCI.sleep_hours || 'N/A'} hrs
- Training: ${lastCI.compliance_training != null ? lastCI.compliance_training + '%' : 'N/A'} | Nutrition: ${lastCI.compliance_nutrition != null ? lastCI.compliance_nutrition + '%' : 'N/A'}
- Client notes: ${lastCI.notes || 'None'}`
        : '';

      const result = await invokeClaude({
        expectJson: true,
        prompt: `You are an elite personal fitness coach. Write ONE short, human, personalized reply to your client "${client?.name || 'your client'}".

CLIENT CONTEXT:
- Goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
- Status: ${client?.lifecycle_status || 'active'}${ciCtx}

RECENT CONVERSATION (most recent last):
${convo || 'No previous messages.'}

TONE INSTRUCTION: ${toneInstruction}

RULES:
- Under 70 words
- Use client's first name (${client?.name?.split(' ')[0] || 'there'})
- Sound like a real human coach, not a corporate bot
- Do NOT use em-dashes or bullet points
- Return ONLY valid JSON in this format: { "message": "...", "tone": "Motivational" }
- The "tone" field must be one of: Motivational, Empathetic, Informative, Casual, Direct`,
      });
      if (!result.ok) return jsonResponse({ error: result.error }, result.status ?? 500);
      return jsonResponse(result.parsed);
    }

    // ── ACTION: generateBroadcast ──
    if (action === 'generateBroadcast') {
      const ctx = broadcastContext || {};
      const count = ctx.count || (selectedClientIds || []).length || 0;
      const sampleNames = (clients || []).slice(0, 3).map((c: { name?: string }) => c.name?.split(' ')[0]).join(', ');

      const result = await invokeClaude({
        expectJson: true,
        prompt: `You are a fitness coach. Write 3 different broadcast messages for ${count} ${ctx.filter || 'clients'}.
Sample recipients: ${sampleNames || 'various clients'}.
Context: ${ctx.reason || 'general check-in'}, today is ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.

Each message should:
- Use [First Name] token for personalization
- Be 30-50 words
- Version 1: Motivational/energetic tone
- Version 2: Informative/reminder tone
- Version 3: Casual/friendly tone
- Do NOT use em-dashes

Return ONLY valid JSON: { "versions": [{ "message": "...", "tone": "..." }, { "message": "...", "tone": "..." }, { "message": "...", "tone": "..." }] }`,
      });
      if (!result.ok) return jsonResponse({ error: result.error }, result.status ?? 500);
      return jsonResponse(result.parsed);
    }

    // ── ACTION: generateCheckInResponse ──
    if (action === 'generateCheckInResponse') {
      const allCIs = recentCheckIns || [];
      const weights = allCIs.filter((c: { weight?: number }) => c.weight).slice(0, 5).map((c: { weight: number }) => c.weight);
      const weightTrend = weights.length >= 2
        ? (weights[0] < weights[weights.length - 1]
            ? `up ${(weights[weights.length - 1] - weights[0]).toFixed(1)} lbs recently`
            : `down ${(weights[0] - weights[weights.length - 1]).toFixed(1)} lbs recently`)
        : 'insufficient data';
      const avgTraining = allCIs.length
        ? Math.round(allCIs.reduce((s: number, c: { compliance_training?: number }) => s + (c.compliance_training || 0), 0) / allCIs.length)
        : null;

      const result = await invokeClaude({
        prompt: `You are an elite personal fitness coach writing a check-in response.

CLIENT: ${client?.name || 'Client'} | GOAL: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}

THIS WEEK'S CHECK-IN:
- Weight: ${checkIn.weight ? checkIn.weight + ' lbs' : 'N/A'}
- Body fat: ${checkIn.body_fat_pct ? checkIn.body_fat_pct + '%' : 'N/A'}
- Sleep: ${checkIn.sleep_hours ? checkIn.sleep_hours + ' hrs' : 'N/A'}
- Energy: ${checkIn.energy_level || 'N/A'}/10 | Stress: ${checkIn.stress_level || 'N/A'}/10
- Mood: ${checkIn.mood || 'N/A'}
- Training: ${checkIn.compliance_training != null ? checkIn.compliance_training + '%' : 'N/A'}
- Nutrition: ${checkIn.compliance_nutrition != null ? checkIn.compliance_nutrition + '%' : 'N/A'}
- Client notes: ${checkIn.notes || 'None'}

TRENDS (last ${allCIs.length} check-ins): Weight trend ${weightTrend}, avg training ${avgTraining != null ? avgTraining + '%' : 'N/A'}

Write a 80-120 word coaching response that:
1. Acknowledges 2 specific data points from this check-in
2. Addresses any red flags (low mood/sleep/compliance) with empathy but action-focused
3. Gives ONE clear priority for next week
4. Ends with brief encouragement
Tone: warm, direct, results-focused. No bullet points, no em-dashes, plain paragraphs.
Use first name only (${client?.name?.split(' ')[0] || 'there'}), no greeting opener.
Return ONLY the message text as a plain string.`,
      });
      if (!result.ok) return jsonResponse({ error: result.error }, result.status ?? 500);
      return jsonResponse({ message: result.text.trim() });
    }

    // ── ACTION: followUpSuggestions ──
    if (action === 'followUpSuggestions') {
      const daysSince = body.daysSince || 7;
      const lastCI = checkIn;

      const result = await invokeClaude({
        expectJson: true,
        prompt: `Client "${client?.name}" hasn't been messaged in ${daysSince} days.
${lastCI ? `Last check-in: mood ${lastCI.mood}, training ${lastCI.compliance_training}%, nutrition ${lastCI.compliance_nutrition}%` : 'No recent check-in.'}
Goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}

Write ONE short (under 50 words) follow-up message. Warm, caring, curious. Use first name (${client?.name?.split(' ')[0] || 'there'}).
Return ONLY valid JSON: { "message": "..." }`,
      });
      if (!result.ok) return jsonResponse({ error: result.error }, result.status ?? 500);
      return jsonResponse(result.parsed);
    }

    return jsonResponse({ error: 'Unknown action' }, 400);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
