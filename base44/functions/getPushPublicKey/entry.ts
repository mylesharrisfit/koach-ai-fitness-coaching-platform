import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// NOTE: In production, generate VAPID keys once and store as secrets
// npx web-push generate-vapid-keys
// Store publicKey in VAPID_PUBLIC_KEY secret
// Store privateKey in VAPID_PRIVATE_KEY secret (server-side only)

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    if (!publicKey) {
      return Response.json({ error: 'Push service not configured' }, { status: 500 });
    }

    return Response.json({ 
      publicKey,
      message: 'Public key retrieved successfully',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});