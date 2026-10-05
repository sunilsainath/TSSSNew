"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/server";
import { getAdminSession, roleRank } from "@/lib/auth/session";
import { writeAudit } from "@/lib/actions/admin-actions";
import {
  MAX_FILE_BYTES,
  MAX_ROWS,
  normaliseMobile,
  parseImportRows,
  validateImportRow,
  type ImportRow,
} from "@/lib/blood-donation/csv";

/**
 * Bulk donation import for camps.
 *
 * Two steps, both server-side, no pending state stored anywhere:
 *
 * 1. `previewDonationImport` parses the uploaded CSV, validates every row and
 *    returns the parsed rows with per-row errors. Nothing is written.
 * 2. `confirmDonationImport` receives the same rows back, re-validates them
 *    from scratch, and writes the valid ones. Error rows are skipped and
 *    reported; duplicates are skipped by the (camp_id, external_ref) key.
 *
 * Re-validation on confirm means a tampered preview cannot smuggle bad data
 * past the checks.
 */

export type ValidatedRow = {
  row: ImportRow;
  errors: string[];
  /** True when this exact donation is already recorded. */
  duplicate: boolean;
};

export type ImportPreview = {
  campId: string | null;
  campName: string | null;
  rows: ValidatedRow[];
  valid: number;
  errors: number;
  duplicates: number;
};

async function requireContentManager() {
  const session = await getAdminSession();
  if (!session) return { session: null, error: "Your session expired. Please sign in again." };
  if (roleRank(session.user.role) < roleRank("content_manager")) {
    return { session: null, error: "You do not have permission to do that." };
  }
  return { session, error: null as string | null };
}

export async function previewDonationImport(
  _previous: { preview: ImportPreview | null; error?: string },
  formData: FormData,
): Promise<{ preview: ImportPreview | null; error?: string }> {
  const auth = await requireContentManager();
  if (auth.error) return { preview: null, error: auth.error };

  const campId = String(formData.get("campId") ?? "").trim() || null;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { preview: null, error: "Choose a CSV file to upload." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { preview: null, error: "The file is too large. Keep imports under 2 MB (about 2000 rows)." };
  }

  const parsed = parseImportRows(await file.text());
  if ("error" in parsed) return { preview: null, error: parsed.error };

  const supabase = createAdminClient();

  let campName: string | null = null;
  if (campId) {
    const { data: camp } = await supabase
      .from("donation_camps")
      .select("name")
      .eq("id", campId)
      .maybeSingle();
    campName = camp?.name ?? null;
  }

  // Existing donations for this selection, so re-uploads are recognised.
  // Without a camp the standalone unique index on external_ref does the same job.
  let existingRefs = new Set<string>();
  {
    let query = supabase.from("donations").select("external_ref").not("external_ref", "is", null);
    query = campId ? query.eq("camp_id", campId) : query.is("camp_id", null);
    const { data } = await query;
    existingRefs = new Set((data ?? []).map((row) => String(row.external_ref)));
  }

  const rows: ValidatedRow[] = parsed.rows.map((row, index) => {
    const errors = validateImportRow(row, campId);
    const ref = row.external_ref || `${campId ?? "no-camp"}:${index + 1}`;
    return { row, errors, duplicate: errors.length === 0 && existingRefs.has(ref) };
  });

  return {
    preview: {
      campId,
      campName,
      rows,
      valid: rows.filter((row) => row.errors.length === 0 && !row.duplicate).length,
      errors: rows.filter((row) => row.errors.length > 0).length,
      duplicates: rows.filter((row) => row.duplicate).length,
    },
  };
}

export type ImportResult = {
  imported: number;
  skippedErrors: number;
  skippedDuplicates: number;
  errors: Array<{ line: number; message: string }>;
};

export async function confirmDonationImport(
  _previous: { result: ImportResult | null; error?: string },
  formData: FormData,
): Promise<{ result: ImportResult | null; error?: string }> {
  const auth = await requireContentManager();
  if (auth.error) return { result: null, error: auth.error };

  const campId = String(formData.get("campId") ?? "").trim() || null;
  const rawRows = String(formData.get("rows") ?? "");

  let rows: ImportRow[];
  try {
    const parsed: unknown = JSON.parse(rawRows);
    if (!Array.isArray(parsed)) throw new Error("not an array");
    rows = parsed as ImportRow[];
  } catch {
    return { result: null, error: "The preview data was unreadable. Upload the file again." };
  }

  if (rows.length === 0 || rows.length > MAX_ROWS) {
    return { result: null, error: "Nothing to import. Upload the file again." };
  }

  const supabase = createAdminClient();
  const result: ImportResult = { imported: 0, skippedErrors: 0, skippedDuplicates: 0, errors: [] };

  // The camp date fills in rows that leave the date blank.
  let campDate: string | null = null;
  if (campId) {
    const { data: camp } = await supabase
      .from("donation_camps")
      .select("camp_date")
      .eq("id", campId)
      .maybeSingle();
    campDate = camp?.camp_date ?? null;
  }

  for (const [index, row] of rows.entries()) {
    const safe = { line: row.line ?? index + 2 } as ImportRow;
    for (const column of [
      "full_name",
      "father_name",
      "mobile_number",
      "phone_country_code",
      "email",
      "blood_group",
      "date_of_birth",
      "gender",
      "city",
      "area",
      "address",
      "last_donation_date",
      "units",
      "donation_date",
      "external_ref",
    ] as const) {
      safe[column] = String((row as Record<string, unknown>)[column] ?? "").trim();
    }

    // Re-validated from scratch: a tampered preview cannot smuggle bad data in.
    const errors = validateImportRow(safe, campId);
    if (errors.length > 0) {
      result.skippedErrors += 1;
      result.errors.push({ line: safe.line, message: errors.join(" ") });
      continue;
    }

    const mobile = normaliseMobile(safe.mobile_number);
    const bloodGroup = safe.blood_group.trim().toUpperCase();
    const units = safe.units.trim() === "" ? 1 : Number(safe.units.trim());
    const ref = safe.external_ref || `${campId ?? "no-camp"}:${index + 1}`;
    const donationDate =
      safe.donation_date || campDate || new Date().toISOString().slice(0, 10);

    // Re-uploads of the same file resolve to the same refs and stop here.
    {
      let query = supabase.from("donations").select("id").eq("external_ref", ref);
      query = campId ? query.eq("camp_id", campId) : query.is("camp_id", null);
      const { data: existing } = await query.maybeSingle();
      if (existing) {
        result.skippedDuplicates += 1;
        continue;
      }
    }

    // One live donor per mobile number, so the dashboard never double counts.
    const { data: donor } = await supabase
      .from("donors")
      .select("id")
      .eq("mobile_number", mobile)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    let donorId: string | null = donor?.id ?? null;

    if (!donorId) {
      const { data: created, error: donorError } = await supabase
        .from("donors")
        .insert({
          full_name: safe.full_name,
          father_name: safe.father_name || null,
          mobile_number: mobile,
          phone_country_code: safe.phone_country_code || "91",
          email: safe.email || null,
          blood_group: bloodGroup,
          date_of_birth: safe.date_of_birth || null,
          gender: safe.gender ? safe.gender.toLowerCase() : null,
          city: safe.city || null,
          area: safe.area || null,
          address: safe.address || null,
          last_donation_date: safe.last_donation_date || donationDate,
          is_willing: true,
          country_code: "IN",
        })
        .select("id")
        .single();

      if (donorError || !created) {
        result.skippedErrors += 1;
        result.errors.push({ line: safe.line, message: "The donor record could not be saved." });
        continue;
      }

      donorId = created.id;
    } else {
      // Keep the donor's most recent donation date current.
      await supabase
        .from("donors")
        .update({ last_donation_date: donationDate })
        .eq("id", donorId)
        .lt("last_donation_date", donationDate);
    }

    const { error: donationError } = await supabase.from("donations").insert({
      donor_id: donorId,
      camp_id: campId,
      donation_date: donationDate,
      units,
      blood_group: bloodGroup,
      source: campId ? "camp" : "import",
      external_ref: ref,
    });

    if (donationError) {
      // A concurrent re-upload winning the race lands here via the unique key.
      if (/duplicate|unique/i.test(donationError.message)) {
        result.skippedDuplicates += 1;
        continue;
      }
      result.skippedErrors += 1;
      result.errors.push({ line: safe.line, message: "The donation record could not be saved." });
      continue;
    }

    result.imported += 1;
  }

  try {
    await writeAudit("bulk_import", "donations", campId, null, {
      imported: result.imported,
      skippedErrors: result.skippedErrors,
      skippedDuplicates: result.skippedDuplicates,
    });
  } catch {
    // Audit trouble must not fail an import that already succeeded.
  }

  revalidatePath("/admin/blood-donation");
  revalidatePath("/admin/blood-donation/camps");

  return { result };
}