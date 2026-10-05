-- ---------------------------------------------------------------------------
-- 0008_member_filter_rpc.sql
--
-- One function behind the admin member list and the CSV export, so "what you
-- see is what you export".
--
-- SECURITY INVOKER is deliberate: the caller’s Row Level Security still
-- applies to `members` and `donors`, exactly as if the panel had issued the
-- filters itself. A blood_help_manager calling this directly sees nothing,
-- because `members_admin_read` requires content management rights.
--
-- The sort column is whitelisted inside the function, so it can never become
-- an injection vector through the `p_sort` argument.
-- ---------------------------------------------------------------------------

create or replace function public.filter_members(
  p_search text default null,
  p_status text default null,
  p_gender text default null,
  p_blood_group text default null,
  p_state text default null,
  p_country text default null,
  p_dob_from date default null,
  p_dob_to date default null,
  p_registered_from date default null,
  p_registered_to date default null,
  p_donated boolean default null,
  p_sort text default 'created_at',
  p_direction text default 'desc',
  p_limit integer default 25,
  p_offset integer default 0
)
returns table (
  id uuid,
  registration_number text,
  full_name text,
  normalized_full_name text,
  father_name text,
  gender public.gender_t,
  blood_group public.blood_group_t,
  date_of_birth date,
  village text,
  state_code text,
  country_code char(2),
  phone_country_code text,
  mobile_number text,
  normalized_mobile text,
  email text,
  designation text,
  profile_photo_url text,
  status text,
  notes text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql
stable
set search_path = public
as $$
declare
  v_term text := nullif(trim(coalesce(p_search, '')), '');
  v_direction text := case when lower(coalesce(p_direction, 'desc')) = 'asc' then 'asc' else 'desc' end;
  v_limit integer := least(greatest(coalesce(p_limit, 25), 1), 10000);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
begin
  return query execute format(
    'select m.id, m.registration_number, m.full_name, m.normalized_full_name,
            m.father_name, m.gender, m.blood_group, m.date_of_birth, m.village,
            m.state_code, m.country_code, m.phone_country_code, m.mobile_number,
            m.normalized_mobile, m.email, m.designation, m.profile_photo_url,
            m.status::text, m.notes, m.created_at, m.updated_at,
            count(*) over() as total_count
       from public.members m
      where ($1 is null or (
              m.registration_number ilike ''%%'' || $1 || ''%%''
           or m.full_name ilike ''%%'' || $1 || ''%%''
           or coalesce(m.father_name, '''') ilike ''%%'' || $1 || ''%%''
           or coalesce(m.village, '''') ilike ''%%'' || $1 || ''%%''
           or m.mobile_number ilike ''%%'' || $1 || ''%%''
           or coalesce(m.email, '''') ilike ''%%'' || $1 || ''%%''))
        and ($2 is null or m.status::text = $2)
        and ($3 is null or m.gender::text = $3)
        and ($4 is null or m.blood_group::text = $4)
        and ($5 is null or m.state_code = $5)
        and ($6 is null or m.country_code = $6)
        and ($7 is null or m.date_of_birth >= $7)
        and ($8 is null or m.date_of_birth <= $8)
        and ($9 is null or m.created_at >= $9::timestamptz)
        and ($10 is null or m.created_at < ($10::date + 1)::timestamptz)
        and ($11 is null or ($11 and exists (
              select 1 from public.donations d
                join public.donors o on o.id = d.donor_id
               where o.member_id = m.id or o.mobile_number = m.mobile_number
            )) or (not $11 and not exists (
              select 1 from public.donations d
                join public.donors o on o.id = d.donor_id
               where o.member_id = m.id or o.mobile_number = m.mobile_number
            )))
      order by %s %s, m.registration_number asc
      limit %s offset %s',
    case coalesce(p_sort, 'created_at')
      when 'full_name' then 'm.full_name'
      when 'village' then 'm.village'
      when 'registration_number' then 'm.registration_number'
      when 'date_of_birth' then 'm.date_of_birth'
      else 'm.created_at'
    end,
    v_direction,
    v_limit,
    v_offset
  )
  using v_term,
        nullif(p_status, ''), nullif(p_gender, ''), nullif(p_blood_group, ''),
        nullif(p_state, ''), nullif(p_country, ''),
        p_dob_from, p_dob_to, p_registered_from, p_registered_to,
        p_donated;
end;
$$;

-- Email is now part of the free-text search, so it needs an index.
create index if not exists members_email_idx on public.members (lower(email));

revoke all on function public.filter_members(text, text, text, text, text, text, date, date, date, date, boolean, text, text, integer, integer) from public;
grant execute on function public.filter_members(text, text, text, text, text, text, date, date, date, date, boolean, text, text, integer, integer) to authenticated;