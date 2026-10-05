/**
 * Verifies the bulk donation import: template download, validation preview
 * (valid, invalid and duplicate rows), confirm writes donors and donations,
 * re-upload dedupes, and the dashboard reflects the import.
 *
 * Usage: node scripts/donation-import-check.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

import { loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/donation-import-check.mjs <email> <password>");
  process.exit(1);
}

const env = loadEnvFile();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

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

/** Scoped to the form carrying the given marker hidden input. */
function scopedFields(html, marker) {
  const form =
    [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)]
      .map((match) => match[0])
      .find((candidate) => candidate.includes(`name="${marker}"`)) ?? "";

  const fields = new Map();
  for (const match of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(match[0])?.[1];
    const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
    if (name && !/^\$ACTION_ID_/.test(name)) fields.set(name, decode(value));
  }
  return fields;
}

async function postAction(route, fields, values) {
  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  for (const [name, value] of Object.entries(values)) {
    body.delete(name);
    if (value instanceof Blob) body.append(name, value, "upload.csv");
    else body.append(name, value);
  }

  const response = await fetch(`${BASE}${route}`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: ORIGIN, host: new URL(BASE).host, cookie },
  });
  return { status: response.status, text: await response.text() };
}

const cookie = await signIn();
check("signed in", Boolean(cookie));

console.log("\n1. Template");
const template = await (
  await fetch(`${BASE}/api/admin/blood-donation/template`, { headers: { cookie } })
).text();
check("template downloads as CSV", template.includes("full_name,") && template.includes("external_ref"));
check("template documents the blood groups", template.includes("O+ O- A+ A- B+ B- AB+ AB-"));

console.log("\n2. Validation preview");
const importHtml = await (await fetch(`${BASE}/admin/blood-donation/import`, { headers: { cookie } })).text();
check("import page renders", importHtml.includes("Import donations"));

const stamp = Date.now() % 100000;
const csv = [
  "full_name,father_name,mobile_number,phone_country_code,email,blood_group,date_of_birth,gender,city,area,address,last_donation_date,units,donation_date,external_ref",
  `Import Donor One${stamp},Father One,9000100011,91,,O+,1990-01-01,male,Karimnagar,Sriramapuram,,2024-06-01,1,2026-01-10,IMP-${stamp}-1`,
  `Import Donor Two${stamp},,9000100022,91,import-two@example.com,B-,1992-02-02,female,Hyderabad,Ameerpet,,2026-01-10,2,2026-01-10,IMP-${stamp}-2`,
  `Bad Row${stamp},,12345,91,,ZZ,,,,,,,,,`,
].join("\n");

const previewFields = scopedFields(importHtml, "file");
const preview = await postAction("/admin/blood-donation/import", previewFields, {
  campId: "",
  file: new Blob([csv], { type: "text/csv" }),
});

check("preview marks valid rows ready", preview.text.includes("Ready"));
check("preview flags the bad row", preview.text.includes("Mobile number must be 10 digits"));
check("preview flags the bad blood group", preview.text.includes("Blood group must be one of"));

console.log("\n3. Confirm writes donors and donations");
const confirmHtml = preview.text;
const confirmFields = scopedFields(confirmHtml, "rows");
check("confirm form carries the rows", confirmFields.has("rows"));

const confirm = await postAction("/admin/blood-donation/import", confirmFields, {});
// React inserts comment nodes between JSX text fragments, so strip them before
// matching sentences.
const confirmText = confirm.text.replace(/<!--[\s\S]*?-->/g, "");
check("import finishes", confirmText.includes("Import finished"));
check("two donations recorded", confirmText.includes("2 donation(s) recorded"));

const { data: donors } = await admin
  .from("donors")
  .select("id, full_name, blood_group")
  .like("full_name", `Import Donor%${stamp}`);
check("two donors created", (donors ?? []).length === 2, JSON.stringify(donors ?? []));

const { data: donations, count } = await admin
  .from("donations")
  .select("id", { count: "exact" })
  .in("donor_id", (donors ?? []).map((row) => row.id));
check("two donations stored", (count ?? 0) === 2, String(count ?? 0));

console.log("\n4. Re-upload dedupes");
const preview2 = await postAction("/admin/blood-donation/import", previewFields, {
  campId: "",
  file: new Blob([csv], { type: "text/csv" }),
});
check("re-upload recognises duplicates", preview2.text.includes("Already recorded"));

console.log("\n5. Dashboard reflects the import");
const dashboard = await (await fetch(`${BASE}/admin/blood-donation`, { headers: { cookie } })).text();
check("dashboard renders", dashboard.includes("Blood donation dashboard"));
check("dashboard shows the group table", dashboard.includes("B-"));

console.log("\n6. Cleanup");
for (const row of donations ?? []) {
  await admin.from("donations").delete().eq("id", row.id);
}
for (const row of donors ?? []) {
  await admin.from("donors").delete().eq("id", row.id);
}
const { count: remaining } = await admin
  .from("donors")
  .select("id", { count: "exact", head: true })
  .like("full_name", `Import Donor%${stamp}`);
check("test donors removed", (remaining ?? 0) === 0);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);