import { readFileSync } from "node:fs";
import dns from "node:dns/promises";

export function loadEnvFile() {
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const i = line.indexOf("=");
        return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
      }),
  );
}

/**
 * Supabase hostnames can resolve to IPv6 addresses that are unreachable from
 * some networks, so IPv4 is preferred when available.
 */
export async function connectionConfig(env = loadEnvFile()) {
  const url = new URL(env.DATABASE_URL);
  const config = {
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace("/", ""),
    port: Number(url.port || 5432),
    host: url.hostname,
    ssl: { rejectUnauthorized: false },
  };

  try {
    const { address } = await dns.lookup(url.hostname, { family: 4 });
    return { ...config, hostaddr: address };
  } catch {
    return config;
  }
}