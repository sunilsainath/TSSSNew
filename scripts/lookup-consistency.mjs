/**
 * Checks that the static lookups in src/lib/lookups.ts match the reference data
 * seeded by migration 0006, so a dropdown can never offer a value the database
 * would reject.
 *
 * Usage: node scripts/lookup-consistency.mjs
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import pg from "pg";

import { connectionConfig, loadEnvFile } from "./db-config.mjs";

const root = path.resolve(import.meta.dirname, "..");
const source = await readFile(path.join(root, "src", "lib", "lookups.ts"), "utf8");

function block(name) {
  const start = source.indexOf(`export const ${name}`);
  if (start === -1) throw new Error(`${name} not found`);
  const open = source.indexOf("[", start);
  const close = source.indexOf("\n];", open);
  return source.slice(open, close);
}

const countries = [...block("COUNTRIES").matchAll(/code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)",\s*dial:\s*"(\d+)"/g)].map(
  (match) => ({ code: match[1], name: match[2], dial: match[3] }),
);

const states = [...block("INDIAN_STATES").matchAll(/code:\s*"([A-Z]{2})",\s*name:\s*"([^"]+)"/g)].map(
  (match) => ({ code: match[1], name: match[2] }),
);

const client = new pg.Client(await connectionConfig(loadEnvFile()));
await client.connect();

let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

try {
  const { rows: dbCountries } = await client.query(
    "select iso_code, name, phone_code from public.countries where is_active order by iso_code",
  );
  const { rows: dbStates } = await client.query(
    "select code, name from public.states where is_active order by display_order",
  );

  console.log(`COUNTRIES (code lists ${countries.length}, database ${dbCountries.length})`);

  for (const country of countries) {
    const row = dbCountries.find((item) => item.iso_code === country.code);
    check(
      `${country.code} ${country.name}`,
      row?.name === country.name && row?.phone_code === country.dial,
      row ? `db has "${row.name}" / ${row.phone_code}` : "missing from the database",
    );
  }

  for (const row of dbCountries) {
    check(
      `${row.iso_code} present in lookups.ts`,
      countries.some((country) => country.code === row.iso_code),
      "database has a country the app does not offer",
    );
  }

  console.log(`\nSTATES (code lists ${states.length}, database ${dbStates.length})`);

  for (const state of states) {
    const row = dbStates.find((item) => item.code === state.code);
    check(`${state.code} ${state.name}`, row?.name === state.name, row ? `db has "${row.name}"` : "missing");
  }

  for (const row of dbStates) {
    check(
      `${row.code} present in lookups.ts`,
      states.some((state) => state.code === row.code),
      "database has a state the app does not offer",
    );
  }
} finally {
  await client.end();
}

console.log(failed === 0 ? "\nall lookups in sync" : `\n${failed} mismatch(es)`);
process.exit(failed === 0 ? 0 : 1);