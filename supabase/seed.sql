-- ===========================================================================
-- Seed data for Srinivasula Seva Samstha (TSSS)
--
-- Idempotent - safe to run more than once.
--
-- IMPORTANT: the events, blogs, media items and donation details below are
-- DEMO / PLACEHOLDER content. Replace them with the trust's real content from
-- the admin panel, or run `supabase/remove-demo-content.sql` to delete them.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Singleton rows (must exist for the public pages to render)
-- ---------------------------------------------------------------------------

insert into public.site_settings (organization_name, short_name, tagline, about_short, mission, vision)
values (
  'Srinivasula Seva Samstha',
  'TSSS',
  'Service · Devotion · Unity',
  'Srinivasula Seva Samstha is a non-profit community trust that brings Srinivas families together through devotional programmes, education, blood assistance and community service.',
  'To serve society through devotional programmes, education, relief and healthcare assistance while strengthening the bond between every Srinivas family.',
  'A united, spiritually grounded Srinivas community that serves every family with dignity, care and compassion.'
)
on conflict do nothing;

insert into public.donation_settings (account_name, bank_name, account_number, ifsc, branch, upi_id, instructions, transparency_note, is_donation_open)
values (
  'Srinivasula Seva Samstha',
  'Demo Bank (replace with real bank)',
  '0000000000',
  'DEMO0000000',
  'Main Branch',
  'tssstrust@demoupi',
  '1. Open any UPI app and scan the QR code or enter the UPI ID. 2. Add your name and a message. 3. Send the amount you wish to contribute. 4. Share the UTR/reference with the administration if you need a receipt.',
  'Donations to Srinivasula Seva Samstha are entirely voluntary. There is no mandatory fee or compulsory contribution to register, attend any programme, or receive any service from this trust. Every contribution is used only for community service, education, devotional activities and blood assistance, and is accounted for by the trust.',
  true
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Event categories (admin can add more without code changes)
-- ---------------------------------------------------------------------------

insert into public.event_categories (name, slug, description, cover_image, display_order)
values
  ('1st Anniversary', '1st-anniversary', 'Celebration of the first year of our community trust - bhajans, prasadam and community gathering.', '/images/events/anniversary-1.jpg', 1),
  ('2nd Anniversary', '2nd-anniversary', 'Second year celebration with cultural programmes, spiritual discourse and community stalls.', '/images/events/anniversary-2.jpg', 2),
  ('Devotional Events', 'devotional-events', 'Kalyanotsavam, bhajans, satsangam, mass kalyanam and other regular spiritual programmes.', '/images/events/devotional-1.jpg', 3),
  ('Helping Hands', 'helping-hands', 'Relief material distribution, medical camps, family support and disaster response.', '/images/events/helping-hands-1.jpg', 4),
  ('Pen Distributions', 'pen-distributions', 'Free notebooks, pens and school kits distributed to students across our villages.', '/images/events/pen-distribution-1.jpg', 5),
  ('Educational Programs', 'educational-programs', 'Scholarships, coaching classes, computer education and skill development.', '/images/events/education-1.jpg', 6)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Demo events (placeholder - replace with real programmes)
-- ---------------------------------------------------------------------------

insert into public.events (category_id, title, slug, event_date, end_date, location, summary, content, cover_image, is_featured, is_published)
select c.id, v.title, v.slug, v.event_date::date, null, v.location, v.summary, v.content, v.cover, v.featured, true
from (values
  ('devotional-events', 'Demo: Sri Venkateshwara Kalyanotsavam & Bhajan Sandhanam', 'demo-sri-venkateshwara-kalyanotsavam',
   (current_date + 21)::text, 'TSSS Community Hall, Karimnagar',
   'A devotional day with morning kalyanotsavam, continuous bhajan sandhanam, pravachanam and prasadam.',
   E'Demo content. Morning kalyanotsavam, followed by bhajan sandhanam and a pravachanam on the significance of Sri Venkateswara nama. Prasadam is served to all participants at the conclusion of the programme.',
   '/images/events/devotional-1.jpg', true),
  ('devotional-events', 'Demo: Weekly Satsangam & Nama Sankirtanam', 'demo-weekly-satsangam',
   (current_date + 7)::text, 'Sriramapuram, Telangana',
   'Every Sunday morning nama sankirtanam and satsangam for all families of the community.',
   E'Demo content. Weekly satsangam with nama sankirtanam, bhajan, and a short discourse. Open to all members and their families.',
   '/images/events/devotional-2.jpg', false),
  ('helping-hands', 'Demo: Village Health & Awareness Camp', 'demo-village-health-camp',
   (current_date + 35)::text, 'Community School Grounds, Telangana',
   'Free health screening, blood group detection and medical awareness camp for the village.',
   E'Demo content. General health check-ups, blood group detection, blood pressure and sugar screening, and medical awareness sessions led by visiting doctors.',
   '/images/events/helping-hands-1.jpg', true),
  ('pen-distributions', 'Demo: School Kit Distribution Drive', 'demo-school-kit-distribution',
   (current_date + 14)::text, 'Z.P. High School, Telangana',
   'Distribution of notebooks, pens, bags and school kits to students studying in Classes 1 to 10.',
   E'Demo content. Each student receives a school kit containing notebooks, pens, a pencil box, a bag and other study material. Volunteers are welcome.',
   '/images/events/pen-distribution-1.jpg', false),
  ('educational-programs', 'Demo: Free Spoken English & Computer Classes', 'demo-spoken-english-computer-classes',
   (current_date + 45)::text, 'TSSS Community Centre',
   'Weekend classes in spoken English, computer basics and aptitude for students of the community.',
   E'Demo content. Weekend batches conducted by volunteers. Foundation course, intermediate course and computer literacy modules.',
   '/images/events/education-1.jpg', false),
  ('1st-anniversary', 'Demo: 1st Anniversary Celebrations', 'demo-1st-anniversary-celebrations',
   (current_date - 200)::text, 'TSSS Community Hall, Karimnagar',
   'Our first year milestone - thanksgiving, cultural programme and community recognition.',
   E'Demo content. Thanksgiving to all volunteers and members, cultural performances by children, and recognition of long serving volunteers.',
   '/images/events/anniversary-1.jpg', false),
  ('2nd-anniversary', 'Demo: 2nd Anniversary Celebrations', 'demo-2nd-anniversary-celebrations',
   (current_date - 90)::text, 'TSSS Community Hall, Karimnagar',
   'Second year of service - report presentation, pledge ceremony and community dinner.',
   E'Demo content. Presentation of the annual service report, pledge ceremony for the year ahead and a community dinner.',
   '/images/events/anniversary-2.jpg', false)
) as v(category_slug, title, slug, event_date, location, summary, content, cover, featured)
join public.event_categories c on c.slug = v.category_slug
where not exists (select 1 from public.events e where e.slug = v.slug);

insert into public.event_gallery (event_id, image_url, caption, display_order)
select e.id, v.img, v.caption, v.ord
from (values
  ('demo-sri-venkateshwara-kalyanotsavam', '/images/gallery/gallery-1.jpg', 'Morning kalyanotsavam', 1),
  ('demo-sri-venkateshwara-kalyanotsavam', '/images/gallery/gallery-2.jpg', 'Bhajan sandhanam', 2),
  ('demo-sri-venkateshwara-kalyanotsavam', '/images/gallery/gallery-3.jpg', 'Prasadam distribution', 3),
  ('demo-village-health-camp', '/images/gallery/gallery-2.jpg', 'Health screening', 1),
  ('demo-school-kit-distribution', '/images/gallery/gallery-3.jpg', 'Students receiving kits', 1),
  ('demo-school-kit-distribution', '/images/gallery/gallery-4.jpg', 'Volunteers packing kits', 2)
) as v(event_slug, img, caption, ord)
join public.events e on e.slug = v.event_slug
where not exists (select 1 from public.event_gallery g where g.event_id = e.id and g.image_url = v.img);

-- ---------------------------------------------------------------------------
-- Demo blogs
-- ---------------------------------------------------------------------------

insert into public.blogs (author_name, author_email, author_mobile, title, slug, excerpt, content, featured_image, category, status, is_featured)
values
  ('Community Team', 'demo@example.com', '9000000000',
   'Demo: Serving our community through pen distribution',
   'demo-serving-our-community-through-pen-distribution',
   'Demo article. How a simple school kit can change a student''s year, written by the TSSS volunteer team.',
   E'Demo article.\n\nEvery year our volunteers visit schools across the district and distribute notebooks, pens and school kits to students who need them most.\n\nThis placeholder article shows how approved blog posts appear on the website. You can edit or delete it from Admin > Blogs.',
   '/images/blogs/blog-1.jpg', 'Community Service', 'approved', true),
  ('Volunteer Network', 'demo2@example.com', '9000000001',
   'Demo: Organising a successful village blood drive',
   'demo-organising-a-successful-village-blood-drive',
   'Demo article. A step by step guide to running a blood donation camp with our district volunteers.',
   E'Demo article.\n\nBlood donation camps need planning, volunteers, donors and a clear process. This placeholder article explains how our blood help network is organised district by district.',
   '/images/blogs/blog-2.jpg', 'Blood Help', 'approved', false),
  ('Pending Reviewer', 'demo3@example.com', '9000000002',
   'Demo: Submitted blog awaiting administrator approval',
   'demo-submitted-blog-awaiting-approval',
   'Demo article. Submitted by a member from the public blog form and waiting for administrator review.',
   E'Demo article.\n\nThis post was submitted through the public "Share your story" form and is in the pending queue. Administrators can approve or reject it from Admin > Blogs > Pending.',
   '/images/blogs/blog-3.jpg', 'General', 'pending', false);

-- ---------------------------------------------------------------------------
-- Demo media (replace with real YouTube videos / press coverage)
-- ---------------------------------------------------------------------------

insert into public.media_items (type, title, description, url, thumbnail_url, source_name, publication_date, display_order, is_published)
values
  ('youtube', 'Demo: Sri Venkateswara Kalyanotsavam Highlights', 'Replace with a real YouTube link of your event video.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/media/media-1.jpg', 'TSSS YouTube', current_date - 30, 1, true),
  ('youtube', 'Demo: Satsangam & Nama Sankirtanam', 'Replace with a real YouTube link of your regular satsangam.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '/images/media/media-2.jpg', 'TSSS YouTube', current_date - 12, 2, true),
  ('news', 'Demo: Trust distributes school kits to 500 students', 'Replace with the real press coverage link.', 'https://example.com/news/tsss-school-kits', '/images/media/media-1.jpg', 'Example News', current_date - 60, 3, true),
  ('news', 'Demo: Free health camp in Telangana village', 'Replace with the real article URL and publication name.', 'https://example.com/news/tsss-health-camp', '/images/media/media-2.jpg', 'Example Daily', current_date - 100, 4, true);

-- ---------------------------------------------------------------------------
-- Districts & areas used by the Blood Help form.
-- These are real Telangana district names with example areas so the routing
-- feature can be tested. Administrators can rename, add or deactivate them.
-- ---------------------------------------------------------------------------

insert into public.districts (name, slug, display_order)
select v.name, v.slug, v.ord
from (values
  ('Karimnagar', 'karimnagar', 1),
  ('Warangal', 'warangal', 2),
  ('Hyderabad', 'hyderabad', 3),
  ('Nalgonda', 'nalgonda', 4),
  ('Khammam', 'khammam', 5),
  ('Siddipet', 'siddipet', 6),
  ('Jagtial', 'jagtial', 7),
  ('Mahabubnagar', 'mahabubnagar', 8)
) as v(name, slug, ord)
where not exists (select 1 from public.districts d where d.slug = v.slug);

insert into public.areas (district_id, name, slug, display_order)
select d.id, v.area, v.slug, v.ord
from (values
  ('karimnagar', 'Karimnagar City', 'karimnagar-city', 1),
  ('karimnagar', 'Sriramapuram', 'sriramapuram', 2),
  ('warangal', 'Warangal City', 'warangal-city', 1),
  ('hyderabad', 'Hyderabad City', 'hyderabad-city', 1),
  ('nalgonda', 'Nalgonda Town', 'nalgonda-town', 1),
  ('khammam', 'Khammam Town', 'khammam-town', 1),
  ('siddipet', 'Siddipet Town', 'siddipet-town', 1),
  ('jagtial', 'Jagtial Town', 'jagtial-town', 1),
  ('mahabubnagar', 'Mahabubnagar Town', 'mahabubnagar-town', 1)
) as v(district_slug, area, slug, ord)
join public.districts d on d.slug = v.district_slug
where not exists (select 1 from public.areas a where a.slug = v.slug);

-- One example district administrator so notification routing can be tested.
-- Replace with your real administrators from Admin > Blood Help > Administrators.
insert into public.blood_help_admins (district_id, area_id, admin_name, email, whatsapp_number, is_active)
select d.id, a.id, 'Demo Blood Help Coordinator', 'bloodhelp@example.com', '919999999999', true
from public.districts d
join public.areas a on a.district_id = d.id and a.slug = 'karimnagar-city'
where d.slug = 'karimnagar'
  and not exists (select 1 from public.blood_help_admins b where b.district_id = d.id);
