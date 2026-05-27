import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import Anthropic from 'npm:@anthropic-ai/sdk@0.27.3';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, clientId, tone, conversationMessages, checkIn, client, recentCheckIns, selectedClientIds, clients, broadcastContext } = body;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

    // ── COACH TONE PROFILE (analyze last 50 coach messages) ──
    const buildToneProfile = async () => {
      const msgs = await base44.asServiceRole.entities.Message.filter({ sender: 'coach' }, '-created_date', 50);
      if (msgs.length < 5) return 'Warm, motivational, casual, uses emojis occasionally.';
      const sample = msgs.slice(0, 15).map(m => m.content).join('\n---\n');
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze these coach messages and summarize their communication style in 1-2 sentences (tone, formality, emoji usage, vocabulary). Messages:\n${sample}`,
      });
      return r;
    };

    // ── ACTION: generateReply ──
    if (action === 'generateReply') {
      const toneInstruction = {
        motivational: 'Be highly energetic, celebratory, use fire/muscle emojis, pump up the client.',
        empathetic: 'Be gentle, understanding, validate feelings, show genuine care.',
        direct: 'Be concise and actionable, skip fluff, get straight to the point.',
        casual: 'Be relaxed and friendly, like a text from a friend, natural language.',
        professional: 'Be polished and structured, minimal emojis, clear coaching language.',
      }[tone] || 'Match the coach\'s natural style.';

      const convo = (conversationMessages || [])
        .slice(-6)
        .map(m => `${m.sender === 'coach' ? 'Coach' : (client?.name || 'Client')}: ${m.content}`)
        .join('\n');

      const lastCI = checkIn;
      const ciCtx = lastCI
        ? `\nLatest check-in (${lastCI.date}):
- Mood: ${lastCI.mood || 'N/A'} | Energy: ${lastCI.energy_level || 'N/A'}/10 | Stress: ${lastCI.stress_level || 'N/A'}/10
- Weight: ${lastCI.weight ? lastCI.weight + ' lbs' : 'N/A'} | Sleep: ${lastCI.sleep_hours || 'N/A'} hrs
- Training: ${lastCI.compliance_training != null ? lastCI.compliance_training + '%' : 'N/A'} | Nutrition: ${lastCI.compliance_nutrition != null ? lastCI.compliance_nutrition + '%' : 'N/A'}
- Client notes: ${lastCI.notes || 'None'}`
        : '';

      const prompt = `You are an elite personal fitness coach. Write ONE short, human, personalized reply to your client "${client?.name || 'your client'}".

CLIENT CONTEXT:
- Goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
- Status: ${client?.lifecycle_status || 'active'}
- Tags: ${(client?.tags || []).join(', ') || 'none'}${ciCtx}

RECENT CONVERSATION (most recent last):
${convo || 'No previous messages.'}

TONE INSTRUCTION: ${toneInstruction}

RULES:
- Under 70 words
- Use client's first name (${client?.name?.split(' ')[0] || 'there'})
- Sound like a real human coach, not a corporate bot
- Do NOT use em-dashes or bullet points
- Return JSON with: { "message": "...", "tone": "Motivational|Empathetic|Informative|Casual|Direct" }`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return Response.json(JSON.parse(jsonMatch[0]));
      } catch (_) {}
      return Response.json({ message: text.trim(), tone: 'Motivational' });
    }

    // ── ACTION: generateBroadcast ──
    if (action === 'generateBroadcast') {
      const ctx = broadcastContext || {};
      const recipientSummary = ctx.filter || 'all clients';
      const count = ctx.count || selectedClientIds?.length || 0;
      const sampleNames = (clients || [])
        .filter(c => (selectedClientIds || []).includes(c.id))
        .slice(0, 3)
        .map(c => c.name?.split(' ')[0]);

      const prompt = `You are a fitness coach. Write 3 different broadcast messages for ${count} ${recipientSummary}.
Sample recipients: ${sampleNames.join(', ') || 'various clients'}.
Context: ${ctx.reason || 'general check-in'}, ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}.

Each message should:
- Use [First Name] token for personalization
- Be 30-50 words
- Have a distinct tone/angle: 1) Motivational, 2) Informative/reminder, 3) Casual/friendly
- NOT use em-dashes or bullet points

Return JSON: { "versions": [{ "message": "...", "tone": "..." }, ...] }`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return Response.json(JSON.parse(jsonMatch[0]));
      } catch (_) {}
      return Response.json({ versions: [{ message: text.trim(), tone: 'Motivational' }] });
    }

    // ── ACTION: generateCheckInResponse ──
    if (action === 'generateCheckInResponse') {
      const allCIs = recentCheckIns || [];
      const weights = allCIs.filter(c => c.weight).slice(0, 5).map(c => c.weight);
      const weightTrend = weights.length >= 2
        ? (weights[0] < weights[weights.length - 1]
          ? `down ${(weights[weights.length - 1] - weights[0]).toFixed(1)} lbs`
          : weights[0] > weights[weights.length - 1]
          ? `up ${(weights[0] - weights[weights.length - 1]).toFixed(1)} lbs`
          : 'stable')
        : 'insufficient data';

      const avgTraining = allCIs.length
        ? Math.round(allCIs.reduce((s, c) => s + (c.compliance_training || 0), 0) / allCIs.length)
        : null;

      const prompt = `You are an elite personal fitness coach writing a check-in response.

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

TRENDS (last ${allCIs.length} check-ins):
- Weight trend: ${weightTrend}
- Average training compliance: ${avgTraining != null ? avgTraining + '%' : 'N/A'}

Write a 80-120 word coaching response that:
1. Acknowledges 2 specific data points from this check-in
2. Addresses any red flags (low mood/sleep/compliance) with empathy but action-focused
3. Gives ONE clear priority for next week
4. Ends with brief encouragement
- Tone: warm, direct, results-focused coach
- No bullet points, no em-dashes, plain paragraphs
- First name only (${client?.name?.split(' ')[0] || 'there'}), no "Hi" opener`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      });

      return Response.json({ message: response.content[0].text.trim() });
    }

    // ── ACTION: followUpSuggestions ──
    if (action === 'followUpSuggestions') {
      const daysSince = body.daysSince || 7;
      const lastCI = checkIn;

      const prompt = `Client "${client?.name}" hasn't been messaged in ${daysSince} days.
${lastCI ? `Last check-in: mood ${lastCI.mood}, training ${lastCI.compliance_training}%, nutrition ${lastCI.compliance_nutrition}%` : 'No recent check-in.'}
Goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}

Write ONE short (under 50 words) follow-up message. Warm, caring, curious. Use their first name (${client?.name?.split(' ')[0] || 'there'}).
Return JSON: { "message": "..." }`;

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) return Response.json(JSON.parse(jsonMatch[0]));
      } catch (_) {}
      return Response.json({ message: text.trim() });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});