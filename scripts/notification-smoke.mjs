/** Verifies the notification providers end-to-end through the admin API route. */
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

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/notification-smoke.mjs <admin email> <password>");
  process.exit(1);
}

const auth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

const { data, error } = await auth.auth.signInWithPassword({ email, password });
if (error || !data.session) {
  console.error("sign in failed:", error?.message);
  process.exit(1);
}

const cookie = `${auth.storageKey}=${JSON.stringify({
  access_token: data.session.access_token,
  refresh_token: data.session.refresh_token,
  expires_at: data.session.expires_at,
})}`;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
};

console.log("\n1. Unauthenticated access is rejected");
const anonymous = await fetch(`${BASE}/api/admin/notifications/test`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ channel: "email" }),
});
check("anonymous request is refused", anonymous.status === 403, String(anonymous.status));

console.log("\n2. Test email delivery");
const emailResponse = await fetch(`${BASE}/api/admin/notifications/test`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ channel: "email", recipient: "quality-check@example.com" }),
});
const emailResult = await emailResponse.json();
check("email test endpoint responds", emailResponse.status < 400, JSON.stringify(emailResult));
check("email provider reported a result", typeof emailResult.status === "string");

console.log("\n3. Test WhatsApp delivery");
const whatsappResponse = await fetch(`${BASE}/api/admin/notifications/test`, {
  method: "POST",
  headers: { "content-type": "application/json", cookie },
  body: JSON.stringify({ channel: "whatsapp", recipient: "919999999999" }),
});
const whatsappResult = await whatsappResponse.json();
check("whatsapp test endpoint responds", whatsappResponse.status < 400, JSON.stringify(whatsappResult));
check("whatsapp provider reported a result", typeof whatsappResult.status === "string");

console.log(`\n${passed} passed, ${failed} failed`);
console.log(`providers: email=${emailResult.provider} (${emailResult.status}), whatsapp=${whatsappResult.provider} (${whatsappResult.status})`);
console.log("In console mode both are logged on the server; configure provider keys to deliver for real.");
process.exit(failed === 0 ? 0 : 1);