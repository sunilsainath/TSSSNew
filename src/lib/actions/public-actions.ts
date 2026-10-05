/**
 * Server actions for public forms.
 *
 * Every action: validates input, checks honeypot + rate limits, calls the
 * database function (which re-validates and enforces uniqueness), then
 * dispatches notifications. Users only ever receive friendly messages.
 */

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  blogSubmissionSchema,
  bloodHelpSchema,
  fieldErrors,
  registrationSchema,
  type BlogSubmissionInput,
  type BloodHelpInput,
  type RegistrationInput,
} from "@/lib/validation/schemas";
import {
  clientIdentifier,
  isHoneypotTripped,
  rateLimit,
  verifyTurnstile,
} from "@/lib/security/rate-limit";
import { dispatchBloodHelpNotifications } from "@/lib/notifications/dispatch";
import { slugify, textToSafeHtml } from "@/lib/utils/sanitize";
import type { FormState } from "@/lib/actions/state";

/* -------------------------------------------------------------------------- */
/* Registration                                                               */
/* -------------------------------------------------------------------------- */

export async function registerMember(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (isHoneypotTripped(formData)) {
    return { status: "success", message: "Registration received." };
  }

  const headerList = await headers();
  const identifier = clientIdentifier(headerList);

  const limit = rateLimit(`register:${identifier}`, { limit: 8, windowSeconds: 3600 });
  if (!limit.allowed) {
    return {
      status: "error",
      message: "Too many registration attempts. Please try again in a while or contact the administration.",
    };
  }

  const allowed = await verifyTurnstile(
    typeof formData.get("turnstileToken") === "string" ? String(formData.get("turnstileToken")) : null,
    identifier,
  );
  if (!allowed) {
    return { status: "error", message: "Spam verification failed. Please refresh the page and try again." };
  }

  const parsed = registrationSchema.safeParse({
    fullName: formData.get("fullName"),
    fatherName: formData.get("fatherName"),
    gender: formData.get("gender"),
    bloodGroup: formData.get("bloodGroup"),
    countryCode: formData.get("countryCode"),
    stateCode: formData.get("stateCode"),
    dateOfBirth: formData.get("dateOfBirth"),
    village: formData.get("village"),
    mobileNumber: formData.get("mobileNumber"),
    email: formData.get("email") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input: RegistrationInput = parsed.data;

  // The profile photo is optional. A failed upload is reported but never blocks
  // an otherwise valid registration, since the number is issued either way.
  let profilePhotoUrl = "";
  const photo = formData.get("profilePhoto");
  if (photo instanceof File && photo.size > 0) {
    const uploaded = await uploadPublicImage(photo, "profile-photos");
    if (!uploaded.ok) {
      return { status: "error", message: uploaded.error, errors: { profilePhoto: uploaded.error } };
    }
    profilePhotoUrl = uploaded.url;
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("submit_registration_v2", {
    p_full_name: input.fullName,
    p_date_of_birth: input.dateOfBirth,
    p_father_name: input.fatherName,
    p_gender: input.gender,
    p_blood_group: input.bloodGroup,
    p_state_code: input.stateCode,
    p_country_code: input.countryCode.toUpperCase(),
    p_village: input.village,
    p_mobile_number: input.mobileNumber,
    p_phone_country_code: null,
    p_profile_photo_url: profilePhotoUrl || null,
    p_email: input.email || null,
    p_rate_key: identifier,
  });

  if (error) {
    const code = error.message ?? "";
    if (code.includes("already_registered")) {
      return {
        status: "error",
        message:
          "You are already registered. If you believe this is an issue, please contact the administration.",
      };
    }
    if (code.includes("RATE_LIMITED")) {
      return {
        status: "error",
        message: "Too many attempts from this device. Please try again later.",
      };
    }
    if (
      code.includes("INVALID_MOBILE") ||
      code.includes("INVALID_DOB") ||
      code.includes("INVALID_NAME") ||
      code.includes("INVALID_VILLAGE") ||
      code.includes("INVALID_FATHER_NAME") ||
      code.includes("INVALID_BLOOD_GROUP") ||
      code.includes("INVALID_GENDER") ||
      code.includes("INVALID_COUNTRY") ||
      code.includes("INVALID_STATE")
    ) {
      return { status: "error", message: "Please check your details and try again." };
    }
    console.error("submit_registration_v2 failed:", error.message);
    return {
      status: "error",
      message: "We could not complete your registration right now. Please try again in a moment.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const resultCode = row?.result_code as string | undefined;

  if (resultCode === "already_registered") {
    return {
      status: "error",
      message:
        "You are already registered. If you believe this is an issue, please contact the administration.",
    };
  }

  revalidatePath("/admin/registrations");

  return {
    status: "success",
    message: "Registration successful.",
    data: {
      registrationNumber: row?.registration_number ?? "",
      fullName: row?.full_name ?? input.fullName,
      dateOfBirth: row?.date_of_birth ?? input.dateOfBirth,
      village: row?.village ?? input.village,
      registeredAt: row?.registered_at ?? new Date().toISOString(),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Blood help                                                                 */
/* -------------------------------------------------------------------------- */

export async function submitBloodHelpRequest(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (isHoneypotTripped(formData)) {
    return { status: "success", message: "Request received." };
  }

  const headerList = await headers();
  const identifier = clientIdentifier(headerList);

  const limit = rateLimit(`blood:${identifier}`, { limit: 5, windowSeconds: 3600 });
  if (!limit.allowed) {
    return {
      status: "error",
      message:
        "Too many blood help requests from this device. Please call the helpline if this is urgent.",
    };
  }

  const allowed = await verifyTurnstile(
    typeof formData.get("turnstileToken") === "string" ? String(formData.get("turnstileToken")) : null,
    identifier,
  );
  if (!allowed) {
    return { status: "error", message: "Spam verification failed. Please refresh the page and try again." };
  }

  const parsed = bloodHelpSchema.safeParse({
    requesterName: formData.get("requesterName"),
    mobileNumber: formData.get("mobileNumber"),
    bloodGroup: formData.get("bloodGroup"),
    hospitalName: formData.get("hospitalName"),
    hospitalLocation: formData.get("hospitalLocation") ?? "",
    districtId: formData.get("districtId"),
    areaId: formData.get("areaId") ?? "",
    requiredDate: formData.get("requiredDate") ?? "",
    unitsRequired: formData.get("unitsRequired"),
    message: formData.get("message") ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input: BloodHelpInput = parsed.data;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_blood_request", {
    p_requester_name: input.requesterName,
    p_mobile_number: input.mobileNumber,
    p_blood_group: input.bloodGroup,
    p_hospital_name: input.hospitalName,
    p_hospital_location: input.hospitalLocation || null,
    p_district_id: input.districtId,
    p_area_id: input.areaId || null,
    p_required_date: input.requiredDate || null,
    p_units_required: input.unitsRequired,
    p_message: input.message || null,
    p_rate_key: identifier,
  });

  if (error) {
    const code = error.message ?? "";
    if (code.includes("RATE_LIMITED")) {
      return { status: "error", message: "Too many requests from this device. Please try again later." };
    }
    if (code.startsWith("INVALID_")) {
      return { status: "error", message: "Please check your details and try again." };
    }
    console.error("create_blood_request failed:", error.message);
    return {
      status: "error",
      message: "We could not submit your request right now. Please try again or call the helpline.",
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const requestId = row?.request_id as string | undefined;
  const isUnassigned = Boolean(row?.is_unassigned);

  if (requestId) {
    const outcome = await dispatchBloodHelpNotifications({
      requestId,
      requestNumber: String(row?.request_number ?? ""),
      isUnassigned,
      assignedAdminEmail: (row?.assigned_admin_email as string | null) ?? null,
      assignedAdminWhatsapp: (row?.assigned_admin_whatsapp as string | null) ?? null,
      requesterName: String(row?.requester_name ?? ""),
      mobileNumber: String(row?.mobile_number ?? ""),
      bloodGroup: String(row?.blood_group ?? ""),
      hospitalName: String(row?.hospital_name ?? ""),
      hospitalLocation: (row?.hospital_location as string | null) ?? "",
      requiredDate: (row?.required_date as string | null) ?? null,
      unitsRequired: Number(row?.units_required ?? 1),
      message: (row?.message as string | null) ?? "",
      districtName: String(formData.get("districtName") ?? ""),
      areaName: String(formData.get("areaName") ?? ""),
    });

    revalidatePath("/admin/blood-help/requests");
    if (!outcome.delivered) {
      return {
        status: "success",
        message:
          "Your request was saved, but our volunteers could not be notified automatically. Please call the blood helpline so we can act quickly.",
        data: {
          requestNumber: String(row?.request_number ?? ""),
          unassigned: true,
        },
      };
    }
  }

  return {
    status: "success",
    message: isUnassigned
      ? "Your request has been recorded. Our central team has been informed and will contact you shortly."
      : "Your request has been recorded and the district volunteer has been notified.",
    data: {
      requestNumber: String(row?.request_number ?? ""),
      unassigned: isUnassigned,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Public blog submission                                                     */
/* -------------------------------------------------------------------------- */

export async function submitBlogPost(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (isHoneypotTripped(formData)) {
    return { status: "success", message: "Thank you. Your article has been submitted for review." };
  }

  const headerList = await headers();
  const identifier = clientIdentifier(headerList);

  const limit = rateLimit(`blog:${identifier}`, { limit: 3, windowSeconds: 86_400 });
  if (!limit.allowed) {
    return {
      status: "error",
      message: "You have already submitted articles recently. Please try again tomorrow.",
    };
  }

  const allowed = await verifyTurnstile(
    typeof formData.get("turnstileToken") === "string" ? String(formData.get("turnstileToken")) : null,
    identifier,
  );
  if (!allowed) {
    return { status: "error", message: "Spam verification failed. Please refresh the page and try again." };
  }

  let imageUrl = "";
  const upload = formData.get("featuredImage");
  if (upload instanceof File && upload.size > 0) {
    const uploaded = await uploadPublicImage(upload, "blogs");
    if (!uploaded.ok) {
      return { status: "error", message: uploaded.error };
    }
    imageUrl = uploaded.url;
  } else if (typeof upload === "string" && upload.trim()) {
    imageUrl = upload.trim();
  }

  const parsed = blogSubmissionSchema.safeParse({
    authorName: formData.get("authorName"),
    authorEmail: formData.get("authorEmail"),
    authorMobile: formData.get("authorMobile") ?? "",
    title: formData.get("title"),
    category: formData.get("category"),
    content: formData.get("content"),
    featuredImage: imageUrl,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      errors: fieldErrors(parsed.error),
    };
  }

  const input: BlogSubmissionInput = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.rpc("submit_blog", {
    p_author_name: input.authorName,
    p_author_email: input.authorEmail,
    p_author_mobile: input.authorMobile || null,
    p_title: input.title,
    p_content: textToSafeHtml(input.content),
    p_category: input.category,
    p_featured_image: input.featuredImage || null,
    p_rate_key: identifier,
  });

  if (error) {
    if (error.message.includes("RATE_LIMITED")) {
      return { status: "error", message: "You have already submitted articles recently. Please try again later." };
    }
    console.error("submit_blog failed:", error.message);
    return {
      status: "error",
      message: "We could not submit your article right now. Please try again in a moment.",
    };
  }

  revalidatePath("/admin/blogs");

  return {
    status: "success",
    message: "Thank you. Your article has been submitted and is awaiting administrator approval.",
    data: { slug: slugify(input.title) },
  };
}

/* -------------------------------------------------------------------------- */
/* Shared image upload                                                        */
/* -------------------------------------------------------------------------- */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Uploads an image to the public Supabase Storage bucket.
 * Type and size are validated here and again by the storage bucket policy.
 */
export async function uploadPublicImage(
  file: File,
  folder = "uploads",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { ok: false, error: "Only JPG, PNG, WebP or AVIF images are allowed." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 4 MB." };
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;

  const supabase = await createClient();
  const { error } = await supabase.storage.from("public-media").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    console.error("storage upload failed:", error.message);
    return { ok: false, error: "We could not upload that image. Please try a different file." };
  }

  const { data } = supabase.storage.from("public-media").getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
