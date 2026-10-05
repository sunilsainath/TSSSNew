/**
 * Reproduces the three reported admin failures against a running server:
 * donation details, gallery image upload, and blog creation.
 *
 * Usage: node scripts/admin-error-repro.mjs <email> <password>
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

import { loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;

/** Next.js 16 rejects a forwarded Server Action POST with no matching Origin. */
const postHeaders = (cookie) => ({
  cookie,
  origin: ORIGIN,
  host: new URL(BASE).host,
});
const [email, password] = process.argv.slice(2);
const root = path.resolve(import.meta.dirname, "..");

if (!email || !password) {
  console.error("Usage: node scripts/admin-error-repro.mjs <email> <password>");
  process.exit(1);
}

const env = loadEnvFile();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

let cookie = "";

function stripHtml(value) {
  return value
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Pulls the human-visible text out of a role="alert"/role="status" block. */
function messageFrom(html, role) {
  const marker = `role="${role}"`;
  const index = html.indexOf(marker);
  if (index === -1) return "";

  const block = html.slice(index, index + 1200);
  const span = /<span[^>]*>([\s\S]*?)<\/span>/.exec(block);
  return stripHtml(span ? span[1] : block.replace(/<[^>]+>/g, " "));
}

function actionFields(html) {
  const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((match) => match[0]);
  const form = forms.find((candidate) => candidate.includes('name="__intent"')) ?? forms[0];
  if (!form) throw new Error("no form found");

  const fields = [];
  for (const tag of form.matchAll(/<input\b([^>]*)>/g)) {
    const [, attributes] = tag;
    const name = attributes.match(/name="([^"]+)"/)?.[1];
    if (!name || !/type="hidden"/.test(attributes)) continue;
    const value = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
    fields.push([name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
  }
  return fields;
}

async function act(route, values) {
  const html = await (await fetch(`${BASE}${route}`, { headers: { cookie } })).text();
  const fields = actionFields(html);

  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  for (const [name, value] of Object.entries(values)) {
    body.delete(name);
    body.append(name, value);
  }

  const response = await fetch(`${BASE}${route}`, {
    method: "POST",
    body,
    headers: postHeaders(cookie),
    redirect: "manual",
  });

  const text = await response.text();

  return {
    status: response.status,
    alert: messageFrom(text, "alert"),
    ok: messageFrom(text, "status"),
    body: text,
  };
}

console.log("Signing in…");
const loginHtml = await (await fetch(`${BASE}/admin/login`)).text();
const envelope = new Map();
for (const match of loginHtml.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
  const name = /name="([^"]+)"/.exec(match[0])?.[1];
  const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
  if (name) envelope.set(name, value.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
}

const loginBody = new FormData();
for (const [name, value] of envelope) loginBody.append(name, value);
loginBody.set("email", email);
loginBody.set("password", password);
loginBody.set("next", "/admin");

const loginResponse = await fetch(`${BASE}/admin/login`, {
  method: "POST",
  body: loginBody,
  headers: { origin: ORIGIN, host: new URL(BASE).host },
  redirect: "manual",
});
cookie = (loginResponse.headers.getSetCookie?.() ?? [])
  .map((entry) => entry.split(";")[0])
  .join("; ");

if (!cookie) {
  console.log("  FAIL  could not sign in");
  process.exit(1);
}
console.log("  PASS  signed in\n");

/* ------------------------------------------------------------------ */
console.log("A. Donation details");
const marker = `PROBE-${Date.now()}`;
const donation = await act("/admin/donations", {
  __entity: "donation_settings",
  __intent: "save",
  bank_name: marker,
  account_number: "1234567890",
  ifsc: "TEST0000123",
  is_donation_open: "on",
});
console.log(`  status=${donation.status}`);
console.log(`  alert="${donation.alert}"`);
console.log(`  message="${donation.ok}"`);

const { data: donationRow } = await admin
  .from("donation_settings")
  .select("bank_name, account_number, ifsc, is_donation_open")
  .limit(1)
  .maybeSingle();
console.log(`  stored=${JSON.stringify(donationRow)}`);
console.log(`  VERDICT: ${donationRow?.bank_name === marker ? "SAVED" : "NOT SAVED"}`);

/* ------------------------------------------------------------------ */
console.log("\nB. Gallery image upload (real file)");
const { data: event } = await admin
  .from("events")
  .select("id, title")
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (!event) {
  console.log("  SKIP  no event exists to attach a photo to");
} else {
  // A genuine PNG so the upload path is exercised, not just a URL string.
  const png = await readFile(
    path.join(root, "public", "images", "photobooth", "frame-circle.png"),
  );

  const galleryHtml = await (
    await fetch(`${BASE}/admin/events/galleries?event=${event.id}`, { headers: { cookie } })
  ).text();
  const galleryFields = actionFields(galleryHtml);
  console.log(`  form fields: ${galleryFields.map(([n]) => n).join(", ")}`);

  const body = new FormData();
  for (const [name, value] of galleryFields) body.append(name, value);
  body.delete("event_id");
  body.append("event_id", event.id);
  body.delete("caption");
  body.append("caption", "Repro upload");
  body.delete("image_url");
  body.append("image_url", "");
  const { count: existingCount } = await admin
    .from("event_gallery")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event.id);
  body.delete("display_order");
  body.append("display_order", String((existingCount ?? 0) + 1));
  body.append(
    "image_urlFile",
    new Blob([png], { type: "image/png" }),
    "repro-gallery.png",
  );

  const galleryResponse = await fetch(`${BASE}/admin/events/galleries`, {
    method: "POST",
    body,
    headers: postHeaders(cookie),
    redirect: "manual",
  });
  const galleryText = await galleryResponse.text();
  console.log(`  status=${galleryResponse.status}`);
  console.log(`  alert="${messageFrom(galleryText, "alert")}"`);
  console.log(`  message="${messageFrom(galleryText, "status")}"`);

  for (const needle of [
    "highlighted fields",
    "upload failed",
    "only JPG",
    "smaller than 4 MB",
    "is required",
    "Unknown form",
    "permission",
    "session expired",
    "already exists",
  ]) {
    if (galleryText.includes(needle)) console.log(`  contains: "${needle}"`);
  }

  const { data: galleryRows } = await admin
    .from("event_gallery")
    .select("id, image_url, caption, display_order")
    .eq("event_id", event.id)
    .eq("caption", "Repro upload");
  console.log(`  stored=${JSON.stringify(galleryRows)}`);
  console.log(`  VERDICT: ${galleryRows?.length ? "UPLOADED" : "NOT STORED"}`);

  if (galleryRows?.length) {
    await admin.from("event_gallery").delete().eq("id", galleryRows[0].id);
    console.log("  (cleaned up)");
  }
}

/* ------------------------------------------------------------------ */
console.log("\nC. Blog creation from the admin panel");
const blog = await act("/admin/blogs/approved", {
  __entity: "blog",
  __intent: "save",
  title: "Repro admin blog post",
  category: "General",
  content: "<p>This post was created from the admin panel to reproduce the reported error.</p>",
  status: "approved",
});
console.log(`  status=${blog.status}`);
console.log(`  alert="${blog.alert}"`);
console.log(`  message="${blog.ok}"`);
console.log(
  `  admin page exposes a create form? ${blog.body.includes('name="title"') && !blog.body.includes('name="__id"')}`,
);