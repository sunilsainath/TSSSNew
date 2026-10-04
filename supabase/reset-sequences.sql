-- Removes leftover development/smoke-test registrations and resets numbering.
delete from public.members where full_name like 'Smoke Test Person %'
  or full_name like 'Concurrent Person %'
  or full_name like 'Rate Limited %';

delete from public.notification_logs
where blood_request_id in (select id from public.blood_help_requests where requester_name like 'Smoke Patient%');

delete from public.blood_help_requests where requester_name like 'Smoke Patient%';

select setval('public.member_registration_seq', 1, false);
select setval('public.blood_request_seq', 1, false);