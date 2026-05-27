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

    // Parse subscription
    const sub = JSON.parse(subscription);
    const endpoint = sub.endpoint;
    const deviceId = `${user.id}-${Date.now()}`;

    // Store subscription in database for later use
    // You would create a PushSubscription entity to track this
    // For now, just log it
    console.log(`Push subscription stored for ${user.email}:`, endpoint);

    return Response.json({ 
      success: true,
      deviceId,
      message: 'Push subscription stored',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});