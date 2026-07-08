import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { differenceInDays, parseISO } from 'date-fns';
import {
  Sparkles, Loader2, RefreshCw, Check, Edit3, X, ChevronDown
} from 'lucide-react';

const TONE_OPTIONS = [
  { key: 'motivational', label: '🔥 More Motivational' },
  { key: 'empathetic', label: '💙 More Empathetic' },
  { key: 'direct', label: '⚡ More Direct' },
  { key: 'casual', label: '😊 More Casual' },
  { key: 'professional', label: '💼 More Professional' },
];

const TONE_LABELS = {
  motivational: 'Motivational',
  empathetic: 'Empathetic',
  direct: 'Direct',
  casual: 'Casual',
  professional: 'Professional',
};

function buildAIPrompt(client, messages, checkIns, tone) {
  const clientMsgs = messages.filter(m => m.client_id === client?.id);
  const recent = [...clientMsgs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)).slice(-8);
  const convo = recent.map(m => `${m.sender === 'coach' ? 'Coach' : client.name}: ${m.content}`).join('\n');

  const sorted = [...checkIns].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCI = sorted[0];
  const prevCI = sorted[1];

  // Detect context
  const lastClientMsg = [...clientMsgs].reverse().find(m => m.sender === 'client');
  const daysSinceLastMsg = lastClientMsg ? differenceInDays(new Date(), new Date(lastClientMsg.created_date)) : 999;
  const daysSinceCI = lastCI ? differenceInDays(new Date(), parseISO(lastCI.date)) : 999;
  const isNewClient = client?.start_date && differenceInDays(new Date(), parseISO(client.start_date)) <= 7;
  const weightDelta = lastCI?.weight && prevCI?.weight ? (lastCI.weight - prevCI.weight).toFixed(1) : null;
  const lowMood = lastCI?.mood && ['tired', 'stressed'].includes(lastCI.mood);
  const missedWorkouts = lastCI?.compliance_training != null && lastCI.compliance_training < 60;
  const noNutritionLogs = lastCI?.compliance_nutrition != null && lastCI.compliance_nutrition < 40;

  let contextNote = '';
  if (daysSinceCI <= 1 && lastCI) contextNote = `Client just submitted a check-in. Mood: ${lastCI.mood}, energy: ${lastCI.energy_level}/10, training: ${lastCI.compliance_training}%, nutrition: ${lastCI.compliance_nutrition}%${weightDelta ? `, weight change: ${weightDelta} lbs` : ''}.`;
  else if (lowMood) contextNote = `Client's last check-in showed low mood (${lastCI.mood}) - be extra empathetic.`;
  else if (missedWorkouts) contextNote = `Client missed workouts this week (${lastCI.compliance_training}% training compliance).`;
  else if (noNutritionLogs) contextNote = `Client has low nutrition tracking (${lastCI.compliance_nutrition}% compliance).`;
  else if (isNewClient) contextNote = `Client is brand new (started ${client.start_date}). Focus on welcome and encouragement.`;
  else if (daysSinceLastMsg > 5) contextNote = `Client has been quiet for ${daysSinceLastMsg} days - check in warmly.`;

  const toneInstruction = {
    motivational: 'Be high-energy, celebratory, use fire emojis, pump them up.',
    empathetic: 'Be warm, understanding, validate their feelings, lead with compassion.',
    direct: 'Be concise and action-oriented. Give clear next steps. No fluff.',
    casual: 'Be friendly and conversational, like texting a friend. Light tone.',
    professional: 'Be structured and professional. No emojis. Clear and composed.',
  }[tone] || 'Be warm, supportive, and human. Match the energy of the conversation.';

  return `You are an elite personal fitness coach. Write ONE short, human, contextual reply to your client.

CLIENT: ${client?.name?.split(' ')[0] || 'Client'}
GOAL: ${client?.goal?.replace(/_/g, ' ') || 'general fitness'}
${contextNote ? `CONTEXT: ${contextNote}` : ''}

Recent conversation:
${convo || '(No messages yet — write a warm opening)'}

TONE INSTRUCTION: ${toneInstruction}
LENGTH: Under 70 words. Conversational.
RULES: Use client's first name. Sound human. Return ONLY the message text — no labels or quotes.`;
}

export default function AIMessageAssistant({ client, allMessages = [], checkIns = [], onUse, onEditFirst }) {
  const [suggestion, setSuggestion] = useState(null);
  const [tone, setTone] = useState(null); // null = auto
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [toneLabel, setToneLabel] = useState('Auto');
  const [showTonePicker, setShowTonePicker] = useState(false);

  const generate = useCallback(async (overrideTone) => {
    if (!client) return;
    setVisible(true);
    setLoading(true);
    setSuggestion(null);
    const useTone = overrideTone ?? tone;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: buildAIPrompt(client, allMessages, checkIns, useTone),
      response_json_schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          detected_tone: { type: 'string' },
        }
      }
    });
    setSuggestion(result?.message || '');
    if (result?.detected_tone) setToneLabel(result.detected_tone);
    setLoading(false);
  }, [client, allMessages, checkIns, tone]);

  const handleToneChange = (t) => {
    setTone(t);
    setToneLabel(TONE_LABELS[t]);
    setShowTonePicker(false);
    generate(t);
  };

  if (!visible) {
    return (
      <button
        onClick={() => generate(null)}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-primary hover:from-primary/15 hover:to-purple-500/15 transition-all"
      >
        <Sparkles className="w-3 h-3" />
        AI Suggest Reply
      </button>
    );
  }

  return (
    <div className="mx-1 mb-2 rounded-xl border border-primary/20 bg-gradient-to-br from-[#EEF4FF] to-[#F5F3FF] p-3 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-semibold text-primary">AI Suggested Reply</span>
          {!loading && toneLabel !== 'Auto' && (
            <span className="text-[10px] text-[#9CA3AF] bg-white/70 px-1.5 py-0.5 rounded-full">{toneLabel}</span>
          )}
        </div>
        <button onClick={() => { setVisible(false); setSuggestion(null); }} className="text-[#9CA3AF] hover:text-gray-600 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-3">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-[#6B7280]">Reading conversation & generating reply…</span>
        </div>
      )}

      {/* Suggestion */}
      {suggestion && !loading && (
        <>
          <p className="text-xs text-[#374151] leading-relaxed bg-white/70 rounded-lg p-2.5 mb-2.5 border border-white">
            {suggestion}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => { onUse(suggestion); setVisible(false); setSuggestion(null); }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
              <Check className="w-3 h-3" /> Use This
            </button>
            <button onClick={() => { onEditFirst(suggestion); setVisible(false); setSuggestion(null); }}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-white border border-primary/30 text-primary rounded-full hover:bg-primary/5 transition-colors">
              <Edit3 className="w-3 h-3" /> Edit First
            </button>
            <button onClick={() => generate(tone)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 bg-white border border-gray-200 text-[#6B7280] rounded-full hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3 h-3" /> Try Again
            </button>

            {/* Tone picker */}
            <div className="relative ml-auto">
              <button onClick={() => setShowTonePicker(s => !s)}
                className="flex items-center gap-1 text-[11px] text-[#9CA3AF] hover:text-primary transition-colors">
                Change Tone <ChevronDown className="w-3 h-3" />
              </button>
              {showTonePicker && (
                <div className="absolute bottom-full mb-1 right-0 bg-white border border-[#E7EAF3] rounded-xl shadow-xl p-1.5 w-48 z-30">
                  {TONE_OPTIONS.map(t => (
                    <button key={t.key} onClick={() => handleToneChange(t.key)}
                      className="w-full text-left text-[11px] px-3 py-1.5 rounded-lg hover:bg-primary/5 text-[#374151] transition-colors">
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}