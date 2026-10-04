-- ---------------------------------------------------------------------------
-- Grants fix.
--
-- Administrators write through the request-scoped (session) Supabase client, so
-- the `authenticated` role needs DML privileges on the tables they manage.
-- Row Level Security remains the security boundary: staff roles are allowed,
-- anonymous visitors are not.
-- ---------------------------------------------------------------------------

-- Members: administrators can view, edit, disable and export registrations.
grant select, insert, update on table public.members to authenticated;

-- Blood help: administrators manage requests and routing.
grant select, insert, update on table public.blood_help_requests to authenticated;
grant select, insert, update, delete on table public.blood_help_admins to authenticated;

-- Team management (role changes are still restricted to super_admin by RLS).
grant select, update, delete on table public.users to authenticated;

-- Notification logs and the audit log stay service-role only for writes:
-- they are system records written on behalf of anonymous visitors.
revoke insert, update, delete on table public.notification_logs from anon, authenticated;
revoke insert, update, delete on table public.audit_logs from anon, authenticated;
revoke insert, update, delete on table public.form_rate_limits from anon, authenticated;

-- Public visitors may only read published content; never write.
revoke insert, update, delete on table public.members from anon;
revoke insert, update, delete on table public.blood_help_requests from anon;
revoke insert, update, delete on table public.blood_help_admins from anon;
revoke insert, update, delete on table public.users from anon;