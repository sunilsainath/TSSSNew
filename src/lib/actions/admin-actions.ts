"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ENTITY_SPECS, type EntityKey, type FieldSpec } from "@/lib/admin/entities";
import { getAdminSession, roleRank } from "@/lib/auth/session";
import type { AdminState } from "@/lib/actions/state";
import { createAdminClient } from "@/lib/supabase/server";
import { slugify, sanitizeHtml } from "@/lib/utils/sanitize";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function buildValidator(_entity: EntityKey, fields: FieldSpec[]) {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.type === "checkbox") {
      shape[field.name] = z.boolean().optional();
      continue;
    }

    let base = z.string().trim();

    if (field.required) {
      base = base.min(1, `${field.label} is required.`);
    }

    if (field.type === "email" && field.required) {
      base = base.refine((value: string) => z.email().safeParse(value).success, "Enter a valid email address.");
    }

    if (field.type === "url" && field.required) {
      base = base.refine(
        (value: string) => /^https?:\/\//i.test(value) || value.startsWith("/"),
        "Enter a valid URL (including https://).",
      );
    }

    if (field.required) {
      base = base.max(5000, `${field.label} is too long.`);
    }

    if (field.type === "number") {
      base = base.refine(
        (value: string) => value === "" || !Number.isNaN(Number(value)),
        "Enter a valid number.",
      );
    }

    shape[field.name] = base.optional().default("");
  }

  return z.object(shape);
}

export async function writeAudit(
  action: string,
  entity: string,
  entityId: string | null,
  previous: unknown,
  next: unknown,
) {
  try {
    const session = await getAdminSession();
    const { error } = await createAdminClient().from("audit_logs").insert({
      actor_id: session?.user.id ?? null,
      actor_email: session?.authEmail ?? null,
      action,
      entity,
      entity_id: entityId,
      previous_value: (previous ?? null) as never,
      new_value: (next ?? null) as never,
    });
    if (error) console.error("audit log failed:", error.message);
  } catch (error) {
    console.error("audit log error:", error instanceof Error ? error.message : error);
  }
}

const UPLOAD_FOLDERS: Partial<Record<EntityKey, string>> = {
  banner: "banners",
  event_category: "categories",
  event: "events",
  event_gallery: "events",
  media_item: "media",
  blog: "blogs",
  blood_help_admin: "admins",
  photo_booth_template: "photo-booth",
  photo_booth_slot: "photo-booth",
};

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/**
 * Placeholder that stands in for an image field during validation, before the
 * file has actually been uploaded. Replaced by the stored URL afterwards.
 */
const PENDING_UPLOAD = "__pending_upload__";

async function handleImageUploads(
  entity: EntityKey,
  fields: FieldSpec[],
  formData: FormData,
): Promise<Record<string, string>> {
  const uploaded: Record<string, string> = {};
  const admin = createAdminClient();

  for (const field of fields) {
    if (field.type !== "image") continue;
    const file = formData.get(`${field.name}File`);
    if (!(file instanceof File) || file.size === 0) continue;

    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(`${field.label}: only JPG, PNG, WebP or AVIF images are allowed.`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error(`${field.label}: image must be smaller than 4 MB.`);
    }

    const extension = file.type.split("/")[1].replace("jpeg", "jpg");
    const folder = UPLOAD_FOLDERS[entity] ?? "uploads";
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    const { error } = await admin.storage
      .from("public-media")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw new Error(`${field.label}: upload failed (${error.message}).`);

    uploaded[field.name] = admin.storage.from("public-media").getPublicUrl(path).data.publicUrl;
  }

  return uploaded;
}

/** Column mapping per entity so form field names match database columns. */
const COLUMN_MAP: Partial<Record<EntityKey, Record<string, string>>> = {
  banner: { message: "message" },
};

function toRow(entity: EntityKey, values: Record<string, unknown>) {
  const spec = ENTITY_SPECS[entity];
  const row: Record<string, unknown> = {};

  for (const field of spec.fields) {
    const column = COLUMN_MAP[entity]?.[field.name] ?? field.name;

    if (field.type === "checkbox") {
      row[column] = Boolean(values[field.name]);
      continue;
    }

    if (field.type === "number") {
      const value = values[field.name];
      row[column] = value === null || value === undefined || value === "" ? null : Number(value);
      continue;
    }

    let value = values[field.name];
    if (typeof value === "string") value = value.trim();
    if (value === "") value = null;

    if (field.type === "image") {
      row[column] = value ?? null;
      continue;
    }

    row[column] = value ?? null;
  }

  if (entity === "event" && typeof row.summary === "string") row.summary = row.summary.slice(0, 600);
  if (entity === "page_content") {
    const metaText = String(values.meta_json ?? "").trim();
    if (metaText) {
      try {
        const parsed = JSON.parse(metaText);
        row.meta = parsed;
      } catch {
        throw new Error("Meta must be valid JSON.");
      }
    } else {
      row.meta = {};
    }
    delete row.meta_json;
  }
  if (entity === "blog") {
    if (typeof row.content === "string") row.content = sanitizeHtml(row.content);
    if (typeof row.excerpt === "string") row.excerpt = row.excerpt.slice(0, 400);
  }

  return row;
}

const SINGLETON_ENTITIES = new Set<EntityKey>(["donation_settings", "site_settings"]);
const SINGLE_ACTIVE_BANNER: EntityKey = "banner";

/* -------------------------------------------------------------------------- */
/* Create / update                                                            */
/* -------------------------------------------------------------------------- */

export async function adminSaveAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const entity = String(formData.get("__entity") ?? "") as EntityKey;
  const spec = ENTITY_SPECS[entity];
  const id = String(formData.get("__id") ?? "").trim();
  const intent = String(formData.get("__intent") ?? "save");

  if (!spec) return { status: "error", message: "Unknown form." };

  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Your session expired. Please sign in again." };
  if (roleRank(session.user.role) < roleRank(spec.minimumRole)) {
    return { status: "error", message: "You do not have permission to do that." };
  }

  const isNew = !id;

  try {
    if (entity === "user" && isNew) {
      return await createUserAccount(formData);
    }

    const raw: Record<string, unknown> = {};
    for (const field of spec.fields) {
      if (field.type === "checkbox") {
        raw[field.name] = formData.get(field.name) === "on" || formData.get(field.name) === "true";
        continue;
      }
      raw[field.name] = formData.get(field.name) ?? "";
    }

    // An image field submits its current value in a hidden input and the new
    // file separately. On create the hidden value is empty, so a *required*
    // image field would fail validation even though a perfectly good file was
    // chosen. Mark it as satisfied here; the real upload happens after
    // validation so a rejected form never leaves an orphaned file in storage.
    const pendingFiles = new Set<string>();
    for (const field of spec.fields) {
      if (field.type !== "image") continue;

      const file = formData.get(`${field.name}File`);
      if (file instanceof File && file.size > 0 && !String(raw[field.name] ?? "").trim()) {
        raw[field.name] = PENDING_UPLOAD;
        pendingFiles.add(field.name);
      }
    }

    const validator = buildValidator(entity, spec.fields);
    const parsed = validator.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".") || "form";
        if (!errors[key]) errors[key] = issue.message;
      }
      return { status: "error", message: "Please correct the highlighted fields.", errors };
    }

    const uploads = await handleImageUploads(entity, spec.fields, formData);

    // A placeholder that survived to here means the upload produced nothing.
    for (const name of pendingFiles) {
      if (!uploads[name]) {
        return {
          status: "error",
          message: `The ${spec.fields.find((field) => field.name === name)?.label ?? "image"} could not be uploaded.`,
        };
      }
    }

    const values = { ...parsed.data, ...uploads };

    // Auto-generate slugs
    if (["event_category", "event", "blog", "district", "area"].includes(entity)) {
      const slugValue = String(values.slug ?? "").trim();
      const titleValue = String(values.title ?? values.name ?? "");
      if (!slugValue && titleValue) {
        values.slug = slugify(titleValue);
      } else if (slugValue) {
        values.slug = slugify(slugValue);
      }
    }

    // Admin writes use the service-role client. Authorisation was verified
    // against the session and role above; RLS still protects the anon key.
    const supabase = createAdminClient();
    if (entity === "event" || entity === "blog") {
      values.slug =
        (await uniqueSlug(
          spec.table === "blogs" ? "blogs" : "events",
          String(values.title ?? ""),
          id || null,
        )) ?? values.slug;
    }
    const row = toRow(entity, values);
    const table = spec.table;
    const isBanner = entity === SINGLE_ACTIVE_BANNER;
    const isSingleton = SINGLETON_ENTITIES.has(entity) || isBanner;

    let savedId = id;

    if (SINGLETON_ENTITIES.has(entity)) {
      const { data: existing } = await supabase
        .from(table)
        .select("id")
        .limit(1)
        .maybeSingle();
      savedId = existing?.id ?? "";
      if (existing?.id) {
        const { error } = await supabase.from(table).update(row).eq("id", existing.id);
        if (error) throw new Error(error.message);
      } else {
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(row)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        savedId = inserted.id;
      }
    } else if (entity === SINGLE_ACTIVE_BANNER) {
      const { data: existing } = await supabase
        .from(table)
        .select("id")
        .limit(1)
        .maybeSingle();
      if (existing?.id && !id) {
        const { error } = await supabase.from(table).update(row).eq("id", existing.id);
        if (error) throw new Error(error.message);
        savedId = existing.id;
      } else {
        const { data: inserted, error } = await supabase
          .from(table)
          .insert({ ...row, created_by: session.user.id })
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        savedId = inserted.id;
      }
    } else if (isNew) {
      if (entity === "event" || entity === "media_item" || entity === "blog") {
        row.created_by = session.user.id;
      }
      const { data: inserted, error } = await supabase
        .from(table)
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      savedId = inserted.id;
    } else {
      const { data: previous, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) throw new Error(fetchError.message);

      const { error } = await supabase.from(table).update(row).eq("id", id);
      if (error) throw new Error(error.message);

      await writeAudit("update", spec.auditEntity, id, previous, row);
    }

    if (isNew && !isSingleton) {
      await writeAudit("create", spec.auditEntity, savedId, null, row);
    } else if (isSingleton) {
      await writeAudit(isBanner ? "update_banner" : "update", spec.auditEntity, savedId || null, null, row);
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");

    return {
      status: "success",
      message: `${spec.singular.charAt(0).toUpperCase()}${spec.singular.slice(1)} saved successfully.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const friendly = /duplicate key|unique/i.test(message)
      ? "A record with these details already exists. Try a different slug or name."
      : /row-level security|permission denied/i.test(message)
        ? "You do not have permission to do that."
        : message;

    // Logged so an administrator (or a developer reading server output) can see
    // why a save failed instead of only seeing a generic message in the browser.
    console.error(`[admin] ${spec.auditEntity} save failed:`, message);

    return { status: "error", message: intent === "save" ? friendly : "Something went wrong." };
  }
}

async function uniqueSlug(table: "blogs" | "events", title: string, id: string | null) {
  const supabase = createAdminClient();
  const { data } = await supabase.rpc("next_unique_slug", {
    source_table: table,
    source_title: title,
    source_id: id || null,
  });
  return (data as string) ?? null;
}

async function createUserAccount(formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "content_manager");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!z.email().safeParse(email).success) {
    return { status: "error", message: "Enter a valid email address.", errors: { email: "Invalid email." } };
  }
  if (password.length < 8) {
    return {
      status: "error",
      message: "Temporary password must be at least 8 characters.",
      errors: { password: "At least 8 characters." },
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    return { status: "error", message: `Could not create the login: ${error?.message ?? "unknown error"}` };
  }

  const { error: profileError } = await admin
    .from("users")
    .update({ role: role as never, full_name: fullName || null, is_active: formData.get("is_active") === "on" })
    .eq("id", data.user.id);

  if (profileError) {
    return { status: "error", message: `Login created but profile update failed: ${profileError.message}` };
  }

  await writeAudit("create", "users", data.user.id, null, { email, role, full_name: fullName });

  revalidatePath("/admin/users");
  return {
    status: "success",
    message: `Login created for ${email}. Share the temporary password securely and ask them to change it.`,
  };
}

/* -------------------------------------------------------------------------- */
/* Delete & quick actions                                                      */
/* -------------------------------------------------------------------------- */

export async function adminDeleteAction(formData: FormData): Promise<void> {
  const entity = String(formData.get("__entity") ?? "") as EntityKey;
  const id = String(formData.get("__id") ?? "");
  const spec = ENTITY_SPECS[entity];
  if (!spec || !id) return;

  const session = await getAdminSession();
  if (!session) return;
  if (roleRank(session.user.role) < roleRank(spec.minimumRole)) return;

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from(spec.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from(spec.table).delete().eq("id", id);
  if (error) {
    console.error("delete failed:", error.message);
    return;
  }

  await writeAudit("delete", spec.auditEntity, id, previous, null);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

export async function adminQuickAction(formData: FormData): Promise<void> {
  const entity = String(formData.get("__entity") ?? "") as EntityKey;
  const id = String(formData.get("__id") ?? "");
  const action = String(formData.get("__action") ?? "");
  const spec = ENTITY_SPECS[entity];
  if (!spec || !id) return;

  const session = await getAdminSession();
  if (!session) return;
  if (roleRank(session.user.role) < roleRank(spec.minimumRole)) return;

  const supabase = createAdminClient();
  const updates: Record<string, unknown> = {};
  let auditAction = action;

  switch (`${entity}:${action}`) {
    case "banner:toggle-published":
      updates.is_enabled = formData.get("value") === "true";
      auditAction = updates.is_enabled ? "enable_banner" : "disable_banner";
      break;
    case "page_content:toggle-published":
      updates.is_published = formData.get("value") === "true";
      auditAction = "toggle_published";
      break;
    case "blog:set-approved":
      updates.status = "approved";
      break;
    case "blog:set-rejected":
      updates.status = "rejected";
      break;
    case "blog:set-unpublished":
      updates.status = "unpublished";
      break;
    case "blog:set-pending":
      updates.status = "pending";
      break;
    case "event:toggle-published":      updates.is_published = formData.get("value") === "true";
      auditAction = String(formData.get("value")) === "true" ? "publish" : "unpublish";
      break;
    case "event:toggle-featured":
      updates.is_featured = formData.get("value") === "true";
      auditAction = "toggle_featured";
      break;
    case "event_category:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = "toggle_active";
      break;
    case "media_item:toggle-published":
      updates.is_published = formData.get("value") === "true";
      auditAction = String(formData.get("value")) === "true" ? "publish" : "unpublish";
      break;
    case "member:set-disabled":
      updates.status = "disabled";
      auditAction = "disable_member";
      break;
    case "member:set-active":
      updates.status = "active";
      auditAction = "activate_member";
      break;
    case "district:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = "toggle_active";
      break;
    case "area:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = "toggle_active";
      break;
    case "blood_help_admin:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = "toggle_active";
      break;
    case "donor:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = "toggle_active";
      break;
    case "donor:set-willing":
      updates.is_willing = true;
      auditAction = "set_willing";
      break;
    case "donor:set-unwilling":
      updates.is_willing = false;
      auditAction = "set_unwilling";
      break;
    case "donation_request:set-pending":
      updates.status = "pending";
      break;
    case "donation_request:set-in-progress":
      updates.status = "in_progress";
      break;
    case "donation_request:set-fulfilled":
      updates.status = "fulfilled";
      break;
    case "donation_request:set-cancelled":
      updates.status = "cancelled";
      break;
    case "photo_booth_template:toggle-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = updates.is_active ? "activate_template" : "deactivate_template";
      break;
    case "photo_booth_template:toggle-featured":
      updates.is_featured = formData.get("value") === "true";
      auditAction = "toggle_featured_template";
      break;
    case "user:set-active":
      updates.is_active = formData.get("value") === "true";
      auditAction = String(formData.get("value")) === "true" ? "activate_user" : "deactivate_user";
      break;
    default:
      return;
  }

  if (entity === "blog" && updates.status) {
    updates.reviewed_at = new Date().toISOString();
    updates.reviewed_by = session.user.id;
  }

  const { data: previous } = await supabase
    .from(spec.table)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from(spec.table).update(updates).eq("id", id);
  if (error) {
    console.error("quick action failed:", error.message);
    return;
  }

  await writeAudit(auditAction, spec.auditEntity, id, previous, updates);
  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
}

/** Sends the banner toggle from the banner admin page. */
export async function adminToggleBannerAction(formData: FormData): Promise<void> {
  const id = String(formData.get("__id") ?? "");
  const value = formData.get("value") === "true";

  const session = await getAdminSession();
  if (!session) return;
  if (roleRank(session.user.role) < roleRank("content_manager")) return;

  const supabase = createAdminClient();
  const { data: previous } = await supabase
    .from("site_banners")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("site_banners").update({ is_enabled: value }).eq("id", id);
  if (error) {
    console.error("banner toggle failed:", error.message);
    return;
  }

  await writeAudit(value ? "enable_banner" : "disable_banner", "site_banners", id, previous, {
    is_enabled: value,
  });

  revalidatePath("/admin/banner");
  revalidatePath("/", "layout");
}

/**
 * Replaces the photo windows of a template in one go.
 *
 * The visual slot editor collects the geometry and posts it as JSON, so an
 * administrator can reposition or resize every window in a single save.
 */
export async function savePhotoBoothSlotsAction(
  _previous: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const session = await getAdminSession();
  if (!session) return { status: "error", message: "Your session expired. Please sign in again." };
  if (roleRank(session.user.role) < roleRank("content_manager")) {
    return { status: "error", message: "You do not have permission to do that." };
  }

  const templateId = String(formData.get("template_id") ?? "");
  const raw = String(formData.get("slots") ?? "[]");

  if (!templateId) return { status: "error", message: "No template selected." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", message: "The window layout could not be read. Please try again." };
  }

  const slots = z
    .array(
      z.object({
        label: z.string().trim().max(80).nullish(),
        shape: z.enum(["rect", "circle"]),
        x: z.coerce.number().int().min(0),
        y: z.coerce.number().int().min(0),
        width: z.coerce.number().int().min(10),
        height: z.coerce.number().int().min(10),
        radius: z.coerce.number().int().min(0),
        rotation: z.coerce.number().min(-180).max(180),
      }),
    )
    .max(12)
    .safeParse(parsed);

  if (!slots.success) {
    return { status: "error", message: "One or more photo windows have invalid values." };
  }

  const supabase = createAdminClient();

  const { data: template, error: templateError } = await supabase
    .from("photo_booth_templates")
    .select("id, name, width, height")
    .eq("id", templateId)
    .maybeSingle();

  if (templateError || !template) {
    return { status: "error", message: "That template no longer exists." };
  }

  // Windows must sit inside the frame canvas.
  const outside = slots.data.find(
    (slot) =>
      slot.x + slot.width > template.width + 1 || slot.y + slot.height > template.height + 1,
  );
  if (outside) {
    return {
      status: "error",
      message: `The window "${outside.label ?? "untitled"}" extends beyond the frame. Move or resize it inside the canvas.`,
    };
  }

  const { data: previous } = await supabase
    .from("photo_booth_slots")
    .select("*")
    .eq("template_id", templateId)
    .order("display_order");

  const { error: deleteError } = await supabase
    .from("photo_booth_slots")
    .delete()
    .eq("template_id", templateId);
  if (deleteError) return { status: "error", message: deleteError.message };

  if (slots.data.length > 0) {
    const { error: insertError } = await supabase.from("photo_booth_slots").insert(
      slots.data.map((slot, index) => ({
        template_id: templateId,
        label: slot.label ?? `Photo ${index + 1}`,
        shape: slot.shape,
        x: slot.x,
        y: slot.y,
        width: slot.width,
        height: slot.height,
        radius: slot.shape === "circle" ? Math.min(slot.width, slot.height) / 2 : slot.radius,
        rotation: slot.rotation,
        display_order: index + 1,
      })),
    );
    if (insertError) return { status: "error", message: insertError.message };
  }

  await writeAudit("update_windows", "photo_booth_slots", templateId, previous ?? null, slots.data);

  revalidatePath("/admin/photo-booth", "layout");
  revalidatePath("/photo-booth");

  return {
    status: "success",
    message: `Saved ${slots.data.length} photo window${slots.data.length === 1 ? "" : "s"} for "${template.name}".`,
  };
}

/** Re-runs notifications for a blood request that previously failed. */
export async function adminRetryNotificationsAction(formData: FormData): Promise<void> {
  const id = String(formData.get("__id") ?? "");
  const session = await getAdminSession();
  if (!session) return;
  if (roleRank(session.user.role) < roleRank("blood_help_manager")) return;

  const admin = createAdminClient();
  const { data: request } = await admin
    .from("blood_help_requests")
    .select(
      "*, districts(name), areas(name), blood_help_admins(admin_name, email, whatsapp_number)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!request) return;

  const { dispatchBloodHelpNotifications } = await import("@/lib/notifications/dispatch");

  await dispatchBloodHelpNotifications({
    requestId: request.id,
    requestNumber: request.request_number,
    isUnassigned: request.is_unassigned,
    assignedAdminEmail: request.blood_help_admins?.email ?? null,
    assignedAdminWhatsapp: request.blood_help_admins?.whatsapp_number ?? null,
    requesterName: request.requester_name,
    mobileNumber: request.mobile_number,
    bloodGroup: request.blood_group,
    hospitalName: request.hospital_name,
    hospitalLocation: request.hospital_location ?? "",
    requiredDate: request.required_date,
    unitsRequired: request.units_required,
    message: request.message ?? "",
    districtName: request.districts?.name ?? "",
    areaName: request.areas?.name ?? "",
  });

  await writeAudit("retry_notifications", "blood_help_requests", id, null, null);
  revalidatePath("/admin/blood-help/notifications");
}
