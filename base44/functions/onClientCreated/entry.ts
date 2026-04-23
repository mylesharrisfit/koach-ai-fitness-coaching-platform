import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const { event, data: client } = body;

    if (!client || !client.id) {
      return Response.json({ skipped: true, reason: 'No client data' });
    }

    // Find coach defaults — try by created_by first, then just get first record
    const allDefaults = await base44.asServiceRole.entities.CoachDefaults.list();
    if (!allDefaults || allDefaults.length === 0) {
      return Response.json({ skipped: true, reason: 'No coach defaults configured' });
    }

    const defaults = allDefaults[0];
    const updates = {};

    // Auto-assign program if not already assigned
    if (defaults.default_program_id && !client.assigned_program_id) {
      updates.assigned_program_id = defaults.default_program_id;
    }

    // Auto-assign nutrition plan if not already assigned
    if (defaults.default_nutrition_id && !client.assigned_nutrition_id) {
      updates.assigned_nutrition_id = defaults.default_nutrition_id;
    }

    if (Object.keys(updates).length > 0) {
      await base44.asServiceRole.entities.Client.update(client.id, updates);
    }

    // Send welcome message if enabled
    if (defaults.send_welcome_message && defaults.welcome_message) {
      await base44.asServiceRole.entities.Message.create({
        client_id: client.id,
        client_name: client.name,
        sender: 'coach',
        content: defaults.welcome_message,
        tag: 'general',
      });
    }

    // Create a notification for the coach
    await base44.asServiceRole.entities.Notification.create({
      recipient_id: client.created_by || 'admin',
      type: 'general',
      title: `New client: ${client.name}`,
      body: `${client.name} has been added. ${Object.keys(updates).length > 0 ? 'Plans auto-assigned.' : 'No defaults configured.'}`,
      link: '/clients',
    });

    return Response.json({
      success: true,
      client_id: client.id,
      updates_applied: updates,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});