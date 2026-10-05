/**
 * Verifies the new admin authentication flows against a running server.
 * Usage: node scripts/auth-flow-check.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function head(path) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  return { status: response.status, location: response.headers.get("location") };
}

console.log("1. Unauthenticated access");
const dashboard = await head("/admin");
check("/admin redirects anonymous visitors to login", dashboard.status === 307 || dashboard.status === 302);
check("redirect target is the login page", (dashboard.location ?? "").includes("/admin/login"));

for (const path of ["/admin/settings", "/admin/registrations", "/admin/audit-log"]) {
  const result = await head(path);
  check(`${path} is protected`, result.status === 307 || result.status === 302);
}

console.log("\n2. Public password pages");
for (const path of ["/admin/forgot-password", "/admin/password"]) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual" });
  const body = await response.text();
  check(`${path} renders without a session`, response.status === 200);
  check(`${path} is not indexed`, body.includes('name="robots" content="noindex'));
}

console.log("\n3. Login screen wiring");
const login = await fetch(`${BASE}/admin/login`);
const loginBody = await login.text();
check("login page has the password field", loginBody.includes('name="password"'));
check("login page offers a forgot-password link", loginBody.includes('href="/admin/forgot-password"'));
check("login page posts to a server action", loginBody.includes('name="1"') || loginBody.includes("$ACTION"));

console.log("\n4. Recovery code handling");
const recovery = await head("/admin/password?code=not-a-real-code");
check("an invalid recovery code does not loop", recovery.status !== 500);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);