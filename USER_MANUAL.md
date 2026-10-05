# TSSS Website — User Manual

**Srinivasula Seva Samstha (TSSS)** — non-profit community trust website and admin panel.

This manual covers what the website does, how a visitor uses each feature, and how an
administrator manages the site. It is written for the trust's office staff and volunteers —
no technical knowledge is assumed.

---

## Table of contents

**Part 1 — For visitors**
1. [Finding your way around](#1-finding-your-way-around)
2. [Home page](#2-home-page)
3. [About and contact](#3-about-and-contact)
4. [Events](#4-events)
5. [Donations](#5-donations)
6. [Media](#6-media)
7. [Blogs](#7-blogs)
8. [Register as a member](#8-register-as-a-member)
9. [Blood help](#9-blood-help)
10. [Photo booth](#10-photo-booth)

**Part 2 — For administrators**
11. [Signing in](#11-signing-in)
12. [Roles and permissions](#12-roles-and-permissions)
13. [Dashboard](#13-dashboard)
14. [Website content](#14-website-content)
15. [Events](#15-events)
16. [Donations](#16-donations)
17. [Media](#17-media)
18. [Blogs](#18-blogs)
19. [Registrations](#19-registrations)
20. [Blood help](#20-blood-help)
20A. [Blood donation](#20a-blood-donation)
21. [Photo booth](#21-photo-booth)
22. [Settings](#22-settings)
23. [Team and roles](#23-team-and-roles)
24. [Audit log](#24-audit-log)

**Part 3 — Reference**
25. [Limits and quotas](#25-limits-and-quotas)
26. [Troubleshooting](#26-troubleshooting)
27. [Known gaps](#27-known-gaps)

---

# Part 1 — For visitors

## 1. Finding your way around

The website has a sticky header with the trust emblem and name. On a desktop you see the
main menu inline; on a phone, tap the **Menu** button (three lines, top right) to open it.

**Main menu**

| Link | What you find there |
| --- | --- |
| Home | Everything at a glance |
| About Us | Who we are, mission, vision, objectives, contact form |
| Events | All programmes, past and upcoming |
| Donations | Bank and UPI details to give money |
| Media | Videos and press coverage |
| Blogs | Community articles, plus a form to submit your own |
| Blood Help | Emergency blood request form |
| Photo Booth | Create and download a photo with your friends |

Two buttons sit alongside the menu on every page:

- **Photo Booth** — jumps straight to the photo studio.
- **Register** — the gold button; takes you to the membership form.

The footer repeats every link, plus the trust's contact details and social media buttons.

At the very top of some pages you may see an **announcement banner** (for example, a festival
or an urgent blood drive). Administrators control this; it appears only between its start and
end dates if those are set.

---

## 2. Home page

The home page is a scroll of sections:

1. **Hero** — the trust name, the tagline "Service · Devotion · Unity", the emblem, and four
   buttons: Register Now, Blood Help, Upcoming Events, Donate. If a programme is coming up, a
   "Next programme" card links to it.
2. **About TSSS** — a short introduction, our mission and vision, and a Learn More button.
3. **Upcoming Events** — the next three events.
4. **Impact statistics** — six live counters:
   - Registered Members
   - Events Conducted
   - Upcoming Events
   - Blood Assistance
   - Community Stories
   - Service Categories

   These count real records, so they change as the site is used.
5. **Helping Hands** — the trust's main initiatives.
6. **Photo Booth** — an invitation to the studio (hidden if no templates are active).
7. **Latest Blogs** — the three most recent articles.
8. **Media** — the latest videos and press.
9. **Blood help** — a call to register as a donor.
10. **Registration** — a call to join.

---

## 3. About and contact

**About Us** (`/about`) contains the trust's story, six numbered objectives, activity cards
that link to the relevant event categories, the leadership list, and the districts served.

### The contact form

Scroll to **Get in touch**. The left column lists the trust's email, phone, WhatsApp and
address (only the details an administrator has published appear). The right column has a
message form:

| Field | Required | Notes |
| --- | --- | --- |
| Full Name | Yes | |
| Email | Yes | A valid email address |
| Mobile Number | No | Up to 20 characters |
| What is this about? | Yes | Registration help, Donation or receipt, Blood assistance, Volunteering, Event or programme, Feedback or complaint, Something else |
| Message | Yes | 20–4000 characters |

Press **Send message**. A green panel confirms delivery. If it fails, a red panel explains why
and you can try again.

> **Do not include bank account numbers, card details, Aadhaar or other sensitive data in
> the message.**

Two things to know about this form:

- Messages are emailed to the trust inbox by an outside service called FormSubmit. **They are
  not stored in the website database and do not appear in the admin panel.** Somebody has to
  read the inbox and forward anything that needs filing.
- The very first message ever sent must be confirmed: FormSubmit emails an activation link to
  the destination inbox. Until somebody clicks that link, **all messages are silently
  discarded**.

For emergencies, use the [blood help form](#9-blood-help) or telephone the trust — do not use
the contact form.

---

## 4. Events

**/events** lists every category (Devotional Events, Helping Hands, Pen Distributions,
Educational Programs, and the anniversaries) with a cover image and the number of upcoming
events. Below that, two lists: **Upcoming events** and **Recently held** (the nine most recent
past events).

Each event card shows the cover image, category, a "Featured" badge where applicable, the date
marked *Upcoming* or *Held*, the location, and a three-line summary.

Open a category to see all its events, or open an event for full detail:

- **Event page** — the cover image, date, location, entry (always "Free for members"), and the
  full description. Blank lines in the description become paragraphs.
- **Video** — a YouTube video is embedded if one is set. Links open in a new tab.
- **Gallery** — photographs with captions in a two or three column grid.
- **Sidebar** — a quick summary of date, location and organiser.

---

## 5. Donations

**/donations** explains how to give. A badge at the top shows whether donations are currently
open or closed.

Two payment methods are shown (only those an administrator has filled in):

- **Bank transfer** — account name, bank, account number, IFSC and branch, in a monospaced
  font so digits are easy to read aloud.
- **UPI** — the UPI ID, plus a button that opens your UPI app with the amount pre-filled.

Also on the page:

- **How to donate** — numbered instructions written by an administrator.
- **Transparency and accountability** — a statement explaining that donations are voluntary.
- **QR code** — a scannable code for UPI.
- **What your support funds** — four categories of work.
- A link to register as a volunteer.

> **The website never collects money.** There is no payment gateway. Anyone can donate
> directly by bank transfer or UPI using the details above.

---

## 6. Media

**/media** has two sections:

- **Videos** — YouTube videos play inline. "Subscribe on YouTube" appears at the top if a
  channel is configured.
- **News & media coverage** — press articles and interviews with a thumbnail, publication name
  and date. Each links out to the original.

Cards are badged **Video** (red) or **News** (blue).

---

## 7. Blogs

**/blogs** lists approved articles, newest first. The most recent article appears as a large
featured card at the top.

**Finding articles**

- **Category buttons** across the top filter by topic. Categories come from published
  articles (General, Devotional, Community Service, Education, Blood Help, Announcements).
- **Search** — type a word in the search box. It looks in article titles, summaries and body
  text. Press Enter.
- **Pages** — six articles per page, with numbered buttons at the bottom.

An article page shows the category, date and author, with an "About the author" sidebar and up
to three related articles.

### Submitting your own article

Scroll to **Share your story** and fill in:

| Field | Required | Notes |
| --- | --- | --- |
| Full Name | Yes | 2–120 characters |
| Email | Yes | Used only if the editor needs to contact you |
| Mobile Number | No | Up to 15 characters |
| Category | Yes | Chosen from the list above |
| Blog Title | Yes | 5–200 characters |
| Blog Content | Yes | At least 50 characters |
| Featured Image | No | JPG, PNG, WebP or AVIF, up to 4 MB |

Press **Submit for Review**. A green panel confirms receipt and explains that the article will
appear only after an administrator approves it.

Limits: **3 submissions per day** from the same device. Blank lines separate paragraphs.

> Submissions are reviewed before publication. Do not submit anything confidential.

---

## 8. Register as a member

**/register** creates your membership record and gives you a permanent registration number.

### What you need

| Field | Required | Rules |
| --- | --- | --- |
| Full Name | Yes | Letters only (Telugu and other scripts accepted). 2–120 characters |
| Father's Name | Yes | Same rules as your name |
| Date of Birth | Yes | Must be a real past date, within the last 120 years |
| Gender | Yes | Male, Female, Other, or Prefer not to say |
| Blood Group | Yes | A+, A-, B+, B-, AB+, AB-, O+, O-, or **I Don't Know**. Donors who choose this are listed for follow-up testing |
| Village | Yes | 2–120 characters |
| Country | Yes | Defaults to India. Choosing another country changes the dialling code |
| State | Yes | Indian state, e.g. Telangana |
| Mobile Number | Yes | Exactly 10 digits, starting with 6, 7, 8 or 9. Shown with the country's code, e.g. +91 |
| Email Address | No | For event updates |
| Photo | No | JPG or PNG, up to 4 MB. Printed on your ID card |

### How it works

1. Fill the form and press **Submit Registration**.
2. A green confirmation appears with your registration number in large gold type, formatted
   like **TSSS000123**.
3. A summary table shows your name, date of birth, village and registration date.
4. Press **Download your ID card** for a printable card with your photo and details. The link
   works for one hour. Afterwards, use **Print** or **Download / Save as PDF** to keep a copy.
   **Back to home** finishes.

### If something goes wrong

- *"You are already registered."* — a member with the same name and date of birth already
  exists. Contact the administration if you believe this is wrong.
- *"Name must contain letters only."* — remove digits, brackets or symbols.
- *"Please enter a valid mobile number."* — 10 digits starting with 6, 7, 8 or 9.
- A field highlighted in red explains what to fix.

Limit: **8 attempts per hour** from the same device.

**Privacy.** Registration records are never displayed publicly. Your number cannot be changed
or reused — the system issues each one once. If you lose it, contact the administration with
your name and date of birth.

If the trust pauses registration, the button is disabled and a notice explains why.

### Your ID card

Every member gets an identity card in the trust's design: emblem and trust name across the
top, your photograph, your name, father's name, designation, mobile number, address, blood
group, date of birth, gender and age, with the organisation's phone and email at the bottom.

- Press **Download your ID card** on the success screen. The link works for one hour and is
  tied to your registration — it stops working if your phone number is corrected.
- If you registered without a photo, the card prints "No photo" in its place.
- Members registered before the photo field existed print em dashes for the fields they never
  supplied. Their cards remain valid.
- Lost the link? The trust can print a fresh copy from your registration number at any time.

---

## 9. Blood help

**/blood-help** is the fastest way to ask for emergency blood. This is the most important
form on the site.

**In a real emergency, telephone the nearest blood bank or hospital as well.** Do not wait for
an online response.

### Before you start

Have the patient's details ready: blood group, hospital name, and the doctor's advice on how
many units are needed.

### The form

| Field | Required | Rules |
| --- | --- | --- |
| Requester Name | Yes | 2–120 characters |
| Mobile Number | Yes | 10 digits, starting with 6–9 |
| Blood Group | Yes | A+, A−, B+, B−, AB+, AB−, O+, O− |
| Units Required | Yes | 1 to 50 (whole units). Defaults to 1 |
| Hospital Name | Yes | 2–160 characters |
| Hospital Location | No | Ward, street or landmark |
| District | Yes | Chosen from the list |
| Area / Mandal / City | No | Appears only after you pick a district |
| Required Date | No | Today or later. Leave blank if needed immediately |
| Message | No | Up to 1000 characters — ward, floor, contact person |

**The district → area link matters.** Pick a district and the area list narrows to that
district. Choosing the correct area routes your request straight to the volunteer who covers
it, which is the difference between a fast and a slow response.

### After you submit

A panel appears with your reference number, formatted like **BH000123**. Write it down. The
message differs slightly:

- *"the district volunteer has been notified"* — a volunteer covers your area.
- *"Our central team has been informed and will contact you shortly"* — no volunteer is
  configured for your area, so head office is handling it.
- *"Please call the blood helpline so we can act quickly"* — the request was saved but the
  automatic alert did not go out. **Please telephone.**

An amber box reminds you to contact the nearest blood bank in an emergency. Use **Submit
another request** to file a second request (for a different patient, say).

Limit: **5 requests per hour** from the same device.

### What happens next

A volunteer receives your request by email and WhatsApp and works through these stages:
**New → Contacted → In progress → Resolved → Closed.** You will not see these statuses
anywhere on the website — the reference number is your only handle, so quote it if you call.

### Donor roll

**/blood-donate** is the opposite direction: instead of asking for blood, you offer it.

| Field | Required | Rules |
| --- | --- | --- |
| Full Name | Yes | 2–120 characters |
| Father's Name | No | |
| Date of Birth | No | |
| Gender | No | Defaults to "Prefer not to say" |
| Blood Group | Yes | A+, A-, B+, B-, AB+, AB-, O+, O-, or **I Don't Know**. Donors who choose this stay on the roll and are listed for follow-up testing |
| Last Donation Date | No | Cannot be in the future |
| Country | Yes | Defaults to India, drives the dialling code |
| State | No | Defaults to Telangana |
| City / District | No | |
| Area / Locality | No | |
| Address | No | Up to 400 characters |
| Mobile Number | Yes | 10 digits starting with 6–9, with the country's code |
| Email Address | No | |
| Preferred Contact | No | Phone call, WhatsApp message or Email |
| Availability | No | Free text, e.g. "weekends, evenings" |

Press **I am willing to donate**. A green panel confirms you are on the roll — and that is
all that happens. Nothing is scheduled. When a patient nearby needs your group, a volunteer
calls you directly.

If you have registered before with the same mobile number, your record is **updated** rather
than duplicated, so the dashboard never double counts you.

Limit: **5 donor registrations per day** from the same device.

---

## 10. Photo booth

**/photo-booth** lets visitors pose together and download a framed photo. Free, no account.

### Step 1 — Choose a frame

Four templates are available:

| Template | Photos | Size |
| --- | --- | --- |
| Four Photo Collage *(marked "Popular")* | 3 | Portrait |
| Photo Strip | 3 | Tall |
| Classic Circle | 1 | Square |
| Twin Collage | 2 | Portrait |

> The template named "Four Photo Collage" actually has three windows — one wide photo with two
> below. Administrators can rename it.

**Choosing a different template clears any photos you have already added.**

### Step 2 — Add photos

Click **Add photo** in a window and pick a file from your device (JPG, PNG, WebP or AVIF).
The button becomes **Replace** once a photo is in. Empty windows show a dashed gold outline.

### Step 3 — Adjust the fit

Controls appear for whichever window you have selected:

| Control | What it does |
| --- | --- |
| Drag | Move the photo inside its frame |
| Zoom slider | 100% to 300%, in 2% steps. The mouse wheel and pinch gestures also zoom |
| Rotate slider | −180° to +180°, in 1° steps |
| Rotate 90° | Quick quarter turn |
| Reset | Back to the original position, size and angle |
| Remove | Clear the window |

A line under the controls reads *"Photo size 1200×900px · fits at 140%"*, telling you how
much the photo is scaled.

### Keyboard controls

Click the canvas once to focus it, then:

| Key | Action |
| --- | --- |
| Arrow keys | Nudge the photo 6 pixels |
| Shift + arrows | Nudge 20 pixels |
| `+` or `=` | Zoom in |
| `-` | Zoom out |
| `R` | Rotate 90° |

### Step 4 — Download or share

Press **Download photo** (top right of the canvas). On a phone you may get a share sheet with
WhatsApp, Bluetooth and email; dismiss it and the image downloads anyway. On a computer it
saves as `tsss-photo-booth-<frame>.png` at full resolution — the same picture you previewed.

### Privacy

**Your photos never leave your device.** They are processed entirely inside your browser.
Nothing is uploaded to our servers, and no copy is kept. Clearing the page deletes them.

---

# Part 2 — For administrators

## 11. Signing in

Go to **`/admin/login`**. Enter the email address and password a Super Admin gave you.

- Any page under `/admin` redirects here when you are signed out, and returns you afterwards.
- A wrong email or password gives the same message either way, for safety.
- After **10 failed attempts in 15 minutes** the form locks, for both your device and your
  account. Signing in successfully clears the count.
- The header shows your email and role, with **Password**, **View site** and **Sign out**.

### Forgotten password

Press **Forgot your password?** on the sign-in screen, enter your email address and the reset
link arrives by email. The link works once and expires after an hour.

> **The reset email needs the trust's SMTP to be working.** If Supabase's built-in email
> service is disabled on the project, no mail is sent. Contact the Super Admin, who can reset
> a password from the Supabase dashboard.

### Changing your password

Press **Password** in the admin header (or go to `/admin/password`). You need your current
password, then choose a new one of at least 8 characters and confirm it.

> **Change the temporary password you were given at the start.** It was shared in plain text
> and has never been rotated. Anyone holding it can act as you until you do.

If you are locked out entirely, a Super Admin can issue a new login from
[Team & Roles](#23-team-and-roles).

---

## 12. Roles and permissions

Four roles, each unlocking everything below it:

| Role | Can do |
| --- | --- |
| **Blood Help Manager** | Blood requests, districts, areas, administrators, notification logs |
| **Content Manager** | Everything above, plus website content, events, donations, media, photo booth, blogs and registrations |
| **Admin** | Everything above, plus organisation and contact settings |
| **Super Admin** | Everything, plus Team & Roles and the Audit Log |

### Who can reach what

| Section | Blood Help Mgr | Content Mgr | Admin | Super Admin |
| --- | :-: | :-: | :-: | :-: |
| Dashboard | ✔ | ✔ | ✔ | ✔ |
| Banner, Homepage & About content | | ✔ | ✔ | ✔ |
| Events, Categories, Galleries | | ✔ | ✔ | ✔ |
| Donation information | | ✔ | ✔ | ✔ |
| YouTube, News, Photo Booth | | ✔ | ✔ | ✔ |
| Blog queues | | ✔ | ✔ | ✔ |
| Registered Members, Export | | ✔ | ✔ | ✔ |
| Blood Help (all four pages) | ✔ | ✔ | ✔ | ✔ |
| Organisation & Contact settings | | | ✔ | ✔ |
| Team & Roles | | | | ✔ |
| Audit Log | | | | ✔ |

Sections a role cannot reach are hidden from the menu. Permissions are enforced by the
**database**, not just the interface — hiding a menu item is a convenience, not the security
boundary.

---

## 13. Dashboard

**/admin** is a read-only overview. Nothing here changes data.

- **Nine counters**, each a link: Total Members, New (30 days), Total Events, Upcoming Events,
  Pending Blogs, Blood Requests, Open Blood Requests, Published Media, Active Banners.
- **Bar chart** — new registrations over the last 30 days (the most recent 14 days are plotted).
- **Quick actions** — six shortcuts: create an event, review pending blogs, update the banner,
  edit donation details, manage districts and administrators, search members.
- **Two tables** — the six most recent registrations and the six most recent blood requests.
  Unassigned blood requests carry an amber **Unassigned** pill.

---

## 14. Website content

### Banner — `/admin/banner`

The banner is the strip at the top of every page. **Only one banner is used at a time** —
saving always updates the existing one rather than creating a second.

The top of the page shows the current status, its date window (blank dates mean "always"), and
buttons to **Enable** or **Disable** it.

| Field | Required | Notes |
| --- | --- | --- |
| Banner message | Yes | Full width. The text visitors see |
| Banner type | Yes | Information (blue), Success (green), Warning (amber), Urgent (red) |
| Show this banner | No | Checkbox. Combine with the date window |
| Link URL | No | e.g. `/events/devotional-events` |
| Link label | No | Defaults to "Learn more" |
| Start date & time | No | Banner hidden before this moment |
| End date & time | No | Banner hidden after this moment |

> **To retire a banner permanently, untick "Show this banner" and save.** Disabling leaves the
> text in place so you can switch it back on.

### Homepage content — `/admin/content`

Five blocks of homepage text, each listed with its key, a preview and the date it was last
changed: `home_intro`, `blogs_intro`, `home_helping_hands`, `home_blood_cta`,
`home_register_cta`.

Each card has **Publish** / **Unpublish** and **Delete**.

The single form below does double duty: type an existing key to update that block, or a new key
to create one. `about_intro` and `about_leadership` also work here but have dedicated forms on
the next page.

| Field | Notes |
| --- | --- |
| Key | Required. The identifier — see the list above |
| Title | Heading text |
| Subtitle | Secondary line |
| Body | Main text, blank lines become paragraphs |
| Meta (JSON) | Optional. `{"members":[{"name":"…","role":"…"}]}` |
| Published | Checkbox |

**Meta** must be valid JSON — for example `{"members":[{"name":"S. Reddy","role":"President"}]}`.
Leave it blank for `{}`.

### About content — `/admin/content/about`

Two fixed forms, one per section:

- **About introduction** (`about_intro`) — title, subtitle, body. Published by default.
- **Leadership / trust members** (`about_leadership`) — same fields, plus a JSON `Meta` field.
  Use `{"members":[{"name":"…","role":"…"}, …]}` to build the leadership list. The About page
  shows "Leadership details coming soon" when this is empty.

---

## 15. Events

### Categories — `/admin/events/categories`

Ordered by display order; new categories are appended.

| Field | Required | Notes |
| --- | --- | --- |
| Name | Yes | Shown to visitors |
| Slug | No | Auto-generated if blank, e.g. `helping-hands` |
| Description | No | Full width |
| Cover image | No | JPG/PNG/WebP/AVIF, up to 4 MB |
| Display order | No | Lower numbers appear first |
| Active | No | Untick to hide without deleting |

Actions per row: **Edit**, **Activate/Deactivate**, **Delete**.

> **Before deleting a category, move its events elsewhere** — the confirmation warns about
> this. Deactivating is safer: the category disappears from the site but nothing is lost.

### Events — `/admin/events`

The busiest page. Newest events first, up to 200.

**Finding an event**

- **Search** matches the title, location or slug.
- **Drafts** and **Published** buttons filter by status.
- **Reset** clears both.

**Columns**: Event (title and slug), Category, Date, Location, Featured, Status, Actions.

**Actions**: **Edit**, **Gallery** (jumps to that event's photos), **View** (only for published
events), **Delete** (asks you to confirm).

Buttons in the table toggle **Featured** and **Published** without opening the event.

**New event** — press **New event**. Defaults: today's date, unpublished, not featured, first
active category. If no active category exists you are sent to create one.

| Field | Required | Notes |
| --- | --- | --- |
| Category | Yes | Dropdown |
| Title | Yes | Full width |
| Slug | No | Auto-generated |
| Event date | Yes | The day of the programme |
| End date | No | For multi-day events |
| Location | No | Venue or "Online" |
| Summary | No | Full width. **Truncated to 600 characters** — this is the card text |
| Content | No | Full description, blank lines become paragraphs |
| Cover image | No | The card and page banner |
| YouTube URL | No | Accepts a normal watch link |
| External links | No | One URL per line |
| Featured | No | Adds a "Featured" badge |
| Published | No | Untick to keep as a draft |

Slugs must be unique; duplicates get `-1`, `-2` and so on automatically.

### Galleries — `/admin/events/galleries`

Photos attached to an event, shown in the event's gallery grid.

1. Pick an event from the chips at the top. **Only the first 12 events are listed** — for
   anything else, use the **Gallery** button on the events page.
2. Existing images appear in a grid with caption and order. Each has **Delete**.
3. Use the form to add one:

| Field | Required | Notes |
| --- | --- | --- |
| Event | Yes | Which event these photos belong to |
| Image | Yes | JPG/PNG/WebP/AVIF, up to 4 MB |
| Caption | No | Shown under the photo |
| Display order | No | Lower numbers first |

---

## 16. Donations

**/admin/donations** is a single settings page — there is one donation record, not a list.

| Field | Notes |
| --- | --- |
| Account name | As printed on the passbook |
| Bank name | |
| Account number | Shown in monospace so it can be read aloud |
| IFSC | |
| Branch | |
| UPI ID | Enables the UPI block and deep-link button |
| QR code | Image. Shown at 224px on the page |
| Instructions | Full width. One step per line; leading numbers are stripped automatically |
| Transparency note | Full width. The "no mandatory fee" statement |
| Accepting donations | Untick to show "Currently closed" |

Only fields you fill in appear on the public page. A green reminder on this page asks you to
keep the transparency note explaining that donations are always voluntary.

---

## 17. Media

Both pages work the same way; they are split by type.

### YouTube — `/admin/media/youtube`

| Field | Required | Notes |
| --- | --- | --- |
| Type | Yes | Fixed to "YouTube video" |
| Title | Yes | Full width |
| URL | Yes | Full width. A watch, `youtu.be` or embed link all work |
| Thumbnail | No | Used on the news layout |
| Media organisation | No | Channel name |
| Publication date | No | Defaults to today |
| Description | No | Full width |
| Display order | No | Lower first |
| Published | No | Untick to hide |

### News articles — `/admin/media/news`

Identical, with Type fixed to "News / press article" and the columns labelled Article and
Publication.

New items are created **unpublished** — review before publishing.

---

## 18. Blogs

**/admin/blogs/new**, `/pending`, `/approved`, `/rejected` — one page serves the queues. Each
shows up to 100 articles, newest first.

### Writing a post

Press **New post** (in the menu or on any queue page). The author fields default to you; replace
them with a guest author when publishing on somebody else's behalf. Saving as **Approved**
publishes immediately; the other statuses behave exactly like reviewed submissions.

> A fourth queue, **unpublished** (approved but hidden), exists at
> `/admin/blogs/unpublished` but is not in the menu. You can reach it by URL or from a
> published article's row.

**Actions per row**

| Action | When it appears |
| --- | --- |
| **Review** | Always — opens the article |
| **Approve** | Anything not already approved. Publishes publicly |
| **Unpublish** | Approved articles only. Hides without rejecting |
| **Reject** | Anything not already rejected |
| **View** | Approved articles only. Opens the public page |
| **Delete** | Always, with confirmation |

> There is no button to return a rejected article to pending. To reconsider one, use
> **Review**, set Status to "Pending review", and save.

**Reviewing an article** opens a two-column panel: the author's details and the submitted text
on the left (read-only), and an editable form on the right.

| Field | Required | Notes |
| --- | --- | --- |
| Title | Yes | Full width |
| Slug | No | Auto-generated, always made unique |
| Category | Yes | Free text |
| Featured image | No | Replaces the submitted image if you upload a new one |
| Excerpt | No | **Truncated to 400 characters.** Leave blank to derive it automatically |
| Content | Yes | Full width. HTML is sanitised on save |
| Featured | No | Featured badge on the blogs page |
| Status | Yes | Pending review / Approved (public) / Rejected / Approved but unpublished |
| Review note | No | Internal only. Never shown publicly |

Author name, email and mobile are editable — they default to the submission but can be
corrected.

Press **Close** to collapse the panel, or **Review "…" again** to reopen it.

---

## 19. Registrations

**/admin/registrations** is the member list. **Members cannot be created or deleted here** —
they exist only by public registration.

### Finding members

- **Search** covers registration number, name, father's name, village, mobile and email.
- **Status** — All / Active / Disabled.
- **Gender, blood group, state, country** — dropdowns. A mistyped value in the address bar is
  treated as unset rather than emptying the list.
- **Blood donated** — All / Donated / Never donated, matched against the donation records.
- **Date ranges** — born after/before, and registered after/before.
- **Sort** — click the Registration No., Full Name, Date of Birth, Village or Registered column
  headers to sort; click again to reverse. Changing filters resets to page 1.
- **Pages** — 25 per page by default.
- **Reset** clears every filter at once.

Every filter works alone and in combination, and the same query drives the list, the count
and the export — what is listed is what downloads.

**Columns**: Registration No., Full Name, Date of Birth, Village, Mobile, Registered, Status,
Actions.

**Actions**: **View** opens the member's record. **Disable** / **Activate** toggles their
status — a disabled member stays on the list but is excluded from the "Registered Members"
counter on the home page and from most queries. Disabling is the right tool for a duplicate or
fraudulent record; **deliberately do not delete member records**, since registration numbers
must never be reused.

### Viewing a member

The panel shows the registration number, timestamps, normalised mobile, country, state and
status, alongside an editable form covering every profile field: name, father's name, gender,
blood group, date of birth, village, state and country codes, dialling code, mobile, email,
designation, profile photo, status and internal notes.

A **Download ID card** button renders the member's card from their current details — reissue
whenever required, and it always reflects the latest edit.

A note on the page is worth reading: **registration numbers come from a database sequence and
can never be reused or edited**, and the database prevents two members sharing a name and date
of birth. If you change a name or date of birth into a conflict, the save is rejected.

### Export — `/admin/registrations/export`

Produces a CSV of members. It inherits **every** filter from the address you arrive on, so
filter on the Registrations page first, then use its **Export CSV** link — the file matches
the list.

The page reports how many records match, offers **Download CSV**, shows the first ten rows in a
preview table, and prints the first 2000 characters of the raw file.

**The CSV has fourteen columns:**

`registration_number`, `full_name`, `father_name`, `date_of_birth`, `gender`, `blood_group`,
`village`, `state_code`, `country_code`, `mobile_number`, `email`, `designation`, `status`,
`registered_at`

Notes: dates of birth are `YYYY-MM-DD`; registration timestamps look like
`04/10/2026, 14:32`. **Internal notes are not exported.** Exports are capped at 10,000 rows.

### Bulk ID cards — `/admin/registrations/id-cards`

Downloads a ZIP of identity cards for every member matching the current filters — one PNG per
member named by registration number, plus a README describing the contents.

Only 25 cards fit in one file (rendering is the bottleneck), so a larger selection asks you to
narrow the filters and download each slice separately. The button on the member list carries
your filters across.

---

## 20. Blood help

### Requests — `/admin/blood-help/requests`

**Finding a request**

- **Status chips** — All, New, Contacted, In progress, Resolved, Closed.
- **Search** matches reference number, requester name, hospital or mobile.

Each request is a **card**, not a table row:

- Reference number, status badge, blood group, units, and an amber **Unassigned** pill if no
  volunteer covers the area.
- Requester name and mobile; hospital name and location.
- Area, district, required date (or "ASAP") and when it was submitted.
- The requester's message.
- **Assigned to** — the responsible volunteer, or "Central team".

**Updating a request** — expand **Update status / assignment** and edit:

| Field | Notes |
| --- | --- |
| Status | New / Contacted / In progress / Resolved / Closed |
| Assigned administrator | Any configured volunteer |
| Resolution note | Internal. What was arranged, who donated |

Any status can be set from any other; nothing forces you through the order. Changing the status
**does not notify anyone** — if a volunteer needs to know, call them.

The requester's own details cannot be edited. If they were entered wrongly, ask for a new
request or correct it in the database.

The footer reports how many districts are configured and links to Administrators and
Notification logs.

### Districts and areas — `/admin/blood-help/districts`

Two sets of records on one page. **Only active districts and areas appear on the public blood
help form**, so an un-ticked box immediately removes an option from visitors.

**Districts** — name, slug (auto), display order, active.

**Areas** — district, name, slug (auto), display order, active.

Deleting a district **also deletes its areas**. Deactivate instead wherever possible.

### Administrators — `/admin/blood-help/administrators`

These are **volunteer contact records, not panel logins**. They decide who gets notified.

| Field | Required | Notes |
| --- | --- | --- |
| Administrator name | Yes | |
| Email | No | Receives email alerts. Without it, no email alert |
| WhatsApp number | No | **Include the country code**, e.g. `919876543210` |
| Phone number | No | |
| District | No | |
| Area | No | **Leave blank to cover the whole district** |
| Active | No | Untick to stop routing to them |

The Coverage column shows "Area (District)", "All of District", or "Unassigned".

### How routing works

When a request arrives:

1. The volunteer whose **area** matches exactly is notified.
2. Failing that, the volunteer whose **district** matches and who covers the whole district.
3. Failing that, the request is flagged **Unassigned** and the central admin email/WhatsApp
   receive it instead.

An amber box on the page restates this order. **Configuring volunteers is what makes the blood
help form work** — an unassigned request means a human had to notice it on the dashboard.

### Notification logs — `/admin/blood-help/notifications`

Every alert attempt, newest first, up to 200.

- **Filters**: All / Sent / Failed / Skipped.
- **Columns**: Request, channel (email or WhatsApp), recipient, status with any error message,
  provider, and when it was sent.

A **Retry** button appears on any non-sent row, which re-sends that alert. Use it after fixing
a provider key.

If a channel is switched off in settings, its attempts are logged as **Skipped** with provider
`disabled` — that is normal, not an error.

> **Test notification buttons on the Settings page are restricted to Super Admins.** An Admin
> will see the buttons but get a permission error. Ask a Super Admin to test.

## 20A. Blood donation

Separate from emergency Blood Help above: this module tracks **willing donors** and
**planned donations** — camps, regular donors and scheduled needs. It sends no automatic
notifications. When a matching request arrives, a volunteer calls the donor.

### Dashboard — `/admin/blood-donation`

Eight counters: registered donors, blood donations, units donated, blood requests, fulfilled
requests, pending requests, units requested, units fulfilled. All respect the area selection.

Below them, a **by blood group** table (donors, donations, units, requests per group) and an
**area table with drill-down**: states first, then cities within a state, then areas within a
city. Every number derives live from the donation records, so imported camps appear
immediately.

### Donors — `/admin/blood-donation/donors`

Everyone on the roll, whether they signed up at `/blood-donate` or an administrator added
them for a walk-in or phone registration.

- **Filters**: free text (name, mobile, city, area), blood group, willingness.
- **Actions**: **Edit**, **Mark willing / unwilling**, **Delete** (with confirmation).
- The add/edit form covers every donor field. A mobile number already on the roll updates the
  existing record instead of creating a duplicate.
- Donors who ask to be removed should be marked unwilling rather than deleted, so their past
  donations stay on the dashboard.

### Requests — `/admin/blood-donation/requests`

Planned, non-emergency requests with their own lifecycle: **Pending → In Progress →
Fulfilled**, plus **Cancelled**. Status chips filter the list; each card shows the reference
number (`BDR000001` and on), patient, hospital, contact, required date and units.

- **Update status** expands inline for quick status and fulfilled-unit changes.
- **Edit details** opens the full form. New requests get their number automatically.
- Quick buttons move a request forward one step. Changing status notifies nobody — call the
  people involved.

### Camps — `/admin/blood-donation/camps`

Where and when group donations happened. Each camp links straight to the import page with
itself preselected. Deleting a camp keeps its donation records — they become standalone.

### Bulk import — `/admin/blood-donation/import`

Records a whole camp at once from a spreadsheet:

1. **Download template** for the exact columns. Working in Excel? *Save As → CSV* — the
   importer reads CSV only.
2. Fill it in. Dates are `YYYY-MM-DD`; blood groups are the eight clinical values. Give every
   row its own reference so re-uploads are recognised.
3. Pick the camp (or leave it unset for standalone donations) and **Validate file**. Nothing is
   written yet.
4. Review every row: **Ready**, **Already recorded**, or the specific problem with its line
   number. Fix the file for problem rows.
5. **Import** writes only the valid new rows. Duplicates and error rows are skipped and
   listed afterwards, with counts.

Donors are matched by mobile number — an existing donor is linked (and their last donation
date moved forward), a new number creates a donor marked willing. Every import is itself
written to the audit log. Files are capped at 2 MB / 2000 rows; split larger camps.

---

## 21. Photo booth

**/admin/photo-booth** manages the frames visitors use. Three sections.

### Templates

| Column | Notes |
| --- | --- |
| Template | Thumbnail, name and slug |
| Canvas | Pixel size |
| Featured | Marks the template shown on the home page |
| Status | Active or not |
| Actions | Photo windows, Edit, Activate/Deactivate, Delete |

**Open public page** at the top previews what visitors see.

### Adding a template

| Field | Required | Notes |
| --- | --- | --- |
| Name | Yes | |
| Slug | No | Auto-generated |
| Description | No | |
| Frame image | **Yes** | **Transparent PNG** |
| Preview image | No | Shown in the list. Defaults to the frame |
| Width | Yes | 320–4000. **Must match the PNG's width** |
| Height | Yes | 320–4000. **Must match the PNG's height** |
| Display order | No | Lower first |
| Featured | No | Only one is featured at a time in practice |
| Available to visitors | No | Untick to hide without deleting |

**Designing a frame** — the page prints this guide, and it matters:

1. Design at the exact size you will enter, e.g. 1080×1350, and export a **transparent PNG**.
2. **Erase the areas where the photos should appear.** Transparent areas become the windows.
3. Upload it, set width and height to match, then position the windows in the editor.
4. Add a preview image (the frame with sample photos) so the list looks inviting.

A frame with no erased areas will produce a solid image with no photo visible.

### Editing photo windows

Press **Photo windows** on a template. The visual editor shows the real frame at full size with
every window drawn on top; the selected one is solid gold, the others dashed blue.

| Action | How |
| --- | --- |
| Move a window | Drag it |
| Resize a window | **Shift** + drag |
| Add a window | Click empty canvas, or the **Add window** button |
| Select a window | Click it, or click its row in the list |
| Delete a window | **Remove**, with it selected |
| Fine-tune | Type exact X, Y, Width, Height, Corner radius and Rotation |

**Shape** offers Rectangle or Circle. Choosing Circle sets the corner radius to half the
smaller side automatically; switching back resets an oversized radius.

**Save photo windows** replaces the layout completely — up to **12 windows** per template. A
window that extends past the frame is rejected with a message naming it. Save is
all-or-nothing, so you cannot half-apply a layout.

---

## 22. Settings

**/admin/settings** (Admin and Super Admin only) is a single form driving the trust's identity
across the whole site.

**General**

| Field | Required | Notes |
| --- | --- | --- |
| Organization name | Yes | Site title, header, footer, emails |
| Short name | Yes | Shown under the logo, e.g. TSSS |
| Tagline | No | |
| About short | No | The paragraph in the footer |
| Mission | No | About page and home page |
| Vision | No | About page |
| Contact email | No | Footer and About page |
| Contact phone | No | Shown as a tap-to-call link |
| Contact address | No | |
| WhatsApp number | No | Tap-to-chat link |
| YouTube URL | No | Enables the subscribe button |
| Facebook URL | No | |
| Instagram URL | No | |
| Twitter / X URL | No | |
| Map embed URL | No | |

**Forms**

| Field | Notes |
| --- | --- |
| Registration form open | Untick to pause registrations. Visitors see a notice instead |
| Blood help form open | Untick to pause blood requests. The form is disabled |
| Registration paused message | Optional custom wording |
| Blood help paused message | Optional custom wording |

**Notifications**

| Field | Notes |
| --- | --- |
| Central admin email | Receives **unassigned** blood requests |
| Email notifications enabled | Off means email alerts are logged as "Skipped" |
| WhatsApp notifications enabled | Off means WhatsApp alerts are logged as "Skipped" |

**Email and WhatsApp provider credentials** — this section lists the environment variable names
to set on the server, and states plainly that these keys are never stored in the database or
exposed to the browser:

```
EMAIL_PROVIDER_API_KEY
EMAIL_FROM
EMAIL_API_URL=https://api.resend.com/emails
WHATSAPP_PROVIDER_API_KEY
WHATSAPP_SENDER_NUMBER
CENTRAL_ADMIN_EMAIL
CENTRAL_ADMIN_WHATSAPP
```

**Without these keys the system runs in console mode**: notifications are written to the
server log instead of being delivered. Nothing breaks, but nobody receives anything.

---

## 23. Team and roles

**/admin/users** (Super Admin only) lists every administrator: email, name, role, join date and
status.

**Creating an administrator**

1. Fill the form: **email** (required), **full name**, **role**, **temporary password** (at least
   8 characters) and **active**.
2. Press the create button.
3. A confirmation tells you the login was created. **Share the temporary password securely** —
   in person or by a channel you already trust, never by SMS to an unverified number and never
   in a group chat.
4. Ask them to change it after signing in.

The email is confirmed automatically, so the person never clicks a verification link. New
accounts default to Content Manager if you do not pick a role.

**Deactivating** someone immediately revokes their access on their next request — their session
is checked against the profile every time, so there is no waiting for a token to expire. Your
own row shows **"(you)"** and hides the deactivate and delete buttons, so you cannot lock
yourself out.

**Deleting** removes them immediately; the confirmation warns about this.

**Helping someone who is locked out.** Ask them to use **Forgot your password?** on the sign-in
screen — the reset link goes straight to them and they can set a new password without you.
If email is not working on the project, you will have to reset it in the Supabase dashboard.

> **Changing an existing person's role is not possible in this panel.** The page says so. Either
> deactivate and re-add them with the correct role, or update the row in the Supabase dashboard.

> **The very first Supabase account created is automatically Super Admin.** Every account
> created after that defaults to Content Manager. If you ever let strangers sign up through
> Supabase, review this page.

---

## 24. Audit log

**/admin/audit-log** (Super Admin only) records who changed what, newest first, 50 per page.

**Columns**: When · Administrator · Action · Entity · Record · Change.

Expand **View values** on any row to see the previous and new values as JSON — the fastest way
to see exactly what a previous administrator altered.

**What is recorded**: every create, update and delete in the panel, plus banner
enable/disable, blog approvals, event publishing and featuring, member activation and
disabling, photo-booth window changes, notification retries and bulk donation imports
(`bulk_import`). Public registrations, blog submissions, blood requests and donor
registrations are recorded too, from the database side.

**Authentication events** appear with the entity `admin_auth`:

| Action | Meaning |
| --- | --- |
| `sign_in` | Successful sign-in, with the role in the detail |
| `sign_in_failed` | Wrong email or password |
| `sign_out` | Signed out |
| `access_denied` | Blocked by the rate limiter, or no active administrator profile |
| `password_reset_requested` | Reset link emailed |
| `password_changed` | Password changed, by reset or voluntarily |

Passwords and tokens are never stored in the log — only the event name, the address and a
fixed reason.

> The page supports `?entity=<table>` and `?page=<n>` in the URL, but there is no filter form.
> Filters are URL-only. To see only authentication events, visit
> `/admin/audit-log?entity=admin_auth`.

---

## Recent sign-in attempts

Failed sign-in attempts are also stored in the `admin_login_attempts` table (identifier,
email, timestamp, IP and user agent) and drive the lockout. They are readable with SQL:

```sql
select email, succeeded, ip, created_at
  from public.admin_login_attempts
 order by created_at desc
 limit 50;
```

Clear a lockout without waiting 15 minutes:

```sql
select public.clear_rate_limit('admin-login:ip:<address>');
select public.clear_login_failures('admin-login:account:<email>');
```

---

# Part 3 — Reference

## 25. Limits and quotas

**Visitor form limits**

| Form | Limit |
| --- | --- |
| Registration | 8 attempts per hour per device |
| Blood help | 5 requests per hour per device |
| Donor registration | 5 per day per device |
| Blog submission | 3 per day per device |
| Contact form | No application-side limit (FormSubmit applies its own) |
| Admin sign-in | 10 failures per 15 minutes, per device **and** per account |

**Field limits**

| Field | Maximum |
| --- | --- |
| Name | 120 characters |
| Village | 120 characters |
| Mobile number | 10 digits, starting 6–9 |
| Blood units per request | 50 |
| Donation units per record | 10 |
| Blog title | 200 characters |
| Blog content | No practical limit; excerpt capped at 400 characters |
| Contact message | 4,000 characters |
| Blood request message | 1,000 characters |
| Donor address | 400 characters |
| Donor availability note | 200 characters |
| Event summary | 600 characters (truncated silently) |
| Any admin text field | 5,000 characters |

**Image uploads** — JPG, PNG, WebP or AVIF, **4 MB maximum**, applied to every image field in
the admin panel and the blog submission form. Uploading is **additive**: leave the file box
empty to keep the current image. **There is no way to delete or remove an image from a record**
— upload a replacement instead.

**Record caps**

| List | Maximum shown |
| --- | --- |
| Events | 200 |
| Media items | 100 per type |
| Blog queue | 100 per queue |
| Blood requests | 200 |
| Donors, donation requests, camps | 200 per list |
| Notification logs | 200 |
| Registrations export | 10,000 rows |
| Bulk ID cards | 25 cards per ZIP file |
| Import file | 2 MB / 2000 rows per upload |
| Audit log | 50 per page (unlimited total) |
| Gallery event shortcuts | First 12 events |
| Photo booth windows | 12 per template |

**There are no bulk or multi-select operations anywhere, except the donation import and the
bulk ID card download.** Everything else is handled one record at a time.

---

## 26. Troubleshooting

### A visitor reports…

| Problem | What to tell them |
| --- | --- |
| "Registration says I'm already registered" | A member with the same name and date of birth exists. Check the member list; if it is a duplicate, disable the old record |
| "My registration number is lost" | Numbers cannot be looked up or reissued from the website. Find them in the member list by name and date of birth |
| "I submitted a blog and cannot see it" | It is waiting for review. Check the Pending queue |
| "My blood request shows nothing" | There is no public tracking page. Quote the reference number when you call |
| "My ID card link expired" | Links last one hour. The trust can reissue a card from the registration number at any time |
| "The contact form says sent but nobody replied" | Check the trust inbox, and confirm the FormSubmit activation email was accepted the first time |
| "The photo booth will not download" | Mobile browsers sometimes open the share sheet instead. Dismiss it and the file saves. Try a desktop browser |
| "A page shows a broken image" | The photograph may not have uploaded. An administrator can re-upload it |

### An administrator reports…

| Problem | Cause and fix |
| --- | --- |
| Login says "does not have administrator access" | Signed in fine, but no active profile. A Super Admin must add them in Team & Roles |
| Login says "Invalid email or password" | Check for a typo. After 10 failures in 15 minutes the form locks, for your device and your account |
| Login says "Too many failed attempts" | Wait 15 minutes, or ask a Super Admin to clear it. Signing in successfully also resets the count |
| No reset email arrives | Supabase's built-in email service may be disabled on the project, or the address is not an administrator. The form always says "if that address belongs to an administrator" |
| Reset link says "no longer valid" | Links expire after one hour and work once. Request a new one |
| A menu item is missing | Expected — your role is below that section's requirement |
| A save does nothing, no message | Your role is too low for that record, or the session expired. Sign in again; if it persists, ask a Super Admin |
| "The window extends beyond the frame" | A photo-booth window reaches past the canvas. Drag or resize it inside, then save |
| Blog has no "unpublish" option | Only approved articles can be unpublished |
| No "return to pending" button | Not provided. Use **Review**, set Status to Pending, save |
| Cannot change someone's role | Not supported in the panel — deactivate and re-add, or use Supabase |
| Cannot reset a password for someone | Use **Forgot your password?** on the sign-in screen and send them the link |
| Blood request shows "Unassigned" | No active volunteer covers that area. Add one under Administrators |
| Import says "header is missing" | The first row must match the template exactly. Re-download it and paste data under it |
| Import shows "Already recorded" for everything | That exact file (or those references) was already imported. Change the references for genuinely new donations |
| Dashboard numbers look wrong after import | Check the import result: error rows are skipped, not written. Fix and re-upload those rows; duplicates stay skipped |
| Notifications all show "Skipped" | The channel is switched off in Settings, or the provider keys are missing. Both are logged, not delivered |
| Cannot delete a category | Move its events first — or deactivate the category instead |
| Cannot delete a member | Deliberate. Members come from public registration. Disable duplicates instead |

---

## 27. Known gaps

Worth knowing so nobody is surprised:

- **Password reset depends on working email.** If Supabase's SMTP is disabled on the project,
  no reset link is sent and a Super Admin must reset from the dashboard.
- **Roles cannot be changed in the panel.**
- **Email and WhatsApp notifications are not yet configured**, so alerts are logged as
  "Skipped" rather than delivered. Configure the provider keys on the server to switch them on.
- **Still no bulk actions for blogs, events or galleries** — approving fifty blogs means fifty
  clicks. Bulk import exists only for donations; bulk download only for ID cards.
- **Images cannot be deleted** from a record once uploaded.
- **Lists are capped** (see [Limits](#25-limits-and-quotas)); beyond the cap, older records are
  simply not listed.
- **The blood help form has no public status tracking.** Reference numbers are the only handle.
- **Notification test buttons are Super Admin only**, though the buttons render for Admins.
- **The template named "Four Photo Collage" has three photo windows.** Rename it if that
  bothers visitors.
- **A fourth blog queue, "unpublished", is missing from the menu.** Reach it at
  `/admin/blogs/unpublished`.
- **Two-factor authentication is not enabled**, so an administrator account is protected by
  its password alone.
- **The importer reads CSV only.** Excel files must be saved as CSV first.
- **All user-facing dates render DD/MM/YYYY**, but the browser's own date picker follows the
  visitor's locale and cannot be forced from the site.
- **Two-factor authentication is not enabled**, so an administrator account is protected by
  its password alone.