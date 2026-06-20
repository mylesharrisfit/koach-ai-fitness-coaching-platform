import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

async function executeTool(toolName, input, base44) {
  try {
    switch (toolName) {
      case 'get_client_data': {
        const client = await base44.asServiceRole.entities.Client.filter({ id: input.client_id }, '-created_date', 1).then(r => r[0]);
        const checkIns = await base44.asServiceRole.entities.CheckIn.filter({ client_id: input.client_id }, '-date', 5);
        const plan = client?.assigned_nutrition_id
          ? await base44.asServiceRole.entities.NutritionPlan.filter({ id: client.assigned_nutrition_id }, '-created_date', 1).then(r => r[0])
          : null;
        return { client, recent_checkins: checkIns, nutrition_plan: plan };
      }
      case 'list_clients': {
        const allClients = await base44.asServiceRole.entities.Client.list('name', 100);
        const filter = input.filter;
        const filtered = filter && filter !== 'all'
          ? allClients.filter(c => c.lifecycle_status === filter)
          : allClients;
        return {
          clients: filtered.map(c => ({
            id: c.id, name: c.name, status: c.lifecycle_status,
            goal: c.goal, assigned_nutrition_id: c.assigned_nutrition_id,
            assigned_program_id: c.assigned_program_id, current_weight: c.current_weight
          }))
        };
      }
      case 'create_nutrition_plan': {
        const plan = await base44.asServiceRole.entities.NutritionPlan.create({
          title: input.title,
          calories: input.calories,
          protein_g: input.protein_g,
          carbs_g: input.carbs_g,
          fats_g: input.fats_g,
          tracking_mode: input.tracking_mode || 'macros',
          description: input.description || '',
          client_id: input.client_id || '',
          status: 'active',
        });
        if (input.client_id) {
          await base44.asServiceRole.entities.Client.update(input.client_id, { assigned_nutrition_id: plan.id });
        }
        return { success: true, plan_id: plan.id, message: 'Created nutrition plan: ' + input.title };
      }
      case 'update_nutrition_plan': {
        const fields = {};
        if (input.calories !== undefined) fields.calories = input.calories;
        if (input.protein_g !== undefined) fields.protein_g = input.protein_g;
        if (input.carbs_g !== undefined) fields.carbs_g = input.carbs_g;
        if (input.fats_g !== undefined) fields.fats_g = input.fats_g;
        if (input.title) fields.title = input.title;
        if (input.description) fields.description = input.description;
        await base44.asServiceRole.entities.NutritionPlan.update(input.plan_id, fields);
        return { success: true, message: 'Nutrition plan updated successfully' };
      }
      case 'create_program': {
        const prog = await base44.asServiceRole.entities.WorkoutProgram.create({
          title: input.title,
          duration_weeks: input.duration_weeks,
          days_per_week: input.days_per_week,
          difficulty: input.difficulty || 'intermediate',
          description: input.description || '',
          workouts: [],
        });
        if (input.client_id) {
          await base44.asServiceRole.entities.Client.update(input.client_id, { assigned_program_id: prog.id });
        }
        return { success: true, program_id: prog.id, message: 'Created program: ' + input.title };
      }
      case 'update_client': {
        const fields = {};
        if (input.goal) fields.goal = input.goal;
        if (input.lifecycle_status) fields.lifecycle_status = input.lifecycle_status;
        if (input.notes) fields.notes = input.notes;
        if (input.tags) fields.tags = input.tags;
        if (input.target_weight) fields.target_weight = input.target_weight;
        if (input.current_weight) fields.current_weight = input.current_weight;
        await base44.asServiceRole.entities.Client.update(input.client_id, fields);
        return { success: true, message: 'Client profile updated' };
      }
      case 'flag_client_at_risk': {
        await base44.asServiceRole.entities.Client.update(input.client_id, {
          lifecycle_status: 'at_risk',
          lifecycle_notes: '[AI Flag] ' + input.reason + ' (urgency: ' + (input.urgency || 'medium') + ')',
        });
        return { success: true, message: 'Client flagged as at-risk: ' + input.reason };
      }
      case 'send_message': {
        await base44.asServiceRole.entities.Message.create({
          client_id: input.client_id,
          content: input.message,
          sender: 'coach',
        });
        return { success: true, message: 'Message sent to client' };
      }
      case 'create_checkin_response': {
        await base44.asServiceRole.entities.CheckIn.update(input.checkin_id, {
          coach_notes: input.response,
          review_status: input.review_status || 'reviewed',
          coach_responded: true,
        });
        return { success: true, message: 'Check-in response submitted' };
      }
      case 'award_badge': {
        await base44.asServiceRole.entities.ClientBadge.create({
          client_id: input.client_id,
          badge_key: input.badge_key,
          earned_date: new Date().toISOString().split('T')[0],
          notes: input.notes || '',
        });
        return { success: true, message: 'Badge awarded: ' + input.badge_key };
      }
      default:
        return { error: 'Unknown tool: ' + toolName };
    }
  } catch (err) {
    return { error: err.message };
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { userMessage, conversationHistory = [], clientContext = null } = body;

    if (!userMessage) return Response.json({ error: 'userMessage required' }, { status: 400 });

    // Build client context section
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

    // Build conversation history string
    const historyStr = conversationHistory.slice(-6).map(m =>
      (m.role === 'user' ? 'Coach' : 'Assistant') + ': ' + m.content
    ).join('\n\n');

    // Agentic loop
    const actionLog = [];
    let currentInput = userMessage;
    let fullContext = historyStr ? 'CONVERSATION HISTORY:\n' + historyStr + '\n\n' : '';
    let iterations = 0;

    while (iterations < 6) {
      iterations++;

      const prompt = systemPrompt + '\n\n' + fullContext + 'Coach: ' + currentInput + '\n\nAssistant:';

      const llmResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
      });

      const responseText = typeof llmResponse === 'string' ? llmResponse : JSON.stringify(llmResponse);

      // Parse action tags
      const actionRegex = /<action>([\s\S]*?)<\/action>/g;
      const actionsFound = [];
      let match;
      while ((match = actionRegex.exec(responseText)) !== null) {
        try {
          actionsFound.push(JSON.parse(match[1].trim()));
        } catch (_e) { /* skip malformed */ }
      }

      if (actionsFound.length === 0) {
        // No more actions — this is the final answer
        return Response.json({
          response: responseText.trim(),
          actions: actionLog,
        });
      }

      // Execute all actions found
      const results = [];
      for (const action of actionsFound) {
        const result = await executeTool(action.tool, action, base44);
        results.push({ tool: action.tool, input: action, result });
        actionLog.push({ tool: action.tool, input: action, result });
      }

      // Feed results back into context for next iteration
      const resultsStr = results.map(r =>
        'Tool: ' + r.tool + '\nResult: ' + JSON.stringify(r.result)
      ).join('\n\n');

      // Clean response text (remove action tags)
      const cleanResponse = responseText.replace(/<action>[\s\S]*?<\/action>/g, '').trim();

      fullContext += 'Coach: ' + currentInput + '\n\nAssistant: ' + (cleanResponse || '[taking action]') +
        '\n\nTOOL RESULTS:\n' + resultsStr + '\n\n';

      currentInput = 'Continue based on the tool results above. Provide your final response to the coach.';
    }

    return Response.json({
      response: 'I completed the requested actions. Please check the action log for details.',
      actions: actionLog,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});