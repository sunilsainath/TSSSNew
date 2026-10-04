-- ===========================================================================
-- Srinivasula Seva Samstha (TSSS) - initial schema (Supabase / PostgreSQL)
--
--   1. Extensions, enums, helper functions
--   2. Tables
--   3. Number generators (concurrency safe sequences)
--   4. Row Level Security policies
--   5. Public RPCs (registration, blog submission, blood help routing)
--   6. Triggers (updated_at, audit log, auth profile bootstrap)
--   7. Grants & storage buckets
-- ===========================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1. Enums & helpers
-- ---------------------------------------------------------------------------

do $$ begin create type public.app_role as enum ('super_admin','admin','content_manager','blood_help_manager');
exception when duplicate_object then null; end $$;

do $$ begin create type public.member_status as enum ('active','disabled');
exception when duplicate_object then null; end $$;

do $$ begin create type public.blog_status as enum ('pending','approved','rejected','unpublished');
exception when duplicate_object then null; end $$;

do $$ begin create type public.media_type as enum ('youtube','news');
exception when duplicate_object then null; end $$;

do $$ begin create type public.blood_request_status as enum ('NEW','CONTACTED','IN_PROGRESS','RESOLVED','CLOSED');
exception when duplicate_object then null; end $$;

do $$ begin create type public.banner_type as enum ('info','success','warning','urgent');
exception when duplicate_object then null; end $$;

do $$ begin create type public.notification_type as enum ('email','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin create type public.notification_status as enum ('pending','sent','failed','skipped');
exception when duplicate_object then null; end $$;

-- Duplicate detection normalisation: "Srinivasa  Reddy." == "srinivasa reddy"
create or replace function public.normalize_name(input text)
returns text language sql immutable as $$
  select lower(regexp_replace(trim(coalesce(input,'')), '[.\-_''`]+', ' ', 'g'));
$$;

-- Indian mobile numbers are stored as 10 digits when possible.
create or replace function public.normalize_mobile(input text)
returns text language sql immutable as $$
  with d as (select regexp_replace(coalesce(input,''), '\D', '', 'g') as v)
  select case
    when d.v = '' then null
    when length(d.v) = 10 then d.v
    when length(d.v) = 11 and left(d.v,2) = '91' then right(d.v,10)
    when length(d.v) = 12 and left(d.v,3) = '091' then right(d.v,10)
    else d.v
  end from d;
$$;

create or replace function public.slugify(input text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Role helpers (current_app_role, is_admin, has_role, can_manage_content,
-- can_manage_blood_help) are defined after the tables are created.

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'content_manager',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_banners (
  id uuid primary key default gen_random_uuid(),
  message text not null check (char_length(message) between 3 and 400),
  banner_type public.banner_type not null default 'info',
  link_url text,
  link_label text,
  is_enabled boolean not null default false,
  start_date timestamptz,
  end_date timestamptz,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint banners_window_valid check (end_date is null or start_date is null or end_date >= start_date)
);

create table if not exists public.event_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 2 and 120),
  slug text not null unique,
  description text,
  cover_image text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.event_categories (id) on delete restrict,
  title text not null check (char_length(title) between 3 and 200),
  slug text not null unique,
  event_date date not null,
  end_date date,
  location text,
  summary text,
  content text,
  cover_image text,
  youtube_url text,
  external_links text,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_end_after_start check (end_date is null or end_date >= event_date)
);

create table if not exists public.event_gallery (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  image_url text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.donation_settings (
  id uuid primary key default gen_random_uuid(),
  account_name text,
  bank_name text,
  account_number text,
  ifsc text,
  branch text,
  upi_id text,
  qr_code_url text,
  instructions text,
  transparency_note text,
  is_donation_open boolean not null default true,
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create unique index if not exists donation_settings_singleton on public.donation_settings ((true));

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  type public.media_type not null default 'news',
  title text not null check (char_length(title) between 3 and 200),
  description text,
  url text not null,
  thumbnail_url text,
  source_name text,
  publication_date date,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blogs (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_email text not null,
  author_mobile text,
  title text not null check (char_length(title) between 5 and 200),
  slug text not null unique,
  excerpt text,
  content text not null,
  featured_image text,
  category text not null default 'General',
  status public.blog_status not null default 'pending',
  is_featured boolean not null default false,
  reviewed_by uuid references public.users (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  registration_number text not null unique,
  full_name text not null check (char_length(full_name) between 2 and 120),
  normalized_full_name text generated always as (public.normalize_name(full_name)) stored,
  date_of_birth date not null,
  village text,
  mobile_number text not null check (char_length(public.normalize_mobile(mobile_number)) = 10),
  normalized_mobile text generated always as (public.normalize_mobile(mobile_number)) stored,
  email text,
  status public.member_status not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Core duplicate-detection guarantee: one member per normalised name + DOB.
create unique index if not exists members_identity_unique
  on public.members (normalized_full_name, date_of_birth);

create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  district_id uuid not null references public.districts (id) on delete cascade,
  name text not null,
  slug text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint areas_name_unique unique (district_id, name)
);

create table if not exists public.blood_help_admins (
  id uuid primary key default gen_random_uuid(),
  district_id uuid references public.districts (id) on delete cascade,
  area_id uuid references public.areas (id) on delete cascade,
  admin_name text not null,
  email text,
  whatsapp_number text,
  phone_number text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blood_help_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  requester_name text not null,
  mobile_number text not null,
  blood_group text not null,
  hospital_name text not null,
  hospital_location text,
  district_id uuid references public.districts (id) on delete set null,
  area_id uuid references public.areas (id) on delete set null,
  required_date date,
  units_required integer not null default 1 check (units_required between 1 and 50),
  message text,
  status public.blood_request_status not null default 'NEW',
  assigned_admin_id uuid references public.blood_help_admins (id) on delete set null,
  is_unassigned boolean not null default true,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid references public.blood_help_requests (id) on delete cascade,
  notification_type public.notification_type not null,
  provider text,
  recipient text,
  subject text,
  body text,
  status public.notification_status not null default 'pending',
  error_message text,
  provider_response jsonb,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.page_content (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  subtitle text,
  body text,
  meta jsonb not null default '{}'::jsonb,
  is_published boolean not null default true,
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null default 'Srinivasula Seva Samstha',
  short_name text not null default 'TSSS',
  tagline text,
  about_short text,
  mission text,
  vision text,
  contact_email text,
  contact_phone text,
  contact_address text,
  whatsapp_number text,
  youtube_url text,
  facebook_url text,
  instagram_url text,
  twitter_url text,
  map_embed_url text,
  registration_open boolean not null default true,
  blood_help_open boolean not null default true,
  registration_paused_message text,
  blood_help_paused_message text,
  central_admin_email text,
  email_notifications_enabled boolean not null default true,
  whatsapp_notifications_enabled boolean not null default false,
  updated_by uuid references public.users (id) on delete set null,
  updated_at timestamptz not null default now()
);
create unique index if not exists site_settings_singleton on public.site_settings ((true));

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  previous_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

-- Database backed rate limiter for public forms.
create table if not exists public.form_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

create index if not exists events_published_date_idx on public.events (is_published, event_date desc);
create index if not exists events_category_idx on public.events (category_id, event_date desc);
create index if not exists blogs_public_idx on public.blogs (status, created_at desc);
create index if not exists members_name_idx on public.members (normalized_full_name);
create index if not exists members_village_idx on public.members (lower(village));
create index if not exists blood_requests_status_idx on public.blood_help_requests (status, created_at desc);
create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Number generators - PostgreSQL sequences are concurrency safe
-- ---------------------------------------------------------------------------

create sequence if not exists public.member_registration_seq as bigint start with 1 increment by 1;
create sequence if not exists public.blood_request_seq as bigint start with 1 increment by 1;

create or replace function public.next_registration_number()
returns text language sql volatile as $$
  select 'TSSS' || lpad(nextval('public.member_registration_seq')::text, 6, '0');
$$;

create or replace function public.next_blood_request_number()
returns text language sql volatile as $$
  select 'BH' || lpad(nextval('public.blood_request_seq')::text, 6, '0');
$$;

create or replace function public.next_unique_slug(source_table text, source_title text, source_id uuid default null)
returns text language plpgsql volatile as $$
declare
  base text := public.slugify(source_title);
  candidate text;
  attempt integer := 0;
begin
  if base is null or base = '' then base := 'item'; end if;
  candidate := base;
  while true loop
    if source_table = 'events' then
      exit when not exists (select 1 from public.events e where e.slug = candidate and (source_id is null or e.id <> source_id));
    elsif source_table = 'blogs' then
      exit when not exists (select 1 from public.blogs b where b.slug = candidate and (source_id is null or b.id <> source_id));
    else
      exit;
    end if;
    attempt := attempt + 1;
    candidate := base || '-' || attempt::text;
    exit when attempt > 100;
  end loop;
  return candidate;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('super_admin','admin','content_manager','blood_help_manager'), false);
$$;

create or replace function public.has_role(variadic roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() = any(roles), false);
$$;

create or replace function public.can_manage_content()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('super_admin','admin','content_manager'), false);
$$;

create or replace function public.can_manage_blood_help()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_app_role() in ('super_admin','admin','blood_help_manager'), false);
$$;

do $$
declare t text;
begin
  foreach t in array array['users','site_banners','event_categories','events','event_gallery',
    'donation_settings','media_items','blogs','members','districts','areas','blood_help_admins',
    'blood_help_requests','notification_logs','page_content','site_settings','audit_logs','form_rate_limits']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- users
drop policy if exists "users_read" on public.users;
create policy "users_read" on public.users for select
  using (public.is_admin() or id = auth.uid());
drop policy if exists "users_update_super_admin" on public.users;
create policy "users_update_super_admin" on public.users for update
  using (public.has_role('super_admin')) with check (public.has_role('super_admin'));
drop policy if exists "users_insert_super_admin" on public.users;
create policy "users_insert_super_admin" on public.users for insert
  with check (public.has_role('super_admin'));
drop policy if exists "users_delete_super_admin" on public.users;
create policy "users_delete_super_admin" on public.users for delete
  using (public.has_role('super_admin'));

-- banners: public read only when enabled and inside the optional window
-- Banner: public can only read banners that are enabled and inside their window.
drop policy if exists "banners_public_read" on public.site_banners;
create policy "banners_public_read" on public.site_banners for select using (
  is_enabled
  and (start_date is null or start_date <= now())
  and (end_date is null or end_date >= now())
);
drop policy if exists "banners_admin_all" on public.site_banners;
create policy "banners_admin_all" on public.site_banners for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- Generated visibility flag so the banner lookup is a single indexed predicate.
-- (Created in 0002_banner_visibility.sql because ALTER TABLE ... ADD COLUMN
--  GENERATED ALWAYS AS requires the column to be added on its own.)

-- events & categories
drop policy if exists "categories_public_read" on public.event_categories;
create policy "categories_public_read" on public.event_categories for select
  using (is_active or public.can_manage_content());
drop policy if exists "categories_admin_all" on public.event_categories;
create policy "categories_admin_all" on public.event_categories for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "events_public_read" on public.events;
create policy "events_public_read" on public.events for select
  using (is_published or public.can_manage_content());
drop policy if exists "events_admin_all" on public.events;
create policy "events_admin_all" on public.events for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "gallery_public_read" on public.event_gallery;
create policy "gallery_public_read" on public.event_gallery for select using (
  exists (select 1 from public.events e where e.id = event_gallery.event_id
          and (e.is_published or public.can_manage_content()))
);
drop policy if exists "gallery_admin_all" on public.event_gallery;
create policy "gallery_admin_all" on public.event_gallery for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- donations / settings / page content
drop policy if exists "donations_public_read" on public.donation_settings;
create policy "donations_public_read" on public.donation_settings for select using (true);
drop policy if exists "donations_admin_all" on public.donation_settings;
create policy "donations_admin_all" on public.donation_settings for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select using (true);
drop policy if exists "settings_admin_all" on public.site_settings;
create policy "settings_admin_all" on public.site_settings for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "content_public_read" on public.page_content;
create policy "content_public_read" on public.page_content for select
  using (is_published or public.can_manage_content());
drop policy if exists "content_admin_all" on public.page_content;
create policy "content_admin_all" on public.page_content for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- media
drop policy if exists "media_public_read" on public.media_items;
create policy "media_public_read" on public.media_items for select
  using (is_published or public.can_manage_content());
drop policy if exists "media_admin_all" on public.media_items;
create policy "media_admin_all" on public.media_items for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- blogs: public sees approved only. Writes go through submit_blog() RPC.
drop policy if exists "blogs_public_read" on public.blogs;
create policy "blogs_public_read" on public.blogs for select
  using (status = 'approved' or public.can_manage_content());
drop policy if exists "blogs_admin_all" on public.blogs;
create policy "blogs_admin_all" on public.blogs for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- members: private. Only staff can read, public writes go through submit_registration().
drop policy if exists "members_admin_read" on public.members;
create policy "members_admin_read" on public.members for select using (public.can_manage_content());
drop policy if exists "members_admin_write" on public.members;
create policy "members_admin_write" on public.members for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- districts / areas (drives the blood help form - never hard-coded in the app)
drop policy if exists "districts_public_read" on public.districts;
create policy "districts_public_read" on public.districts for select
  using (is_active or public.can_manage_content());
drop policy if exists "districts_admin_all" on public.districts;
create policy "districts_admin_all" on public.districts for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "areas_public_read" on public.areas;
create policy "areas_public_read" on public.areas for select using (
  is_active and exists (select 1 from public.districts d where d.id = areas.district_id and d.is_active)
);
drop policy if exists "areas_admin_all" on public.areas;
create policy "areas_admin_all" on public.areas for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- blood help routing data and requests are staff only
drop policy if exists "blood_admins_read" on public.blood_help_admins;
create policy "blood_admins_read" on public.blood_help_admins for select using (public.can_manage_blood_help());
drop policy if exists "blood_admins_write" on public.blood_help_admins;
create policy "blood_admins_write" on public.blood_help_admins for all
  using (public.can_manage_blood_help()) with check (public.can_manage_blood_help());

drop policy if exists "blood_requests_read" on public.blood_help_requests;
create policy "blood_requests_read" on public.blood_help_requests for select using (public.can_manage_blood_help());
drop policy if exists "blood_requests_write" on public.blood_help_requests;
create policy "blood_requests_write" on public.blood_help_requests for all
  using (public.can_manage_blood_help()) with check (public.can_manage_blood_help());

drop policy if exists "notification_logs_read" on public.notification_logs;
create policy "notification_logs_read" on public.notification_logs for select using (public.can_manage_blood_help());
drop policy if exists "notification_logs_write" on public.notification_logs;
create policy "notification_logs_write" on public.notification_logs for all
  using (public.can_manage_blood_help()) with check (public.can_manage_blood_help());

-- audit log
drop policy if exists "audit_logs_read" on public.audit_logs;
create policy "audit_logs_read" on public.audit_logs for select using (public.has_role('super_admin'));

-- ---------------------------------------------------------------------------
-- 5. Public RPCs
-- ---------------------------------------------------------------------------

create or replace function public.rate_limit_hit(p_key text, p_max_hits integer, p_window_seconds integer)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.form_rate_limits (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start) do update set hits = public.form_rate_limits.hits + 1
  returning hits into v_hits;

  delete from public.form_rate_limits where key = p_key and window_start < v_window - interval '2 days';
  return v_hits <= p_max_hits;
end;
$$;

-- REGISTRATION --------------------------------------------------------------
-- Duplicate detection and numbering both happen inside the database so they
-- cannot be bypassed from the browser.
create or replace function public.submit_registration(
  p_full_name text,
  p_date_of_birth date,
  p_village text default null,
  p_mobile_number text default null,
  p_email text default null,
  p_rate_key text default null
)
returns table (
  result_code text,
  registration_number text,
  full_name text,
  date_of_birth date,
  village text,
  registered_at timestamptz
)
language plpgsql security definer set search_path = public as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
  v_village text := nullif(trim(coalesce(p_village, '')), '');
  v_mobile text := public.normalize_mobile(p_mobile_number);
  v_normalized text := public.normalize_name(v_name);
  v_number text;
  v_row public.members%rowtype;
begin
  if p_rate_key is not null and not public.rate_limit_hit('register:' || p_rate_key, 8, 3600) then
    raise exception 'RATE_LIMITED';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'INVALID_NAME'; end if;
  if p_date_of_birth is null or p_date_of_birth > current_date
     or p_date_of_birth < current_date - interval '120 years' then raise exception 'INVALID_DOB'; end if;
  if v_mobile is null or v_mobile !~ '^[0-9]{10}$' then raise exception 'INVALID_MOBILE'; end if;
  if v_village is not null and char_length(v_village) > 120 then raise exception 'INVALID_VILLAGE'; end if;

  if exists (
    select 1 from public.members m
    where m.normalized_full_name = v_normalized and m.date_of_birth = p_date_of_birth
  ) then
    return query select 'already_registered', null::text, null::text, null::date, null::text, null::timestamptz;
    return;
  end if;

  v_number := public.next_registration_number();

  begin
    insert into public.members (registration_number, full_name, date_of_birth, village, mobile_number, email)
    values (v_number, v_name, p_date_of_birth, v_village, v_mobile, nullif(trim(coalesce(p_email, '')), ''))
    returning * into v_row;
  exception when unique_violation then
    -- concurrent identical submission won the race
    return query select 'already_registered', null::text, null::text, null::date, null::text, null::timestamptz;
    return;
  end;

  return query select 'created', v_row.registration_number, v_row.full_name, v_row.date_of_birth,
    v_row.village, v_row.created_at;
end;
$$;

-- BLOG SUBMISSION -----------------------------------------------------------
create or replace function public.submit_blog(
  p_author_name text,
  p_author_email text,
  p_author_mobile text,
  p_title text,
  p_content text,
  p_category text default 'General',
  p_featured_image text default null,
  p_rate_key text default null
)
returns table (result_code text, blog_id uuid, result_slug text)
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_slug text;
begin
  if p_rate_key is not null and not public.rate_limit_hit('blog:' || p_rate_key, 3, 86400) then
    raise exception 'RATE_LIMITED';
  end if;

  if char_length(trim(coalesce(p_author_name, ''))) < 2 then raise exception 'INVALID_NAME'; end if;
  if p_author_email is null or p_author_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[a-z]{2,}$' then
    raise exception 'INVALID_EMAIL';
  end if;
  if char_length(trim(coalesce(p_title, ''))) < 5 then raise exception 'INVALID_TITLE'; end if;
  if char_length(trim(coalesce(p_content, ''))) < 50 then raise exception 'INVALID_CONTENT'; end if;

  v_slug := public.next_unique_slug('blogs', p_title);

  insert into public.blogs (author_name, author_email, author_mobile, title, slug, excerpt, content,
                            category, featured_image, status)
  values (
    trim(p_author_name), lower(trim(p_author_email)), public.normalize_mobile(p_author_mobile),
    trim(p_title), v_slug,
    left(regexp_replace(trim(p_content), '<[^>]+>', '', 'g'), 240),
    p_content,
    coalesce(nullif(trim(coalesce(p_category, '')), ''), 'General'),
    p_featured_image, 'pending'
  )
  returning id, blogs.slug into v_id, v_slug;

  return query select 'submitted', v_id, v_slug;
end;
$$;

-- BLOOD HELP ----------------------------------------------------------------
create or replace function public.create_blood_request(
  p_requester_name text,
  p_mobile_number text,
  p_blood_group text,
  p_hospital_name text,
  p_hospital_location text,
  p_district_id uuid,
  p_area_id uuid,
  p_required_date date,
  p_units_required integer,
  p_message text,
  p_rate_key text default null
)
returns table (
  result_code text,
  request_id uuid,
  request_number text,
  is_unassigned boolean,
  assigned_admin_id uuid,
  assigned_admin_name text,
  assigned_admin_email text,
  assigned_admin_whatsapp text,
  requester_name text,
  mobile_number text,
  blood_group text,
  hospital_name text,
  hospital_location text,
  required_date date,
  units_required integer,
  message text
)
language plpgsql security definer set search_path = public as $$
declare
  v_mobile text := public.normalize_mobile(p_mobile_number);
  v_group text := upper(trim(coalesce(p_blood_group, '')));
  v_admin public.blood_help_admins%rowtype;
  v_number text;
  v_id uuid;
begin
  if p_rate_key is not null and not public.rate_limit_hit('blood:' || p_rate_key, 5, 3600) then
    raise exception 'RATE_LIMITED';
  end if;

  if char_length(trim(coalesce(p_requester_name, ''))) < 2 then raise exception 'INVALID_NAME'; end if;
  if v_mobile is null or v_mobile !~ '^[0-9]{10}$' then raise exception 'INVALID_MOBILE'; end if;
  if v_group not in ('A+','A-','B+','B-','AB+','AB-','O+','O-') then raise exception 'INVALID_BLOOD_GROUP'; end if;
  if char_length(trim(coalesce(p_hospital_name, ''))) < 2 then raise exception 'INVALID_HOSPITAL'; end if;
  if p_units_required is null or p_units_required < 1 or p_units_required > 50 then raise exception 'INVALID_UNITS'; end if;
  if p_required_date is not null and p_required_date < current_date - 1 then raise exception 'INVALID_DATE'; end if;
  if p_district_id is null then raise exception 'INVALID_DISTRICT'; end if;

  if p_area_id is not null and not exists (
    select 1 from public.areas a join public.districts d on d.id = a.district_id
    where a.id = p_area_id and a.district_id = p_district_id and a.is_active and d.is_active
  ) then
    raise exception 'INVALID_AREA';
  end if;

  -- 1. exact area administrator, 2. district administrator
  select * into v_admin from public.blood_help_admins
  where is_active and p_area_id is not null and area_id = p_area_id
  order by created_at limit 1;

  if not found then
    select * into v_admin from public.blood_help_admins
    where is_active and area_id is null and district_id = p_district_id
    order by created_at limit 1;
  end if;

  v_number := public.next_blood_request_number();

  insert into public.blood_help_requests (
    request_number, requester_name, mobile_number, blood_group, hospital_name, hospital_location,
    district_id, area_id, required_date, units_required, message, assigned_admin_id, is_unassigned
  ) values (
    v_number, trim(p_requester_name), v_mobile, v_group, trim(p_hospital_name),
    nullif(trim(coalesce(p_hospital_location, '')), ''),
    p_district_id, p_area_id, p_required_date, p_units_required,
    nullif(trim(coalesce(p_message, '')), ''), v_admin.id, v_admin.id is null
  )
  returning id into v_id;

  return query
    select 'created', v_id, v_number, (v_admin.id is null), v_admin.id, v_admin.admin_name,
      v_admin.email, v_admin.whatsapp_number,
      trim(p_requester_name), v_mobile, v_group, trim(p_hospital_name),
      nullif(trim(coalesce(p_hospital_location, '')), ''), p_required_date, p_units_required,
      nullif(trim(coalesce(p_message, '')), '');
end;
$$;

-- Audit logging helper used by the app's data access layer and DB triggers.
create or replace function public.write_audit(
  p_action text, p_entity text, p_entity_id text,
  p_previous jsonb default null, p_new jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, previous_value, new_value)
  values (auth.uid(), auth.jwt() ->> 'email', p_action, p_entity, p_entity_id, p_previous, p_new);
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['site_banners','event_categories','events','media_items','blogs','members',
                           'districts','areas','blood_help_admins','blood_help_requests','users','site_settings','page_content']
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- Create a public.users profile for every new Supabase Auth user.
-- The very first profile becomes super_admin so the panel can be bootstrapped.
create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    lower(new.email),
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    case when (select count(*) from public.users) = 0 then 'super_admin'::public.app_role
         else 'content_manager'::public.app_role end
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Blog status bookkeeping (reviewed_by / reviewed_at).
create or replace function public.blog_review_stamp()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('approved','rejected') then
      new.reviewed_at := now();
      new.reviewed_by := coalesce(new.reviewed_by, auth.uid());
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_blogs_review_stamp on public.blogs;
create trigger trg_blogs_review_stamp before update on public.blogs
  for each row execute function public.blog_review_stamp();

-- ---------------------------------------------------------------------------
-- 7. Grants & storage
-- ---------------------------------------------------------------------------

revoke all on function public.submit_registration(text, date, text, text, text, text) from public;
revoke all on function public.submit_blog(text, text, text, text, text, text, text, text) from public;
revoke all on function public.create_blood_request(text, text, text, text, text, uuid, uuid, date, integer, text, text) from public;
revoke all on function public.rate_limit_hit(text, integer, integer) from public;
revoke all on function public.write_audit(text, text, text, jsonb, jsonb) from public;

grant execute on function public.submit_registration(text, date, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_blog(text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_blood_request(text, text, text, text, text, uuid, uuid, date, integer, text, text) to anon, authenticated;

-- No public write access to private tables.
revoke insert, update, delete on table public.members from anon, authenticated;
revoke insert, update, delete on table public.blood_help_requests from anon, authenticated;
revoke insert, update, delete on table public.blood_help_admins from anon, authenticated;
revoke insert, update, delete on table public.notification_logs from anon, authenticated;
revoke insert, update, delete on table public.audit_logs from anon, authenticated;
revoke insert, update, delete on table public.form_rate_limits from anon, authenticated;
revoke insert, update, delete on table public.users from anon, authenticated;

grant select on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

-- Public media bucket (event/blog/media images).
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

drop policy if exists "public_media_public_read" on storage.objects;
create policy "public_media_public_read" on storage.objects for select
  using (bucket_id = 'public-media');

drop policy if exists "public_media_admin_write" on storage.objects;
create policy "public_media_admin_write" on storage.objects for insert
  with check (bucket_id = 'public-media' and public.can_manage_content());

drop policy if exists "public_media_admin_update" on storage.objects;
create policy "public_media_admin_update" on storage.objects for update
  using (bucket_id = 'public-media' and public.can_manage_content());

drop policy if exists "public_media_admin_delete" on storage.objects;
create policy "public_media_admin_delete" on storage.objects for delete
  using (bucket_id = 'public-media' and public.can_manage_content());

