// Supabase Edge Function: planMutations
//
// Coach-facing HTTP surface for the closed-loop plan-mutation approval queue.
// The heavy lifting lives in the shared single write path
// (_shared/planMutationService.js) — this endpoint just authenticates the coach
// and routes approve / reject / propose(manual_edit) to it.
//
// The queue READ path (listing pending_approval rows) is a plain RLS-scoped
// select from the frontend; no endpoint needed for that.
import { getCaller, serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
import { approveMutation, rejectMutation, proposeMutation } from '../_shared/planMutationService.js';

// Map service-layer error codes to HTTP status.
const STATUS_FOR = {
  bad_request: 400,
  not_owned: 403,
  not_found: 404,
  not_pending: 409,
  stale_diff: 409,
  open_proposal_exists: 409,
  clone_failed: 500,
  apply_failed: 500,
  insert_failed: 500,
  update_failed: 500,
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
    const svc = serviceClient();
    const coachId = caller.auth.id;

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    let res;
    switch (action) {
      case 'approve':
        res = await approveMutation({ svc, versionId: body.version_id, coachId });
        break;
      case 'reject':
        res = await rejectMutation({ svc, versionId: body.version_id, coachId, reason: body.reason });
        break;
      case 'propose':
        // Manual edit from the coach UI — applies immediately, still audited.
        // source is fixed server-side; a client can't ask for coach_command here.
        res = await proposeMutation({
          svc, coachId,
          clientId: body.client_id,
          planKind: body.plan_kind,
          planId: body.plan_id,
          diff: body.diff,
          rationale: body.rationale,
          source: 'manual_edit',
          autoApply: body.auto_apply !== false,
        });
        break;
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }

    if (res?.error) return jsonResponse({ error: res.error, code: res.code }, STATUS_FOR[res.code] ?? 400);
    return jsonResponse(res);
  } catch (error) {
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});
