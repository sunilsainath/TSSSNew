/**
 * One-off refactor: move the neutral `ink-50/100/200` utilities to the brand
 * blue scale so light surfaces match the emblem.
 *
 * Usage: node scripts/rebrand-utilities.mjs
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..", "src");

const REPLACEMENTS = [
  [/\bink-100\b/g, "brand-100"],
  [/\bink-50\b/g, "brand-50"],
  [/\bink-200\b/g, "brand-200"],
];

async function* walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(tsx|ts|css)$/.test(entry.name)) yield full;
  }
}

let changed = 0;

for await (const file of walk(ROOT)) {
  const before = await readFile(file, "utf8");
  let after = before;

  for (const [pattern, replacement] of REPLACEMENTS) {
    after = after.replace(pattern, replacement);
  }

  if (after !== before) {
    await writeFile(file, after, "utf8");
    changed += 1;
    console.log("updated", path.relative(ROOT, file));
  }
}

console.log(`\n${changed} files updated`);