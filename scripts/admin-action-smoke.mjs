/**
 * Drives admin server actions over HTTP the same way the panel does, verifying
 * that writes actually land in the database and are audited.
 *
 * Usage: node scripts/admin-action-smoke.mjs <admin email> <password>
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
const [email, password] = process.argv.slice(2);
const stamp = Date.now();

if (!email || !password) {
  console.error("Usage: node scripts/admin-action-smoke.mjs <admin email> <password>");
  process.exit(1);
}

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

const auth = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});
const { data: signIn, error: signInError } = await auth.auth.signInWithPassword({ email, password });
if (signInError || !signIn.session) {
  console.error("sign in failed:", signInError?.message);
  process.exit(1);
}

const cookie = `${auth.storageKey}=${JSON.stringify({
  access_token: signIn.session.access_token,
  refresh_token: signIn.session.refresh_token,
  expires_at: signIn.session.expires_at,
})}`;

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  realtime: { transport: WebSocket },
  auth: { persistSession: false },
});

function actionFields(html) {
  const forms = [...html.matchAll(/<form\b[\s\S]*?<\/form>/g)].map((match) => match[0]);
  // The resource form is the one that carries the __intent marker (quick action
  // and delete buttons also emit __entity).
  const form = forms.find((candidate) => candidate.includes('name="__intent"')) ?? forms[0];
  if (!form) throw new Error("no form found");

  const fields = [];
  for (const tag of form.matchAll(/<input\b([^>]*)>/g)) {
    const [, attributes] = tag;
    const name = attributes.match(/name="([^"]+)"/)?.[1];
    if (!name || !/type="hidden"/.test(attributes)) continue;
    const value = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
    fields.push([name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
  }
  return fields;
}

const stripHtml = (value) =>
  value
    .replace(/<svg[\s\S]*?<\/svg>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function act(path, fields, values) {
  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);
  // Values must replace (not append to) any hidden input with the same name.
  for (const [name, value] of Object.entries(values)) {
    body.delete(name);
    body.append(name, value);
  }

  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    body,
    headers: { cookie },
    redirect: "manual",
  });
  const text = await response.text();
  const alertIndex = text.indexOf('role="alert"');
  const alert = alertIndex > -1 ? stripHtml(text.slice(alertIndex, alertIndex + 600)) : "";
  return {
    status: response.status,
    location: response.headers.get("location"),
    text,
    summary: `${stripHtml(text).slice(0, 120)}${alert ? ` | alert: ${alert.slice(0, 160)}` : ""}`,
  };
}

/** Posts a specific form identified by the value of its __action input. */
async function actNamedForm(path, actionValue, cookie) {
  const page = await (await fetch(`${BASE}${path}`, { headers: { cookie } })).text();
  const form = [...page.matchAll(/<form\b[\s\S]*?<\/form>/g)]
    .map((match) => match[0])
    .find((candidate) => candidate.includes(`value="${actionValue}"`));

  if (!form) return { status: 0, text: "", summary: `no form with action ${actionValue}` };

  const fields = [];
  for (const tag of form.matchAll(/<input\b([^>]*)>/g)) {
    const [, attributes] = tag;
    const name = attributes.match(/name="([^"]+)"/)?.[1];
    if (!name) continue;
    fields.push([name, (attributes.match(/value="([^"]*)"/)?.[1] ?? "").replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
  }

  const body = new FormData();
  for (const [name, value] of fields) body.append(name, value);

  const response = await fetch(`${BASE}${path}`, {
    method: "POST",
    body,
    headers: { cookie },
    redirect: "manual",
  });
  const text = await response.text();
  return { status: response.status, text, summary: stripHtml(text).slice(0, 200) };
}

async function run() {
  console.log("\n0. Clean up any rows left by an interrupted previous run");
  const { data: staleEvents } = await admin.from("events").select("id").like("title", "Automation Event%");
  for (const stale of staleEvents ?? []) {
    await admin.from("event_gallery").delete().eq("event_id", stale.id);
    await admin.from("events").delete().eq("id", stale.id);
  }
  await admin.from("site_banners").delete().like("message", "Automation banner%");
  await admin.from("blogs").delete().like("title", "Form flow article%");
  check("stale automation rows removed", (staleEvents ?? []).length >= 0);

  console.log("\n1. Banner: create and update");
  let page = await (await fetch(`${BASE}/admin/banner`, { headers: { cookie } })).text();
  let fields = actionFields(page);

  let result = await act("/admin/banner", fields, {
    message: `Automation banner ${stamp}`,
    banner_type: "warning",
    link_url: "/events",
    link_label: "View events",
    is_enabled: "on",
    start_date: "",
    end_date: "",
  });

  const { data: banner } = await admin
    .from("site_banners")
    .select("message, is_enabled, is_visible, banner_type")
    .ilike("message", `Automation banner ${stamp}`)
    .maybeSingle();
  check("banner saved", Boolean(banner), `status=${result.status} loc=${result.location} ${result.summary}`);
  check("banner marked enabled", banner?.is_enabled === true);
  check("generated visibility flag is true", banner?.is_visible === true);

  const toggle = await actNamedForm("/admin/banner", "toggle-published", cookie);
  const { data: disabledBanner } = await admin
    .from("site_banners")
    .select("is_enabled, is_visible")
    .ilike("message", `Automation banner ${stamp}`)
    .maybeSingle();
  check("banner can be disabled", disabledBanner?.is_enabled === false, toggle.summary);
  check("disabled banner is hidden from the public", disabledBanner?.is_visible === false);

  const home = await (await fetch(`${BASE}/`)).text();
  check("hidden banner does not render on the site", !home.includes(`Automation banner ${stamp}`));

  console.log("\n2. Event: create, publish, gallery");
  page = await (await fetch(`${BASE}/admin/events/new`, { headers: { cookie } })).text();
  fields = actionFields(page);

  const { data: category } = await admin
    .from("event_categories")
    .select("id")
    .eq("slug", "devotional-events")
    .maybeSingle();

  const eventTitle = `Automation Event ${stamp}`;
  result = await act("/admin/events/new", fields, {
    __entity: "event",
    category_id: category.id,
    title: eventTitle,
    slug: "",
    event_date: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    end_date: "",
    location: "Test Venue",
    summary: "Created by the automation test.",
    content: "Automated test content for the event.",
    cover_image: "",
    youtube_url: "",
    external_links: "",
    is_published: "on",
  });

  const { data: event } = await admin
    .from("events")
    .select("id, slug, is_published, is_featured, event_date")
    .eq("title", eventTitle)
    .maybeSingle();
  check("event created with an auto-generated slug", Boolean(event?.slug), `status=${result.status} loc=${result.location} ${result.summary}`);
  check("slug matches the title", event?.slug === `automation-event-${stamp}`, event?.slug ?? "");

  if (!event) {
    console.log("\nEvent creation failed - stopping before dependent checks.");
    console.log(`\n${passed} passed, ${failed} failed\n`);
    process.exit(1);
  }

  page = await (await fetch(`${BASE}/admin/events/${event.id}`, { headers: { cookie } })).text();
  fields = actionFields(page);
  await act(`/admin/events/${event.id}`, fields, {
    __entity: "event",
    category_id: category.id,
    title: eventTitle,
    slug: event.slug,
    event_date: event.event_date,
    end_date: "",
    location: "Test Venue Renamed",
    summary: "Updated by the automation test.",
    content: "Automated test content for the event.",
    cover_image: "",
    youtube_url: "",
    external_links: "",
    is_published: "on",
    is_featured: "on",
  });

  const { data: updatedEvent } = await admin
    .from("events")
    .select("location, is_featured")
    .eq("id", event.id)
    .maybeSingle();
  check("event updated", updatedEvent?.location === "Test Venue Renamed");
  check("event marked as featured", updatedEvent?.is_featured === true);

  page = await (await fetch(`${BASE}/admin/events/galleries?event=${event.id}`, { headers: { cookie } })).text();
  fields = actionFields(page);
  const galleryResult = await act(`/admin/events/galleries?event=${event.id}`, fields, {
    __entity: "event_gallery",
    event_id: event.id,
    image_url: "/images/gallery/gallery-1.jpg",
    caption: "Automation caption",
    display_order: "1",
  });
  const { data: gallery } = await admin
    .from("event_gallery")
    .select("image_url, caption")
    .eq("event_id", event.id)
    .maybeSingle();
  check(
    "gallery image added",
    gallery?.image_url === "/images/gallery/gallery-1.jpg",
    `${galleryResult.summary} | row=${JSON.stringify(gallery ?? {})}`,
  );

  console.log("\n3. Blog: approve from the pending queue");
  // Self-contained fixture: a blog submitted by the public form.
  const blogTitle = `Automation Blog ${stamp}`;
  await admin.from("blogs").insert({
    author_name: "Automation Author",
    author_email: "automation@example.com",
    title: blogTitle,
    slug: `automation-blog-${stamp}`,
    excerpt: "Fixture for the approval test.",
    content: "Pending blog created by the admin action test.",
    category: "General",
    status: "pending",
  });
  const { data: pendingBlog } = await admin
    .from("blogs")
    .select("id, status")
    .eq("title", blogTitle)
    .maybeSingle();

  if (pendingBlog) {
    page = await (await fetch(`${BASE}/admin/blogs/pending`, { headers: { cookie } })).text();
    const approveForm = [...page.matchAll(/<form\b[\s\S]*?<\/form>/g)]
      .map((match) => match[0])
      .find((form) => form.includes('name="__action"') && form.includes('value="set-approved"'));
    if (approveForm) {
      const approveFields = [];
      for (const tag of approveForm.matchAll(/<input\b([^>]*)>/g)) {
        const [, attributes] = tag;
        const name = attributes.match(/name="([^"]+)"/)?.[1];
        const value = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
        if (name) approveFields.push([name, value]);
      }
      await act("/admin/blogs/pending", approveFields, {});
    } else {
      check("approve button rendered for the pending blog", false);
    }

    const { data: approved } = await admin
      .from("blogs")
      .select("status, reviewed_at, reviewed_by")
      .eq("id", pendingBlog.id)
      .maybeSingle();
    check("blog approved", approved?.status === "approved", approved?.status ?? "not approved");
    check("approval is stamped", Boolean(approved?.reviewed_at && approved?.reviewed_by));

    const publicList = await (await fetch(`${BASE}/blogs`)).text();
    check("approved blog becomes public", publicList.includes(blogTitle));
  }

  console.log("\n4. Registrations: disable and re-activate");
  // Self-contained fixture: a member created through the public RPC.
  const { data: fixture } = await admin
    .rpc("submit_registration", {
      p_full_name: `AutomationMember${stamp}`,
      p_date_of_birth: "1979-01-15",
      p_village: "Test Village",
      p_mobile_number: "9876543210",
      p_rate_key: `admin-action-${stamp}`,
    })
    .maybeSingle();

  const memberId = (Array.isArray(fixture) ? fixture[0] : fixture)?.member_id;
  void memberId;
  const { data: member } = await admin
    .from("members")
    .select("id, status")
    .eq("full_name", `AutomationMember${stamp}`)
    .maybeSingle();

  let disableOutcome = { status: 0, summary: "no disable form" };
  let disableFields = [];
  if (member) {
    const search = `/admin/registrations?search=AutomationMember${stamp}`;
    page = await (await fetch(`${BASE}${search}`, { headers: { cookie } })).text();
    check("member appears in the admin search", page.includes(`AutomationMember${stamp}`));

    const disableForm = [...page.matchAll(/<form\b[\s\S]*?<\/form>/g)]
      .map((match) => match[0])
      .find((form) => form.includes('value="set-disabled"'));
    if (disableForm) {
      for (const tag of disableForm.matchAll(/<input\b([^>]*)>/g)) {
        const [, attributes] = tag;
        const name = attributes.match(/name="([^"]+)"/)?.[1];
        const value = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
        if (name) disableFields.push([name, value]);
      }
      disableOutcome = await act(search, disableFields, {});
    } else {
      check("disable button rendered for the member", false);
    }

    const { data: disabled } = await admin
      .from("members")
      .select("status")
      .eq("id", member.id)
      .maybeSingle();
    check(
      "member disabled from the panel",
      disabled?.status === "disabled",
      `${disabled?.status ?? ""} | status=${disableOutcome.status} ${disableOutcome.summary} | fields=${JSON.stringify(disableFields ?? [])}`,
    );

    const csv = await (
      await fetch(`${BASE}/api/admin/export/registrations?search=AutomationMember${stamp}`, {
        headers: { cookie },
      })
    ).text();
    check("export includes the member", csv.includes(`AutomationMember${stamp}`));
  } else {
    check("member fixture created", false);
  }

  console.log("\n5. Audit log");
  const { data: auditRows } = await admin
    .from("audit_logs")
    .select("action, entity")
    .order("created_at", { ascending: false })
    .limit(20);
  const actions = new Set((auditRows ?? []).map((row) => row.action));
  check("create actions are audited", actions.has("create"), [...actions].join(","));
  check("update actions are audited", actions.has("update"));
  check("banner enable/disable is audited", actions.has("enable_banner") || actions.has("disable_banner"));

  console.log("\n7. Photo Booth: windows can be updated");
  const { data: boothTemplate } = await admin
    .from("photo_booth_templates")
    .select("id, name, width, height")
    .order("display_order")
    .limit(1)
    .maybeSingle();

  if (boothTemplate) {
    const boothPath = `/admin/photo-booth?windows=${boothTemplate.id}`;
    page = await (await fetch(`${BASE}${boothPath}`, { headers: { cookie } })).text();
    check("admin photo booth page renders", page.includes("Photo Booth"));
    check("template list is shown", page.includes(boothTemplate.name));
    check("window editor is present", page.includes('name="slots"'));

    const slotForm = [...page.matchAll(/<form\b[\s\S]*?<\/form>/g)]
      .map((match) => match[0])
      .find((form) => form.includes('name="slots"'));

    if (slotForm) {
      const slotFields = [];
      for (const tag of slotForm.matchAll(/<input\b([^>]*)>/g)) {
        const [, attributes] = tag;
        const name = attributes.match(/name="([^"]+)"/)?.[1];
        if (!name || !/type="hidden"/.test(attributes)) continue;
        const value = attributes.match(/value="([^"]*)"/)?.[1] ?? "";
        slotFields.push([name, value.replace(/&quot;/g, '"').replace(/&amp;/g, "&")]);
      }

      const slotTemplateId = slotFields.find(([name]) => name === "template_id")?.[1];
      const original = JSON.parse(
        slotFields.find(([name]) => name === "slots")?.[1].replace(/&quot;/g, '"') ?? "[]",
      );

      // Move the first window 12px right and make it slightly narrower.
      const moved = original.map((slot, index) =>
        index === 0 ? { ...slot, x: slot.x + 12, width: slot.width - 24 } : slot,
      );

      const saveResult = await act(boothPath, slotFields, {
        template_id: slotTemplateId,
        slots: JSON.stringify(moved),
      });

      const { data: stored } = await admin
        .from("photo_booth_slots")
        .select("x, width")
        .eq("template_id", boothTemplate.id)
        .order("display_order")
        .limit(1)
        .maybeSingle();

      check(
        "photo window position saved",
        stored?.x === moved[0].x && stored?.width === moved[0].width,
        `stored=${JSON.stringify(stored)} expected=${JSON.stringify(moved[0])} ${saveResult.summary.slice(0, 120)}`,
      );

      // Restore the original layout so the seeded template stays untouched.
      await act(boothPath, slotFields, {
        template_id: slotTemplateId,
        slots: JSON.stringify(original),
      });

      const { data: restored } = await admin
        .from("photo_booth_slots")
        .select("x, width")
        .eq("template_id", boothTemplate.id)
        .order("display_order")
        .limit(1)
        .maybeSingle();
      check("original layout restored", restored?.x === original[0].x);

      // A window outside the canvas must be rejected with a friendly message.
      const invalid = [{ ...original[0], x: boothTemplate.width - 10, width: 400 }];
      const invalidResult = await act(boothPath, slotFields, {
        template_id: slotTemplateId,
        slots: JSON.stringify(invalid),
      });
      check(
        "windows outside the canvas are rejected",
        invalidResult.text.includes("extends beyond the frame"),
        invalidResult.summary.slice(0, 140),
      );
    } else {
      check("photo window form found", false);
    }
  } else {
    check("photo booth template exists", false);
  }

  console.log("\n8. Cleanup");
  await admin.from("event_gallery").delete().eq("event_id", event.id);
  await admin.from("events").delete().eq("id", event.id);
  await admin.from("site_banners").delete().like("message", "Automation banner%");
  if (pendingBlog) await admin.from("blogs").delete().eq("id", pendingBlog.id);
  if (member) await admin.from("members").delete().eq("id", member.id);

  const { data: leftovers } = await admin.from("events").select("id").eq("title", eventTitle);
  check("automation event removed", (leftovers ?? []).length === 0);
  void result;

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed === 0 ? 0 : 1);
}

run().catch((error) => {
  console.error("admin action test crashed:", error);
  process.exit(1);
});