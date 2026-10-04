/**
 * Creates the first administrator login (Super Admin) if none exists.
 *
 * Usage: node scripts/create-admin.mjs <email> [name]
 * Prints a generated temporary password - change it after the first sign-in.
 */
import crypto from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const root = path.resolve(import.meta.dirname, "..");

function loadEnvFile(file) {
  return Object.fromEntries(
    readFileSync(path.join(root, file), "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

const env = { ...loadEnvFile(".env.local"), ...process.env };

const email = (process.argv[2] ?? "").trim().toLowerCase();
const fullName = (process.argv[3] ?? "Trust Administrator").trim();

if (!email) {
  console.error("Usage: node scripts/create-admin.mjs <email> [full name]");
  process.exit(1);
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

const { data: existingProfile } = await admin
  .from("users")
  .select("id, email, role")
  .limit(1)
  .maybeSingle();

if (existingProfile) {
  console.log(`An administrator already exists (${existingProfile.email}). Nothing to do.`);
  process.exit(0);
}

const password = `${crypto.randomBytes(9).toString("base64url")}Tsss${Math.floor(Math.random() * 90 + 10)}`;

const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: fullName },
});

if (error || !data.user) {
  console.error("Could not create the administrator:", error?.message);
  process.exit(1);
}

const { data: profile } = await admin
  .from("users")
  .select("id, email, role")
  .eq("id", data.user.id)
  .maybeSingle();

console.log(`
Administrator created
  email:    ${profile?.email ?? email}
  role:     ${profile?.role ?? "unknown"}
  password: ${password}

Sign in at /admin/login and change this password immediately.
`);
