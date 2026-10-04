/**
 * Signs fresh Supabase API keys with the project's JWT secret and writes them
 * into `.env.local`. Useful when a key has to be recovered or rotated.
 *
 * Usage: node scripts/generate-api-keys.mjs          # print keys
 *        node scripts/generate-api-keys.mjs --write   # write to .env.local
 */
import crypto from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import pg from "pg";

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
const client = new pg.Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

await client.connect();
const { rows } = await client.query(
  "select decrypted_secret from vault.decrypted_secrets where name = 'p_jwt_secret' limit 1",
);
const secret = rows[0]?.decrypted_secret;
await client.end();

if (!secret) {
  console.error("Could not read p_jwt_secret from the vault.");
  process.exit(1);
}

const ref = new URL(env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0];

function sign(role) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: "supabase",
    ref,
    role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 5,
  };
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const data = `${encode(header)}.${encode(payload)}`;
  return `${data}.${crypto.createHmac("sha256", secret).update(data).digest("base64url")}`;
}

const keys = {
  NEXT_PUBLIC_SUPABASE_ANON_KEY: sign("anon"),
  SUPABASE_SERVICE_ROLE_KEY: sign("service_role"),
};

if (process.argv.includes("--write")) {
  const envPath = path.join(root, ".env.local");
  let contents = readFileSync(envPath, "utf8");

  for (const [name, value] of Object.entries(keys)) {
    const pattern = new RegExp(`^${name}=.*$`, "m");
    contents = pattern.test(contents)
      ? contents.replace(pattern, `${name}=${value}`)
      : `${contents.trimEnd()}\n${name}=${value}\n`;
  }

  writeFileSync(envPath, contents);
  console.log("Updated .env.local");
} else {
  for (const [name, value] of Object.entries(keys)) console.log(`${name}=${value}`);
}
