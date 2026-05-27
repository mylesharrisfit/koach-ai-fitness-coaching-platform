import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subscription } = await req.json();

    if (!subscription) {
      return Response.json({ error: 'Missing subscription' }, { status: 400 });
    }

    // Save to user's profile or device table
    await base44.auth.updateMe({
      push_subscriptions: JSON.stringify({
        endpoint: JSON.parse(subscription).endpoint,
        timestamp: new Date().toISOString(),
      }),
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});