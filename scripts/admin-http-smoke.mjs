/**
 * Authenticated HTTP smoke test: signs in as the admin and checks that every
 * admin page renders with a real session cookie.
 *
 * Usage: node scripts/admin-http-smoke.mjs <email> <password>
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const root = path.resolve(import.meta.dirname, "..");

const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const email = process.argv[2];
const password = process.argv[3];
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

if (!email || !password) {
  console.error("Usage: node scripts/admin-http-smoke.mjs <email> <password>");
  process.exit(1);
}

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

// 1. Sign in through Supabase Auth and reuse the session cookies.
const auth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

const { data: signIn, error: signInError } = await auth.auth.signInWithPassword({ email, password });
if (signInError || !signIn.session) {
  console.error("Sign in failed:", signInError?.message);
  process.exit(1);
}

const cookieHeader = [
  `${auth.storageKey}=${JSON.stringify({
    access_token: signIn.session.access_token,
    refresh_token: signIn.session.refresh_token,
    expires_at: signIn.session.expires_at,
  })}`,
  `${auth.storageKey}-refresh-token=${JSON.stringify(signIn.session.refresh_token)}`,
].join("; ");

async function get(path) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { cookie: cookieHeader },
  });
  return { status: response.status, location: response.headers.get("location"), body: await response.text() };
}

console.log("\n1. Admin shell");

const dashboard = await get("/admin");
check("dashboard renders", dashboard.status === 200, String(dashboard.status));
check("dashboard shows the signed-in email", dashboard.body.includes(email));
check("dashboard shows member statistics", dashboard.body.includes("Total Members"));
check("dashboard shows blood help statistics", dashboard.body.includes("Open Blood Requests"));
check("admin navigation is present", dashboard.body.includes("Registered Members"));

console.log("\n2. Admin sections");

const pages = [
  ["/admin/banner", "Website banner"],
  ["/admin/content", "Homepage content"],
  ["/admin/content/about", "About content"],
  ["/admin/events/categories", "Event categories"],
  ["/admin/events", "Events"],
  ["/admin/events/new", "Create event"],
  ["/admin/events/galleries", "Event galleries"],
  ["/admin/donations", "Donation information"],
  ["/admin/media/youtube", "YouTube videos"],
  ["/admin/media/news", "News &amp; media coverage"],
  ["/admin/blogs/pending", "Blogs"],
  ["/admin/blogs/approved", "Approved"],
  ["/admin/registrations", "Registered members"],
  ["/admin/registrations/export", "Export registrations"],
  ["/admin/blood-help/requests", "Blood help requests"],
  ["/admin/blood-help/districts", "Districts &amp; areas"],
  ["/admin/blood-help/administrators", "Blood help administrators"],
  ["/admin/blood-help/notifications", "Notification logs"],
  ["/admin/settings", "Organization &amp; contact settings"],
  ["/admin/users", "Team &amp; roles"],
  ["/admin/audit-log", "Audit log"],
];

for (const [path, expected] of pages) {
  const page = await get(path);
  check(`${path} renders`, page.status === 200, String(page.status));
  // React escapes `&` as `&amp;` in the served HTML.
  check(`${path} contains "${expected}"`, page.body.includes(expected));
}

console.log("\n3. CSV export");

const exportResponse = await fetch(
  `${BASE}/api/admin/export/registrations?search=&status=all`,
  { headers: { cookie: cookieHeader } },
);
const csv = await exportResponse.text();
check("export responds 200", exportResponse.status === 200, String(exportResponse.status));
check(
  "export returns a CSV attachment",
  (exportResponse.headers.get("content-disposition") ?? "").includes("attachment"),
);
check("export has CSV headers", csv.includes("registration_number"));

console.log("\n4. Public site with an admin session");

const publicPage = await get("/");
check("public home still renders", publicPage.status === 200);
check("public home has no admin chrome", !publicPage.body.includes("Admin panel"));

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
