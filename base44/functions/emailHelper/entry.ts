// This file is intentionally empty — it cannot be used as a shared module.
// Email sending is inlined directly into each trigger function.
Deno.serve(async () => Response.json({ ok: true }));