/**
 * Runs a SQL statement against the database configured in `.env.local`.
 *
 * Usage: node scripts/dbsql.mjs "select 1"
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const query = process.argv[2] ?? readFileSync("sql/probe.sql", "utf8");

try {
  process.stdout.write(execFileSync("node", ["scripts/db-query.mjs", query], { encoding: "utf8" }));
} catch (error) {
  process.stdout.write(`${error.stdout ?? error.message}\n`);
}