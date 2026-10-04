-- ===========================================================================
-- Photo Booth
--
--   photo_booth_templates : branded frames an administrator maintains
--   photo_booth_slots     : the photo windows inside each frame
--
-- Visitors upload photos in the browser; images are composited client-side and
-- never stored on the server, so no personal photos are retained.
-- ===========================================================================

do $$ begin create type public.photo_slot_shape as enum ('rect', 'circle');
exception when duplicate_object then null; end $$;

create table if not exists public.photo_booth_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique,
  description text,
  frame_image text not null,
  preview_image text,
  width integer not null default 1080 check (width between 320 and 4000),
  height integer not null default 1350 check (height between 320 and 4000),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_by uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_booth_slots (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.photo_booth_templates (id) on delete cascade,
  label text,
  shape public.photo_slot_shape not null default 'rect',
  x integer not null check (x >= 0),
  y integer not null check (y >= 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  radius integer not null default 24 check (radius >= 0),
  rotation numeric(6,2) not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint photo_booth_slots_inside_frame
    check (x + width <= 4000 and y + height <= 4000)
);

create index if not exists photo_booth_templates_active_idx
  on public.photo_booth_templates (is_active, display_order);
create index if not exists photo_booth_slots_template_idx
  on public.photo_booth_slots (template_id, display_order);

-- Added after the first release so existing installs pick it up.
alter table public.photo_booth_slots add column if not exists radius integer not null default 24;
alter table public.photo_booth_slots drop constraint if exists photo_booth_slots_radius_positive;
alter table public.photo_booth_slots
  add constraint photo_booth_slots_radius_positive check (radius >= 0);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.photo_booth_templates enable row level security;
alter table public.photo_booth_slots enable row level security;

drop policy if exists "photo_templates_public_read" on public.photo_booth_templates;
create policy "photo_templates_public_read" on public.photo_booth_templates for select
  using (is_active or public.can_manage_content());

drop policy if exists "photo_templates_admin_all" on public.photo_booth_templates;
create policy "photo_templates_admin_all" on public.photo_booth_templates for all
  using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "photo_slots_public_read" on public.photo_booth_slots;
create policy "photo_slots_public_read" on public.photo_booth_slots for select using (
  exists (
    select 1 from public.photo_booth_templates t
    where t.id = photo_booth_slots.template_id
      and (t.is_active or public.can_manage_content())
  )
);

drop policy if exists "photo_slots_admin_all" on public.photo_booth_slots;
create policy "photo_slots_admin_all" on public.photo_booth_slots for all
  using (public.can_manage_content()) with check (public.can_manage_content());

-- Reads for visitors, writes through the admin panel's service-role client.
grant select on table public.photo_booth_templates to anon, authenticated;
grant select on table public.photo_booth_slots to anon, authenticated;

drop trigger if exists trg_photo_booth_templates_updated_at on public.photo_booth_templates;
create trigger trg_photo_booth_templates_updated_at
  before update on public.photo_booth_templates
  for each row execute function public.set_updated_at();