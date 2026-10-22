/**
 * Gentle production load check: bounded concurrency, short duration,
 * GET-only public pages. ~250 requests in total — enough to characterise
 * cold-start and steady-state latency without disturbing real visitors.
 *
 * Usage: node scripts/prod-load.mjs
 */
const BASE = "https://www.srinivasula.com";

const PAGES = ["/", "/events", "/blogs", "/register", "/blood-donations", "/photo-booth", "/donations", "/media"];
const CONCURRENCY = 4;
const ROUNDS = 8; // 8 rounds x 4 concurrent x 8 pages = 256 requests

const latencies = new Map();
let errors = 0;
let statuses = {};

async function timedFetch(path) {
  const started = Date.now();
  try {
    const response = await fetch(`${BASE}${path}`, { cache: "no-store" });
    await response.arrayBuffer();
    const ms = Date.now() - started;
    statuses[response.status] = (statuses[response.status] ?? 0) + 1;
    if (!latencies.has(path)) latencies.set(path, []);
    latencies.get(path).push(ms);
  } catch {
    errors += 1;
  }
}

console.log(`Load check: ${ROUNDS} rounds x ${CONCURRENCY} concurrent over ${PAGES.length} pages\n`);

const overallStart = Date.now();

for (let round = 0; round < ROUNDS; round += 1) {
  const queue = [...PAGES];
  for (let slot = 0; slot < CONCURRENCY; slot += 1) {
    await Promise.all(queue.map((path) => timedFetch(path)));
  }
  process.stdout.write(`  round ${round + 1}/${ROUNDS} done\n`);
}

const totalMs = Date.now() - overallStart;

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

console.log("\nPer-page latency (ms)");
for (const [path, times] of latencies) {
  const sorted = [...times].sort((a, b) => a - b);
  console.log(
    `  ${path.padEnd(16)} min=${sorted[0]}  p50=${percentile(sorted, 50)}  p95=${percentile(sorted, 95)}  max=${sorted[sorted.length - 1]}  n=${sorted.length}`,
  );
}

const all = [...latencies.values()].flat().sort((a, b) => a - b);
console.log(
  `\nOverall: min=${all[0]} p50=${percentile(all, 50)} p95=${percentile(all, 95)} max=${all[all.length - 1]} (n=${all.length})`,
);
console.log(`Status codes: ${JSON.stringify(statuses)}`);
console.log(`Network errors: ${errors}`);
console.log(`Wall time: ${(totalMs / 1000).toFixed(1)}s (${(all.length / (totalMs / 1000)).toFixed(1)} req/s)`);

const ok = errors === 0 && (statuses["200"] ?? 0) === all.length && percentile(all, 95) < 3000;
console.log(ok ? "\nVERDICT: healthy" : "\nVERDICT: problems detected");
process.exit(ok ? 0 : 1);