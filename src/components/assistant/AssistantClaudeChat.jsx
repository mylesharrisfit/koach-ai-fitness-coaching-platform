import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Copy, Check, Mic, BookmarkPlus, User, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { format } from 'date-fns';

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

// ── Build system prompt ────────────────────────────────────────────────────
function buildSystemPrompt(client, plan, lastCheckIn, adherenceScore, streak) {
  if (!client) {
    return `You are an expert fitness coach AI assistant. Help with general coaching questions about nutrition, programming, client management, and business growth. Be specific and actionable. Always end responses with 1-2 concrete action items.`;
  }
  return `You are an expert fitness coach AI assistant helping coach ${client.name}.

CLIENT PROFILE:
- Name: ${client.name}
- Goal: ${client.goal?.replace(/_/g, ' ') || 'general fitness'}
- Current weight: ${client.current_weight || 'unknown'} lbs
- Target weight: ${client.target_weight || 'not set'} lbs
- Assigned nutrition plan: ${plan?.title || 'None assigned'}
- Daily targets: ${plan?.calories || '?'} kcal, ${plan?.protein_g || '?'}g protein
- Last check-in date: ${lastCheckIn?.date || 'Never'}
- Overall adherence: ${Math.round(adherenceScore)}%
- Check-in streak: ${streak} days
- Recent mood: ${lastCheckIn?.mood || 'unknown'}
- Recent sleep: ${lastCheckIn?.sleep_hours || 'unknown'} hours
- Energy level: ${lastCheckIn?.energy_level || 'unknown'}/10
- Stress level: ${lastCheckIn?.stress_level || 'unknown'}/10
- Training compliance: ${lastCheckIn?.compliance_training || 'unknown'}%
- Nutrition compliance: ${lastCheckIn?.compliance_nutrition || 'unknown'}%
- Client notes: ${lastCheckIn?.notes || 'None'}

Be specific, actionable, and reference the client's actual data when possible.
Keep responses concise but comprehensive. Format with clear sections when needed.
Always end with 1-2 specific action items for the coach.`;
}

// ── Suggested follow-ups ───────────────────────────────────────────────────
async function generateFollowUps(lastResponse, clientName) {
  const prompt = `Based on this AI coaching response, suggest 3 short follow-up questions a coach might ask next. Return ONLY a JSON array of 3 strings, no other text.

Response: "${lastResponse.slice(0, 500)}"
Client: ${clientName || 'general'}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    return JSON.parse(text);
  } catch {
    return [];
  }
}

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ message, onFollowUp, onSaveNote, isLast }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [followUps, setFollowUps] = useState(message.followUps || []);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);

  useEffect(() => {
    if (!isUser && isLast && followUps.length === 0 && message.content?.length > 100) {
      setLoadingFollowUps(true);
      generateFollowUps(message.content, message.clientName).then(suggestions => {
        setFollowUps(suggestions);
        setLoadingFollowUps(false);
      });
    }
  }, [isLast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
        isUser ? 'bg-[#1F2937]' : 'bg-primary/10'
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-white" />
          : <Sparkles className="w-3.5 h-3.5 text-primary" />
        }
      </div>

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[85%]')}>
        <div className={cn(
          'rounded-2xl px-4 py-3 text-sm',
          isUser
            ? 'bg-[#111827] text-white'
            : 'bg-white border border-[#E7EAF3] text-[#1F2A44] shadow-sm'
        )}>
          {isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
              components={{
                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-1 ml-4 list-disc space-y-0.5">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal space-y-0.5">{children}</ol>,
                li: ({ children }) => <li className="my-0">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
                code: ({ children }) => <code className="px-1 py-0.5 rounded bg-secondary text-xs font-mono">{children}</code>,
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>

        {/* Actions row */}
        <div className={cn('flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity', isUser && 'flex-row-reverse')}>
          {message.timestamp && (
            <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
          )}
          {!isUser && (
            <>
              <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              {onSaveNote && (
                <button onClick={() => onSaveNote(message.content)} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                  <BookmarkPlus className="w-3 h-3" /> Save note
                </button>
              )}
            </>
          )}
        </div>

        {/* Follow-up chips */}
        {!isUser && isLast && (followUps.length > 0 || loadingFollowUps) && (
          <div className="flex flex-wrap gap-1.5 mt-1 max-w-[500px]">
            {loadingFollowUps ? (
              <span className="text-[10px] text-muted-foreground animate-pulse">Generating follow-ups...</span>
            ) : followUps.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="flex items-center gap-1 text-[10px] bg-accent text-accent-foreground border border-border hover:bg-secondary px-2.5 py-1 rounded-full transition-colors"
              >
                <ChevronRight className="w-2.5 h-2.5" /> {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-white border border-[#E7EAF3] rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(delay => (
            <div
              key={delay}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main chat component ────────────────────────────────────────────────────
export default function AssistantClaudeChat({ selectedClient, pendingPrompt, onPromptConsumed, onSave }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

  const { data: checkIns = [] } = useQuery({
    queryKey: ['checkins-chat', selectedClient?.id],
    queryFn: () => base44.entities.CheckIn.list('-date', 100),
    staleTime: 60_000,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ['nutrition-plans'],
    queryFn: () => base44.entities.NutritionPlan.list(),
    staleTime: 60_000,
  });

  const clientCheckIns = checkIns.filter(c => c.client_id === selectedClient?.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCheckIn = clientCheckIns[0];
  const adherenceScore = averageAdherenceScore(clientCheckIns) || 0;
  const streak = calculateStreak(clientCheckIns);
  const plan = plans.find(p => p.id === selectedClient?.assigned_nutrition_id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle pending prompt (quick actions or load conversation)
  useEffect(() => {
    if (!pendingPrompt) return;
    if (pendingPrompt.__loadMessages) {
      setMessages(pendingPrompt.__loadMessages);
      onPromptConsumed?.();
      return;
    }
    setInput(pendingPrompt);
    onPromptConsumed?.();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [pendingPrompt]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setCharCount(0);

    const userMsg = { role: 'user', content: trimmed, timestamp: format(new Date(), 'h:mm a') };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const systemPrompt = buildSystemPrompt(selectedClient, plan, lastCheckIn, adherenceScore, streak);
    const historyForAPI = newMessages.map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1500,
          system: systemPrompt,
          messages: historyForAPI,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Claude API error');

      const aiContent = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      const aiMsg = {
        role: 'assistant',
        content: aiContent,
        timestamp: format(new Date(), 'h:mm a'),
        clientName: selectedClient?.name,
      };
      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      // Save conversation to database
      const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? '...' : '');
      base44.entities.AIConversation.create({
        client_id: selectedClient?.id || '',
        client_name: selectedClient?.name || 'General',
        title,
        messages: finalMessages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
      }).then(() => onSave?.()).catch(() => {});

    } catch (err) {
      toast.error('Failed to get AI response. Check your API key in settings.');
      setMessages(prev => prev.filter(m => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading, selectedClient, plan, lastCheckIn, adherenceScore, streak, apiKey]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    setCharCount(e.target.value.length);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSaveNote = async (content) => {
    if (!selectedClient) { toast.error('Select a client first'); return; }
    const existing = await base44.entities.Client.list();
    const c = existing.find(x => x.id === selectedClient.id);
    if (!c) return;
    const note = `[AI Note - ${format(new Date(), 'MMM d, yyyy')}]\n${content.slice(0, 500)}`;
    await base44.entities.Client.update(selectedClient.id, { notes: (c.notes ? c.notes + '\n\n' : '') + note });
    toast.success('Saved to client notes');
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="bg-white border border-border rounded-xl flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">
                {selectedClient ? `Coaching ${selectedClient.name}` : 'AI Coach Assistant'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {selectedClient
                  ? `Client context loaded. Ask anything about ${selectedClient.name}'s nutrition, training, or progress — or use a Quick Action from the sidebar.`
                  : 'Select a client to get personalized AI coaching insights, or ask a general coaching question below.'}
              </p>
            </div>
            {!selectedClient && (
              <div className="grid grid-cols-2 gap-2 max-w-sm w-full mt-2">
                {['How do I structure a deload week?', 'What are signs a client is at risk?', 'Best macro split for fat loss?', 'How to improve client retention?'].map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-xs text-left bg-secondary hover:bg-border p-3 rounded-xl transition-colors text-muted-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble
                key={i}
                message={msg}
                isLast={i === messages.length - 1}
                onFollowUp={sendMessage}
                onSaveNote={msg.role === 'assistant' ? handleSaveNote : null}
              />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-border bg-white flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={selectedClient
                ? `Ask about ${selectedClient.name}...`
                : 'Ask a coaching question...'}
              rows={1}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10 min-h-[40px]"
              disabled={isLoading}
              style={{ height: 'auto', overflow: 'hidden' }}
            />
            <span className="absolute bottom-1.5 right-2.5 text-[9px] text-muted-foreground/40 tabular-nums pointer-events-none">
              {charCount}
            </span>
          </div>
          <button
            onClick={() => toast.info('Voice input coming soon!')}
            className="h-9 w-9 rounded-xl border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}