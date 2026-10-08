/**
 * Reply tones the coach can pick in the app, as prompt instructions. One map
 * for every AI reply function so a tone means the same thing everywhere:
 *   - check-in drawer (aiCheckInInsights reviewCheckIn): warm | direct | detailed
 *   - message assistant (aiMessageAssistant generateReply): motivational |
 *     empathetic | direct | casual | professional
 * Unknown / missing tone -> `fallback` (each caller keeps its old default).
 */
export const TONE_INSTRUCTIONS = {
  warm: 'Be warm and encouraging, like a coach who genuinely cares. Acknowledge effort before giving direction.',
  direct: 'Be concise and actionable, skip fluff, get straight to the point.',
  detailed: 'Be thorough: reference the specific numbers, explain the reasoning, and give a clear plan for next week (4-6 sentences).',
  motivational: 'Be highly energetic, celebratory, use fire/muscle emojis, pump the client up.',
  empathetic: 'Be gentle, understanding, validate feelings, show genuine care and warmth.',
  casual: 'Be relaxed and friendly, like texting a friend, use natural language.',
  professional: 'Be polished and structured, minimal emojis, clear coaching language.',
};

export function toneInstruction(tone, fallback) {
  return TONE_INSTRUCTIONS[String(tone ?? '').toLowerCase()] ?? fallback;
}
