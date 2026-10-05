/**
 * Exercises the database-backed admin login lockout end to end.
 *
 * Sends real sign-in attempts at a running server and asserts that the durable
 * counter blocks the address, that a correct password is refused while blocked,
 * and that a successful sign-in clears the counter again.
 *
 * Usage: node scripts/login-lockout-check.mjs <email> <password>
 */
import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";
import pg from "pg";

import { connectionConfig, loadEnvFile } from "./db-config.mjs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/login-lockout-check.mjs <email> <password>");
  process.exit(1);
}

const env = loadEnvFile();
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

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

/**
 * Next.js renders a server action form as a multipart POST carrying
 * `$ACTION_REF_*`, `$ACTION_*:0` (the action id) and `$ACTION_KEY`. A plain
 * urlencoded POST is ignored, so replay the real envelope.
 */
async function loadActionEnvelope() {
  const html = await (await fetch(`${BASE}/admin/login`)).text();

  const fields = new Map();
  for (const match of html.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(match[0])?.[1];
    const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
    if (name) fields.set(name, value.replaceAll("&quot;", '"').replaceAll("&amp;", "&"));
  }

  if (![...fields.keys()].some((name) => name.startsWith("$ACTION_REF"))) {
    throw new Error("Could not find the server action envelope on /admin/login");
  }

  return fields;
}

let envelope = null;

async function attemptLogin(candidatePassword) {
  envelope ??= await loadActionEnvelope();

  const body = new FormData();
  for (const [name, value] of envelope) body.append(name, value);
  body.set("email", email);
  body.set("password", candidatePassword);
  body.set("next", "/admin");

  const response = await fetch(`${BASE}/admin/login`, {
    method: "POST",
    body,
    redirect: "manual",
    headers: {
      // A fixed identifier so the test controls which bucket it hits.
      "x-forwarded-for": "203.0.113.77",
      "user-agent": "login-lockout-check",
    },
  });

  const text = await response.text();

  return {
    status: response.status,
    location: response.headers.get("location"),
    signedIn: text.includes("Registered Members") || text.includes("Total Members"),
    saysInvalid: text.includes("Invalid email or password"),
    saysBlocked: text.includes("Too many failed attempts"),
  };
}

async function countFailures() {
  const sql = await connectionConfig(env);
  const client = new pg.Client(sql);
  await client.connect();
  try {
    const { rows } = await client.query(
      "select count(*)::int as count from public.admin_login_attempts where identifier like $1 and succeeded = false",
      [`%${email}%`],
    );
    return rows[0].count;
  } finally {
    await client.end();
  }
}

async function clearCounters() {
  await db.rpc("clear_rate_limit", { p_key: "admin-login:ip:203.0.113.77" });
  await db.rpc("clear_rate_limit", { p_key: `admin-login:account:${email}` });

  const client = new pg.Client(await connectionConfig(env));
  await client.connect();
  try {
    await client.query("delete from public.admin_login_attempts where email = $1", [email]);
  } finally {
    await client.end();
  }
}

console.log("1. Setup");
await clearCounters();
check("counters start empty", (await countFailures()) === 0);

console.log("\n2. Failed attempts are recorded");
const wrongPassword = `${password}-wrong`;
for (let attempt = 1; attempt <= 3; attempt += 1) {
  const result = await attemptLogin(wrongPassword);
  if (attempt === 1) check("a wrong password is rejected", result.saysInvalid);
}
const failures = await countFailures();
check("three failed attempts are stored", failures === 3, `saw ${failures}`);

console.log("\n3. Correct password still works below the limit");
const ok = await attemptLogin(password);
check("a correct password signs in", ok.signedIn || (ok.location ?? "").includes("/admin"), JSON.stringify(ok));
check("no failures recorded on success", (await countFailures()) === 0);

console.log("\n4. The lockout engages after 10 failures");
await clearCounters();
for (let attempt = 1; attempt <= 10; attempt += 1) {
  await attemptLogin(wrongPassword);
}
check("ten failures are stored", (await countFailures()) === 10);

const blocked = await attemptLogin(password);
check(
  "the correct password is refused while blocked",
  blocked.saysBlocked,
  `status=${blocked.status}`,
);

console.log("\n5. Cleanup");
await clearCounters();
check("counters cleared", (await countFailures()) === 0);

const final = await attemptLogin(password);
check(
  "sign-in works again after clearing",
  final.signedIn || (final.location ?? "").includes("/admin"),
  JSON.stringify(final),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);