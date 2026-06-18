import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      return Response.json({ valid: false, reason: 'No token provided' });
    }

    const results = await base44.asServiceRole.entities.Client.filter({ invite_token: token }, '-created_date', 1);
    const client = results[0];

    if (!client) {
      return Response.json({ valid: false, reason: 'Token not found' });
    }

    if (!client.invite_token_expires || new Date(client.invite_token_expires) < new Date()) {
      return Response.json({ valid: false, reason: 'Token expired' });
    }

    return Response.json({
      valid: true,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
    });
  } catch (error) {
    console.error('validateInviteToken error:', error);
    return Response.json({ valid: false, reason: 'Server error' }, { status: 500 });
  }
});