import { createClient } from '@base44/sdk';
import { appParams } from '@/lib/app-params';
import { isSupabaseAuth } from '@/lib/authConfig';
import { supabase as supabaseFacade } from '@/api/supabaseClient';

const { appId, token, functionsVersion, appBaseUrl } = appParams;

// Underlying Base44 SDK client. Entities + functions still flow through here
// for every page not yet cut over to Supabase (Steps 2/4/5).
const base44Sdk = createClient({
  appId,
  token,
  functionsVersion,
  serverUrl: '',
  requiresAuth: false,
  appBaseUrl
});

/**
 * App-wide auth switch (Migration Step 3a).
 *
 * Auth is one session for the whole shell, so it flips all at once via the
 * VITE_AUTH_PROVIDER flag (src/lib/authConfig.js) — NOT module by module.
 * `.auth` delegates to the Supabase facade when the flag is 'supabase',
 * otherwise to the native Base44 SDK auth. `.entities` and `.functions`
 * deliberately stay on Base44 regardless, so the incremental data-layer
 * cutover from Step 2 is unaffected by the auth cutover.
 */
export const base44 = new Proxy(base44Sdk, {
  get(target, prop, receiver) {
    if (prop === 'auth' && isSupabaseAuth()) {
      return supabaseFacade.auth;
    }
    return Reflect.get(target, prop, receiver);
  },
});
