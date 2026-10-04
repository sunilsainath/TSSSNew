/**
 * Validation schemas (zod).
 *
 * The same rules are enforced again inside the database functions, so these
 * schemas exist for fast, friendly client feedback rather than security.
 */

import { z } from "zod";

import { BLOOD_GROUPS } from "@/lib/constants";

const trimmed = (schema: z.ZodType<string>) => z.preprocess((v) => (typeof v === "string" ? v.trim() : v), schema);

export const registrationSchema = z.object({
  fullName: trimmed(
    z
      .string()
      .min(2, "Please enter your full name.")
      .max(120, "Name must be 120 characters or fewer.")
      .regex(
        /^[\p{L}\p{M}0-9][\p{L}\p{M}\p{N}\s.'-]*$/u,
        "Name must contain letters only.",
      ),
  ),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required.")
    .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00`);
      if (Number.isNaN(date.getTime())) return false;
      const now = new Date();
      return date <= now && date >= new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
    }, "Date of birth must be a valid past date."),
  village: trimmed(
    z.string().min(2, "Village is required.").max(120, "Village must be 120 characters or fewer."),
  ),
  mobileNumber: trimmed(
    z
      .string()
      .min(10, "Mobile number is required.")
      .max(15, "Enter a valid mobile number.")
      .transform((value) => value.replace(/\D/g, ""))
      .refine((value) => value.length === 10, "Enter a 10 digit mobile number.")
      .refine((value) => /^[6-9]/.test(value), "Enter a valid Indian mobile number."),
  ),
  email: z
    .string()
    .trim()
    .max(160, "Email is too long.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address.")
    .optional()
    .default(""),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export const bloodHelpSchema = z.object({
  requesterName: trimmed(
    z.string().min(2, "Please enter the requester's name.").max(120, "Name is too long."),
  ),
  mobileNumber: trimmed(
    z
      .string()
      .min(10, "Mobile number is required.")
      .max(15, "Enter a valid mobile number.")
      .transform((value) => value.replace(/\D/g, ""))
      .refine((value) => /^[6-9]\d{9}$/.test(value), "Enter a valid 10 digit mobile number."),
  ),
  bloodGroup: trimmed(z.enum(BLOOD_GROUPS, { message: "Select a blood group." })),
  hospitalName: trimmed(
    z.string().min(2, "Hospital name is required.").max(160, "Hospital name is too long."),
  ),
  hospitalLocation: trimmed(z.string().max(160, "Location is too long.")).default(""),
  districtId: trimmed(z.string().min(1, "Select a district.")),
  areaId: trimmed(z.string().max(64, "Invalid area.")).default(""),
  requiredDate: z
    .string()
    .max(10, "Enter a valid date.")
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
    .refine((value) => {
      if (value === "") return true;
      const date = new Date(`${value}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date.getTime() >= today.getTime();
    }, "Required date cannot be in the past.")
    .default(""),
  unitsRequired: z.coerce
    .number({ message: "Units required is required." })
    .int("Enter a whole number of units.")
    .min(1, "At least one unit is required.")
    .max(50, "Contact us directly for more than 50 units."),
  message: trimmed(z.string().max(1000, "Message must be 1000 characters or fewer.")).default(""),
});

export type BloodHelpInput = z.infer<typeof bloodHelpSchema>;

export const blogSubmissionSchema = z.object({
  authorName: trimmed(
    z.string().min(2, "Please enter your name.").max(120, "Name is too long."),
  ),
  authorEmail: z
    .string()
    .trim()
    .min(5, "Email is required.")
    .max(160, "Email is too long.")
    .refine((value) => z.email().safeParse(value).success, "Enter a valid email address."),
  authorMobile: trimmed(z.string().max(15, "Enter a valid mobile number.")).default(""),
  title: trimmed(
    z.string().min(5, "Title must be at least 5 characters.").max(200, "Title is too long."),
  ),
  category: trimmed(z.string().min(1, "Select a category.").max(60, "Category is too long.")),
  content: trimmed(
    z.string().min(50, "Please write at least 50 characters so reviewers have enough to work with."),
  ),
  featuredImage: trimmed(z.string().max(500, "Image URL is too long.")).default(""),
});

export type BlogSubmissionInput = z.infer<typeof blogSubmissionSchema>;

/** Flattens a zod error into `{ field: message }` for form state. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
