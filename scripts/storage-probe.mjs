/** Lists storage buckets and verifies the public-media upload path works. */
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const root = path.resolve(import.meta.dirname, "..");

const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [
        line.slice(0, index).trim(),
        line
          .slice(index + 1)
          .trim()
          .replace(/^"|"$/g, ""),
      ];
    }),
);

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

const { data: buckets, error } = await admin.storage.listBuckets();

if (error) {
  console.log("listBuckets FAILED:", error.message);
} else {
  console.log("buckets:");
  for (const bucket of buckets) {
    console.log(`  - ${bucket.id} (public=${bucket.public})`);
  }
}

const target = "public-media";
if (!buckets?.some((bucket) => bucket.id === target)) {
  console.log(`\n${target} DOES NOT EXIST - uploads will fail`);
  process.exit(0);
}

const probe = `probe/${Date.now()}.txt`;
const { error: uploadError } = await admin.storage
  .from(target)
  .upload(probe, new Blob(["probe"]), { contentType: "text/plain", upsert: false });

console.log(`\nupload probe -> ${uploadError ? `FAILED: ${uploadError.message}` : "ok"}`);

if (!uploadError) {
  console.log(`public url -> ${admin.storage.from(target).getPublicUrl(probe).data.publicUrl}`);
  await admin.storage.from(target).remove([probe]);
  console.log("probe removed");
}
