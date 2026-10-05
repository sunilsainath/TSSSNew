/**
 * Verifies that a donor who does not know their blood group can register:
 * the option is offered, the submission succeeds, and the record lands as
 * UNKNOWN for follow-up.
 *
 * Usage: node scripts/donor-unknown-check.mjs
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const ORIGIN = new URL(BASE).origin;

let passed = 0;
let failed = 0;

function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

function scopedFields(html, marker) {
  const form =
    [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)]
      .map((match) => match[0])
      .find((candidate) => candidate.includes(`name="${marker}"`)) ?? "";

  const fields = new Map();
  for (const match of form.matchAll(/<(input|select|textarea)\b([^>]*)>/g)) {
    const [, , attributes] = match;
    const name = /name="([^"]+)"/.exec(attributes)?.[1];
    if (name) fields.set(name, true);
  }

  const hidden = new Map();
  for (const match of form.matchAll(/<input[^>]*type="hidden"[^>]*>/g)) {
    const name = /name="([^"]+)"/.exec(match[0])?.[1];
    const value = /value="([^"]*)"/.exec(match[0])?.[1] ?? "";
    if (name && !/^\$ACTION_ID_/.test(name)) {
      hidden.set(
        name,
        value.replaceAll("&quot;", '"').replaceAll("&amp;", "&"),
      );
    }
  }

  return { fields, hidden };
}

const html = await (await fetch(`${BASE}/blood-donate`)).text();
const { fields, hidden } = scopedFields(html, "bloodGroup");

check("blood group field offered", fields.has("bloodGroup"));
check(
  "I Don't Know is offered",
  html.includes('value="UNKNOWN"') && html.includes("I Don"),
  "the UNKNOWN option must be selectable",
);

const stamp = String(Date.now() % 100000).padStart(5, "0");
const body = new FormData();
for (const [name, value] of hidden) body.append(name, value);
for (const [name, value] of Object.entries({
  fullName: `Unknown Donor ${stamp}`,
  fatherName: "",
  mobileNumber: `9886500${stamp.slice(0, 3)}`,
  email: "",
  bloodGroup: "UNKNOWN",
  dateOfBirth: "",
  gender: "",
  countryCode: "IN",
  stateCode: "TS",
  city: "Karimnagar",
  area: "",
  address: "",
  lastDonationDate: "",
  availability: "",
  preferredContact: "phone",
  website: "",
})) {
  body.delete(name);
  body.append(name, value);
}

const response = await fetch(`${BASE}/blood-donate`, {
  method: "POST",
  body,
  redirect: "manual",
  headers: { origin: ORIGIN, host: new URL(BASE).host },
});
const text = (await response.text()).replace(/<!--[\s\S]*?-->/g, "");

check("submission succeeds", response.status === 200, String(response.status));
check("donor roll confirmation shown", text.includes("donor roll"));
check(
  "no blood-group rejection",
  !text.includes("known blood group") && !text.includes("Please correct the highlighted fields"),
);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);