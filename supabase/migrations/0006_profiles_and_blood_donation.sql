-- ---------------------------------------------------------------------------
-- 0006_profiles_and_blood_donation.sql
--
-- Adds, in three independent groups:
--
--   A. Member profile enrichment  - father name, gender, blood group, state,
--      country, dialling code and an optional profile photo.
--   B. Reference data             - countries (ISO code + dialling code) and
--      Indian states.
--   C. Blood donation module      - donors, camps, donations and donation
--      requests. This sits ALONGSIDE the existing emergency blood help
--      requests in `blood_help_requests`; that table and its routing are
--      untouched.
--
-- Backwards compatibility: every new column on `members` is nullable. Members
-- registered before this migration keep working, and the registration form is
-- the only place that enforces the new fields.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- A. Enums
-- ---------------------------------------------------------------------------

-- `UNKNOWN` covers "I Don't Know". It is a real stored value rather than a null
-- so the dashboard can distinguish "not asked" from "genuinely unknown".
do $$ begin
  create type public.blood_group_t as enum
    ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'UNKNOWN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender_t as enum ('male', 'female', 'other', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.donation_request_status_t as enum
    ('pending', 'in_progress', 'fulfilled', 'cancelled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- B. Reference data
-- ---------------------------------------------------------------------------

create table if not exists public.countries (
  iso_code char(2) primary key,          -- ISO 3166-1 alpha-2, e.g. 'IN'
  name text not null,
  phone_code text not null,              -- E.164 without '+', e.g. '91'
  is_active boolean not null default true
);

comment on column public.countries.phone_code is
  'International dialling code without the plus sign, e.g. 91 for India.';

insert into public.countries (iso_code, name, phone_code) values
  ('IN', 'India', '91'),
  ('AE', 'United Arab Emirates', '971'),
  ('US', 'United States', '1'),
  ('GB', 'United Kingdom', '44'),
  ('CA', 'Canada', '1'),
  ('AU', 'Australia', '61'),
  ('NZ', 'New Zealand', '64'),
  ('SG', 'Singapore', '65'),
  ('MY', 'Malaysia', '60'),
  ('KE', 'Kenya', '254'),
  ('SA', 'Saudi Arabia', '966'),
  ('QA', 'Qatar', '974'),
  ('KW', 'Kuwait', '965'),
  ('OM', 'Oman', '968'),
  ('BH', 'Bahrain', '973'),
  ('IL', 'Israel', '972'),
  ('ZA', 'South Africa', '27'),
  ('LK', 'Sri Lanka', '94'),
  ('NP', 'Nepal', '977'),
  ('BD', 'Bangladesh', '880'),
  ('BT', 'Bhutan', '975'),
  ('MV', 'Maldives', '960'),
  ('MM', 'Myanmar', '95'),
  ('ID', 'Indonesia', '62'),
  ('TH', 'Thailand', '66'),
  ('PH', 'Philippines', '63'),
  ('JP', 'Japan', '81'),
  ('KR', 'South Korea', '82'),
  ('CN', 'China', '86'),
  ('DE', 'Germany', '49'),
  ('FR', 'France', '33'),
  ('NL', 'Netherlands', '31'),
  ('CH', 'Switzerland', '41'),
  ('IE', 'Ireland', '353'),
  ('IT', 'Italy', '39'),
  ('ES', 'Spain', '34'),
  ('SE', 'Sweden', '46'),
  ('NO', 'Norway', '47'),
  ('DK', 'Denmark', '45'),
  ('BE', 'Belgium', '32'),
  ('AT', 'Austria', '43'),
  ('RU', 'Russia', '7'),
  ('BR', 'Brazil', '55'),
  ('MX', 'Mexico', '52'),
  ('AR', 'Argentina', '54')
on conflict (iso_code) do update
  set name = excluded.name, phone_code = excluded.phone_code;

create table if not exists public.states (
  code text primary key,
  country_code char(2) not null references public.countries (iso_code),
  name text not null,
  display_order integer not null default 0,
  is_active boolean not null default true
);

insert into public.states (code, country_code, name, display_order) values
  ('TS', 'IN', 'Telangana', 1),
  ('AP', 'IN', 'Andhra Pradesh', 2),
  ('MH', 'IN', 'Maharashtra', 3),
  ('KA', 'IN', 'Karnataka', 4),
  ('TN', 'IN', 'Tamil Nadu', 5),
  ('KL', 'IN', 'Kerala', 6),
  ('GJ', 'IN', 'Gujarat', 7),
  ('RJ', 'IN', 'Rajasthan', 8),
  ('MP', 'IN', 'Madhya Pradesh', 9),
  ('UP', 'IN', 'Uttar Pradesh', 10),
  ('BR', 'IN', 'Bihar', 11),
  ('WB', 'IN', 'West Bengal', 12),
  ('OD', 'IN', 'Odisha', 13),
  ('PB', 'IN', 'Punjab', 14),
  ('HR', 'IN', 'Haryana', 15),
  ('DL', 'IN', 'Delhi', 16),
  ('JK', 'IN', 'Jammu & Kashmir', 17),
  ('CG', 'IN', 'Chhattisgarh', 18),
  ('JH', 'IN', 'Jharkhand', 19),
  ('GA', 'IN', 'Goa', 20),
  ('PY', 'IN', 'Puducherry', 21),
  ('TR', 'IN', 'Tripura', 22),
  ('MN', 'IN', 'Manipur', 23),
  ('ML', 'IN', 'Meghalaya', 24),
  ('NL', 'IN', 'Nagaland', 25),
  ('MZ', 'IN', 'Mizoram', 26),
  ('AS', 'IN', 'Assam', 27),
  ('SK', 'IN', 'Sikkim', 28),
  ('UK', 'IN', 'Uttarakhand', 29),
  ('AR', 'IN', 'Arunachal Pradesh', 30)
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- C. Member profile columns
-- ---------------------------------------------------------------------------

alter table public.members add column if not exists father_name text;
alter table public.members add column if not exists gender public.gender_t;
alter table public.members add column if not exists blood_group public.blood_group_t;
alter table public.members add column if not exists state_code text;
alter table public.members add column if not exists country_code char(2);
alter table public.members add column if not exists phone_country_code text;
alter table public.members add column if not exists profile_photo_url text;
-- Role held in the trust, printed on the ID card as "Designation".
alter table public.members add column if not exists designation text;

-- The dialling code is stored separately from the number, so a member who
-- moves country keeps one record with two independently correct fields.
comment on column public.members.phone_country_code is
  'International dialling code without the plus sign, e.g. 91.';

create index if not exists members_blood_group_idx on public.members (blood_group);
create index if not exists members_state_idx on public.members (state_code);
create index if not exists members_father_name_idx on public.members (lower(father_name));

-- ---------------------------------------------------------------------------
-- D. Blood donation module
-- ---------------------------------------------------------------------------

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  -- A donor may be a registered member, a member of the public, or an
  -- administrator entering somebody who phoned in.
  member_id uuid references public.members (id) on delete set null,
  full_name text not null,
  father_name text,
  phone_country_code text not null default '91',
  mobile_number text not null,
  email text,
  blood_group public.blood_group_t not null,
  date_of_birth date,
  gender public.gender_t,
  country_code char(2) not null default 'IN' references public.countries (iso_code),
  state_code text,
  city text,
  area text,
  address text,
  last_donation_date date,
  is_willing boolean not null default true,
  availability text,
  preferred_contact text not null default 'phone',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.donors.preferred_contact is 'phone | whatsapp | email';
comment on column public.donors.availability is
  'Free-text: weekdays, weekends, festival seasons, and so on.';

create index if not exists donors_blood_group_idx on public.donors (blood_group);
create index if not exists donors_mobile_idx on public.donors (mobile_number);
create index if not exists donors_willing_idx on public.donors (is_willing) where is_willing;
create index if not exists donors_area_idx on public.donors (state_code, city, area);

create table if not exists public.donation_camps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  camp_date date not null,
  organizing_organization text,
  location text,
  area text,
  city text,
  state_code text,
  country_code char(2) not null default 'IN' references public.countries (iso_code),
  total_donors integer,
  total_units integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.donors (id) on delete cascade,
  camp_id uuid references public.donation_camps (id) on delete set null,
  donation_date date not null default current_date,
  units smallint not null default 1 check (units > 0 and units <= 10),
  blood_group public.blood_group_t,
  source text not null default 'manual',
  external_ref text,
  notes text,
  created_at timestamptz not null default now()
);

-- Bulk import is re-runnable: re-uploading the same file must not double count.
comment on column public.donations.source is 'manual | import | camp';
comment on column public.donations.external_ref is
  'Stable identifier from a spreadsheet, used to reject duplicate imports.';

create unique index if not exists donations_external_ref_uniq
  on public.donations (camp_id, external_ref)
  where external_ref is not null;

create index if not exists donations_donor_idx on public.donations (donor_id);
create index if not exists donations_camp_idx on public.donations (camp_id);
create index if not exists donations_date_idx on public.donations (donation_date desc);

create table if not exists public.donation_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text not null unique,
  patient_name text not null,
  blood_group public.blood_group_t not null,
  units_required smallint not null default 1 check (units_required > 0 and units_required <= 50),
  hospital_name text not null,
  hospital_location text,
  area text,
  city text,
  state_code text,
  country_code char(2) not null default 'IN' references public.countries (iso_code),
  contact_person text,
  contact_country_code text not null default '91',
  contact_number text not null,
  request_date date not null default current_date,
  required_date date,
  status public.donation_request_status_t not null default 'pending',
  donor_id uuid references public.donors (id) on delete set null,
  fulfilled_units smallint not null default 0 check (fulfilled_units >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donation_requests_status_idx
  on public.donation_requests (status, required_date);
create index if not exists donation_requests_group_idx on public.donation_requests (blood_group);
create index if not exists donation_requests_area_idx
  on public.donation_requests (state_code, city, area);

create sequence if not exists public.donation_request_seq as bigint start with 1 increment by 1;

create or replace function public.next_donation_request_number()
returns text language sql volatile as $$
  select 'BDR' || lpad(nextval('public.donation_request_seq')::text, 6, '0');
$$;

-- Assigned automatically, so neither the panel nor the import has to invent one.
alter table public.donation_requests
  alter column request_number set default public.next_donation_request_number();

-- ---------------------------------------------------------------------------
-- E. updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['donors', 'donation_requests']
  loop
    execute format('drop trigger if exists trg_%1$s_updated_at on public.%1$I', t);
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$I for each row execute function public.set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- F. Registration RPC with the new profile fields
--
-- A new overload keeps the original six-argument signature working, so existing
-- callers and any already-deployed client keep functioning. The extended form
-- additionally requires father name, gender, blood group, state and country.
-- ---------------------------------------------------------------------------

create or replace function public.submit_registration_v2(
  p_full_name text,
  p_date_of_birth date,
  p_father_name text,
  p_gender text,
  p_blood_group text,
  p_state_code text,
  p_country_code text,
  p_village text,
  p_mobile_number text,
  p_phone_country_code text,
  p_profile_photo_url text,
  p_email text,
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
  v_father text := trim(coalesce(p_father_name, ''));
  v_village text := nullif(trim(coalesce(p_village, '')), '');
  v_mobile text := public.normalize_mobile(p_mobile_number);
  v_normalized text := public.normalize_name(v_name);
  v_country char(2) := upper(coalesce(nullif(trim(coalesce(p_country_code, '')), ''), 'IN'));
  v_dial text := nullif(trim(coalesce(p_phone_country_code, '')), '');
  v_group public.blood_group_t;
  v_sex public.gender_t;
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

  -- New mandatory fields. Existing members registered before this migration are
  -- unaffected; only this path enforces them.
  if char_length(v_father) < 2 or char_length(v_father) > 120 then raise exception 'INVALID_FATHER_NAME'; end if;
  if not exists (select 1 from public.countries c where c.iso_code = v_country and c.is_active) then
    raise exception 'INVALID_COUNTRY';
  end if;

  begin
    v_group := p_blood_group::public.blood_group_t;
  exception when others then
    raise exception 'INVALID_BLOOD_GROUP';
  end;

  if p_gender is not null and trim(p_gender) <> '' then
    begin
      v_sex := p_gender::public.gender_t;
    exception when others then
      raise exception 'INVALID_GENDER';
    end;
  end if;

  if p_state_code is not null and trim(p_state_code) <> ''
     and not exists (select 1 from public.states s where s.code = upper(trim(p_state_code))) then
    raise exception 'INVALID_STATE';
  end if;

  -- Dialling code: fall back to the country's own code when the field is blank
  -- or does not match the selected country.
  if v_dial is null or v_dial !~ '^[0-9]{1,4}$' then
    select c.phone_code into v_dial from public.countries c where c.iso_code = v_country;
  end if;

  if exists (
    select 1 from public.members m
    where m.normalized_full_name = v_normalized and m.date_of_birth = p_date_of_birth
  ) then
    return query select 'already_registered', null::text, null::text, null::date, null::text, null::timestamptz;
    return;
  end if;

  v_number := public.next_registration_number();
  begin
    insert into public.members (
      registration_number, full_name, date_of_birth, village, mobile_number, email,
      father_name, gender, blood_group, state_code, country_code,
      phone_country_code, profile_photo_url
    )
    values (
      v_number, v_name, p_date_of_birth, v_village, v_mobile,
      nullif(trim(coalesce(p_email, '')), ''),
      v_father, v_sex, v_group,
      nullif(upper(trim(p_state_code)), ''), v_country,
      v_dial, nullif(trim(coalesce(p_profile_photo_url, '')), '')
    )
    returning * into v_row;
  exception when unique_violation then
    return query select 'already_registered', null::text, null::text, null::date, null::text, null::timestamptz;
    return;
  end;

  return query select 'created', v_row.registration_number, v_row.full_name, v_row.date_of_birth,
    v_row.village, v_row.created_at;
end;
$$;

-- ---------------------------------------------------------------------------
-- G. Public donor registration RPC
-- ---------------------------------------------------------------------------

create or replace function public.submit_donor(
  p_full_name text,
  p_father_name text,
  p_mobile_number text,
  p_phone_country_code text,
  p_email text,
  p_blood_group text,
  p_date_of_birth date,
  p_gender text,
  p_country_code text,
  p_state_code text,
  p_city text,
  p_area text,
  p_address text,
  p_last_donation_date date,
  p_availability text,
  p_preferred_contact text,
  p_member_id uuid,
  p_rate_key text default null
)
returns table (result_code text, donor_id uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_name text := trim(coalesce(p_full_name, ''));
  v_father text := trim(coalesce(p_father_name, ''));
  v_mobile text := public.normalize_mobile(p_mobile_number);
  v_country char(2) := upper(coalesce(nullif(trim(coalesce(p_country_code, '')), ''), 'IN'));
  v_dial text := nullif(trim(coalesce(p_phone_country_code, '')), '');
  v_group public.blood_group_t;
  v_sex public.gender_t;
  v_contact text := lower(coalesce(nullif(trim(coalesce(p_preferred_contact, '')), ''), 'phone'));
  v_id uuid;
begin
  if p_rate_key is not null and not public.rate_limit_hit('donor:' || p_rate_key, 5, 86400) then
    raise exception 'RATE_LIMITED';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'INVALID_NAME'; end if;
  if v_mobile is null or v_mobile !~ '^[0-9]{10}$' then raise exception 'INVALID_MOBILE'; end if;
  if v_father <> '' and char_length(v_father) > 120 then raise exception 'INVALID_FATHER_NAME'; end if;

  begin
    v_group := p_blood_group::public.blood_group_t;
  exception when others then
    raise exception 'INVALID_BLOOD_GROUP';
  end;

  -- "I Don't Know" is allowed: a willing donor who does not know their group is
  -- still worth recording. The trust tests them at a camp or blood bank, and
  -- the dashboard lists them under UNKNOWN for follow-up.

  if p_gender is not null and trim(p_gender) <> '' then
    begin
      v_sex := p_gender::public.gender_t;
    exception when others then
      raise exception 'INVALID_GENDER';
    end;
  end if;

  if not exists (select 1 from public.countries c where c.iso_code = v_country and c.is_active) then
    raise exception 'INVALID_COUNTRY';
  end if;

  if v_contact not in ('phone', 'whatsapp', 'email') then
    raise exception 'INVALID_CONTACT_PREFERENCE';
  end if;

  if v_dial is null or v_dial !~ '^[0-9]{1,4}$' then
    select c.phone_code into v_dial from public.countries c where c.iso_code = v_country;
  end if;

  if p_last_donation_date is not null and p_last_donation_date > current_date then
    raise exception 'INVALID_LAST_DONATION';
  end if;

  -- One live record per mobile number, so re-registering updates rather than
  -- creating a duplicate donor that would double the dashboard counts.
  select d.id into v_id from public.donors d
   where d.mobile_number = v_mobile and d.is_active
   limit 1;

  if v_id is not null then
    update public.donors set
      full_name = v_name,
      father_name = nullif(v_father, ''),
      phone_country_code = v_dial,
      email = nullif(trim(coalesce(p_email, '')), ''),
      blood_group = v_group,
      date_of_birth = p_date_of_birth,
      gender = v_sex,
      country_code = v_country,
      state_code = nullif(upper(trim(coalesce(p_state_code, ''))), ''),
      city = nullif(trim(coalesce(p_city, '')), ''),
      area = nullif(trim(coalesce(p_area, '')), ''),
      address = nullif(trim(coalesce(p_address, '')), ''),
      last_donation_date = p_last_donation_date,
      is_willing = true,
      availability = nullif(trim(coalesce(p_availability, '')), ''),
      preferred_contact = v_contact,
      member_id = coalesce(p_member_id, member_id)
    where id = v_id
    returning id into v_id;

    return query select 'updated', v_id;
    return;
  end if;

  insert into public.donors (
    full_name, father_name, mobile_number, phone_country_code, email, blood_group,
    date_of_birth, gender, country_code, state_code, city, area, address,
    last_donation_date, is_willing, availability, preferred_contact, member_id
  )
  values (
    v_name, nullif(v_father, ''), v_mobile, v_dial,
    nullif(trim(coalesce(p_email, '')), ''), v_group,
    p_date_of_birth, v_sex, v_country,
    nullif(upper(trim(coalesce(p_state_code, ''))), ''),
    nullif(trim(coalesce(p_city, '')), ''),
    nullif(trim(coalesce(p_area, '')), ''),
    nullif(trim(coalesce(p_address, '')), ''),
    p_last_donation_date, true,
    nullif(trim(coalesce(p_availability, '')), ''), v_contact, p_member_id
  )
  returning id into v_id;

  return query select 'created', v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- H. Reference data for the client
-- ---------------------------------------------------------------------------

create or replace function public.list_countries()
returns table (iso_code text, name text, phone_code text)
language sql stable security definer set search_path = public as $$
  select c.iso_code::text, c.name, c.phone_code
    from public.countries c
   where c.is_active
   order by c.name;
$$;

create or replace function public.list_states(p_country_code text default 'IN')
returns table (code text, name text)
language sql stable security definer set search_path = public as $$
  select s.code, s.name
    from public.states s
   where s.is_active and s.country_code = upper(coalesce(p_country_code, 'IN'))
   order by s.display_order, s.name;
$$;

-- ---------------------------------------------------------------------------
-- I. Row Level Security
-- ---------------------------------------------------------------------------

alter table public.countries enable row level security;
alter table public.states enable row level security;
alter table public.donors enable row level security;
alter table public.donation_camps enable row level security;
alter table public.donations enable row level security;
alter table public.donation_requests enable row level security;

-- Reference data is public.
drop policy if exists countries_read on public.countries;
create policy countries_read on public.countries for select using (true);

drop policy if exists states_read on public.states;
create policy states_read on public.states for select using (true);

-- Donors hold personal data, so the public gets no direct read access at all;
-- the panel reads through the service-role client after a role check.
drop policy if exists donors_read on public.donors;
create policy donors_read on public.donors for select using (public.can_manage_blood_help());

drop policy if exists donors_write on public.donors;
create policy donors_write on public.donors for all using (public.can_manage_blood_help())
  with check (public.can_manage_blood_help());

drop policy if exists camps_read on public.donation_camps;
create policy camps_read on public.donation_camps for select using (public.can_manage_blood_help());

drop policy if exists camps_write on public.donation_camps;
create policy camps_write on public.donation_camps for all using (public.can_manage_content())
  with check (public.can_manage_content());

drop policy if exists donations_read on public.donations;
create policy donations_read on public.donations for select using (public.can_manage_blood_help());

drop policy if exists donations_write on public.donations;
create policy donations_write on public.donations for all using (public.can_manage_blood_help())
  with check (public.can_manage_blood_help());

drop policy if exists donation_requests_read on public.donation_requests;
create policy donation_requests_read on public.donation_requests for select
  using (public.can_manage_blood_help());

drop policy if exists donation_requests_write on public.donation_requests;
create policy donation_requests_write on public.donation_requests for all
  using (public.can_manage_blood_help()) with check (public.can_manage_blood_help());

-- ---------------------------------------------------------------------------
-- J. Grants
-- ---------------------------------------------------------------------------

grant select on table public.countries to anon, authenticated;
grant select on table public.states to anon, authenticated;

grant select, insert, update, delete on table public.donors to authenticated;
grant select, insert, update, delete on table public.donation_camps to authenticated;
grant select, insert, update, delete on table public.donations to authenticated;
grant select, insert, update, delete on table public.donation_requests to authenticated;

-- No public writes: donors register through `submit_donor`.
revoke insert, update, delete on table public.donors from anon;
revoke insert, update, delete on table public.donation_camps from anon;
revoke insert, update, delete on table public.donations from anon;
revoke insert, update, delete on table public.donation_requests from anon;

grant usage, select on sequence public.donation_request_seq to authenticated;

revoke all on function public.submit_registration_v2(text, date, text, text, text, text, text, text, text, text, text, text, text) from public;
revoke all on function public.submit_donor(text, text, text, text, text, text, date, text, text, text, text, text, text, date, text, text, uuid, text) from public;
revoke all on function public.next_donation_request_number() from public;

grant execute on function public.submit_registration_v2(text, date, text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_donor(text, text, text, text, text, text, date, text, text, text, text, text, text, date, text, text, uuid, text) to anon, authenticated;
grant execute on function public.list_countries() to anon, authenticated;
grant execute on function public.list_states(text) to anon, authenticated;