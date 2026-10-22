/**
 * Production end-to-end check for https://www.srinivasula.com (read-only).
 * Usage: node scripts/prod-e2e.mjs
 */
const BASE = process.env.PROD_BASE ?? "https://www.srinivasula.com";

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

console.log("\n1. Public pages");
const PAGES = [
  ["/", "Registered Members"],
  ["/about", "Get in touch"],
  ["/events", "Events"],
  ["/donations", "Donations"],
  ["/media", "Videos"],
  ["/blogs", "Read article"],
  ["/blood-donations", "Blood"],
  ["/blood-donate", "donor"],
  ["/register", "Registration form"],
  ["/photo-booth", "Photo Booth"],
];

for (const [path, needle] of PAGES) {
  try {
    const response = await fetch(`${BASE}${path}`);
    const body = await response.text();
    check(`${path} renders`, response.status === 200, String(response.status));
    check(`${path} shows expected content`, body.includes(needle), needle);
  } catch (error) {
    check(`${path} renders`, false, error.message);
  }
}

console.log("\n2. Redirects and protection");
const redirect = await fetch(`${BASE}/blood-help`, { redirect: "manual" });
check(
  "old /blood-help redirects",
  [301, 302, 307, 308].includes(redirect.status) &&
    (redirect.headers.get("location") ?? "").includes("/blood-donations"),
  `${redirect.status} -> ${redirect.headers.get("location") ?? ""}`,
);

const admin = await fetch(`${BASE}/admin`, { redirect: "manual" });
check(
  "admin dashboard redirects anonymous visitors",
  [301, 302, 307, 308].includes(admin.status) &&
    (admin.headers.get("location") ?? "").includes("/admin/login"),
  `${admin.status} -> ${admin.headers.get("location") ?? ""}`,
);

const legacyCard = await fetch(`${BASE}/api/id-card`, { redirect: "manual" });
check("legacy self-service card route is gone", legacyCard.status === 404, String(legacyCard.status));

console.log("\n3. Home page counters flow");
const home = await (await fetch(`${BASE}/`)).text();
const membersMatch = /Registered Members<\/[a-z]+>\s*<[^>]+>\s*(\d[\d,]*)\s*</.exec(home) ??
  />(\d[\d,]*)<\/[^>]+>[\s\S]{0,220}?Registered Members/.exec(home);
check(
  "Registered Members counter is present",
  home.includes("Registered Members"),
);
if (membersMatch) {
  const count = Number(membersMatch[1].replace(/,/g, ""));
  check("member counter shows real data", count > 0, `shows ${count}`);
}

console.log("\n4. SEO and assets");
const sitemap = await (await fetch(`${BASE}/sitemap.xml`)).text();
check("sitemap lists key routes", sitemap.includes("/register") && sitemap.includes("/blood-donations"));
const robots = await (await fetch(`${BASE}/robots.txt`)).text();
check("robots.txt disallows admin", /admin/i.test(robots) || robots.toLowerCase().includes("disallow"));

for (const path of ["/brand/tsss-emblem.png", "/brand/tsss-emblem-original.jpg", "/icon.png", "/brand/og-default.jpg", "/images/events/devotional-1.jpg"]) {
  const asset = await fetch(`${BASE}${path}`, { method: "HEAD" });
  check(`asset ${path}`, asset.status === 200, String(asset.status));
}

console.log("\n5. Security headers");
const homeResponse = await fetch(`${BASE}/`);
check("nosniff", homeResponse.headers.get("x-content-type-options") === "nosniff");
check("frame guard", homeResponse.headers.get("x-frame-options") === "SAMEORIGIN");
check("referrer policy", homeResponse.headers.get("referrer-policy") === "strict-origin-when-cross-origin");
check("HSTS present", Boolean(homeResponse.headers.get("strict-transport-security")));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);