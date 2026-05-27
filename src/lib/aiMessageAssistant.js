/**
 * AI Message Assistant — core context builder & generation engine
 * Used by ComposeBar, BroadcastModal, CheckInResponseGenerator
 */
import { base44 } from '@/api/base44Client';
import { differenceInDays, format } from 'date-fns';

export const TONES = [
  { key: 'auto',          label: 'Auto (match client)',  emoji: '✨' },
  { key: 'motivational',  label: 'Motivational',         emoji: '🔥' },
  { key: 'empathetic',    label: 'Empathetic',           emoji: '💙' },
  { key: 'direct',        label: 'Direct',               emoji: '🎯' },
  { key: 'casual',        label: 'Casual',               emoji: '😊' },
  { key: 'professional',  label: 'Professional',         emoji: '💼' },
];

export const TONE_LABELS = {
  motivational: 'Motivational 🔥',
  empathetic:   'Empathetic 💙',
  direct:       'Direct 🎯',
  casual:       'Casual 😊',
  professional: 'Professional 💼',
  auto:         'Smart Match ✨',
};

/**
 * Build rich context string for AI prompt
 */
export function buildClientContext(client, messages = [], checkIns = []) {
  if (!client) return '';

  const clientMessages = messages.filter(m => m.client_id === client.id);
  const sorted = [...clientMessages].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const last5 = sorted.slice(-5);
  const coachMessages = sorted.filter(m => m.sender === 'coach').slice(-20);
  const clientMessagesOnly = sorted.filter(m => m.sender === 'client').slice(-10);

  const sortedCI = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCI = sortedCI[0];
  const prevCI = sortedCI[1];

  // Last client message
  const lastClientMsg = [...clientMessages].reverse().find(m => m.sender === 'client');
  const daysSinceClientMsg = lastClientMsg
    ? differenceInDays(new Date(), new Date(lastClientMsg.created_date))
    : 999;

  // Coach tone profile from past messages
  const coachEmojis = coachMessages.flatMap(m => [...(m.content.match(/[\u{1F300}-\u{1FFFF}]/gu) || [])]);
  const emojiUsage = coachEmojis.length / Math.max(coachMessages.length, 1);
  const avgCoachLength = coachMessages.reduce((sum, m) => sum + m.content.length, 0) / Math.max(coachMessages.length, 1);
  const toneProfile = emojiUsage > 0.8 ? 'casual with emojis' : emojiUsage > 0.3 ? 'friendly with occasional emojis' : 'professional';

  let ctx = `CLIENT PROFILE:
- Name: ${client.name} (use first name: ${client.name?.split(' ')[0]})
- Goal: ${client.goal?.replace(/_/g, ' ') || 'general fitness'}
- Status: ${client.lifecycle_status || 'active'}
- Start date: ${client.start_date || 'unknown'}
- Program assigned: ${client.assigned_program_id ? 'yes' : 'no'}
- Nutrition plan: ${client.assigned_nutrition_id ? 'yes' : 'no'}
- Days since client last messaged: ${daysSinceClientMsg === 999 ? 'never' : daysSinceClientMsg}`;

  if (lastCI) {
    const daysSinceCI = differenceInDays(new Date(), new Date(lastCI.date));
    const weightDelta = prevCI?.weight && lastCI.weight ? (lastCI.weight - prevCI.weight).toFixed(1) : null;
    const trainingTrend = prevCI?.compliance_training !== undefined
      ? lastCI.compliance_training - prevCI.compliance_training
      : null;

    ctx += `

LATEST CHECK-IN (${lastCI.date}, ${daysSinceCI} days ago):
- Mood: ${lastCI.mood || 'not provided'} ${lastCI.mood ? `(${getMoodScore(lastCI.mood)}/10)` : ''}
- Energy: ${lastCI.energy_level || '—'}/10
- Stress: ${lastCI.stress_level || '—'}/10
- Sleep: ${lastCI.sleep_hours || '—'} hrs/night
- Training compliance: ${lastCI.compliance_training ?? '—'}%${trainingTrend !== null ? ` (${trainingTrend >= 0 ? '+' : ''}${trainingTrend}% vs prev)` : ''}
- Nutrition compliance: ${lastCI.compliance_nutrition ?? '—'}%
- Weight: ${lastCI.weight || '—'} lbs${weightDelta !== null ? ` (${parseFloat(weightDelta) >= 0 ? '+' : ''}${weightDelta} lbs)` : ''}
- Client notes: "${lastCI.notes || 'none'}"
- Review status: ${lastCI.review_status || 'pending'}`;
  } else {
    ctx += '\n\nCHECK-INS: None submitted yet';
  }

  if (last5.length > 0) {
    ctx += '\n\nRECENT CONVERSATION (last 5 messages):';
    last5.forEach(m => {
      ctx += `\n${m.sender === 'coach' ? 'Coach' : client.name?.split(' ')[0]}: ${m.content}`;
    });
  } else {
    ctx += '\n\nCONVERSATION: No messages yet';
  }

  ctx += `\n\nCOACH STYLE PROFILE:
- Tone: ${toneProfile}
- Avg message length: ~${Math.round(avgCoachLength)} chars
- Past coach samples: ${coachMessages.slice(-3).map(m => `"${m.content.slice(0, 60)}..."`).join(', ') || 'none yet'}`;

  return ctx;
}

function getMoodScore(mood) {
  const map = { great: 9, good: 7, okay: 5, tired: 4, stressed: 3 };
  return map[mood] || 5;
}

/**
 * Detect the best situational context
 */
export function detectContext(client, messages = [], checkIns = []) {
  const clientMessages = messages.filter(m => m.client_id === client?.id);
  const lastClientMsg = [...clientMessages].reverse().find(m => m.sender === 'client');
  const sortedCI = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCI = sortedCI[0];

  if (!lastClientMsg && !lastCI) return 'new_client';

  const daysSinceCI = lastCI ? differenceInDays(new Date(), new Date(lastCI.date)) : 999;
  const recentCI = daysSinceCI <= 2;

  if (recentCI && lastCI?.mood && getMoodScore(lastCI.mood) <= 4) return 'low_mood_checkin';
  if (recentCI && lastCI?.compliance_training !== undefined && lastCI.compliance_training < 50) return 'low_training';
  if (recentCI && lastCI?.compliance_training !== undefined && lastCI.compliance_training >= 90) return 'high_performance';
  if (recentCI) return 'recent_checkin';

  const daysSinceMsg = lastClientMsg
    ? differenceInDays(new Date(), new Date(lastClientMsg.created_date))
    : 999;
  if (daysSinceMsg > 7) return 'inactive';
  if (daysSinceMsg > 3) return 'quiet';

  const lastContent = lastClientMsg?.content?.toLowerCase() || '';
  if (lastContent.includes('hurt') || lastContent.includes('pain') || lastContent.includes('sore')) return 'injury_concern';
  if (lastContent.includes('modify') || lastContent.includes('change') || lastContent.includes('alternative')) return 'modification_request';
  if (lastContent.includes('pr') || lastContent.includes('personal best') || lastContent.includes('record')) return 'pr_achieved';

  return 'general';
}

/**
 * Generate AI reply suggestion
 */
export async function generateAIReply(client, messages, checkIns, tone = 'auto', retryCount = 0) {
  const context = buildClientContext(client, messages, checkIns);
  const detectedCtx = detectContext(client, messages, checkIns);
  const firstName = client?.name?.split(' ')[0] || client?.name || 'there';

  const toneInstruction = {
    motivational: 'Be highly energetic, positive, and use motivating language. Use 1-2 fire or muscle emojis.',
    empathetic:   'Be warm, understanding, and emotionally supportive. Acknowledge feelings first.',
    direct:       'Be concise and action-oriented. Get straight to the point. No fluff.',
    casual:       'Be friendly and conversational, like texting a friend. Use casual language.',
    professional: 'Be polished and professional. Minimal emojis. Clear and structured.',
    auto:         'Match the coach\'s established tone from their message history. Be natural and consistent.',
  }[tone] || 'Be natural and coach-like.';

  const situationalHint = {
    low_mood_checkin:      `Client submitted a check-in with LOW MOOD. Acknowledge it empathetically before coaching.`,
    low_training:          `Client has LOW TRAINING COMPLIANCE this week. Gently explore why and offer support.`,
    high_performance:      `Client had EXCEPTIONAL PERFORMANCE. Celebrate it genuinely and specifically.`,
    recent_checkin:        `Client recently submitted a check-in. Respond to their progress specifically.`,
    inactive:              `Client has been QUIET/INACTIVE for several days. Reach out warmly to re-engage.`,
    quiet:                 `Client hasn't messaged in a few days. Check in casually.`,
    injury_concern:        `Client may have mentioned pain/injury. Address safety first, offer modification.`,
    modification_request:  `Client is asking about exercise modifications. Give a helpful, specific answer.`,
    pr_achieved:           `Client hit a personal best! Celebrate enthusiastically and specifically.`,
    new_client:            `This is a new client with no history. Warmly introduce yourself and set expectations.`,
    general:               `Write a helpful, contextual reply based on the conversation.`,
  }[detectedCtx] || '';

  const retryVariant = retryCount > 0
    ? `\n\nIMPORTANT: This is retry #${retryCount} — generate a DIFFERENT style/angle reply than before. Change the opener and approach.`
    : '';

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an elite personal fitness coach with a warm, results-driven communication style.

SITUATION: ${situationalHint}

TONE INSTRUCTION: ${toneInstruction}

${context}

YOUR TASK:
Write ONE reply message to ${firstName}. Rules:
- Under 80 words
- Use first name naturally
- Sound genuinely human, not robotic
- No generic filler phrases like "I hope you're well"
- Be specific to the client's actual data above
- Do NOT start with "I" as the first word${retryVariant}

Also detect the tone of your reply from: Motivational, Empathetic, Informative, Celebratory, Direct, Supportive.

Return JSON only.`,
    response_json_schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        tone_label: { type: 'string' },
        context_reason: { type: 'string' },
      }
    }
  });

  return {
    message: result.message || '',
    tone_label: result.tone_label || 'Supportive',
    context_reason: result.context_reason || '',
  };
}

/**
 * Generate broadcast message (multiple versions)
 */
export async function generateBroadcastMessage(selectedClients, allClients, filter, checkIns = []) {
  const clientSample = selectedClients.slice(0, 5);
  const summaries = clientSample.map(c => {
    const lastCI = checkIns
      .filter(ci => ci.client_id === c.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return `- ${c.name}: goal=${c.goal?.replace(/_/g, ' ')}, status=${c.lifecycle_status || 'active'}, last check-in=${lastCI?.date || 'none'}, training=${lastCI?.compliance_training ?? '?'}%`;
  }).join('\n');

  const filterCtx = {
    all:        'all active coaching clients',
    active:     'all active clients who are progressing',
    at_risk:    'clients who are at-risk of churning or falling off track',
    no_program: 'clients who don\'t have a workout program assigned yet',
    lead:       'potential leads who haven\'t started yet',
  }[filter] || 'selected clients';

  const today = format(new Date(), 'EEEE, MMMM d');

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a personal fitness coach writing a broadcast message to ${filterCtx} (${selectedClients.length} people) on ${today}.

Sample of recipients:
${summaries}

Generate 3 DIFFERENT versions of a broadcast message. Each version should:
- Use [First Name] as a personalization token
- Be under 100 words
- Be appropriate for the recipient group context (${filterCtx})
- Have a different tone/angle
- Sound warm and personal, not mass-marketing

Return JSON only.`,
    response_json_schema: {
      type: 'object',
      properties: {
        versions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              tone_label: { type: 'string' },
              description: { type: 'string' },
            }
          }
        }
      }
    }
  });

  return result.versions || [];
}

/**
 * Generate check-in response
 */
export async function generateCheckInResponse(client, checkIn, previousCheckIns = []) {
  const firstName = client?.name?.split(' ')[0] || 'there';
  const prevCI = previousCheckIns.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  const weightDelta = prevCI?.weight && checkIn.weight
    ? (checkIn.weight - prevCI.weight).toFixed(1)
    : null;
  const trainingTrend = prevCI?.compliance_training !== undefined
    ? (checkIn.compliance_training || 0) - prevCI.compliance_training
    : null;

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an elite fitness coach writing a personalized check-in response to ${firstName}.

CHECK-IN DATA (submitted ${checkIn.date}):
- Mood: ${checkIn.mood || 'not provided'}
- Energy: ${checkIn.energy_level || '—'}/10
- Stress: ${checkIn.stress_level || '—'}/10
- Sleep: ${checkIn.sleep_hours || '—'} hrs
- Training compliance: ${checkIn.compliance_training ?? '—'}%${trainingTrend !== null ? ` (${trainingTrend >= 0 ? '+' : ''}${trainingTrend}% vs last week)` : ''}
- Nutrition compliance: ${checkIn.compliance_nutrition ?? '—'}%
- Weight: ${checkIn.weight || '—'} lbs${weightDelta !== null ? ` (${parseFloat(weightDelta) >= 0 ? '+' : ''}${weightDelta} lbs vs last)` : ''}
- Client notes: "${checkIn.notes || 'none'}"

CLIENT CONTEXT:
- Goal: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
- Status: ${client?.lifecycle_status || 'active'}

Write a personalized check-in response that:
1. Opens with genuine acknowledgment of their week (specific to their data)
2. Highlights 1-2 specific things that went well
3. Gives 1-2 clear coaching points for improvement
4. Ends with a motivating close

Tone: warm, specific, professional coach. 100-150 words. Use first name.

Return JSON only.`,
    response_json_schema: {
      type: 'object',
      properties: {
        response: { type: 'string' },
        highlights: { type: 'array', items: { type: 'string' } },
        coaching_points: { type: 'array', items: { type: 'string' } },
      }
    }
  });

  return result;
}