// Supabase Edge Function: weeklyDigest  (Migration Step 5b)
//
// Port of base44/functions/weeklyDigest. The inline 0–10 priorityScore + churn
// logic is REMOVED and replaced by the shared source-of-truth risk model
// (_shared/weeklyDigest.js → getAtRiskClients, 0–100). Admin-only. The email
// language was updated for the new scale ("Risk score: N/100", not "N/10").
// No scoring logic lives in this file — it only loads data, calls the shared
// builder, and sends the email.
import { getCaller, serviceClient, jsonResponse, cors } from '../_shared/edgeClients.js';
import { buildWeeklyDigest, renderDigestEmail } from '../_shared/weeklyDigest.js';

const COACH_TIPS = [
  'Send a voice message instead of text this week — clients love the personal touch.',
  'Review your least-engaged client and schedule a surprise check-in call.',
  "Consider updating a client's program — stale programs reduce adherence by up to 30%.",
  'Ask one client to share a progress photo — it boosts their accountability significantly.',
  'A personalized win acknowledgment takes 30 seconds and dramatically improves retention.',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (caller?.profile?.role !== 'admin') return jsonResponse({ error: 'Admin only' }, 403);

    const svc = serviceClient();
    const [{ data: clients }, { data: checkIns }] = await Promise.all([
      svc.from('clients').select('*').order('created_at', { ascending: false }),
      svc.from('check_ins').select('*').order('date', { ascending: false }).limit(200),
    ]);

    const now = new Date();
    const digest = buildWeeklyDigest(clients ?? [], checkIns ?? [], now);
    const tip = COACH_TIPS[now.getDay() % COACH_TIPS.length];
    const appUrl = Deno.env.get('APP_URL') || 'https://app.koach.ai';
    const emailHtml = renderDigestEmail(digest, { tip, appUrl });

    if (caller.profile.email) {
      try {
        await svc.functions.invoke('sendEmailNotification', {
          body: {
            to: caller.profile.email,
            subject: `🧠 Your Weekly AI Coaching Digest — ${digest.week_of}`,
            html: emailHtml,
          },
        });
      } catch (_) { /* mailer re-platformed in Step 5c; non-fatal */ }
    }

    return jsonResponse({ success: true, digest });
  } catch (error) {
    return jsonResponse({ error: (error && error.message) || 'Server error' }, 500);
  }
});
