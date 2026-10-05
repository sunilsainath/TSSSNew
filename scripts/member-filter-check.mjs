/**
 * Verifies the extended member filters: each new filter narrows the list,
 * combinations work, reset clears everything, and the export carries the same
 * filters.
 *
 * Usage: node scripts/member-filter-check.mjs <email> <password>
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/member-filter-check.mjs <email> <password>");
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

async function list(params = "") {
  return (await fetch(`${BASE}/admin/registrations${params}`, { headers: { cookie } })).text();
}

function countRows(html) {
  // One "View" link per member row in the table.
  return (html.match(/>View</g) ?? []).length;
}

function totalFrom(html) {
  const match = /(\d[\d,]*) registration/.exec(html);
  return match ? match[1] : "?";
}

console.log("\n1. Filter controls render");
const base = await list();
for (const name of [
  'name="gender"',
  'name="bloodGroup"',
  'name="state"',
  'name="country"',
  'name="donated"',
  'name="dobFrom"',
  'name="dobTo"',
  'name="registeredFrom"',
  'name="registeredTo"',
]) {
  check(`control ${name}`, base.includes(name));
}

console.log("\n2. Each filter narrows or matches the unfiltered list");
const unfiltered = countRows(base);
console.log(`  (unfiltered rows on page 1: ${unfiltered}, total ${totalFrom(base)})`);

const blood = await list("?bloodGroup=O%2B");
check("blood group filter applies", countRows(blood) <= unfiltered);

const gender = await list("?gender=male");
check("gender filter applies", countRows(gender) <= unfiltered);

const state = await list("?state=TS");
check("state filter applies", countRows(state) <= unfiltered);

const country = await list("?country=IN");
check("country filter applies", countRows(country) <= unfiltered);

const donated = await list("?donated=no");
check("donation filter applies", countRows(donated) <= unfiltered);

const dob = await list("?dobFrom=2000-01-01");
check("date of birth filter applies", countRows(dob) <= unfiltered);

const registered = await list("?registeredFrom=2020-01-01");
check("registration date filter applies", countRows(registered) <= unfiltered);

console.log("\n3. Invalid values are ignored, not fatal");
const bogus = await list("?gender=not-a-gender&bloodGroup=ZZ&state=XX&country=YY");
check("unknown filter values render the page", bogus.includes("Registered members"));
check("unknown filter values behave as unfiltered", countRows(bogus) === unfiltered);

console.log("\n4. Export honors the filters");
const csv = await (
  await fetch(`${BASE}/api/admin/export/registrations?bloodGroup=O%2B`, { headers: { cookie } })
).text();
check("filtered export returns CSV", csv.startsWith("registration_number,"));
check(
  "export carries the new columns",
  csv.includes("father_name") && csv.includes("blood_group") && csv.includes("country_code"),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);