-- Clears the public form rate-limit counters (development helper).
-- Public forms are limited to 8 registrations/hour, 5 blood requests/hour and
-- 3 blog submissions/day per source; run this when re-running the smoke tests.
delete from public.form_rate_limits;