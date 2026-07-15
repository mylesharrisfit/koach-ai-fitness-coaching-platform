// Supabase Edge Function: claudeAssistant  (Migration Step 5d)
//
// Re-platform of base44/functions/claudeAssistant — the agentic coach
// assistant: prompt → model may emit <action>{json}</action> tool calls →
// execute → feed results back, up to 6 iterations (verbatim loop shape).
//
// Two deliberate changes vs Base44:
//   - InvokeLLM → the shared Anthropic client (_shared/anthropic.js).
//   - SECURITY: Base44 ran every tool asServiceRole with no ownership checks
//     (any coach could act on any tenant's clients). Every tool now resolves
//     targets through the caller's ownership — see _shared/assistantTools.js.
import { getCaller, serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
import { invokeClaude } from '../_shared/anthropic.js';
import { executeAssistantTool } from '../_shared/assistantTools.js';

const TOOLS_PROMPT = `You are an expert AI fitness coach assistant with REAL ACTION capabilities inside the KOACH AI coaching platform.

You have access to the following tools. When you want to use a tool, output it as JSON wrapped in <action> tags.
After an action result comes back, continue naturally and take additional actions if needed.

AVAILABLE TOOLS:

1. get_client_data - Get full client info, check-ins, nutrition plan
   <action>{"tool":"get_client_data","client_id":"CLIENT_ID"}</action>

2. list_clients - List all clients
   <action>{"tool":"list_clients","filter":"all"}</action>

3. create_nutrition_plan - Create a nutrition plan and assign to client
   <action>{"tool":"create_nutrition_plan","client_id":"ID","title":"Title","calories":2200,"protein_g":180,"carbs_g":220,"fats_g":70,"tracking_mode":"macros","description":"optional"}</action>

4. update_nutrition_plan - Update existing nutrition plan
   <action>{"tool":"update_nutrition_plan","plan_id":"ID","calories":2000,"protein_g":160,"carbs_g":200,"fats_g":65}</action>

5. create_program - Create a workout program for a client
   <action>{"tool":"create_program","title":"Title","client_id":"ID","duration_weeks":8,"days_per_week":4,"difficulty":"intermediate","description":"optional"}</action>

6. update_client - Update client profile
   <action>{"tool":"update_client","client_id":"ID","goal":"weight_loss","lifecycle_status":"active","notes":"optional"}</action>

7. flag_client_at_risk - Flag a client as at-risk
   <action>{"tool":"flag_client_at_risk","client_id":"ID","reason":"reason text","urgency":"medium"}</action>

8. send_message - Send a message to a client
   <action>{"tool":"send_message","client_id":"ID","message":"Your message here"}</action>

9. create_checkin_response - Respond to a client check-in
   <action>{"tool":"create_checkin_response","checkin_id":"ID","response":"Your coaching response","review_status":"reviewed"}</action>

10. award_badge - Award an achievement badge
    <action>{"tool":"award_badge","client_id":"ID","badge_key":"streak_7","notes":"optional"}</action>

IMPORTANT RULES:
- When asked to DO something, ALWAYS use the appropriate tool - do not just give advice
- Use list_clients or get_client_data first if you need IDs or more context
- You can chain multiple actions in sequence
- After taking actions, give a clear summary of what you did
- Be proactive: fully handle requests without asking for unnecessary confirmation
- For nutrition plans, calculate sensible macros based on goals if not specified`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
    const svc = serviceClient();
    const userId = caller.auth.id;

    const body = await req.json();
    const { userMessage, conversationHistory = [], clientContext = null } = body;

    if (!userMessage) return jsonResponse({ error: 'userMessage required' }, 400);

    // Build client context section (verbatim)
    let clientSection = '';
    if (clientContext) {
      clientSection = '\n\nCURRENT CLIENT IN CONTEXT:\n' +
        '- Name: ' + clientContext.name + '\n' +
        '- ID: ' + clientContext.id + '\n' +
        '- Goal: ' + (clientContext.goal || 'general fitness').replace(/_/g, ' ') + '\n' +
        '- Current weight: ' + (clientContext.current_weight || 'unknown') + ' lbs\n' +
        '- Target weight: ' + (clientContext.target_weight || 'not set') + ' lbs\n' +
        '- Assigned nutrition plan ID: ' + (clientContext.assigned_nutrition_id || 'none') + '\n' +
        '- Assigned program ID: ' + (clientContext.assigned_program_id || 'none') + '\n' +
        '- Lifecycle status: ' + (clientContext.lifecycle_status || 'active') + '\n' +
        '- Overall adherence: ' + (clientContext.adherenceScore || 0) + '%\n' +
        '- Check-in streak: ' + (clientContext.streak || 0) + ' days\n' +
        '- Last check-in date: ' + (clientContext.lastCheckIn?.date || 'never') + '\n' +
        '- Last check-in ID: ' + (clientContext.lastCheckIn?.id || 'none') + '\n' +
        '- Last check-in mood: ' + (clientContext.lastCheckIn?.mood || 'unknown') + '\n' +
        '- Last check-in notes: ' + (clientContext.lastCheckIn?.notes || 'none');
    }

    const systemPrompt = TOOLS_PROMPT + clientSection;

    const historyStr = conversationHistory.slice(-6).map((m: { role: string; content: string }) =>
      (m.role === 'user' ? 'Coach' : 'Assistant') + ': ' + m.content
    ).join('\n\n');

    // Agentic loop (verbatim shape: ≤6 iterations, <action> tag protocol)
    const actionLog: unknown[] = [];
    let currentInput = userMessage;
    let fullContext = historyStr ? 'CONVERSATION HISTORY:\n' + historyStr + '\n\n' : '';
    let iterations = 0;

    while (iterations < 6) {
      iterations++;

      const prompt = systemPrompt + '\n\n' + fullContext + 'Coach: ' + currentInput + '\n\nAssistant:';

      const llm = await invokeClaude({ prompt, maxTokens: 2048 });
      if (!llm.ok) return jsonResponse({ error: llm.error }, llm.status ?? 500);
      const responseText = llm.text;

      // Parse action tags
      const actionRegex = /<action>([\s\S]*?)<\/action>/g;
      const actionsFound: Record<string, unknown>[] = [];
      let match;
      while ((match = actionRegex.exec(responseText)) !== null) {
        try {
          actionsFound.push(JSON.parse(match[1].trim()));
        } catch (_e) { /* skip malformed */ }
      }

      if (actionsFound.length === 0) {
        return jsonResponse({ response: responseText.trim(), actions: actionLog });
      }

      const results = [];
      for (const action of actionsFound) {
        const result = await executeAssistantTool(svc, userId, action.tool as string, action);
        results.push({ tool: action.tool, input: action, result });
        actionLog.push({ tool: action.tool, input: action, result });
      }

      const resultsStr = results.map((r) =>
        'Tool: ' + r.tool + '\nResult: ' + JSON.stringify(r.result)
      ).join('\n\n');

      const cleanResponse = responseText.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

      fullContext += 'Coach: ' + currentInput + '\n\nAssistant: ' + (cleanResponse || '[taking action]') +
        '\n\nTOOL RESULTS:\n' + resultsStr + '\n\n';

      currentInput = 'Continue based on the tool results above. Provide your final response to the coach.';
    }

    return jsonResponse({
      response: 'I completed the requested actions. Please check the action log for details.',
      actions: actionLog,
    });
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
