import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Sparkles, Copy, Check, Mic, BookmarkPlus, User, ChevronRight, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { averageAdherenceScore, calculateStreak } from '@/lib/adherence';
import { format } from 'date-fns';

// API calls now go through backend function to avoid exposing API keys

// ── Tools definition ───────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'create_nutrition_plan',
    description: 'Create a new nutrition plan for a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        title: { type: 'string' },
        calories: { type: 'number' },
        protein_g: { type: 'number' },
        carbs_g: { type: 'number' },
        fats_g: { type: 'number' },
        description: { type: 'string' },
        tracking_mode: { type: 'string', enum: ['macros', 'habits'] },
      },
      required: ['title', 'calories', 'protein_g', 'carbs_g', 'fats_g'],
    },
  },
  {
    name: 'update_client',
    description: 'Update a client\'s profile information or status',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string', description: "The client's ID" },
        fields: { type: 'object', description: 'Fields to update: goal, lifecycle_status, notes, tags' },
      },
      required: ['client_id', 'fields'],
    },
  },
  {
    name: 'send_message',
    description: 'Send a message to a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        message: { type: 'string' },
      },
      required: ['client_id', 'message'],
    },
  },
  {
    name: 'create_checkin_response',
    description: 'Submit a coach response to a client check-in',
    input_schema: {
      type: 'object',
      properties: {
        checkin_id: { type: 'string' },
        response: { type: 'string' },
        review_status: { type: 'string', enum: ['reviewed', 'flagged'] },
      },
      required: ['checkin_id', 'response'],
    },
  },
  {
    name: 'award_badge',
    description: 'Award an achievement badge to a client',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        badge_key: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['client_id', 'badge_key'],
    },
  },
  {
    name: 'get_client_data',
    description: 'Get full data for a specific client including check-ins, nutrition plan, and progress',
    input_schema: {
      type: 'object',
      properties: { client_id: { type: 'string' } },
      required: ['client_id'],
    },
  },
  {
    name: 'list_clients',
    description: 'Get a list of all clients with their key stats',
    input_schema: {
      type: 'object',
      properties: { filter: { type: 'string', description: 'Optional: active, at_risk, lead' } },
    },
  },
  {
    name: 'update_nutrition_plan',
    description: 'Update an existing nutrition plan calories or macros',
    input_schema: {
      type: 'object',
      properties: {
        plan_id: { type: 'string' },
        fields: { type: 'object', description: 'Fields to update: calories, protein_g, carbs_g, fats_g, title, description' },
      },
      required: ['plan_id', 'fields'],
    },
  },
  {
    name: 'flag_client_at_risk',
    description: 'Flag a client as at-risk and add a note',
    input_schema: {
      type: 'object',
      properties: {
        client_id: { type: 'string' },
        reason: { type: 'string' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['client_id', 'reason'],
    },
  },
  {
    name: 'create_program',
    description: 'Create a basic workout program structure for a client',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        client_id: { type: 'string' },
        duration_weeks: { type: 'number' },
        days_per_week: { type: 'number' },
        difficulty: { type: 'string', enum: ['beginner', 'intermediate', 'advanced'] },
        description: { type: 'string' },
      },
      required: ['title', 'duration_weeks', 'days_per_week'],
    },
  },
];

const TOOL_ICONS = {
  create_nutrition_plan: '🥗',
  update_client: '👤',
  send_message: '💬',
  create_checkin_response: '✅',
  award_badge: '🏆',
  get_client_data: '🔍',
  list_clients: '📋',
  update_nutrition_plan: '📊',
  flag_client_at_risk: '⚠️',
  create_program: '💪',
};

// ── Build system prompt ────────────────────────────────────────────────────
function buildSystemPrompt(client, plan, lastCheckIn, adherenceScore, streak) {
  const clientSection = client ? `
CURRENT CLIENT CONTEXT:
- Name: ${client.name}
- Goal: ${client.goal?.replace(/_/g, ' ') || 'general fitness'}
- Current weight: ${client.current_weight || 'unknown'} lbs
- Target weight: ${client.target_weight || 'not set'} lbs
- Assigned nutrition plan: ${plan?.title || 'None assigned'} (ID: ${plan?.id || 'none'})
- Daily targets: ${plan?.calories || '?'} kcal, ${plan?.protein_g || '?'}g protein
- Last check-in: ${lastCheckIn?.date || 'Never'} (ID: ${lastCheckIn?.id || 'none'})
- Overall adherence: ${Math.round(adherenceScore)}%
- Check-in streak: ${streak} days
- Recent mood: ${lastCheckIn?.mood || 'unknown'}
- Recent sleep: ${lastCheckIn?.sleep_hours || 'unknown'} hours
- Energy: ${lastCheckIn?.energy_level || 'unknown'}/10
- Training compliance: ${lastCheckIn?.compliance_training || 'unknown'}%
- Nutrition compliance: ${lastCheckIn?.compliance_nutrition || 'unknown'}%
- Client ID: ${client.id}
` : '';

  return `You are an expert fitness coach AI assistant with the ability to take REAL ACTIONS inside the coaching platform.

You have access to tools that let you directly create nutrition plans, send messages, respond to check-ins, award badges, update client profiles, and more. When a coach asks you to do something that requires an action — DO IT using the available tools, don't just give advice.
${clientSection}
IMPORTANT GUIDELINES:
- When asked to create, update, send, or modify anything — use the appropriate tool immediately
- Use get_client_data or list_clients to look up IDs before acting on clients you don't have context for
- You can chain multiple tool calls to complete complex tasks (e.g., update plan then send message)
- After completing actions, summarize what you did and any relevant results
- Always include client IDs and plan IDs when using tools — use get_client_data if you need to look them up
- Be proactive: if asked to "handle" something, take the full action rather than asking for confirmation
- Keep final text responses concise — the tool results speak for themselves`;
}

// ── Backend API call ───────────────────────────────────────────────────────
async function callClaude(_apiKey, systemPrompt, messages) {
  const res = await base44.functions.invoke('claudeAssistant', { systemPrompt, messages });
  const data = res.data;
  if (data?.error) throw new Error(data.error);
  return data;
}

// ── Tool action card ───────────────────────────────────────────────────────
function ToolActionCard({ toolName, input, result }) {
  const icon = TOOL_ICONS[toolName] || '⚙️';
  const label = toolName.replace(/_/g, ' ');
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl text-sm">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#111827] capitalize">{result ? 'Done:' : 'Working:'} {label}</p>
        <p className="text-[#6B7280] text-xs truncate">{result?.message || result?.error || 'Processing...'}</p>
      </div>
      {result ? (
        <span className={cn('text-xs font-semibold shrink-0', result.error ? 'text-red-500' : 'text-green-500')}>
          {result.error ? '✗ Failed' : '✓ Done'}
        </span>
      ) : (
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
      )}
    </div>
  );
}

// ── Message bubble ─────────────────────────────────────────────────────────
function MessageBubble({ message, onFollowUp, onSaveNote, isLast }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [followUps, setFollowUps] = useState(message.followUps || []);
  const [loadingFollowUps, setLoadingFollowUps] = useState(false);

  useEffect(() => {
    if (!isUser && isLast && followUps.length === 0 && message.content?.length > 80) {
      setLoadingFollowUps(true);
      (async () => {
        try {
          const data = await callClaude(null, 'Suggest 3 short follow-up questions a coach might ask next. Return ONLY a JSON array of 3 strings.', [
            { role: 'user', content: `Based on this response: "${message.content.slice(0, 400)}" — suggest 3 follow-up questions as a JSON array.` },
          ]);
          const text = data.content?.[0]?.text || '[]';
          setFollowUps(JSON.parse(text));
        } catch { /* silent */ }
        setLoadingFollowUps(false);
      })();
    }
  }, [isLast]);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tool actions embedded in message
  if (message.toolActions) {
    return (
      <div className="space-y-2 pl-10">
        {message.toolActions.map((ta, i) => (
          <ToolActionCard key={i} toolName={ta.name} input={ta.input} result={ta.result} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-3 group', isUser && 'flex-row-reverse')}>
      <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', isUser ? 'bg-[#1F2937]' : 'bg-primary/10')}>
        {isUser ? <User className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
      </div>

      <div className={cn('flex flex-col gap-1', isUser ? 'items-end max-w-[80%]' : 'items-start max-w-[85%]')}>
        <div className={cn('rounded-2xl px-4 py-3 text-sm', isUser ? 'bg-[#111827] text-white' : 'bg-white border border-[#E7EAF3] text-[#1F2A44] shadow-sm')}>
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

        <div className={cn('flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity', isUser && 'flex-row-reverse')}>
          {message.timestamp && <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>}
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

        {!isUser && isLast && (followUps.length > 0 || loadingFollowUps) && (
          <div className="flex flex-wrap gap-1.5 mt-1 max-w-[500px]">
            {loadingFollowUps ? (
              <span className="text-[10px] text-muted-foreground animate-pulse">Generating follow-ups...</span>
            ) : followUps.map((q, i) => (
              <button key={i} onClick={() => onFollowUp(q)}
                className="flex items-center gap-1 text-[10px] bg-accent text-accent-foreground border border-border hover:bg-secondary px-2.5 py-1 rounded-full transition-colors">
                <ChevronRight className="w-2.5 h-2.5" /> {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-white border border-[#E7EAF3] rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map(delay => (
            <div key={delay} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main chat component ────────────────────────────────────────────────────
export default function AssistantClaudeChat({ selectedClient, pendingPrompt, onPromptConsumed, onSave }) {
  const [displayMessages, setDisplayMessages] = useState([]); // what user sees
  const [apiMessages, setApiMessages] = useState([]); // raw Claude API history
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: allClients = [] } = useQuery({ queryKey: ['clients'], queryFn: () => base44.entities.Client.list('name'), staleTime: 30_000 });
  const { data: checkIns = [] } = useQuery({ queryKey: ['checkins-chat'], queryFn: () => base44.entities.CheckIn.list('-date', 200), staleTime: 60_000 });
  const { data: plans = [] } = useQuery({ queryKey: ['nutrition-plans'], queryFn: () => base44.entities.NutritionPlan.list(), staleTime: 60_000 });

  const clientCheckIns = checkIns.filter(c => c.client_id === selectedClient?.id).sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastCheckIn = clientCheckIns[0];
  const adherenceScore = averageAdherenceScore(clientCheckIns) || 0;
  const streak = calculateStreak(clientCheckIns);
  const plan = plans.find(p => p.id === selectedClient?.assigned_nutrition_id);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [displayMessages, isLoading]);

  useEffect(() => {
    if (!pendingPrompt) return;
    if (pendingPrompt.__loadMessages) {
      setDisplayMessages(pendingPrompt.__loadMessages);
      setApiMessages(pendingPrompt.__loadMessages.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content })));
      onPromptConsumed?.();
      return;
    }
    setInput(pendingPrompt);
    onPromptConsumed?.();
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [pendingPrompt]);

  // ── Tool executor ──────────────────────────────────────────────────────
  const executeTool = useCallback(async (toolName, toolInput) => {
    switch (toolName) {
      case 'create_nutrition_plan': {
        const p = await base44.entities.NutritionPlan.create({ tracking_mode: 'macros', ...toolInput });
        if (toolInput.client_id) await base44.entities.Client.update(toolInput.client_id, { assigned_nutrition_id: p.id });
        queryClient.invalidateQueries({ queryKey: ['nutrition-plans'] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        return { success: true, plan_id: p.id, message: `Created plan "${toolInput.title}"` };
      }
      case 'update_client': {
        await base44.entities.Client.update(toolInput.client_id, toolInput.fields);
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        return { success: true, message: 'Client updated successfully' };
      }
      case 'send_message': {
        await base44.entities.Message.create({ client_id: toolInput.client_id, content: toolInput.message, sender: 'coach' });
        queryClient.invalidateQueries({ queryKey: ['messages'] });
        return { success: true, message: 'Message sent' };
      }
      case 'create_checkin_response': {
        await base44.entities.CheckIn.update(toolInput.checkin_id, { coach_notes: toolInput.response, review_status: toolInput.review_status || 'reviewed', coach_responded: true });
        queryClient.invalidateQueries({ queryKey: ['checkins-review'] });
        queryClient.invalidateQueries({ queryKey: ['checkins-chat'] });
        return { success: true, message: 'Check-in response submitted' };
      }
      case 'award_badge': {
        const c = allClients.find(x => x.id === toolInput.client_id);
        await base44.entities.ClientBadge.create({ client_id: toolInput.client_id, client_name: c?.name || '', badge_key: toolInput.badge_key, earned_date: new Date().toISOString().split('T')[0], notes: toolInput.notes || '' });
        queryClient.invalidateQueries({ queryKey: ['badges'] });
        return { success: true, message: `Badge "${toolInput.badge_key}" awarded to ${c?.name || toolInput.client_id}` };
      }
      case 'get_client_data': {
        const clientData = allClients.find(c => c.id === toolInput.client_id);
        const cCheckIns = checkIns.filter(ci => ci.client_id === toolInput.client_id).sort((a, b) => new Date(b.date) - new Date(a.date));
        const clientPlan = plans.find(p => p.id === clientData?.assigned_nutrition_id);
        return { client: clientData, recent_checkins: cCheckIns.slice(0, 5), nutrition_plan: clientPlan };
      }
      case 'list_clients': {
        let filtered = allClients;
        if (toolInput.filter === 'active') filtered = allClients.filter(c => c.lifecycle_status === 'active');
        if (toolInput.filter === 'at_risk') filtered = allClients.filter(c => c.lifecycle_status === 'at_risk');
        if (toolInput.filter === 'lead') filtered = allClients.filter(c => c.lifecycle_status === 'lead');
        return { clients: filtered.map(c => ({ id: c.id, name: c.name, status: c.lifecycle_status, goal: c.goal, assigned_nutrition_id: c.assigned_nutrition_id })) };
      }
      case 'update_nutrition_plan': {
        await base44.entities.NutritionPlan.update(toolInput.plan_id, toolInput.fields);
        queryClient.invalidateQueries({ queryKey: ['nutrition-plans'] });
        return { success: true, message: 'Nutrition plan updated' };
      }
      case 'flag_client_at_risk': {
        await base44.entities.Client.update(toolInput.client_id, { lifecycle_status: 'at_risk', lifecycle_notes: `[AI Flag] ${toolInput.reason} (urgency: ${toolInput.urgency || 'medium'})` });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        return { success: true, message: `Client flagged as at-risk: ${toolInput.reason}` };
      }
      case 'create_program': {
        const prog = await base44.entities.WorkoutProgram.create({ workouts: [], ...toolInput });
        if (toolInput.client_id) await base44.entities.Client.update(toolInput.client_id, { assigned_program_id: prog.id });
        queryClient.invalidateQueries({ queryKey: ['programs'] });
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        return { success: true, program_id: prog.id, message: `Created program "${toolInput.title}"` };
      }
      default:
        return { error: 'Unknown tool' };
    }
  }, [allClients, checkIns, plans, queryClient]);

  // ── Agentic send loop ──────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isLoading) return;
    setInput('');
    setCharCount(0);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    const userDisplayMsg = { role: 'user', content: trimmed, timestamp: format(new Date(), 'h:mm a') };
    setDisplayMessages(prev => [...prev, userDisplayMsg]);

    const systemPrompt = buildSystemPrompt(selectedClient, plan, lastCheckIn, adherenceScore, streak);
    const newApiMessages = [...apiMessages, { role: 'user', content: trimmed }];

    setIsLoading(true);
    let currentApiMessages = newApiMessages;

    try {
      let response = await callClaude(null, systemPrompt, currentApiMessages);

      // Agentic loop — keep going while Claude wants to use tools
      while (response.stop_reason === 'tool_use') {
        const toolBlocks = response.content.filter(b => b.type === 'tool_use');

        // Show tool action cards (pending)
        const toolActionsMsg = { role: 'tool_actions', toolActions: toolBlocks.map(b => ({ name: b.name, input: b.input, result: null })) };
        setDisplayMessages(prev => [...prev, toolActionsMsg]);

        // Execute all tools in parallel
        const toolResults = await Promise.all(
          toolBlocks.map(async (block) => {
            const result = await executeTool(block.name, block.input);
            return { block, result };
          })
        );

        // Update tool cards with results
        setDisplayMessages(prev => {
          const updated = [...prev];
          const idx = updated.findLastIndex(m => m.role === 'tool_actions');
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              toolActions: toolResults.map(({ block, result }) => ({ name: block.name, input: block.input, result })),
            };
          }
          return updated;
        });

        // Build tool results for API
        currentApiMessages = [
          ...currentApiMessages,
          { role: 'assistant', content: response.content },
          {
            role: 'user',
            content: toolResults.map(({ block, result }) => ({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result),
            })),
          },
        ];

        response = await callClaude(null, systemPrompt, currentApiMessages);
      }

      // Final text response
      const aiText = response.content.find(b => b.type === 'text')?.text || 'Done.';
      const aiDisplayMsg = { role: 'assistant', content: aiText, timestamp: format(new Date(), 'h:mm a'), clientName: selectedClient?.name };
      setDisplayMessages(prev => [...prev, aiDisplayMsg]);

      const finalApiMessages = [...currentApiMessages, { role: 'assistant', content: response.content }];
      setApiMessages(finalApiMessages);

      // Save conversation
      const allDisplay = [...displayMessages, userDisplayMsg, aiDisplayMsg];
      const title = trimmed.slice(0, 60) + (trimmed.length > 60 ? '...' : '');
      base44.entities.AIConversation.create({
        client_id: selectedClient?.id || '',
        client_name: selectedClient?.name || 'General',
        title,
        messages: allDisplay.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
      }).then(() => onSave?.()).catch(() => {});

    } catch (err) {
      toast.error('AI error: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [input, apiMessages, displayMessages, isLoading, selectedClient, plan, lastCheckIn, adherenceScore, streak, executeTool]);

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleInputChange = (e) => {
    setInput(e.target.value);
    setCharCount(e.target.value.length);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const handleSaveNote = async (content) => {
    if (!selectedClient) { toast.error('Select a client first'); return; }
    const c = allClients.find(x => x.id === selectedClient.id);
    if (!c) return;
    const note = `[AI Note - ${format(new Date(), 'MMM d, yyyy')}]\n${content.slice(0, 500)}`;
    await base44.entities.Client.update(selectedClient.id, { notes: (c.notes ? c.notes + '\n\n' : '') + note });
    queryClient.invalidateQueries({ queryKey: ['clients'] });
    toast.success('Saved to client notes');
  };

  const isEmpty = displayMessages.length === 0;
  const lastDisplayIdx = displayMessages.length - 1;

  return (
    <div className="bg-white border border-border rounded-xl flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
      {/* Agent indicator */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
        <Zap className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">Agentic Mode</span>
        <span className="text-xs text-muted-foreground">— can take real actions in your app</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-bold text-lg text-foreground">{selectedClient ? `Coaching ${selectedClient.name}` : 'AI Coach Assistant'}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {selectedClient
                  ? `I can take real actions for ${selectedClient.name} — create plans, send messages, respond to check-ins, award badges, and more.`
                  : 'Select a client and ask me to take action, or ask a general coaching question below.'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-md w-full mt-2">
              {(selectedClient ? [
                `Create a fat loss nutrition plan for ${selectedClient.name}`,
                `Respond to ${selectedClient.name}'s latest check-in`,
                `Send ${selectedClient.name} a motivation message`,
                `Analyze ${selectedClient.name}'s progress and flag if at risk`,
              ] : [
                'List all at-risk clients',
                'Respond to all pending check-ins',
                'Who needs a nutrition plan update?',
                'Award streak badges to qualifying clients',
              ]).map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="text-xs text-left bg-secondary hover:bg-border p-3 rounded-xl transition-colors text-muted-foreground">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {displayMessages.map((msg, i) => (
              msg.role === 'tool_actions' ? (
                <div key={i} className="space-y-2 pl-10">
                  {msg.toolActions.map((ta, j) => (
                    <ToolActionCard key={j} toolName={ta.name} input={ta.input} result={ta.result} />
                  ))}
                </div>
              ) : (
                <MessageBubble
                  key={i}
                  message={msg}
                  isLast={i === lastDisplayIdx && msg.role === 'assistant'}
                  onFollowUp={sendMessage}
                  onSaveNote={msg.role === 'assistant' ? handleSaveNote : null}
                />
              )
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-white flex-shrink-0">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKey}
              placeholder={selectedClient ? `Tell me what to do for ${selectedClient.name}...` : 'Ask or give me an action to take...'}
              rows={1}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring pr-10 min-h-[40px]"
              disabled={isLoading}
              style={{ height: 'auto', overflow: 'hidden' }}
            />
            <span className="absolute bottom-1.5 right-2.5 text-[9px] text-muted-foreground/40 tabular-nums pointer-events-none">{charCount}</span>
          </div>
          <button onClick={() => toast.info('Voice input coming soon!')}
            className="h-9 w-9 rounded-xl border border-input bg-background flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors shrink-0">
            <Mic className="w-4 h-4" />
          </button>
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
            className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 px-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}