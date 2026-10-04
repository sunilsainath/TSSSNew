/**
 * Applies a SQL file to the Supabase Postgres database.
 *
 * Usage: npm run db:apply
 *        node scripts/db-apply.mjs supabase/seed.sql
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { connectionConfig, loadEnvFile } from "./db-config.mjs";

const root = path.resolve(import.meta.dirname, "..");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/db-apply.mjs <sql-file>");
    process.exit(1);
  }

  const sql = await readFile(path.resolve(root, file), "utf8");
  const client = new pg.Client(await connectionConfig(loadEnvFile()));

  await client.connect();
  try {
    await client.query(sql);
    console.log(`applied ${file}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("FAILED:", error.message);
  process.exit(1);
});