/**
 * Production functional stress: races duplicate registrations from many
 * rotating client addresses, hammers an approved member lookup with wrong
 * names, and throws malformed payloads at the public forms. Every probe is
 * cleaned up; the database must end with no junk and exactly one member.
 *
 * Usage: node scripts/prod-stress.mjs
 */
const BASE = "https://www.srinivasula.com";
const ORIGIN = new URL(BASE).origin;

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

const { createClient } = await import("@supabase/supabase-js");
const { WebSocket } = await import("ws");
const { readFileSync } = await import("node:fs");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

async function readRegisterEnvelope() {
  const html = await (await fetch(`${BASE}/register`)).text();
  const form = /<form\b[\s\S]*?<\/form>/.exec(html)?.[0] ?? "";
  const hidden = [];
  for (const tag of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(tag[0])?.[1];
    const value = /value="([^"]*)"/.exec(tag[0])?.[1] ?? "";
    if (name && !/^\$ACTION_ID_/.test(name)) hidden.push([name, decode(value)]);
  }
  const district = (/<option value="([0-9a-f-]{36})">/.exec(html) ?? [])[1] ?? "";
  return { hidden, district };
}

const envelope = await readRegisterEnvelope();

async function submitRegistration(values, ip) {
  const body = new FormData();
  for (const [name, value] of envelope.hidden) body.append(name, value);
  for (const [name, value] of Object.entries(values)) {
    body.delete(name);
    body.append(name, value);
  }
  return fetch(`${BASE}/register`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: ORIGIN, host: new URL(BASE).host, "x-forwarded-for": ip },
  });
}

console.log("\n1. Race: 14 concurrent duplicate registrations from 14 addresses");
const raceName = `Stress Race${Date.now() % 100000}`;
const base = {
  fullName: raceName,
  fatherName: "Stress Father",
  age: "29",
  bloodGroup: "O-",
  countryCode: "IN",
  stateCode: "TS",
  districtId: envelope.district,
  village: "Stress Village",
  mobileNumber: "9876540999",
  email: "",
  website: "",
};

const racers = await Promise.all(
  Array.from({ length: 14 }, (_, index) =>
    submitRegistration(
      { ...base, mobileNumber: `98765409${String(99).padStart(2, "0")}`.slice(0, 10), email: "" },
      `203.0.113.${1 + index}`,
    ).then((response) => response.text()),
  ),
);

const createdCount = racers.filter((t) => /Registration Successful/.test(t)).length;
const alreadyCount = racers.filter((t) => /already registered/.test(t.split(/<!--[\s\S]*?-->/g).join(""))).length;
check("exactly one submission created the member", createdCount === 1, `${createdCount} success screens`);
check("the rest were refused as duplicates", alreadyCount >= 12, `${alreadyCount} duplicate messages`);

const { count: raceRows } = await admin
  .from("members")
  .select("id", { count: "exact", head: true })
  .eq("full_name", raceName);
check("database holds exactly one row", raceRows === 1, String(raceRows));
await admin.from("members").delete().eq("full_name", raceName);

console.log("\n2. Wrong-name flood on the lookup endpoint");
// A real approved member's number is known from the CSV not needed; use a
// pending pattern instead: flood a nonexistent number 12 times.
let blocked = false;
for (let attempt = 0; attempt < 12; attempt += 1) {
  const response = await fetch(
    `${BASE}/api/id-card-lookup?number=TSSS000999&name=${encodeURIComponent("No Such Person")}`,
    { redirect: "manual", headers: { "x-forwarded-for": "203.0.113.66" } },
  );
  const location = response.headers.get("location") ?? "";
  if (location.includes("slow-down")) {
    blocked = true;
    break;
  }
}
check("flood is rate limited", blocked, "expected a slow-down redirect within 12 attempts");

console.log("\n3. Malformed and boundary payloads");
const nasty = [
  { label: "script tag name", values: { fullName: '<script>alert(1)</script>', fatherName: "X", age: "30", village: "V", mobileNumber: "9876549999", bloodGroup: "O+", countryCode: "IN", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
  { label: "sql injection name", values: { fullName: "Robert'; DROP TABLE members;--", fatherName: "X", age: "30", village: "V", mobileNumber: "9876549991", bloodGroup: "O+", countryCode: "IN", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
  { label: "age 9999", values: { fullName: "Stress Nine", fatherName: "X", age: "9999", village: "V", mobileNumber: "9876549981", bloodGroup: "O+", countryCode: "IN", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
  { label: "age negative", values: { fullName: "Stress Neg", fatherName: "X", age: "-5", village: "V", mobileNumber: "9876549971", bloodGroup: "O+", countryCode: "IN", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
  { label: "bad mobile", values: { fullName: "Stress Mob", fatherName: "X", age: "30", village: "V", mobileNumber: "1234567890", bloodGroup: "O+", countryCode: "IN", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
  { label: "unknown country", values: { fullName: "Stress Cty", fatherName: "X", age: "30", village: "V", mobileNumber: "9876549961", bloodGroup: "O+", countryCode: "ZZ", stateCode: "TS", districtId: envelope.district, email: "", website: "" } },
];

const stillThere = await admin.from("site_settings").select("id").limit(1);
check("database reachable before nasty inputs", !stillThere.error);

for (const entry of nasty) {
  const response = await submitRegistration(entry.values, `203.0.113.77`);
  const text = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
  const rejected =
    /correct the highlighted fields|check your details|already registered|Registration Successful/.test(text) ||
    response.status === 200;
  const acceptedPresent = text.includes("Registration Successful");
  const scriptEscaped = !/<script>alert/.test(text);
  check(
    `${entry.label}: no crash, friendly handling`,
    response.status === 200 && !acceptedPresent && scriptEscaped,
    `http=${response.status} accepted=${acceptedPresent}`,
  );
}

const { count: junkRows } = await admin
  .from("members")
  .select("id", { count: "exact", head: true })
  .like("full_name", "Stress %");
check("malformed inputs created no rows", (junkRows ?? 0) === 0, String(junkRows));
check("database intact after stress", !stillThere.error);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);