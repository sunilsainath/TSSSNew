/**
 * End-to-end smoke test against the live Supabase project using the anon key,
 * exercising exactly the paths the public website uses.
 *
 * Run with: node scripts/smoke-test.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const root = path.resolve(import.meta.dirname, "..");

const realtime = { realtime: { transport: WebSocket } };

function loadEnv(file) {
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

const env = { ...loadEnv(".env.local"), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  ...realtime,
  auth: { persistSession: false },
});

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

const stamp = Date.now();
const name = `Smoke Test Person ${stamp}`;

async function main() {
  console.log("\n1. Public read access (RLS)");
  const { data: categories } = await supabase
    .from("event_categories")
    .select("slug")
    .eq("is_active", true);
  check("active event categories are readable", (categories ?? []).length >= 6);

  const { data: events } = await supabase.from("events").select("id").eq("is_published", true);
  check("published events are readable", (events ?? []).length > 0);

  const { data: blogs } = await supabase.from("blogs").select("status");
  check(
    "public cannot read pending blogs",
    (blogs ?? []).every((row) => row.status === "approved"),
  );

  const { data: members } = await supabase.from("members").select("*").limit(1);
  check("public cannot read the member database", (members ?? []).length === 0);

  const { data: requests } = await supabase.from("blood_help_requests").select("*").limit(1);
  check("public cannot read blood help requests", (requests ?? []).length === 0);

  const { data: adminRows } = await supabase.from("blood_help_admins").select("*").limit(1);
  check("public cannot read blood help administrators", (adminRows ?? []).length === 0);

  const { data: audit } = await supabase.from("audit_logs").select("*").limit(1);
  check("public cannot read the audit log", (audit ?? []).length === 0);

  const { data: banners } = await supabase.from("site_banners").select("*").eq("is_visible", true);
  check("only visible banners are readable", (banners ?? []).every((row) => row.is_visible === true));

  console.log("\n2. Direct writes are blocked");
  const directInsert = await supabase
    .from("members")
    .insert({
      registration_number: "TSSS999999",
      full_name: "Direct Insert Attempt",
      date_of_birth: "1990-01-01",
      mobile_number: "9000000000",
    });
  check("public cannot insert into members", Boolean(directInsert.error));

  const directBlog = await supabase.from("blogs").insert({
    author_name: "Spam",
    author_email: "spam@example.com",
    title: "Should never be inserted",
    slug: `should-never-exist-${stamp}`,
    content: "x".repeat(80),
  });
  check("public cannot insert into blogs", Boolean(directBlog.error));

  console.log("\n3. Registration + duplicate detection + numbering");
  const first = await supabase.rpc("submit_registration", {
    p_full_name: name,
    p_date_of_birth: "1985-06-15",
    p_village: "Sriramapuram",
    p_mobile_number: `98765${String(stamp % 100000).padStart(5, "0")}`,
    p_rate_key: `smoke-${stamp}`,
  });

  const created = Array.isArray(first.data) ? first.data[0] : first.data;
  check("registration created", created?.result_code === "created", JSON.stringify(first.error ?? created));
  check(
    "registration number uses TSSS + 6 digits",
    /^TSSS\d{6}$/.test(created?.registration_number ?? ""),
    created?.registration_number,
  );

  const duplicate = await supabase.rpc("submit_registration", {
    p_full_name: `  ${name.toUpperCase()} `,
    p_date_of_birth: "1985-06-15",
    p_village: "Sriramapuram",
    p_mobile_number: "9000000001",
    p_rate_key: `smoke-${stamp}`,
  });
  const duplicateRow = Array.isArray(duplicate.data) ? duplicate.data[0] : duplicate.data;
  check(
    "duplicate (case + spacing normalised) is rejected",
    duplicateRow?.result_code === "already_registered",
    JSON.stringify(duplicateRow ?? duplicate.error),
  );
  check("duplicate response leaks no personal data", !duplicateRow?.full_name && !duplicateRow?.village);

  console.log("\n4. Concurrent registration numbering");
  const concurrent = await Promise.all(
    Array.from({ length: 5 }, (_, index) =>
      supabase.rpc("submit_registration", {
        p_full_name: `Concurrent Person ${stamp} ${index}`,
        p_date_of_birth: `19${80 + index}-01-0${index + 1}`,
        p_village: "Test Village",
        p_mobile_number: `9000000${String(100 + index)}`,
        p_rate_key: `conc-${stamp}`,
      }),
    ),
  );
  const concurrentErrors = concurrent
    .map((result) => result.error?.message)
    .filter(Boolean);
  const numbers = concurrent
    .map((result) => (Array.isArray(result.data) ? result.data[0] : result.data)?.registration_number)
    .filter(Boolean);
  check(
    "all concurrent registrations succeeded",
    numbers.length === 5,
    concurrentErrors.join(" | "),
  );
  check("registration numbers are unique", new Set(numbers).size === numbers.length, numbers.join(","));

  const serviceNumbers = numbers.map((value) => Number(String(value).replace("TSSS", "")));
  const sorted = [...serviceNumbers].sort((a, b) => a - b);
  check(
    "registration numbers are sequential",
    numbers.length === 5 && sorted.every((value, index) => index === 0 || value === sorted[index - 1] + 1),
    numbers.join(","),
  );

  console.log("\n5. Rate limiting (database side)");
  const rateLimited = [];
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const result = await supabase.rpc("submit_registration", {
      p_full_name: `Rate Limited ${stamp} ${attempt}`,
      p_date_of_birth: "1975-03-03",
      p_village: "Test Village",
      p_mobile_number: `9000000${String(200 + attempt)}`,
      p_rate_key: `rate-test-key-${stamp}`,
    });
    if (String(result.error?.message ?? "").includes("RATE_LIMITED")) rateLimited.push(attempt);
  }
  check("rate limiting blocks repeated submissions from one source", rateLimited.length > 0);

  console.log("\n6. Blog submission stays pending");
  const blog = await supabase.rpc("submit_blog", {
    p_author_name: "Smoke Tester",
    p_author_email: "smoke@example.com",
    p_author_mobile: "9000000011",
    p_title: `Smoke test article ${stamp}`,
    p_content: "This is a smoke test article body with more than fifty characters of content for validation.",
    p_category: "General",
    p_rate_key: `blog-${stamp}`,
  });
  check("blog submitted", !blog.error, blog.error?.message);

  const service = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    ...realtime,
    auth: { persistSession: false },
  });
  const { data: pendingBlog } = await service
    .from("blogs")
    .select("status")
    .eq("title", `Smoke test article ${stamp}`)
    .maybeSingle();
  check("submitted blog is pending", pendingBlog?.status === "pending");

  console.log("\n7. Blood help routing");
  const { data: districts } = await supabase
    .from("districts")
    .select("id, name, slug")
    .eq("slug", "karimnagar")
    .maybeSingle();
  const { data: area } = await supabase
    .from("areas")
    .select("id, name")
    .eq("district_id", districts.id)
    .eq("slug", "karimnagar-city")
    .maybeSingle();

  const blood = await supabase.rpc("create_blood_request", {
    p_requester_name: `Smoke Patient ${stamp}`,
    p_mobile_number: "9876500011",
    p_blood_group: "O+",
    p_hospital_name: "Smoke Test Hospital",
    p_hospital_location: "Ward 1",
    p_district_id: districts.id,
    p_area_id: area.id,
    p_required_date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    p_units_required: 2,
    p_message: "Automated smoke test request.",
    p_rate_key: `blood-${stamp}`,
  });
  const bloodRow = Array.isArray(blood.data) ? blood.data[0] : blood.data;
  check("blood request created", bloodRow?.result_code === "created", blood.error?.message);
  check(
    "blood request number uses BH + 6 digits",
    /^BH\d{6}$/.test(bloodRow?.request_number ?? ""),
    bloodRow?.request_number,
  );
  check("request routed to the area administrator", bloodRow?.is_unassigned === false);
  check("administrator contact returned for notification", Boolean(bloodRow?.assigned_admin_email));

  const { data: unassignedRequest } = await service
    .from("blood_help_requests")
    .select("status, is_unassigned")
    .eq("request_number", bloodRow?.request_number)
    .maybeSingle();
  check("stored request starts as NEW", unassignedRequest?.status === "NEW");
  check("stored request is assigned", unassignedRequest?.is_unassigned === false);

  const invalidGroup = await supabase.rpc("create_blood_request", {
    p_requester_name: "Invalid Group",
    p_mobile_number: "9876500012",
    p_blood_group: "Z+",
    p_hospital_name: "Test Hospital",
    p_hospital_location: "",
    p_district_id: districts.id,
    p_area_id: null,
    p_required_date: null,
    p_units_required: 1,
    p_message: null,
    p_rate_key: `blood-${stamp}`,
  });
  check(
    "invalid blood group rejected by the database",
    String(invalidGroup.error?.message ?? "").includes("INVALID_BLOOD_GROUP"),
  );

  console.log("\n8. Cleanup smoke test rows");
  await service.from("blood_help_requests").delete().eq("request_number", bloodRow.request_number);
  await service.from("blogs").delete().eq("title", `Smoke test article ${stamp}`);
  await service.from("members").delete().like("full_name", `Concurrent Person ${stamp}%`);
  await service.from("members").delete().like("full_name", `Rate Limited ${stamp}%`);
  await service.from("members").delete().eq("full_name", name);
  const { data: leftover } = await service
    .from("members")
    .select("id")
    .or(`full_name.eq.${name},full_name.like.Concurrent Person ${stamp}%,full_name.like.Rate Limited ${stamp}%`);
  check("smoke test members removed", (leftover ?? []).length === 0);

  console.log("\n9. Row level security for signed-in administrators");
  const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    ...realtime,
    auth: { persistSession: false },
  });

  const email = process.argv[2];
  const password = process.argv[3];

  if (email && password) {
    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({ email, password });
    check("admin can sign in", !signInError && Boolean(signIn.session), signInError?.message ?? "");

    const { data: profile } = await anon
      .from("users")
      .select("role, is_active")
      .eq("id", signIn.session.user.id)
      .maybeSingle();
    check("admin profile is readable by the admin", profile?.role === "super_admin");

    const { data: memberRows } = await anon.from("members").select("registration_number").limit(1);
    check("admin can read the member list", Array.isArray(memberRows));

    const { data: requestRows } = await anon.from("blood_help_requests").select("request_number").limit(1);
    check("admin can read blood help requests", Array.isArray(requestRows));

    const { data: adminRows } = await anon.from("blood_help_admins").select("admin_name").limit(1);
    check("admin can read blood help administrators", Array.isArray(adminRows));

    const { data: auditRows } = await anon.from("audit_logs").select("id").limit(1);
    check("super admin can read the audit log", Array.isArray(auditRows));

    const { data: settingsRow } = await anon.from("site_settings").select("id").limit(1).maybeSingle();
    const settingsUpdate = await anon
      .from("site_settings")
      .update({ short_name: "TSSS" })
      .eq("id", settingsRow.id)
      .select("short_name");
    check(
      "admin can update site settings",
      !settingsUpdate.error && settingsUpdate.data?.[0]?.short_name === "TSSS",
      settingsUpdate.error?.message ?? "",
    );

    const { data: settingsBefore } = await service
      .from("site_settings")
      .select("short_name")
      .limit(1)
      .maybeSingle();
    await anon.from("site_settings").update({ short_name: settingsBefore.short_name }).eq("id", settingsRow.id);
  } else {
    console.log("  SKIP  pass <admin email> <password> to test authenticated RLS");
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("smoke test crashed:", error);
  process.exit(1);
});
