// Supabase Edge Function: submitOnboardingIntake  (Migration Step 5c)
//
// Re-platform of base44/functions/submitOnboardingIntake — the PUBLIC intake
// endpoint the client onboarding flow posts to (no session yet: the prospect
// isn't a user). Writes go through the service role, matching Base44's
// asServiceRole.entities.OnboardingResponse.create. Deploy with
// --no-verify-jwt (like validateInviteToken) so anonymous prospects can submit.
//
// Schema-fit notes vs the Base44 version (which was schema-less):
//   - previous_experience now has a CHECK constraint; the form's
//     'intermediate' option is mapped to 'experienced' (1–3 yrs consistent
//     training), everything unknown is folded into schedule_preferences
//     rather than risking a constraint violation.
//   - goal/activity_level maps are unchanged from Base44.
import { serviceClient, cors, jsonResponse } from '../_shared/edgeClients.js';
// Row mapping lives in _shared so the local rehearsal builds the SAME row
// and proves it satisfies the new CHECK constraints.
import { buildIntakeRow } from '../_shared/intakeMapping.js';
import { sendResendEmail } from '../_shared/resendEmail.js';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const payload = await req.json();
    const { name, email, coachId, formData } = payload;

    if (!name || !email) {
      return jsonResponse({ success: false, error: 'Name and email are required' }, 400);
    }

    const svc = serviceClient();

    // Validate coachId actually names a profile (FK would reject garbage with
    // an opaque 500; a missing/unknown coach simply files the intake unrouted).
    let coach_id = null;
    if (coachId) {
      const { data: coach } = await svc.from('profiles').select('id').eq('id', coachId).maybeSingle();
      coach_id = coach?.id ?? null;
    }

    const { data: record, error } = await svc.from('onboarding_responses')
      .insert(buildIntakeRow({ name, email, formData }, coach_id)).select('id').single();

    if (error) throw new Error(error.message);

    // Fire-and-forget confirmation email (non-blocking, never fails the intake)
    sendResendEmail({
      to: email,
      subject: 'Your application has been received!',
      text: `Hi ${name},\n\nThank you for completing your intake form. Your coach will review your profile and reach out shortly.\n\nKOACH AI`,
    }).then((r) => { if (!r.ok) console.error('Confirmation email error:', r.error); })
      .catch((e) => console.error('Confirmation email error:', e));

    return jsonResponse({ success: true, id: record.id });
  } catch (error) {
    console.error('submitOnboardingIntake error:', error);
    return jsonResponse({ success: false, error: error.message }, 500);
  }
});
