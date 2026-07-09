-- ============================================================================
-- Migration 3 — BUSINESS: leads, packages, store listings, invoicing,
-- payments, marketing, testimonials, coach-referral program, affiliates.
--
-- Financial records (invoices, payments, referrals, commissions, payouts)
-- use ON DELETE RESTRICT so a client/coach cannot be deleted while money
-- records still point at them — deliberate, per the migration brief.
-- Platform-managed tables (referrals, commissions, payouts) are written by
-- the service role / admins only; the owning coach gets read access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- leads  (Base44: Lead)
-- stage CHECK includes Base44's legacy duplicate values (lead/booked/closed/
-- active_client) so existing data can be imported unchanged; consolidation is
-- an open question in SCHEMA_MIGRATION.md.
-- ---------------------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  instagram text,
  location text,
  source text not null default 'other' check (source in
    ('instagram', 'referral', 'store_purchase', 'website', 'cold_outreach', 'dm', 'tiktok', 'youtube', 'other')),
  stage text not null default 'new_lead' check (stage in
    ('new_lead', 'dmd', 'call_booked', 'proposal_sent', 'closed_won', 'lost',
     'lead', 'booked', 'closed', 'active_client')),
  offer_tier text check (offer_tier in ('one_on_one', 'group', 'low_ticket')),
  call_date date,
  call_time text,
  call_link text,
  deal_value numeric(12, 2),
  goal text,
  notes text,
  lost_reason text,
  converted_client_id uuid references public.clients (id) on delete set null,
  lead_score numeric(5, 1) not null default 50,
  last_contact_date timestamptz,
  follow_up_date timestamptz,
  follow_up_note text,
  stage_changed_at timestamptz,
  tags text[] not null default '{}',
  activity_log jsonb not null default '[]',
  pinned_note text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads enable row level security;
select app.add_updated_at_trigger('public.leads');
create index leads_created_by_idx on public.leads (created_by);
create index leads_stage_idx on public.leads (stage);

create policy "select own or admin" on public.leads
  for select to authenticated using (created_by = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.leads
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.leads
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.leads
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- coaching_packages  (Base44: CoachingPackage)
-- visibility='public' rows power anonymous landing pages -> anon read.
-- ---------------------------------------------------------------------------
create table public.coaching_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  long_description text,
  image_url text,
  color_theme text not null default '#2563EB',
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  billing_type text not null default 'monthly' check (billing_type in
    ('one_time', 'monthly', 'quarterly', 'annual', 'custom')),
  contract_type text not null default 'month_to_month' check (contract_type in
    ('month_to_month', 'minimum_months', 'fixed_term')),
  contract_months integer,
  trial_days integer not null default 0,
  duration_weeks integer, -- 0 = ongoing
  inclusions jsonb not null default '{}',
  custom_inclusions text[] not null default '{}',
  max_clients integer, -- 0 = unlimited
  waitlist_enabled boolean not null default false,
  visibility text not null default 'private' check (visibility in ('public', 'private', 'hidden')),
  auto_assign_program_id uuid references public.workout_programs (id) on delete set null,
  auto_assign_nutrition_id uuid references public.nutrition_plans (id) on delete set null,
  auto_welcome_message text,
  auto_schedule_call boolean not null default false,
  slug text,
  testimonials jsonb not null default '[]',
  faqs jsonb not null default '[]',
  is_active boolean not null default true,
  is_archived boolean not null default false,
  enrolled_count integer not null default 0,
  total_revenue numeric(12, 2) not null default 0,
  stripe_price_id text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coaching_packages enable row level security;
select app.add_updated_at_trigger('public.coaching_packages');
create index coaching_packages_created_by_idx on public.coaching_packages (created_by);

create policy "select own or public or admin" on public.coaching_packages
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or visibility = 'public' or app.is_admin());
create policy "insert own" on public.coaching_packages
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.coaching_packages
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.coaching_packages
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- plan_listings  (Base44: PlanListing) — storefront products
-- ---------------------------------------------------------------------------
create table public.plan_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  long_description text,
  product_type text not null default 'workout_program' check (product_type in
    ('workout_program', 'nutrition_plan', 'coaching_package', 'guide_ebook', 'video_course', 'bundle', 'custom')),
  category text not null default 'workout' check (category in
    ('workout', 'nutrition', 'coaching', 'bundle', 'other')),
  difficulty text not null default 'all_levels' check (difficulty in
    ('beginner', 'intermediate', 'advanced', 'all_levels')),
  duration_weeks integer,
  image_url text,
  additional_images text[] not null default '{}',
  preview_file_url text,
  features text[] not null default '{}',
  price numeric(12, 2) not null,
  original_price numeric(12, 2),
  is_free boolean not null default false,
  payment_type text not null default 'one_time' check (payment_type in ('one_time', 'subscription')),
  billing_frequency text not null default 'monthly' check (billing_frequency in
    ('monthly', 'quarterly', 'annual')),
  delivery_types text[] not null default '{}',
  download_file_url text,
  access_duration text not null default 'lifetime' check (access_duration in
    ('lifetime', '30_days', '60_days', '90_days', '6_months', '1_year')),
  scheduled_calls_count integer not null default 0,
  delivery_instructions text,
  stripe_product_id text,
  stripe_price_id text,
  slug text,
  coach_id uuid references public.profiles (id) on delete cascade,
  program_id uuid references public.workout_programs (id) on delete set null,
  nutrition_id uuid references public.nutrition_plans (id) on delete set null,
  is_published boolean not null default true,
  sales_count integer not null default 0,
  views_count integer not null default 0,
  rating numeric(3, 2),
  rating_count integer not null default 0,
  testimonials jsonb not null default '[]',
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.plan_listings enable row level security;
select app.add_updated_at_trigger('public.plan_listings');
create index plan_listings_coach_id_idx on public.plan_listings (coach_id);

create policy "select own or published or admin" on public.plan_listings
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or is_published or app.is_admin());
create policy "insert own" on public.plan_listings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.plan_listings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.plan_listings
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- invoices  (Base44: Invoice) — client may READ their invoices; only the
-- coach writes, only admins delete. client FK is RESTRICT (financial record).
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text,
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  client_email text,
  description text,
  amount numeric(12, 2) not null,
  status text not null default 'draft' check (status in
    ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled')),
  type text not null default 'one_time' check (type in ('one_time', 'recurring', 'package')),
  issue_date date not null,
  due_date date not null,
  paid_date date,
  stripe_invoice_id text,
  stripe_payment_url text,
  notes text,
  recurring_interval text check (recurring_interval in ('weekly', 'monthly', 'quarterly', 'yearly')),
  payment_method text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
select app.add_updated_at_trigger('public.invoices');
create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_created_by_idx on public.invoices (created_by);
create index invoices_status_idx on public.invoices (status);

create policy "select coach or portal or admin" on public.invoices
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.invoices
  for insert to authenticated with check (app.owns_client(client_id) or app.is_admin());
create policy "update own or admin" on public.invoices
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check ((created_by = (select auth.uid()) and app.owns_client(client_id)) or app.is_admin());
create policy "delete admin" on public.invoices
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- payments  (Base44: Payment) — same shape as invoices.
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete restrict,
  client_name text,
  amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  type text not null default 'monthly' check (type in ('monthly', 'one_time', 'upsell')),
  description text,
  stripe_payment_id text,
  due_date date,
  paid_date date,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
select app.add_updated_at_trigger('public.payments');
create index payments_client_id_idx on public.payments (client_id);
create index payments_created_by_idx on public.payments (created_by);

create policy "select coach or portal or admin" on public.payments
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.payments
  for insert to authenticated with check (app.owns_client(client_id) or app.is_admin());
create policy "update own or admin" on public.payments
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check ((created_by = (select auth.uid()) and app.owns_client(client_id)) or app.is_admin());
create policy "delete admin" on public.payments
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- email_templates  (Base44: EmailTemplate)
-- ---------------------------------------------------------------------------
create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  template_type text not null default 'custom' check (template_type in
    ('newsletter', 'launch', 'limited_spots', 'seasonal', 'consultation_offer',
     'reengagement', 'past_client_offer', 'new_program', 'custom')),
  template_name text not null,
  subject_line text not null,
  preview_text text,
  html_content text not null,
  plain_text_content text,
  variables text[] not null default '{}',
  use_case text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.email_templates enable row level security;
select app.add_updated_at_trigger('public.email_templates');
create index email_templates_coach_id_idx on public.email_templates (coach_id);

create policy "select own or admin" on public.email_templates
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.email_templates
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.email_templates
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.email_templates
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- marketing_campaigns  (Base44: MarketingCampaign)
-- ---------------------------------------------------------------------------
create table public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  campaign_name text not null,
  campaign_slug text not null,
  description text,
  start_date date not null,
  end_date date not null,
  campaign_url text not null,
  offer_type text not null check (offer_type in
    ('discount_percent', 'discount_dollar', 'free_week', 'bonus_service')),
  offer_value numeric(12, 2),
  referrer_bonus numeric(12, 2),
  clicks integer not null default 0,
  signups integer not null default 0,
  conversions integer not null default 0,
  revenue numeric(12, 2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'archived')),
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_campaigns enable row level security;
select app.add_updated_at_trigger('public.marketing_campaigns');
create index marketing_campaigns_coach_id_idx on public.marketing_campaigns (coach_id);

create policy "select own or admin" on public.marketing_campaigns
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.marketing_campaigns
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.marketing_campaigns
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.marketing_campaigns
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- marketing_links  (Base44: MarketingLink)
-- ---------------------------------------------------------------------------
create table public.marketing_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  link_name text not null,
  destination_type text not null default 'coach_profile' check (destination_type in
    ('package_page', 'coach_profile', 'specific_package', 'booking', 'signup')),
  destination_url text not null,
  custom_slug text,
  full_url text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  clicks integer not null default 0,
  conversions integer not null default 0,
  conversion_rate numeric(5, 2),
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.marketing_links enable row level security;
select app.add_updated_at_trigger('public.marketing_links');
create index marketing_links_coach_id_idx on public.marketing_links (coach_id);

create policy "select own or admin" on public.marketing_links
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.marketing_links
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.marketing_links
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.marketing_links
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- testimonials  (Base44: Testimonial)
-- Approved testimonials are publicly readable (landing pages) -> anon read.
-- Portal clients may submit and read their own.
-- ---------------------------------------------------------------------------
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  client_name text not null,
  rating smallint not null check (rating between 1 and 5),
  content text not null,
  permission_to_share boolean not null default false,
  display_name text not null default 'first_name_only' check (display_name in
    ('full_name', 'first_name_only', 'anonymous')),
  status text not null default 'pending_approval' check (status in
    ('pending_approval', 'approved', 'rejected')),
  is_featured boolean not null default false,
  submitted_at timestamptz,
  approved_at timestamptz,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;
select app.add_updated_at_trigger('public.testimonials');
create index testimonials_coach_id_idx on public.testimonials (coach_id);
create index testimonials_client_id_idx on public.testimonials (client_id);

create policy "select own or portal or approved or admin" on public.testimonials
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or app.is_portal_client(client_id) or status = 'approved' or app.is_admin());
create policy "insert own or portal" on public.testimonials
  for insert to authenticated
  with check ((created_by = (select auth.uid()) and coach_id = (select auth.uid()) and (client_id is null or app.owns_client(client_id))) or (app.is_portal_client(client_id) and app.portal_coach_is(coach_id)) or app.is_admin());
create policy "update own or admin" on public.testimonials
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.testimonials
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- referral_programs / referral_payouts / referrals
-- (Base44: ReferralProgram, ReferralPayout, Referral)
-- Coach-refers-coach program. referrals + payouts are platform-managed:
-- admin/service-role writes, coach reads own rows.
-- ---------------------------------------------------------------------------
create table public.referral_programs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null unique references public.profiles (id) on delete cascade,
  coach_email text not null,
  referral_code text not null unique,
  referral_link text not null,
  total_referrals integer not null default 0,
  total_earned numeric(12, 2) not null default 0,
  pending_balance numeric(12, 2) not null default 0,
  month_earnings numeric(12, 2) not null default 0,
  current_tier smallint not null default 1,
  active_referrals integer not null default 0,
  expired_referrals integer not null default 0,
  is_active boolean not null default true,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referral_programs enable row level security;
select app.add_updated_at_trigger('public.referral_programs');

create policy "select own or admin" on public.referral_programs
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.referral_programs
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.referral_programs
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.referral_programs
  for delete to authenticated using (app.is_admin());

create table public.referral_payouts (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete restrict,
  coach_email text not null,
  amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  requested_date timestamptz,
  paid_date timestamptz,
  referral_ids uuid[] not null default '{}',
  stripe_transfer_id text,
  reference_number text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referral_payouts enable row level security;
select app.add_updated_at_trigger('public.referral_payouts');
create index referral_payouts_coach_id_idx on public.referral_payouts (coach_id);

create policy "select own or admin" on public.referral_payouts
  for select to authenticated
  using (coach_id = (select auth.uid()) or app.is_admin());
create policy "insert admin" on public.referral_payouts
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.referral_payouts
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.referral_payouts
  for delete to authenticated using (app.is_admin());

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete restrict,
  referrer_email text not null,
  referred_coach_id uuid not null references public.profiles (id) on delete restrict,
  referred_coach_email text not null,
  referred_coach_name text,
  referral_code text not null,
  status text not null default 'signed_up' check (status in
    ('signed_up', 'active_30_days', 'paid', 'expired')),
  commission_amount numeric(12, 2),
  date_referred timestamptz,
  date_30_days_complete timestamptz,
  date_cancelled timestamptz,
  is_paid boolean not null default false,
  payout_id uuid references public.referral_payouts (id) on delete set null,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.referrals enable row level security;
select app.add_updated_at_trigger('public.referrals');
create index referrals_referrer_id_idx on public.referrals (referrer_id);
create index referrals_referred_coach_id_idx on public.referrals (referred_coach_id);

create policy "select own or admin" on public.referrals
  for select to authenticated
  using (referrer_id = (select auth.uid()) or app.is_admin());
create policy "insert admin" on public.referrals
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.referrals
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.referrals
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- affiliate_profiles / affiliate_applications / affiliate_links /
-- affiliate_commissions / affiliate_payouts
-- (Base44: AffiliateProfile, AffiliateApplication, AffiliateLink,
--  AffiliateCommission, AffiliatePayout)
-- Platform affiliate program. Money tables are admin/service-role write.
-- ---------------------------------------------------------------------------
create table public.affiliate_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null unique references public.profiles (id) on delete cascade,
  coach_email text not null,
  affiliate_code text not null unique,
  affiliate_url text not null,
  tier text not null default 'bronze' check (tier in ('bronze', 'silver', 'gold', 'platinum')),
  commission_rate numeric(5, 2),
  total_earned numeric(12, 2) not null default 0,
  month_earnings numeric(12, 2) not null default 0,
  pending_balance numeric(12, 2) not null default 0,
  active_referrals integer not null default 0,
  conversion_rate numeric(5, 2),
  total_clicks integer not null default 0,
  total_signups integer not null default 0,
  account_manager text,
  payout_method text not null default 'stripe_connect' check (payout_method in
    ('stripe_connect', 'bank_transfer')),
  stripe_account_id text,
  tax_form_status text not null default 'pending' check (tax_form_status in
    ('pending', 'w9_submitted', 'w8ben_submitted', 'verified')),
  agreement_signed boolean not null default false,
  agreement_signed_date timestamptz,
  is_active boolean not null default true,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.affiliate_profiles enable row level security;
select app.add_updated_at_trigger('public.affiliate_profiles');

create policy "select own or admin" on public.affiliate_profiles
  for select to authenticated
  using (coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.affiliate_profiles
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.affiliate_profiles
  for update to authenticated
  using (coach_id = (select auth.uid()) or app.is_admin())
  with check (coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.affiliate_profiles
  for delete to authenticated using (app.is_admin());

create table public.affiliate_applications (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  coach_email text not null,
  coach_name text not null,
  website_url text not null,
  platforms text[] not null default '{}',
  audience_size text not null check (audience_size in
    ('under_1k', '1k_10k', '10k_50k', '50k_100k', '100k_plus')),
  promotion_plan text not null,
  content_output_monthly text not null check (content_output_monthly in
    ('1_4_posts', '5_10_posts', '10_20_posts', '20_plus_posts')),
  has_used_koachai boolean,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by text, -- admin email, informational only
  reviewed_at timestamptz,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.affiliate_applications enable row level security;
select app.add_updated_at_trigger('public.affiliate_applications');
create index affiliate_applications_coach_id_idx on public.affiliate_applications (coach_id);

create policy "select own or admin" on public.affiliate_applications
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.affiliate_applications
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.affiliate_applications
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.affiliate_applications
  for delete to authenticated using (app.is_admin());

create table public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  affiliate_code text not null,
  link_name text not null,
  full_url text not null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  clicks integer not null default 0,
  signups integer not null default 0,
  active_coaches integer not null default 0,
  earnings numeric(12, 2) not null default 0,
  conversion_rate numeric(5, 2),
  is_active boolean not null default true,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.affiliate_links enable row level security;
select app.add_updated_at_trigger('public.affiliate_links');
create index affiliate_links_coach_id_idx on public.affiliate_links (coach_id);

create policy "select own or admin" on public.affiliate_links
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.affiliate_links
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.affiliate_links
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.affiliate_links
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

create table public.affiliate_commissions (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.profiles (id) on delete restrict,
  coach_id uuid references public.profiles (id) on delete set null, -- the referred coach
  coach_name text not null,
  affiliate_link_id uuid references public.affiliate_links (id) on delete set null,
  signup_date date not null,
  current_plan text check (current_plan in ('starter', 'pro', 'elite', 'enterprise')),
  monthly_value numeric(12, 2) not null,
  commission_rate numeric(5, 2),
  monthly_commission numeric(12, 2),
  status text not null default 'trial' check (status in ('trial', 'active', 'churned', 'paused')),
  status_changed_at timestamptz,
  total_earned numeric(12, 2) not null default 0,
  last_paid_month text, -- YYYY-MM
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.affiliate_commissions enable row level security;
select app.add_updated_at_trigger('public.affiliate_commissions');
create index affiliate_commissions_affiliate_id_idx on public.affiliate_commissions (affiliate_id);

create policy "select own or admin" on public.affiliate_commissions
  for select to authenticated
  using (affiliate_id = (select auth.uid()) or app.is_admin());
create policy "insert admin" on public.affiliate_commissions
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.affiliate_commissions
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.affiliate_commissions
  for delete to authenticated using (app.is_admin());

create table public.affiliate_payouts (
  id uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.profiles (id) on delete restrict,
  coach_email text not null,
  payout_month text not null, -- YYYY-MM
  gross_earnings numeric(12, 2) not null,
  fees numeric(12, 2) not null default 0,
  net_amount numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id text,
  paid_date timestamptz,
  statement_url text,
  commission_breakdown jsonb not null default '[]',
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.affiliate_payouts enable row level security;
select app.add_updated_at_trigger('public.affiliate_payouts');
create index affiliate_payouts_affiliate_id_idx on public.affiliate_payouts (affiliate_id);

create policy "select own or admin" on public.affiliate_payouts
  for select to authenticated
  using (affiliate_id = (select auth.uid()) or app.is_admin());
create policy "insert admin" on public.affiliate_payouts
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.affiliate_payouts
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.affiliate_payouts
  for delete to authenticated using (app.is_admin());
