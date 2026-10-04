/**
 * Removes any rows left behind by interrupted test runs so the project starts
 * from a clean state. Uses the REST API, so direct Postgres access is not needed.
 *
 * Usage: npm run cleanup:test-data
 */
import { readFileSync } from "node:fs";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

const steps = [
  ["event_gallery", "image_url", "like", "/images/gallery/gallery-%"],
  ["events", "title", "like", "Automation Event%"],
  ["events", "title", "like", "%Smoke%"],
  ["site_banners", "message", "like", "Automation banner%"],
  ["blogs", "title", "like", "Form flow article%"],
  ["blogs", "title", "eq", "Spam article title here"],
  ["blogs", "title", "like", "Smoke test article%"],
  ["blogs", "title", "like", "%Smoke Tester%"],
  ["blogs", "title", "like", "Automation Blog%"],
  ["members", "full_name", "like", "FormFlowPerson%"],
  ["members", "full_name", "like", "AutomationMember%"],
  ["members", "full_name", "like", "Smoke Test Person%"],
  ["members", "full_name", "like", "Concurrent Person%"],
  ["members", "full_name", "like", "Rate Limited%"],
  ["blood_help_requests", "requester_name", "like", "Form Flow Patient%"],
  ["blood_help_requests", "requester_name", "like", "DebugPatient%"],
  ["blood_help_requests", "requester_name", "like", "Smoke Patient%"],
];

let total = 0;

for (const [table, column, operator, value] of steps) {
  const query = admin.from(table).delete();
  const result = operator === "like" ? query.like(column, value) : query.eq(column, value);
  const { error, count } = await result.select("id", { count: "exact" });
  if (error) {
    console.log(`  ${table}.${column} ${value} -> error: ${error.message}`);
  } else if (count) {
    console.log(`  ${table}.${column} ${value} -> removed ${count}`);
    total += count;
  }
}

// Events are deleted first for the automation fixtures; make sure no gallery rows remain.
const { count: orphanGallery } = await admin
  .from("event_gallery")
  .delete("id", "!eq", "00000000-0000-0000-0000-000000000000")
  .select("id", { count: "exact" });

console.log(`\n${total} test rows removed${orphanGallery ? ` (+${orphanGallery} gallery rows)` : ""}`);
console.log("Demo seed content and real records were left untouched.");