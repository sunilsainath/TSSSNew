/** Reads tables through the REST API (used when direct Postgres is unavailable). */
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

const tables = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ["site_banners", "events", "members", "blood_help_requests", "notification_logs"];

for (const table of tables) {
  const { data, error, count } = await admin.from(table).select("*").limit(5);
  console.log(`\n== ${table} (showing ${data?.length ?? 0} of ${count ?? "?"})`);
  if (error) console.log("error:", error.message);
  for (const row of data ?? []) {
    const { id: _id, ...rest } = row;
    void _id;
    console.log(" ", JSON.stringify(rest).slice(0, 220));
  }
}