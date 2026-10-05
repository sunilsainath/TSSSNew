/**
 * Drives the real public forms over HTTP exactly like a browser without
 * JavaScript would: it replays React's server-action fields from the rendered
 * form, then confirms the outcome in the response and in the database.
 *
 * Usage: node scripts/form-flow-smoke.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { WebSocket } from "ws";

const root = path.resolve(import.meta.dirname, "..");
const env = Object.fromEntries(
  readFileSync(path.join(root, ".env.local"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const stamp = Date.now();

// Documentation range (RFC 5737), varied per run so each run looks like a
// different visitor device to the per-IP rate limiters.
const clientIp = `198.51.${100 + (stamp % 100)}.${1 + (Math.floor(stamp / 1000) % 250)}`;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = "") => {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
};

function decode(value) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** Extracts React's hidden server-action fields plus the named form fields. */
function readForm(html, formIndex = 0) {
  const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((match) => match[0]);
  const form = forms[formIndex];
  if (!form) throw new Error("no form found in response");

  const hidden = [];
  const fields = [];

  for (const tag of form.matchAll(/<(input|textarea|select)\b([^>]*)>/g)) {
    const [, tagName, attributeText] = tag;
    const name = attributeText.match(/name="([^"]+)"/)?.[1];
    const value = attributeText.match(/value="([^"]*)"/)?.[1];
    if (!name) continue;

    if (tagName === "input" && /type="hidden"/.test(attributeText)) {
      hidden.push([name, decode(value ?? "")]);
    } else {
      fields.push(name);
      void value;
    }
  }

  return { form, hidden, fields, hasSelect: /<select\b/.test(form) };
}

async function submit(url, form, hidden, values) {
  const body = new FormData();
  for (const [name, value] of hidden) body.append(name, value);
  // Values must replace (not append to) any hidden input with the same name.
  for (const [name, value] of Object.entries(values)) {
    body.delete(name);
    body.append(name, value);
  }

  const response = await fetch(`${BASE}${url}`, {
    method: "POST",
    body,
    redirect: "manual",
    // Next.js 16 ignores a Server Action POST that arrives without an Origin
    // matching the host, returning the page unchanged with no error. A real
    // browser always sends these, so the harness must too.
    //
    // A unique source address per run keeps the public-form rate limiters from
    // making this suite un-repeatable: they count per IP, and re-running against
    // one address exhausts them.
    headers: {
      origin: new URL(BASE).origin,
      host: new URL(BASE).host,
      "x-forwarded-for": clientIp,
    },
  });
  const text = await response.text();
  return { status: response.status, location: response.headers.get("location"), text };
}

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

async function run() {
  console.log("\n1. Registration form (no-JavaScript submission)");
  const registerHtml = await (await fetch(`${BASE}/register`)).text();
  const registerForm = readForm(registerHtml);
  check(
    "registration form exposes the required fields",
    ["fullName", "fatherName", "dateOfBirth", "gender", "bloodGroup", "countryCode", "stateCode", "village", "mobileNumber"].every(
      (name) => registerForm.fields.includes(name),
    ),
    registerForm.fields.join(","),
  );

  const name = `FormFlowPerson${stamp}`;
  const bloodRequester = `Form Flow Patient${stamp}`;

  // The new mandatory profile fields, mirroring what a visitor must supply.
  const profile = {
    fatherName: "FormFlowFather",
    gender: "male",
    bloodGroup: "O+",
    countryCode: "IN",
    stateCode: "TS",
  };

  const registration = await submit("/register", registerForm.form, registerForm.hidden, {
    fullName: name,
    dateOfBirth: "1988-04-12",
    ...profile,
    village: "Sriramapuram",
    mobileNumber: `98765${String(stamp % 100000).padStart(5, "0")}`,
    email: "",
    website: "",
  });

  check("registration submission returns a rendered response", registration.status === 200, String(registration.status));
  check(
    "success screen is rendered",
    registration.text.includes("Registration Successful") &&
      registration.text.includes("Your TSSS Registration Number"),
  );

  const { data: created } = await admin
    .from("members")
    .select("registration_number, father_name, gender, blood_group, state_code, country_code, phone_country_code")
    .eq("full_name", name)
    .maybeSingle();
  check("member row created in the database", Boolean(created), JSON.stringify(created ?? {}));
  check("registration number assigned", /^TSSS\d{6}$/.test(created?.registration_number ?? ""), created?.registration_number ?? "");
  check("father's name stored", created?.father_name === profile.fatherName, created?.father_name ?? "");
  check("gender stored", created?.gender === profile.gender, created?.gender ?? "");
  check("blood group stored", created?.blood_group === profile.bloodGroup, created?.blood_group ?? "");
  check("state stored", created?.state_code === profile.stateCode, created?.state_code ?? "");
  check("country defaults to India", created?.country_code === "IN", created?.country_code ?? "");
  check("dialling code resolved from the country", created?.phone_country_code === "91", created?.phone_country_code ?? "");

  console.log("\n2. Duplicate submission");
  const duplicate = await submit("/register", registerForm.form, registerForm.hidden, {
    fullName: name.toUpperCase(),
    dateOfBirth: "1988-04-12",
    ...profile,
    village: "Sriramapuram",
    mobileNumber: "9876500000",
    email: "",
    website: "",
  });
  check(
    "duplicate shows the already registered message",
    duplicate.text.includes("You are already registered"),
  );
  check(
    "duplicate response does not contain the member's registration number",
    !duplicate.text.includes(created?.registration_number ?? "TSSS999999"),
  );

  const { data: afterDuplicate } = await admin
    .from("members")
    .select("id")
    .eq("full_name", name);
  check("no second member row created", (afterDuplicate ?? []).length === 1);

  console.log("\n3. Validation errors");
  const invalid = await submit("/register", registerForm.form, registerForm.hidden, {
    fullName: "X",
    dateOfBirth: "",
    village: "",
    mobileNumber: "123",
    email: "",
    website: "",
  });
  check("invalid input is rejected", invalid.text.includes("Please correct the highlighted fields"));
  check("field level messages are rendered", invalid.text.includes("Please enter your full name."));

  console.log("\n4. Blood help form");
  const bloodHtml = await (await fetch(`${BASE}/blood-help`)).text();
  const bloodForm = readForm(bloodHtml);
  const { data: district } = await admin
    .from("districts")
    .select("id, name")
    .eq("slug", "karimnagar")
    .maybeSingle();
  const { data: area } = await admin
    .from("areas")
    .select("id, name")
    .eq("district_id", district.id)
    .eq("slug", "karimnagar-city")
    .maybeSingle();

  const blood = await submit("/blood-help", bloodForm.form, bloodForm.hidden, {
    requesterName: bloodRequester,
    mobileNumber: "9876500022",
    bloodGroup: "B+",
    hospitalName: "Form Flow Hospital",
    hospitalLocation: "Ward 3",
    districtId: district.id,
    areaId: area.id,
    requiredDate: new Date(Date.now() + 172_800_000).toISOString().slice(0, 10),
    unitsRequired: "2",
    message: "Automated form flow test.",
    districtName: district.name,
    areaName: area.name,
    website: "",
  });

  check("blood help submission returns a rendered response", blood.status === 200, String(blood.status));
  check("confirmation screen is rendered", blood.text.includes("Request Submitted"));
  check("reference number is shown", /BH\d{6}/.test(blood.text));

  const { data: requestRow } = await admin
    .from("blood_help_requests")
    .select("id, request_number, status, is_unassigned, blood_group")
    .eq("requester_name", bloodRequester)
    .maybeSingle();
  check("blood help request stored", Boolean(requestRow), JSON.stringify(requestRow ?? {}));
  check("request routed to the area administrator", requestRow?.is_unassigned === false);
  check("request starts as NEW", requestRow?.status === "NEW");

  const { data: logs } = await admin
    .from("notification_logs")
    .select("notification_type, status, recipient")
    .eq("blood_request_id", requestRow?.id ?? "");
  check("notification attempts are logged", (logs ?? []).length > 0, JSON.stringify(logs ?? []));

  console.log("\n5. Blog submission form");
  const blogsHtml = await (await fetch(`${BASE}/blogs`)).text();
  const blogForm = readForm(blogsHtml, [...blogsHtml.matchAll(/<form\b[\s\S]*?<\/form>/g)].length - 1);
  const blog = await submit("/blogs", blogForm.form, blogForm.hidden, {
    authorName: "Form Flow Author",
    authorEmail: "formflow@example.com",
    authorMobile: "9876500033",
    title: `Form flow article ${stamp}`,
    category: "General",
    content:
      "This article was submitted through the public form during an automated test of the moderation workflow.",
    featuredImage: "",
    website: "",
  });

  check("blog submission returns a rendered response", blog.status === 200, String(blog.status));
  check("pending confirmation is shown", blog.text.includes("Submission received"));

  const { data: blogRow } = await admin
    .from("blogs")
    .select("status, slug")
    .eq("title", `Form flow article ${stamp}`)
    .maybeSingle();
  check("blog stored as pending", blogRow?.status === "pending", blogRow?.status ?? "missing");

  const publicList = await (await fetch(`${BASE}/blogs`)).text();
  check("pending blog is not public", !publicList.includes(`Form flow article ${stamp}`));

  console.log("\n6. Spam protection");
  const spam = await submit("/blogs", blogForm.form, blogForm.hidden, {
    authorName: "Spam Bot",
    authorEmail: "spam@example.com",
    authorMobile: "",
    title: "Spam article title here",
    category: "General",
    content: "x".repeat(80),
    featuredImage: "",
    website: "http://spam.example.com",
  });
  const { data: spamRow } = await admin
    .from("blogs")
    .select("status")
    .eq("title", "Spam article title here")
    .maybeSingle();
  check("honeypot submission is silently discarded", !spamRow, JSON.stringify(spamRow ?? {}));
  void spam;

  console.log("\n7. Cleanup");
  await admin.from("blogs").delete().eq("title", `Form flow article ${stamp}`);
  await admin.from("blogs").delete().eq("title", "Spam article title here");
  await admin.from("blood_help_requests").delete().eq("requester_name", bloodRequester);
  await admin.from("members").delete().eq("full_name", name);

  const { data: leftovers } = await admin
    .from("members")
    .select("id")
    .or(`full_name.eq.${name},full_name.like.Form Flow Person%`);
  check("test members removed", (leftovers ?? []).length === 0);

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("form flow test crashed:", error);
  process.exit(1);
});