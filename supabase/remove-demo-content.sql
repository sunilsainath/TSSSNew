-- ===========================================================================
-- Removes DEMO / placeholder content created by supabase/seed.sql.
-- Real organisation content (event categories, districts, areas) is kept.
-- Run manually when you are ready to publish real content only.
-- ===========================================================================

delete from public.event_gallery
where event_id in (select id from public.events where slug like 'demo-%');

delete from public.events where slug like 'demo-%';

delete from public.blogs where slug like 'demo-%';

delete from public.media_items where title like 'Demo:%';

delete from public.blood_help_admins where admin_name like 'Demo%';

-- Reset the demo donation details so real bank information can be entered.
update public.donation_settings
set account_name = 'Srinivasula Seva Samstha',
    bank_name = null,
    account_number = null,
    ifsc = null,
    branch = null,
    upi_id = null,
    qr_code_url = null,
    instructions = null;
