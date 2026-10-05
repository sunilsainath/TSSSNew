/**
 * End-to-end check for identity card generation: the signed member link, the
 * admin download, and the fact that neither works without authorisation.
 *
 * Usage: node scripts/id-card-check.mjs <email> <password>
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

import { loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/id-card-check.mjs <email> <password>");
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

/** A valid PNG signature is enough; we are checking delivery, not pixels. */
function isPng(buffer) {
  return (
    buffer.length > 8 &&
    buffer[0] === 0x89 &&
    buffer.subarray(1, 4).toString("ascii") === "PNG"
  );
}

async function signIn() {
  const html = await (await fetch(`${BASE}/admin/login`)).text();
  const fields = new Map();

  for (const match of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(match[0])?.[1];
    const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
    if (name) fields.set(name, value.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  }

  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  body.set("email", email);
  body.set("password", password);
  body.set("next", "/admin");

  const response = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: new URL(BASE).origin, host: new URL(BASE).host },
  });

  return (response.headers.getSetCookie?.() ?? []).map((entry) => entry.split(";")[0]).join("; ");
}

console.log("Setup");
const { data: member } = await admin
  .from("members")
  .select("id, registration_number, mobile_number, full_name")
  .order("registration_number")
  .limit(1)
  .maybeSingle();

if (!member) {
  console.log("  SKIP  no member exists to render");
  process.exit(0);
}
check("a member is available", Boolean(member.id), member.registration_number);

const cookie = await signIn();
check("signed in", Boolean(cookie));

console.log("\n1. Admin download");
const adminResponse = await fetch(`${BASE}/api/admin/members/${member.id}/id-card`, {
  headers: { cookie },
  redirect: "manual",
});
const adminPng = Buffer.from(await adminResponse.arrayBuffer());

check("admin card is served", adminResponse.status === 200, String(adminResponse.status));
check("content type is image/png", adminResponse.headers.get("content-type") === "image/png");
check(
  "download filename carries the registration number",
  (adminResponse.headers.get("content-disposition") ?? "").includes(member.registration_number),
  adminResponse.headers.get("content-disposition") ?? "",
);
check("body is a PNG", isPng(adminPng), `${adminPng.length} bytes`);
check("card is 1000x1600", adminPng.readUInt32BE(16) === 1000 && adminPng.readUInt32BE(20) === 1600);

const outDir = path.join(process.cwd(), ".idcard-preview");
await writeFile(path.join(outDir, "04-real-member.png"), adminPng);
console.log(`  wrote .idcard-preview/04-real-member.png from the live record`);

console.log("\n2. Authorisation");
const anonymous = await fetch(`${BASE}/api/admin/members/${member.id}/id-card`, {
  redirect: "manual",
});
check("anonymous admin download is refused", anonymous.status === 403, String(anonymous.status));

const anonymousPublic = await fetch(
  `${BASE}/api/id-card?number=${member.registration_number}&token=nonsense`,
  { redirect: "manual" },
);
check(
  "a forged token is refused",
  anonymousPublic.status === 403,
  String(anonymousPublic.status),
);

const missingToken = await fetch(`${BASE}/api/id-card?number=${member.registration_number}`, {
  redirect: "manual",
});
check("a missing token is refused", missingToken.status === 400, String(missingToken.status));

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);