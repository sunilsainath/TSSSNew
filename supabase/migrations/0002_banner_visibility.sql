-- Adds the generated visibility flag used by the banner policy and queries.
create or replace function public.banner_is_visible(
  p_enabled boolean, p_start timestamptz, p_end timestamptz
)
returns boolean language sql immutable as $$
  select coalesce(
    p_enabled
    and (p_start is null or p_start <= now())
    and (p_end is null or p_end >= now()),
    false
  );
$$;

alter table public.site_banners drop column if exists is_visible;

alter table public.site_banners
  add column is_visible boolean
  generated always as (public.banner_is_visible(is_enabled, start_date, end_date)) stored;

create index if not exists site_banners_visibility_idx on public.site_banners (is_visible);
