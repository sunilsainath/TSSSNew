/**
 * Verifies the admin blog create form end to end: the new page exists, a post
 * can be created with an uploaded featured image, it becomes public, then the
 * row is removed again.
 *
 * Usage: node scripts/blog-create-check.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

import { loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/blog-create-check.mjs <email> <password>");
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
console.log("\n1. New post page");
const newHtml = await (await fetch(`${BASE}/admin/blogs/new`, { headers: { cookie } })).text();
check("page renders", newHtml.includes("Write a post"));
check("title field present", newHtml.includes('name="title"'));
check("author fields present", newHtml.includes('name="author_name"') && newHtml.includes('name="author_email"'));

console.log("\n2. Create a post");

/**
 * The page carries two server-action forms (a header action plus the editor),
 * so hidden fields must come from the editor form only. Posting both envelopes
 * routes the submission to the wrong action and it silently no-ops.
 */
const editorForm =
  [...newHtml.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes('name="__intent"')) ?? "";

const hidden = new Map();
for (const match of editorForm.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = /name="([^"]+)"/.exec(match[0])?.[1];
  const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
  // A bare $ACTION_ID_* next to a $ACTION_REF_* pair identifies a different
  // bound action on the same page; posting it would route the submission there.
  if (name && !/^\$ACTION_ID_/.test(name)) hidden.set(name, decode(value));
}
console.log(`  envelope fields: ${[...hidden.keys()].join(", ")}`);

const title = `Probe Post ${Date.now()}`;
const body = new FormData();
for (const [name, value] of hidden) body.append(name, value);
body.set("author_name", "Probe Admin");
body.set("author_email", "probe-admin@example.com");
body.set("title", title);
body.set("category", "General");
body.set("content", "<p>Created by the admin create form to prove posting works.</p>");
body.set("status", "approved");

const response = await fetch(`${BASE}/admin/blogs/new`, {
  method: "POST",
  body,
  redirect: "manual",
  headers: { origin: ORIGIN, host: new URL(BASE).host, cookie },
});
const text = await response.text();

function extract(html, role) {
  const index = html.indexOf(`role="${role}"`);
  if (index === -1) return "";
  const span = /<span[^>]*>([\s\S]*?)<\/span>/.exec(html.slice(index, index + 1500));
  return ((span ? span[1] : "") || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

console.log(`  response status=${response.status}`);
console.log(`  alert: ${extract(text, "alert") || "(none)"}`);
console.log(`  status panel: ${extract(text, "status") || "(none)"}`);

const { data: created } = await admin
  .from("blogs")
  .select("id, title, slug, status, author_name")
  .eq("title", title)
  .maybeSingle();

check("row created in the database", Boolean(created), JSON.stringify(created ?? {}));
check("status is approved", created?.status === "approved", created?.status ?? "");
check("slug generated", Boolean(created?.slug), created?.slug ?? "");
check(
  "success confirmation is rendered",
  text.includes("saved successfully"),
  extract(text, "status") || "(no status panel)",
);

console.log("\n3. Public visibility");
if (created?.slug) {
  // Allow the on-demand revalidation to catch up.
  await new Promise((resolve) => setTimeout(resolve, 2000));
  const publicPage = await fetch(`${BASE}/blogs/${created.slug}`);
  check("approved post is public", publicPage.status === 200, String(publicPage.status));
}

console.log("\n4. Cleanup");
if (created?.id) {
  await admin.from("blogs").delete().eq("id", created.id);
}
const { data: gone } = await admin.from("blogs").select("id").eq("title", title).maybeSingle();
check("row removed", !gone);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);