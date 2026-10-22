/**
 * Read-only production admin check: sign in, load every dashboard section,
 * confirm data renders — no saves, deletes or toggles.
 *
 * Usage: node scripts/prod-admin-check.mjs <email> <password>
 */
const BASE = "https://www.srinivasula.com";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/prod-admin-check.mjs <email> <password>");
  process.exit(1);
}

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

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const loginHtml = await (await fetch(`${BASE}/admin/login`, { headers: { origin: ORIGIN } })).text();
const loginBody = new FormData();
for (const match of loginHtml.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = /name="([^"]+)"/.exec(match[0])?.[1];
  const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
  if (name) loginBody.append(name, decode(value));
}
loginBody.set("email", email);
loginBody.set("password", password);
loginBody.set("next", "/admin");

const loginResponse = await fetch(`${BASE}/admin/login`, {
  method: "POST",
  body: loginBody,
  redirect: "manual",
  headers: { origin: ORIGIN, host: new URL(BASE).host },
});
const cookie = (loginResponse.headers.getSetCookie?.() ?? [])
  .map((entry) => entry.split(";")[0])
  .join("; ");
check("admin signs in", Boolean(cookie), String(loginResponse.status));

const pages = [
  ["/admin", "Total Members"],
  ["/admin/registrations", "Registered members"],
  ["/admin/registrations/export", "record(s) ready to export"],
  ["/admin/registrations/id-cards", "Bulk identity cards"],
  ["/admin/events", "Events"],
  ["/admin/events/categories", "Categories"],
  ["/admin/events/galleries", "Galleries"],
  ["/admin/donations", "Donation"],
  ["/admin/media/youtube", "YouTube"],
  ["/admin/media/news", "News"],
  ["/admin/blogs/pending", "Blogs"],
  ["/admin/blogs/approved", "Blogs"],
  ["/admin/blood-help/requests", "Blood donation requests"],
  ["/admin/blood-help/districts", "Districts"],
  ["/admin/blood-help/administrators", "Blood donation administrators"],
  ["/admin/blood-help/notifications", "Notification"],
  ["/admin/blood-donation", "Blood donation dashboard"],
  ["/admin/blood-donation/donors", "Blood donors"],
  ["/admin/blood-donation/requests", "Donation requests"],
  ["/admin/blood-donation/camps", "Donation camps"],
  ["/admin/blood-donation/import", "Import donations"],
  ["/admin/settings", "Settings"],
  ["/admin/users", "Team"],
];

for (const [path, needle] of pages) {
  const response = await fetch(`${BASE}${path}`, { headers: { cookie } });
  const body = await response.text();
  check(`${path} loads`, response.status === 200, String(response.status));
  check(`${path} shows content`, body.toLowerCase().includes(needle.toLowerCase()), needle);
}

console.log("\nCSV export");
const csv = await (await fetch(`${BASE}/api/admin/export/registrations`, { headers: { cookie } })).text();
check("export returns CSV with headers", csv.startsWith("registration_number,"), csv.slice(0, 60));
check("export includes real rows", csv.split("\n").length > 2, `${csv.split("\n").length} lines`);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);