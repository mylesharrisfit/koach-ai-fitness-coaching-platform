-- SECURITY: profiles.email is no longer user-writable.
--
-- profiles had a self-update policy and the privileged-column guard did not
-- cover `email`, so any signed-in user could set their profile email to
-- someone else's address. Several server paths trust that column as identity:
--   * stripeCheckout searched Stripe customers by it and adopted the match as
--     the caller's own customer -> Billing Portal for ANOTHER coach's Stripe
--     customer (cards, invoices, cancel their subscription);
--   * verifyProgramWorkoutCount resolved "the caller's client" by it -> any
--     tenant's client + program by email;
--   * initializeReferralProgram matched referral programs by it -> another
--     coach's referral code and balances.
-- Those functions now use the GoTrue-verified auth email / ids (same PR), and
-- this migration makes the column server-only:
--   * guard trigger: a user can't change email, and a self-inserted profile
--     must carry their session's (JWT) email (handle_new_user runs as
--     postgres: exempt);
--   * auth.users email changes (GoTrue runs as supabase_auth_admin: exempt)
--     are copied to profiles so the column stays correct.
-- The app never writes profiles.email from the browser (no email field in
-- updateMe callers), so nothing user-facing changes.
--
-- Function body = the live definition from 20261006000100 (verified identical
-- to production) plus the two `email` lines.

CREATE OR REPLACE FUNCTION app.protect_profile_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
     or app.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A self-inserted profile must start at the defaults: no pre-set plan,
    -- status, comp flag or trial. (handle_new_user runs as postgres and is exempt.)
    if new.role is distinct from 'user'
       or new.subscription_tier is distinct from 'starter'
       or new.billing_status is distinct from 'none'
       or new.stripe_customer_id is not null
       or new.stripe_subscription_id is not null
       or new.stripe_price_id is not null
       or new.subscription_renewal_date is not null
       or new.subscription_cancel_at_period_end is distinct from false
       or new.had_trial is distinct from false
       or new.ai_generation_count is distinct from 0
       or new.ai_generation_month is not null
       or new.billing_cycle is distinct from 'monthly'
       or new.trial_ends_at is not null
       or new.current_period_end is not null
       or new.past_due_since is not null
       or new.is_comped is distinct from false
       or new.email is distinct from (auth.jwt() ->> 'email')
    then
      raise exception 'not allowed to set privileged profile columns';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role
     or new.subscription_tier is distinct from old.subscription_tier
     or new.billing_status is distinct from old.billing_status
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.stripe_price_id is distinct from old.stripe_price_id
     or new.subscription_renewal_date is distinct from old.subscription_renewal_date
     or new.subscription_cancel_at_period_end is distinct from old.subscription_cancel_at_period_end
     or new.had_trial is distinct from old.had_trial
     or new.ai_generation_count is distinct from old.ai_generation_count
     or new.ai_generation_month is distinct from old.ai_generation_month
     or new.billing_cycle is distinct from old.billing_cycle
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
     or new.past_due_since is distinct from old.past_due_since
     or new.is_comped is distinct from old.is_comped
     or new.email is distinct from old.email
  then
    raise exception 'not allowed to modify privileged profile columns';
  end if;
  return new;
end;
$function$;


-- Keep profiles.email in step with the auth email.
create or replace function app.sync_profile_email()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public', 'pg_temp'
as $function$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$function$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function app.sync_profile_email();
