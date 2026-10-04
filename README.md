# Srinivasula Seva Samstha (TSSS) — website

A modern, responsive website and admin platform for **Srinivasula Seva Samstha**, a
non-profit community trust. Devotional programmes, education, community service and
blood assistance — managed entirely by trust administrators, with no technical
knowledge required.

- **Frontend:** Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL, Auth, Row Level Security, Storage)
- **Notifications:** provider-agnostic email + WhatsApp layer (`src/lib/notifications`)

---

## 1. Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the values (see section 2)
npm run dev                    # http://localhost:3000
```

Admin panel: **http://localhost:3000/admin/login**

Production build:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

---

## 2. Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Public/anon key (RLS applies) |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Admin writes, audit log, user creation. Never prefix with `NEXT_PUBLIC_` |
| `NEXT_PUBLIC_SITE_URL` | server | Canonical URL used for metadata, sitemap and robots |
| `DATABASE_URL` | local scripts only | Direct Postgres connection used by `npm run db:*` |
| `EMAIL_PROVIDER_API_KEY`, `EMAIL_API_URL`, `EMAIL_FROM` | server | Email delivery |
| `WHATSAPP_PROVIDER_API_KEY`, `WHATSAPP_API_URL`, `WHATSAPP_SENDER_NUMBER` | server | WhatsApp delivery |
| `CENTRAL_ADMIN_EMAIL`, `CENTRAL_ADMIN_WHATSAPP` | server | Fallback recipient for unassigned blood requests |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | server / client | Optional Cloudflare Turnstile on public forms |

If the email/WhatsApp keys are empty the notification layer runs in **console mode**:
messages are logged server-side instead of being delivered. The provider can be
swapped at any time by changing the keys — no code changes needed.

---

## 3. Database setup

The schema has already been applied to the connected Supabase project. To set up a
new project:

```bash
npm run db:apply               # supabase/migrations/0001_init.sql (idempotent)
npm run db:apply:visibility    # generated banner visibility column
npm run db:seed                # categories, settings, districts/areas, demo content
```

What the migration creates:

- Tables: `users`, `site_banners`, `event_categories`, `events`, `event_gallery`,
  `donation_settings`, `media_items`, `blogs`, `members`, `districts`, `areas`,
  `blood_help_admins`, `blood_help_requests`, `notification_logs`, `page_content`,
  `site_settings`, `audit_logs`, `form_rate_limits`
- Enums for roles, blog status, request status, notification status, banner type
- Sequences `member_registration_seq` and `blood_request_seq` → `TSSS000001`, `BH000001`
- `SECURITY DEFINER` RPCs: `submit_registration`, `submit_blog`, `create_blood_request`,
  `rate_limit_hit`, `write_audit`, `next_unique_slug`, `next_registration_number`,
  `next_blood_request_number`
- Row Level Security on every table, plus a `public-media` storage bucket
- `updated_at` triggers, blog review stamping, and an auth trigger that creates the
  first profile as `super_admin`

### Registration numbers and duplicate detection

Duplicate detection and numbering both happen **inside the database**:

- `members.normalized_full_name` (case/space/punctuation-insensitive) plus
  `date_of_birth` are covered by a unique index → duplicates are impossible even
  under concurrent submissions.
- `submit_registration()` returns `already_registered` (without revealing anything
  about the existing record) or a freshly generated `TSSS000123`.
- Only the RPC can write to `members`; direct inserts from the browser are rejected by
  RLS and by revoked grants.

### Demo content

`supabase/seed.sql` inserts **clearly marked placeholder content** (`Demo: …` titles,
demo bank details, a demo blood-help coordinator). Remove it with:

```bash
npm run db:remove-demo
```

Real event categories, districts and areas are preserved.

> Registration numbers start at `TSSS000001`. If test runs have consumed numbers
> and you want to restart the sequence, run `supabase/reset-sequences.sql` in the
> Supabase SQL editor (it also removes leftover development registrations).

---

## 4. Admin panel

Sign in at `/admin/login`. The **first** administrator is created as `super_admin`:

```bash
npm run admin:create -- you@example.com "Your Name"
```

A random temporary password is printed — change it after the first sign-in. Further
administrators are created in **Admin → Team & Roles**.

| Section | What it does |
| --- | --- |
| Dashboard | Live counts (members, events, pending blogs, blood requests, media, banners) and a 30-day registration chart |
| Website → Banner | Enable/disable the site-wide banner, set type, message, link and date window |
| Website → Homepage/About content | Editable text blocks (`page_content`) |
| Events → Categories / Events / Galleries | Full CRUD, publish/feature toggles, image upload and ordering |
| Donations | Bank, UPI, QR code, instructions, transparency note |
| Media → YouTube / News | Video links and press coverage |
| Blogs → Pending/Approved/Rejected | Review, edit, approve, reject, feature, delete |
| Registrations | Server-side search, sort, filter, pagination, view, edit, disable/activate, CSV export |
| Blood Help → Requests / Districts / Administrators / Notification logs | Status workflow, district & area management, routing configuration, delivery status + retry |
| Settings | Organization, contact, social links, form availability, notification toggles |
| Team & Roles, Audit Log | Super Admin only |

### Roles

`super_admin` → `admin` → `content_manager` → `blood_help_manager`.
Permissions are enforced by Row Level Security in the database, not only in the UI,
and every admin page/action re-verifies the session server-side.

---

## 5. Public features

- **Home** — hero with the trust emblem, about, upcoming events, live impact
  statistics, initiatives, photo booth entry, latest blogs, media, blood help CTA,
  registration CTA.
- **Events** — admin-managed categories, event pages with gallery, YouTube embed,
  external links and JSON-LD `Event` structured data.
- **Donations** — bank/UPI/QR configured by admins, plus an explicit "voluntary,
  no mandatory fee" transparency section. The site never collects payments.
- **Media** — YouTube embeds and external press links.
- **Blogs** — public submission (stored as `pending`), admin approval workflow,
  search, categories, pagination, featured post, JSON-LD `BlogPosting`.
- **Register** — Full Name, Date of Birth, Village, Mobile Number (plus optional
  email). Duplicate check on **name + date of birth**, unique `TSSS000123` number,
  printable/downloadable confirmation.
- **Blood Help** — request form with district → area cascading (values come from the
  database, never hard-coded), routing to the responsible administrator, email +
  WhatsApp notification with logging, `BH000123` reference numbers, and status
  tracking `NEW → CONTACTED → IN_PROGRESS → RESOLVED → CLOSED`.

Routing order: area administrator → district administrator → central admin
(the request is flagged *Unassigned* and the requester is told).

### Contact form

The "Get in touch" section on `/about#contact` posts to
[FormSubmit](https://formsubmit.co) and emails the enquiry to
`NEXT_PUBLIC_CONTACT_FORM_EMAIL` (default `srinivasreddyvootkuri@srinivasulasevasamstha.com`).
No account, API key or server code is involved, and nothing is written to the database.

Two things to know:

- **The first message must be confirmed.** FormSubmit emails an activation link to
  the destination inbox on the first ever submission. Until somebody clicks it,
  every later message is silently discarded. Check that inbox once after deploying.
- The inbox is the only place enquiries land. They are not visible in the admin
  panel, so forward them where you want them filed.

The form degrades to a normal HTML `POST` if JavaScript is unavailable, so it still
delivers without the client-side fetch.

---

## 5a. Photo Booth

A branded photo-booth studio at **/photo-booth**.

**For visitors**
1. Choose a template.
2. Add a photo to each window (JPG/PNG/WebP/AVIF).
3. Adjust each photo — drag to reposition, scroll or pinch to zoom, rotate, or use
   the sliders and arrow keys.
4. Press **Download photo** to save a full-resolution PNG. On mobile the browser's
   share sheet is used when available.

Photos are decoded and composited **in the browser** (`src/lib/photobooth/compose.ts`)
and never uploaded, so no personal images are stored on the server. The preview and
the export use the same drawing routine, so the download matches the preview exactly.

**For administrators** — Admin → Media → Photo Booth:
- Upload a **transparent PNG frame** (the photo windows are the transparent areas)
  plus an optional preview image, and set the canvas size to match the PNG.
- Position the photo windows on the visual editor: drag to move, `Shift`+drag to
  resize, click empty canvas to add a window, or type exact values. Windows that
  would fall outside the canvas are rejected.
- Activate/deactivate a template, feature one as "Popular", or delete it.

Starter frames (four-photo collage, photo strip, classic circle, twin collage) are
generated by `npm run placeholders:photobooth` and seeded with
`npm run db:seed:photobooth`. Replace them with your own designs at any time —
nothing is hard-coded in the app.

---

## 6. Security

- RLS on all tables; `members`, `blood_help_requests`, `blood_help_admins`,
  `notification_logs` and `audit_logs` are unreadable to the public.
- Public writes only through `SECURITY DEFINER` functions that re-validate input.
- Server-side validation with zod **and** database constraints/unique indexes.
- Rate limiting per source (in-memory + database) and a honeypot field on public
  forms; optional Cloudflare Turnstile support.
- Image uploads restricted to JPG/PNG/WebP/AVIF under 4 MB.
- Blog content sanitised with an allow-list (`src/lib/utils/sanitize.ts`) before
  storage; React escapes everything else on render.
- Security headers, `noindex` on admin routes, and audit logging of administrative
  actions (create/update/delete/publish/approve/enable/disable).
- The service-role key is only used in server-only modules.

---

## 7. SEO & accessibility

- Per-page titles, descriptions, canonical URLs, Open Graph and Twitter cards.
- `sitemap.xml` (public pages, categories, events, blogs) and `robots.txt`
  (admin and API disallowed).
- JSON-LD structured data for events and blog posts.
- Semantic headings, skip link, labelled inputs, `aria-invalid` + inline errors,
  visible focus states, alt text, `prefers-reduced-motion` support, 44px touch
  targets and mobile-first layouts.

---

## 8. Brand assets and colours

**The emblem.** The trust logo lives at `public/brand/tsss-emblem-original.jpg` and is used in
the header, footer, home hero, admin panel and browser tab. Replace that one file and
then run:

```bash
npm run brand:icons     # regenerates the app icon, apple touch icon and the
                        # social share image (public/brand/og-default.jpg)
```

If the emblem file is missing the site falls back to
`public/brand/tsss-emblem-placeholder.jpg` so nothing breaks.

`public/brand/tsss-emblem-original.png` holds the untouched artwork. `npm run brand:emblem`
derives every other copy from it and `npm run brand:icons` rebuilds the app icons and the
social share image.

| File | Size | Use |
| --- | --- | --- |
| `tsss-emblem-original.jpg` | 213x226 | Exact logo as JPG - **the logo the site loads** |
| `tsss-emblem-original.png` | 213x226 | Untouched master artwork |
| `tsss-emblem.jpg` | 1024x1019 | Same logo upscaled, on white, for print and documents |
| `tsss-emblem.png` | 1024x1019 | Same logo, circular with transparent corners |

`npm run brand:emblem` regenerates all four from `tsss-emblem-original.png` (trim, round into
the badge circle, upscale to 1024px). Drop a new master at `tsss-emblem-original.png` or
`tsss-emblem-original.jpg` and re-run `npm run brand:emblem && npm run brand:icons`.

The site loads the exact JPG everywhere the logo appears; `tsss-emblem.png` and
`tsss-emblem.jpg` are the upscaled copies, and the favicon/share image are generated from
them so small sizes stay sharp.

**Colours** are defined as CSS variables in `src/app/globals.css` and mirror the
emblem:

| Token | Value | Use |
| --- | --- | --- |
| `brand-500 / brand-600` | `#1b84dd` / `#0b6ab5` | Primary buttons, links, active states |
| `ink-900 … ink-950` | `#052540` … `#02101f` | Deep brand navy for dark sections |
| `gold-400` | `#f2c230` | Emblem lettering, spiritual accents |
| `flag-600` | `#d8232a` | Crimson accent (TSSS lettering, urgency) |

Generated artwork (photo booth frames, demo images) uses the same palette, so
re-running `npm run placeholders` / `npm run placeholders:photobooth` keeps
everything on-brand. The placeholders themselves are still temporary — replace the
event, gallery, blog and media JPGs with real photography:

```
public/brand/tsss-emblem-original.jpg  (your logo)
public/brand/namalu.jpg
public/brand/og-default.jpg
public/images/events/*.jpg          public/images/gallery/gallery-1..4.jpg
public/images/blogs/blog-1.jpg      public/images/media/media-1.jpg
public/images/donations/qr-placeholder.jpg

All seeded image URLs are stored under `/images/...`, so placeholder artwork has to live in
`public/images/`. A path that does not match makes `next/image` answer 400 in development.
```

---

## 9. Tests

The suites run against the real project, create their own fixtures and clean up
afterwards. Start the dev server first for the HTTP suites.

```bash
npm run test:db                                   # 35 checks: RLS, duplicates,
                                                   # concurrent numbering, routing, auth
npm run test:http                                 # 44 checks: public pages, SEO, 404, protection
npm run test:admin  -- email password              # 52 checks: every admin page + CSV export
npm run test:forms                                # 23 checks: register / blood help / blog
                                                   # submissions through the real forms
npm run test:admin-actions -- email password      # 22 checks: banner, events, gallery,
                                                   # blog approval, member disable, audit
npm run test:notifications -- email password      # 5 checks: email + WhatsApp providers
npm run test:photobooth                           # 10 checks: photo compositing maths
```

Helpers:

```bash
npm run db:reset-rate-limits   # public forms are rate limited (8/hour, 5/hour, 3/day per source)
npm run db:reset-sequences     # clears dev members/requests and restarts TSSS/BH numbering
npm run db:apply               # re-apply migrations (needs direct Postgres access)
```

> Direct Postgres (`npm run db:*`) needs DNS/network access to
> `db.<project-ref>.supabase.co`. If it is unavailable, apply the SQL files in
> `supabase/` through the Supabase SQL editor instead.
>
> `supabase/migrations/0003_admin_grants.sql` is optional: admin writes already
> run through the service-role client after an explicit role check, so the panel
> works without it. Applying it lets the panel write through the RLS-scoped
> session client instead.

---

## 10. Deploying to Vercel

1. Push the project to GitHub.
2. Import it in Vercel (framework preset: Next.js).
3. Add the environment variables from section 2 (`SUPABASE_SERVICE_ROLE_KEY` as a
   **server-only** variable; `NEXT_PUBLIC_SITE_URL` set to the production domain).
4. Deploy. `npm run build` needs no Supabase access at build time — public pages are
   rendered on demand and revalidated.

---

## Project layout

```
src/
  app/
    (site)/            public pages (header/footer/banner chrome)
    admin/
      (auth)/login     sign-in screen
      (dash)/          protected admin sections
    api/               districts JSON, admin CSV export
  components/          UI, layout, forms, admin (generic resource form + tables)
  lib/
    actions/           server actions (public forms, admin CRUD, auth)
    admin/entities.ts  declarative field definitions for every admin entity
    auth/              session + role helpers
    data/              data access layer (public + registrations)
    notifications/     email/WhatsApp providers, templates, dispatcher
    security/          rate limiting, honeypot, Turnstile
    supabase/          browser, server, public and service-role clients
    validation/        zod schemas
supabase/
  migrations/0001_init.sql, 0002_banner_visibility.sql,
            0003_admin_grants.sql, 0004_photo_booth.sql
  seed.sql, photo-booth-seed.sql, remove-demo-content.sql, reset-sequences.sql
scripts/               SQL helpers, frame/placeholder generators, smoke tests, dev helpers
```