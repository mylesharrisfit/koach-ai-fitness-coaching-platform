/**
 * Storage keys + helper for carrying coach-onboarding state across the
 * account-creation step of the /start flow (PremiumOnboarding).
 *
 * IMPORTANT: onboarding answers are safe to persist, but credentials are NOT.
 * The account password must never be written to localStorage — stashOnboarding
 * strips any `account_password` before persisting.
 */
export const LS_ONBOARDING_DATA = 'koach_pending_onboarding_data';
export const LS_RESUME_PRICING = 'koach_resume_pricing';

/**
 * Persist the collected onboarding answers so they survive account creation /
 * email confirmation, and flag that the user should resume at plan selection
 * when they return authenticated. Never persists the password.
 */
export function stashOnboardingData(data) {
  try {
    const safe = { ...(data || {}) };
    delete safe.account_password;
    localStorage.setItem(LS_ONBOARDING_DATA, JSON.stringify(safe));
    localStorage.setItem(LS_RESUME_PRICING, '1');
  } catch {
    /* localStorage unavailable — non-critical */
  }
}
