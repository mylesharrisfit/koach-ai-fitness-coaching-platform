import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * seedTeam — idempotent one-time setup per coach.
 * 1. Ensures a Team record exists owned by the current coach.
 * 2. Stamps team_id onto every Client that is missing it.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Find or create the Team for this coach
    const existingTeams = await base44.entities.Team.filter({ owner_coach_id: user.id });
    let team = existingTeams[0];

    if (!team) {
      const teamName = user.full_name ? `${user.full_name}'s Team` : 'My Team';
      team = await base44.entities.Team.create({
        name: teamName,
        owner_coach_id: user.id,
      });
    }

    // 2. Backfill team_id on all clients that don't have one yet
    const allClients = await base44.entities.Client.list();
    const clientsToUpdate = allClients.filter(c => !c.team_id);

    for (const client of clientsToUpdate) {
      await base44.entities.Client.update(client.id, { team_id: team.id });
    }

    return Response.json({
      success: true,
      team_id: team.id,
      team_name: team.name,
      clients_backfilled: clientsToUpdate.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});