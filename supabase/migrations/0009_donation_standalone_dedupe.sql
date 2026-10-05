-- ---------------------------------------------------------------------------
-- 0009_donation_standalone_dedupe.sql
--
-- Migration 0006 deduplicates re-uploads through (camp_id, external_ref), but
-- Postgres treats NULL camp_id values as distinct from each other, so imports
-- without a camp could still double count. This covers that case.
-- ---------------------------------------------------------------------------

create unique index if not exists donations_standalone_ref_uniq
  on public.donations (external_ref)
  where camp_id is null and external_ref is not null;