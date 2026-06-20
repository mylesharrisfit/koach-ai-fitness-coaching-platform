import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { systemPrompt, messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'messages array required' }, { status: 400 });
    }

    // Use InvokeLLM with claude_sonnet_4_6 for the agentic assistant
    // We need to support tool calls, so we pass the full conversation as context
    // and let the LLM decide what to do. Since InvokeLLM doesn't support native tools,
    // we embed tool schema in the system prompt and parse JSON responses.
    const toolsDescription = `
You have access to the following ACTIONS. When you want to perform an action, respond with a JSON block in this exact format ANYWHERE in your response:

<tool_call>
{"tool": "TOOL_NAME", "input": {...}}
</tool_call>

Available tools:
- create_nutrition_plan: {"client_id":"string","title":"string","calories":number,"protein_g":number,"carbs_g":number,"fats_g":number,"description":"string","tracking_mode":"macros|habits"}
- update_client: {"client_id":"string","fields":{"goal":"string","lifecycle_status":"string","notes":"string"}}
- send_message: {"client_id":"string","message":"string"}
- create_checkin_response: {"checkin_id":"string","response":"string","review_status":"reviewed|flagged"}
- award_badge: {"client_id":"string","badge_key":"string","notes":"string"}
- get_client_data: {"client_id":"string"}
- list_clients: {"filter":"active|at_risk|lead"}
- update_nutrition_plan: {"plan_id":"string","fields":{"calories":number,"protein_g":number,"carbs_g":number,"fats_g":number,"title":"string"}}
- flag_client_at_risk: {"client_id":"string","reason":"string","urgency":"low|medium|high"}
- create_program: {"title":"string","client_id":"string","duration_weeks":number,"days_per_week":number,"difficulty":"beginner|intermediate|advanced","description":"string"}

IMPORTANT: You can include tool calls AND text in the same response. After tool calls are executed, you will be called again with the results.
`;

    const fullSystem = (systemPrompt || '') + '\n\n' + toolsDescription;

    // Build a single prompt from the conversation history
    const conversationText = messages.map(m => {
      if (typeof m.content === 'string') {
        return `${m.role === 'user' ? 'Coach' : 'Assistant'}: ${m.content}`;
      }
      // Handle tool result messages
      if (Array.isArray(m.content)) {
        const toolResults = m.content.filter(c => c.type === 'tool_result');
        if (toolResults.length > 0) {
          return `Tool Results: ${toolResults.map(r => r.content).join('\n')}`;
        }
      }
      return '';
    }).filter(Boolean).join('\n\n');

    const lastUserMsg = messages.filter(m => m.role === 'user' && typeof m.content === 'string').at(-1)?.content || '';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `${fullSystem}\n\nCONVERSATION HISTORY:\n${conversationText}\n\nCurrent request: ${lastUserMsg}\n\nRespond as the AI Coach Assistant:`,
      model: 'claude_sonnet_4_6',
    });

    const text = typeof result === 'string' ? result : JSON.stringify(result);

    // Parse tool calls from response
    const toolCallRegex = /<tool_call>([\s\S]*?)<\/tool_call>/g;
    const toolCalls = [];
    let match;
    while ((match = toolCallRegex.exec(text)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        toolCalls.push({ name: parsed.tool, input: parsed.input, id: `tool_${Date.now()}_${toolCalls.length}` });
      } catch { /* skip malformed */ }
    }

    // Clean text of tool call blocks
    const cleanText = text.replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '').trim();

    if (toolCalls.length > 0) {
      return Response.json({
        stop_reason: 'tool_use',
        content: [
          ...(cleanText ? [{ type: 'text', text: cleanText }] : []),
          ...toolCalls.map(tc => ({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.input })),
        ],
      });
    }

    return Response.json({
      stop_reason: 'end_turn',
      content: [{ type: 'text', text: cleanText || text }],
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});