-- ---------------------------------------------------------------------------
-- 0005_admin_auth_hardening.sql
--
-- Three gaps closed here:
--
-- 1. Admin sign-in throttling lived only in the Node process
--    (src/lib/security/rate-limit.ts). Serverless instances are ephemeral, so a
--    distributed attacker got a fresh bucket on every cold start. `rate_limit_hit`
--    already provides the durable counter; this migration exposes a thin wrapper
--    the server can call, plus a per-account lockout so one victim account cannot
--    be brute forced from many addresses.
--
-- 2. Password reset needs an audit trail.
--
-- 3. Sign-in / sign-out / password-change events were never recorded, which is
--    exactly what an administrator wants to see after a disputed change.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 1. Durable rate limiting
-- ---------------------------------------------------------------------------

-- Existing check, kept as the source of truth for the counter arithmetic.
create table if not exists public.form_rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (key, window_start)
);

create index if not exists form_rate_limits_window_idx
  on public.form_rate_limits (window_start);

-- Fixed window counter shared by every caller. Callers namespace the key
-- themselves (register:, blog:, blood:, admin-login:) so unrelated features
-- never share a key space.
create or replace function public.rate_limit_hit(
  p_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window timestamptz := to_timestamp(
    floor(extract(epoch from now()) / greatest(p_window_seconds, 1)) * greatest(p_window_seconds, 1)
  );
  v_hits integer;
begin
  insert into public.form_rate_limits (key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (key, window_start)
    do update set hits = public.form_rate_limits.hits + 1
  returning hits into v_hits;

  -- Keep the table small: only the live window and one spare are retained.
  delete from public.form_rate_limits
   where key = p_key and window_start < v_window - interval '2 days';

  return v_hits <= greatest(p_max_hits, 1);
end;
$$;

-- Reports whether a key is currently blocked WITHOUT incrementing the counter,
-- so a correct password is never counted as an extra failed attempt.
create or replace function public.rate_limit_blocked(
  p_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (
      select sum(hits) >= greatest(p_max_hits, 1)
        from public.form_rate_limits
       where key = p_key
         and window_start = to_timestamp(
               floor(extract(epoch from now()) / greatest(p_window_seconds, 1))
                 * greatest(p_window_seconds, 1)
             )
    ),
    false
  );
$$;

-- Clears a key's counter. Called after a successful sign-in so a legitimate
-- administrator is not left one failure away from a lockout.
create or replace function public.clear_rate_limit(p_key text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.form_rate_limits where key = p_key;
$$;

-- Administrator sign-in attempts, kept separately from public form traffic so
-- the counter survives a table truncation of `form_rate_limits` and so an
-- operator can read recent attempts without touching visitor data.
create table if not exists public.admin_login_attempts (
  id bigint generated always as identity primary key,
  identifier text not null,
  email text,
  succeeded boolean not null default false,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_login_attempts_recent_idx
  on public.admin_login_attempts (created_at desc);

create index if not exists admin_login_attempts_identifier_idx
  on public.admin_login_attempts (identifier, created_at desc);

-- Drops the failed attempts recorded against one key.
--
-- This must run alongside `clear_rate_limit`: `admin_login_blocked` counts rows
-- in `admin_login_attempts`, not the `form_rate_limits` counter, so clearing only
-- the latter would leave a user who fat-fingered the password a few times still
-- one attempt away from a lockout even after signing in successfully.
create or replace function public.clear_login_failures(p_identifier text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.admin_login_attempts
   where identifier = p_identifier and succeeded = false;
$$;

create or replace function public.record_admin_login_attempt(
  p_identifier text,
  p_email text,
  p_succeeded boolean,
  p_ip text,
  p_user_agent text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.admin_login_attempts
    (identifier, email, succeeded, ip, user_agent)
  values
    (left(p_identifier, 200), left(p_email, 200), p_succeeded, left(p_ip, 64), left(p_user_agent, 300));
$$;

-- Blocks a key after `p_max_hits` attempts inside the window. Unlike
-- `rate_limit_hit` this does not have to be called on every attempt: the caller
-- asks "are you blocked?" first and only records a hit on failure.
create or replace function public.admin_login_blocked(
  p_identifier text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((
    select count(*) >= greatest(p_max_hits, 1)
      from public.admin_login_attempts
     where identifier = p_identifier
       and succeeded = false
       and created_at >= now() - make_interval(secs => greatest(p_window_seconds, 1))
  ), false);
$$;

create or replace function public.record_admin_auth_event(
  p_action text,
  p_actor_email text,
  p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (actor_id, actor_email, action, entity, entity_id, new_value)
  values (
    auth.uid(),
    left(coalesce(p_actor_email, auth.jwt() ->> 'email', 'anonymous'), 200),
    p_action,
    'admin_auth',
    null,
    case when p_detail is null then null else jsonb_build_object('detail', p_detail) end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke all on function public.rate_limit_hit(text, integer, integer) from public;
revoke all on function public.rate_limit_blocked(text, integer, integer) from public;
revoke all on function public.clear_rate_limit(text) from public;
revoke all on function public.clear_login_failures(text) from public;
revoke all on function public.admin_login_blocked(text, integer, integer) from public;
revoke all on function public.record_admin_login_attempt(text, text, boolean, text, text) from public;
revoke all on function public.record_admin_auth_event(text, text, text) from public;

-- Server only: every one of these is called through the service-role client.
grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
grant execute on function public.rate_limit_blocked(text, integer, integer) to service_role;
grant execute on function public.clear_rate_limit(text) to service_role;
grant execute on function public.clear_login_failures(text) to service_role;
grant execute on function public.admin_login_blocked(text, integer, integer) to service_role;
grant execute on function public.record_admin_login_attempt(text, text, boolean, text, text) to service_role;
grant execute on function public.record_admin_auth_event(text, text, text) to service_role;

-- No direct table access from the browser. The panel reads this through the
-- service-role client, which bypasses grants and RLS entirely.
revoke all on table public.admin_login_attempts from anon, authenticated;
grant select on table public.admin_login_attempts to service_role;