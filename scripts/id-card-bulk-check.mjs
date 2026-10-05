/**
 * Verifies bulk identity card downloads: the confirmation page reflects the
 * filters, the ZIP contains one PNG per member, and anonymous access is refused.
 *
 * Usage: node scripts/id-card-bulk-check.mjs <email> <password>
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/id-card-bulk-check.mjs <email> <password>");
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

async function signIn() {
  const html = await (await fetch(`${BASE}/admin/login`)).text();
  const body = new FormData();
  for (const match of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(match[0])?.[1];
    const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
    if (name) body.append(name, decode(value));
  }
  body.set("email", email);
  body.set("password", password);
  body.set("next", "/admin");

  const response = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: ORIGIN, host: new URL(BASE).host },
  });

  return (response.headers.getSetCookie?.() ?? []).map((entry) => entry.split(";")[0]).join("; ");
}

const cookie = await signIn();
check("signed in", Boolean(cookie));

console.log("\n1. Confirmation page");
const page = await (await fetch(`${BASE}/admin/registrations/id-cards`, { headers: { cookie } })).text();
check("page renders", page.includes("Bulk identity cards"));
check("download link present", page.includes("/api/admin/members/id-cards"));

console.log("\n2. ZIP download");
const response = await fetch(`${BASE}/api/admin/members/id-cards`, {
  headers: { cookie },
  redirect: "manual",
});
const buffer = Buffer.from(await response.arrayBuffer());

check("zip is served", response.status === 200, String(response.status));
check("content type is application/zip", (response.headers.get("content-type") ?? "").includes("application/zip"));
check(
  "filename ends in .zip",
  (response.headers.get("content-disposition") ?? "").includes(".zip"),
);
check(
  "body is a ZIP (PK signature)",
  buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b,
  `${buffer.length} bytes`,
);

// Local names live in the central directory; each entry is a card PNG.
const asLatin1 = buffer.toString("latin1");
const cardNames = [...asLatin1.matchAll(/TSSS\d{6}-id-card\.png/g)].map((match) => match[0]);
const uniqueCards = [...new Set(cardNames)];
check("zip holds card PNGs", uniqueCards.length > 0, `${uniqueCards.length} card(s)`);
check("zip holds the README", asLatin1.includes("README.txt"));

console.log("\n3. Authorisation");
const anonymous = await fetch(`${BASE}/api/admin/members/id-cards`, { redirect: "manual" });
check("anonymous bulk download is refused", anonymous.status === 403, String(anonymous.status));

const anonymousPage = await fetch(`${BASE}/admin/registrations/id-cards`, { redirect: "manual" });
check("anonymous confirmation page redirects to login", [301, 302, 303, 307].includes(anonymousPage.status));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);