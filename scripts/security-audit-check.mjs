/**
 * Verifies the audit fixes end to end:
 *  - a script wearing image/png is rejected by the gallery upload
 *  - a genuine PNG still uploads
 *  - clientIdentifier prefers x-real-ip and takes the last X-Forwarded-For
 *    entry, so a spoofed leftmost address buys nothing
 *  - createUserAccount rejects an unknown role
 *
 * Usage: node scripts/security-audit-check.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

import { loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/security-audit-check.mjs <email> <password>");
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

const cookie = await signIn();
check("signed in", Boolean(cookie));

const { data: event } = await admin
  .from("events")
  .select("id")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

console.log("\n1. Disguised upload is rejected");
const galleryHtml = await (
  await fetch(`${BASE}/admin/events/galleries?event=${event.id}`, { headers: { cookie } })
).text();
const form =
  [...galleryHtml.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('name="__intent"')) ?? "";

const fields = new Map();
for (const match of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = /name="([^"]+)"/.exec(match[0])?.[1];
  const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
  if (name && !/^\$ACTION_ID_/.test(name)) fields.set(name, decode(value));
}

async function uploadGallery(file, filename) {
  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  body.delete("event_id");
  body.append("event_id", event.id);
  body.delete("caption");
  body.append("caption", "Security probe");
  body.delete("image_url");
  body.append("image_url", "");
  body.delete("display_order");
  body.append("display_order", "1");
  body.append("image_urlFile", file, filename);

  const response = await fetch(`${BASE}/admin/events/galleries`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: ORIGIN, host: new URL(BASE).host, cookie },
  });
  const text = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
  return text;
}

// A PHP shell wearing a PNG name and MIME type.
const shellText = await postShell();
check("shell upload refused", /not a valid image|do not match|only JPG/i.test(shellText));

const { data: shellRows } = await admin
  .from("event_gallery")
  .select("id")
  .eq("event_id", event.id)
  .eq("caption", "Security probe");
check("shell left no row behind", (shellRows ?? []).length === 0);
for (const row of shellRows ?? []) {
  await admin.from("event_gallery").delete().eq("id", row.id);
}

async function postShell() {
  const malicious = `<?php system($_GET["cmd"]); ?>\n${"A".repeat(200)}`;
  return uploadGallery(new Blob([malicious], { type: "image/png" }), "shell.png");
}

console.log("\n2. Genuine upload still works");
const { readFile } = await import("node:fs/promises");
const { default: path } = await import("node:path");
const realPng = await readFile(path.join(process.cwd(), "public", "brand", "tsss-emblem.png"));
const genuine = await uploadGallery(new Blob([realPng], { type: "image/png" }), "genuine.png");
check("real PNG accepted", !/not a valid image|do not match|only JPG/i.test(genuine));

const { data: genuineRows } = await admin
  .from("event_gallery")
  .select("id, image_url")
  .eq("event_id", event.id)
  .eq("caption", "Security probe");
check("genuine row stored with a storage URL", (genuineRows ?? []).length === 1);
for (const row of genuineRows ?? []) {
  await admin.from("event_gallery").delete().eq("id", row.id);
  const urlPath = new URL(row.image_url).pathname.split("/public-media/")[1];
  if (urlPath) await admin.storage.from("public-media").remove([urlPath]);
}

console.log("\n3. Privilege hardening on account creation");
const usersHtml = await (await fetch(`${BASE}/admin/users`, { headers: { cookie } })).text();
const userForm =
  [...usersHtml.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('name="__intent"')) ?? "";

const userFields = new Map();
for (const match of userForm.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = /name="([^"]+)"/.exec(match[0])?.[1];
  const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
  if (name && !/^\$ACTION_ID_/.test(name)) userFields.set(name, decode(value));
}

async function createAccount(role) {
  const body = new FormData();
  for (const [name, value] of userFields) body.append(name, value);
  body.delete("email");
  body.append("email", `probe-${Date.now()}@example.com`);
  body.delete("password");
  body.append("password", "ProbePass123");
  body.delete("role");
  body.append("role", role);

  const response = await fetch(`${BASE}/admin/users`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: { origin: ORIGIN, host: new URL(BASE).host, cookie },
  });
  return (await response.text()).replace(/<!--[\s\S]*?-->/g, "");
}

const bogus = await createAccount("super_duper_admin");
check(
  "unknown role rejected with a field error",
  /valid role/i.test(bogus),
  bogus.slice(bogus.indexOf("role"), bogus.indexOf("role") + 120),
);

console.log("\n4. Rate limiter identity cannot be steered from the left");
// The unit behaviour is asserted without HTTP: first entry must not win.
const { default: ts } = await import("typescript");
const { readFile: readFs } = await import("node:fs/promises");
const { default: nodePath } = await import("node:path");
const { pathToFileURL } = await import("node:url");
const { mkdtemp, writeFile } = await import("node:fs/promises");

const root = nodePath.resolve(process.cwd());
const rlSource = await readFs(nodePath.join(root, "src", "lib", "security", "rate-limit.ts"), "utf8");
const rlCompiled = ts.transpileModule(rlSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
});
const { mkdtemp: makeTemp } = await import("node:fs/promises");
const scratch = await makeTemp(nodePath.join(root, ".rl-check-"));
await writeFile(nodePath.join(scratch, "rate-limit.mjs"), rlCompiled.outputText);
const { clientIdentifier } = await import(pathToFileURL(nodePath.join(scratch, "rate-limit.mjs")).href);

const headersOf = (entries) => new Headers(entries);
check(
  "x-real-ip wins over everything",
  clientIdentifier(headersOf([["x-real-ip", "9.9.9.9"], ["x-forwarded-for", "1.2.3.4, 5.6.7.8"]])) === "9.9.9.9",
);
check(
  "rightmost forwarded entry used, not the spoofable leftmost",
  clientIdentifier(headersOf([["x-forwarded-for", "1.2.3.4, 5.6.7.8"]])) === "5.6.7.8",
);
check(
  "single entry still works",
  clientIdentifier(headersOf([["x-forwarded-for", "1.2.3.4"]])) === "1.2.3.4",
);
check(
  "no headers gives anonymous",
  clientIdentifier(headersOf([])) === "anonymous",
);

const { rm } = await import("node:fs/promises");
await rm(scratch, { recursive: true, force: true });

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);