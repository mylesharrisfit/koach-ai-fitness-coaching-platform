import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get client by email
    const clients = await base44.entities.Client.filter({ email: user.email }, '-created_date', 1);
    const client = clients[0];

    if (!client) {
      return Response.json({ error: 'No client found for user' }, { status: 404 });
    }

    // Get assigned program
    if (!client.assigned_program_id) {
      return Response.json({ error: 'No program assigned to client' }, { status: 404 });
    }

    const programs = await base44.entities.WorkoutProgram.filter({ id: client.assigned_program_id }, '-created_date', 1);
    const program = programs[0];

    if (!program) {
      return Response.json({ error: 'Program not found' }, { status: 404 });
    }

    // Get workout sessions
    const sessions = await base44.entities.WorkoutSession.filter({ client_id: client.id }, '-completed_at', 500);

    // Calculate values (same as the fixed component)
    const allWorkouts = program.workouts || [];
    const totalWorkouts = allWorkouts.filter(w => !w.day_name?.toLowerCase().includes('rest')).length;
    const completed = sessions.length;
    const remaining = Math.max(0, totalWorkouts - completed);

    return Response.json({
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      program: {
        id: program.id,
        title: program.title,
        duration_weeks: program.duration_weeks,
        total_workout_days_in_program: allWorkouts.length,
        non_rest_days: totalWorkouts,
      },
      calculations: {
        total_workouts: totalWorkouts,
        completed: completed,
        remaining: remaining,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});