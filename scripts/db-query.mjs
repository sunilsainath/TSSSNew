/** Executes the SQL argument against the database and prints the first rows. */
import pg from "pg";

import { connectionConfig } from "./db-config.mjs";

const query = process.argv[2];

if (!query) {
  console.error("Usage: node scripts/db-query.mjs <sql>");
  process.exit(1);
}

const client = new pg.Client(await connectionConfig());
await client.connect();

try {
  const result = await client.query(query);
  console.log(JSON.stringify(result.rows, null, 2));
} catch (error) {
  console.error("SQL ERROR:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}