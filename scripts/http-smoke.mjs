/**
 * HTTP smoke test against a running dev server (default http://localhost:3000).
 *
 * Usage: node scripts/http-smoke.mjs
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function get(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual", ...options });
  const body = options.text === false ? "" : await response.text();
  return { status: response.status, location: response.headers.get("location"), body };
}

console.log("\n1. Public pages");

const home = await get("/");
check("home returns 200", home.status === 200, String(home.status));
check("home shows the organisation name", home.body.includes("Srinivasula Seva Samstha"));
check("home has the primary CTAs", ["Register Now", "Blood Help", "Donate"].every((label) => home.body.includes(label)));
check("home renders seeded events", home.body.includes("Upcoming programmes") || home.body.includes("Kalyanotsavam"));
check("home shows live impact statistics", home.body.includes("Registered Members"));
check("home includes the blood help CTA", home.body.includes("Need Blood Help?"));

for (const [path, expected] of [
  ["/about", "About the trust"],
  ["/events", "Events"],
  ["/events/devotional-events", "Devotional Events"],
  ["/donations", "voluntary"],
  ["/media", "Media"],
  ["/blogs", "Blogs"],
  ["/register", "Register with TSSS"],
  ["/blood-help", "Need Blood Help?"],
  ["/photo-booth", "TSSS Photo Booth"],
]) {
  const page = await get(path);
  check(`${path} returns 200`, page.status === 200, String(page.status));
  check(`${path} contains "${expected}"`, page.body.includes(expected));
}

console.log("\n2. Event and blog detail pages");

const events = await get("/events");
const eventSlug = events.body.match(/\/events\/[a-z0-9-]+\/([a-z0-9-]+)"/)?.[1];
if (eventSlug) {
  const detail = await get(`/events/devotional-events/${eventSlug}`);
  check("event detail renders", detail.status === 200, String(detail.status));
  check("event detail has structured data", detail.body.includes('"@type":"Event"'));
} else {
  check("event detail link found in listing", false);
}

const blogs = await get("/blogs");
const blogSlug = blogs.body.match(/\/blogs\/([a-z0-9-]+)"/)?.[1];
if (blogSlug) {
  const post = await get(`/blogs/${blogSlug}`);
  check("blog detail renders", post.status === 200, String(post.status));
  check("blog detail has structured data", post.body.includes('"@type":"BlogPosting"'));
} else {
  check("blog detail link found in listing", false);
}

console.log("\n3. Photo Booth");

const booth = await get("/photo-booth");
check("photo booth lists a template", /\/images\/photobooth\/frame-[\w-]+\.png/.test(booth.body));
check("photo booth explains privacy", booth.body.includes("never uploaded") || booth.body.includes("never leave your device"));
check("photo booth has the studio canvas", booth.body.includes("<canvas"));

const api = await get("/api/photo-booth/templates/four-photo-collage");
check("template API returns JSON", api.status === 200, String(api.status));
let apiData = {};
try {
  apiData = JSON.parse(api.body);
} catch {
  check("template API returns valid JSON", false);
}
check("template API includes the frame image", typeof apiData?.template?.frame_image === "string");
check("template API includes the photo windows", Array.isArray(apiData?.slots) && apiData.slots.length === 3, JSON.stringify(apiData?.slots?.length));

const missingTemplate = await get("/api/photo-booth/templates/does-not-exist");
check("unknown template returns 404", missingTemplate.status === 404, String(missingTemplate.status));

const sitemapForBooth = await get("/sitemap.xml");
check(
  "sitemap includes the photo booth",
  sitemapForBooth.body.includes("/photo-booth"),
);

console.log("\n4. SEO");

const robots = await get("/robots.txt", { text: false });
check("robots.txt is served", robots.status === 200, String(robots.status));

const sitemap = await get("/sitemap.xml");
check("sitemap is served", sitemap.status === 200, String(sitemap.status));
check("sitemap lists public routes", sitemap.body.includes("/register") && sitemap.body.includes("/blood-help"));

const head = home.body.slice(0, 4000);
check("page has an Open Graph title", head.includes('property="og:title"') || home.body.includes('property="og:title"'));
check("page has Twitter card metadata", home.body.includes('name="twitter:card"'));
check("page has a canonical link", home.body.includes('rel="canonical"'));

console.log("\n4. Admin protection");

const admin = await get("/admin");
check("/admin redirects anonymous visitors to login", admin.status === 307 || admin.status === 302, String(admin.status));
check("redirect target is the login page", (admin.location ?? "").includes("/admin/login"), admin.location ?? "");

const login = await get("/admin/login");
check("login page renders", login.status === 200, String(login.status));
check("login page has the password field", login.body.includes('name="password"'));

for (const path of [
  "/admin/registrations",
  "/admin/events",
  "/admin/blogs/pending",
  "/admin/blood-help/requests",
  "/admin/settings",
  "/admin/audit-log",
  "/api/admin/export/registrations",
]) {
  const page = await get(path, { text: false });
  check(
    `${path} is protected`,
    page.status === 307 || page.status === 302 || page.status === 401 || page.status === 403,
    String(page.status),
  );
}

console.log("\n5. Error handling");

const missing = await get("/this-page-does-not-exist");
check("unknown page returns 404", missing.status === 404, String(missing.status));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
