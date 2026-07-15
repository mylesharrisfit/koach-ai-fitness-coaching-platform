/**
 * Shared push-subscription handler (Step 5e). Base44 shipped TWO functions
 * for this: savePushSubscription stored only {endpoint, timestamp} as a JSON
 * string on the user (dropping the p256dh/auth keys a Web-Push sender needs)
 * and storePushSubscription stored NOTHING (console.log). The frontend calls
 * both names, so both stay deployed — each serving this one handler, which
 * upserts the FULL subscription into push_subscriptions (one row per device
 * endpoint) so a future send-side can actually deliver.
 */
import { getCaller, serviceClient, cors, jsonResponse } from './edgeClients.js';

export async function handleSaveSubscription(req) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const caller = await getCaller(req);
    if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);

    const { subscription } = await req.json();
    if (!subscription) return jsonResponse({ error: 'Missing subscription' }, 400);

    const sub = typeof subscription === 'string' ? JSON.parse(subscription) : subscription;
    if (!sub?.endpoint) return jsonResponse({ error: 'Subscription missing endpoint' }, 400);

    const svc = serviceClient();
    const { data: existing } = await svc.from('push_subscriptions')
      .select('id').eq('user_id', caller.auth.id).eq('endpoint', sub.endpoint).maybeSingle();

    if (existing) {
      await svc.from('push_subscriptions')
        .update({ subscription: sub, user_agent: req.headers.get('user-agent') ?? null })
        .eq('id', existing.id);
      return jsonResponse({ success: true, deviceId: existing.id, message: 'Push subscription updated' });
    }

    const { data: created, error } = await svc.from('push_subscriptions').insert({
      user_id: caller.auth.id,
      endpoint: sub.endpoint,
      subscription: sub,
      user_agent: req.headers.get('user-agent') ?? null,
    }).select('id').single();
    if (error) throw new Error(error.message);

    return jsonResponse({ success: true, deviceId: created.id, message: 'Push subscription stored' });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
