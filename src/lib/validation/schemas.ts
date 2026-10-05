/**
 * Validation schemas (zod).
 *
 * The same rules are enforced again inside the database functions, so these
 * schemas exist for fast, friendly client feedback rather than security.
 */

import { z } from "zod";

import {
  BLOOD_GROUPS,
  BLOOD_GROUP_OPTIONS,
  COUNTRIES,
  GENDER_OPTIONS,
  INDIAN_STATES,
  UNKNOWN_BLOOD_GROUP,
} from "@/lib/lookups";

const trimmed = (schema: z.ZodType<string>) => z.preprocess((v) => (typeof v === "string" ? v.trim() : v), schema);

const COUNTRY_CODES = new Set(COUNTRIES.map((country) => country.code));
const STATE_CODES = new Set(INDIAN_STATES.map((state) => state.code));
const BLOOD_GROUP_VALUES = new Set(BLOOD_GROUP_OPTIONS.map((option) => option.value));
const GENDER_VALUES = new Set<string>(GENDER_OPTIONS.map((option) => option.value));

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
  // Mandatory for new registrations. Members created before migration 0006 keep
  // working because the column is nullable and nothing re-validates them.
  fatherName: trimmed(
    z
      .string()
      .min(2, "Father's name is required.")
      .max(120, "Name must be 120 characters or fewer.")
      .regex(
        /^[\p{L}\p{M}0-9][\p{L}\p{M}\p{N}\s.'-]*$/u,
        "Name must contain letters only.",
      ),
  ),
  gender: trimmed(
    z
      .string()
      .min(1, "Please select a gender.")
      .refine((value) => GENDER_VALUES.has(value), "Please select a valid option."),
  ),
  bloodGroup: trimmed(
    z
      .string()
      .min(1, "Please select your blood group.")
      .refine((value) => BLOOD_GROUP_VALUES.has(value), "Please select a valid blood group."),
  ),
  countryCode: trimmed(
    z
      .string()
      .length(2, "Please select your country.")
      .refine((value) => COUNTRY_CODES.has(value.toUpperCase()), "Please select a supported country."),
  ),
  stateCode: trimmed(
    z
      .string()
      .min(1, "Please select your state.")
      .refine((value) => STATE_CODES.has(value.toUpperCase()), "Please select a supported state."),
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
      .refine((value) => /^[6-9]/.test(value), "Enter a valid mobile number starting with 6, 7, 8 or 9."),
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

/** Everything a public donor has to supply. A donor must know their group. */
export const donorRegistrationSchema = z.object({
  fullName: trimmed(z.string().min(2, "Please enter your name.").max(120, "Name is too long.")),
  fatherName: trimmed(z.string().max(120, "Name is too long.").optional().default("")),
  mobileNumber: trimmed(
    z
      .string()
      .min(7, "Mobile number is required.")
      .max(15, "Enter a valid mobile number.")
      .transform((value) => value.replace(/\D/g, ""))
      .refine((value) => value.length === 10, "Enter a 10 digit mobile number.")
      .refine((value) => /^[6-9]/.test(value), "Enter a valid mobile number starting with 6, 7, 8 or 9."),
  ),
  email: z
    .string()
    .trim()
    .max(160, "Email is too long.")
    .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address.")
    .optional()
    .default(""),
  bloodGroup: trimmed(
    z
      .string()
      .min(1, "Please select your blood group.")
      // "I Don't Know" is offered on the member form but is useless here.
      .refine((value) => value !== UNKNOWN_BLOOD_GROUP, "Please select a blood group.")
      .refine((value) => BLOOD_GROUP_VALUES.has(value), "Please select a valid blood group."),
  ),
  dateOfBirth: z
    .string()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
    .optional()
    .default(""),
  gender: trimmed(z.string().optional().default("")),
  countryCode: trimmed(z.string().length(2, "Please select your country.")),
  stateCode: trimmed(z.string().optional().default("")),
  city: trimmed(z.string().max(120, "Too long.").optional().default("")),
  area: trimmed(z.string().max(120, "Too long.").optional().default("")),
  address: trimmed(z.string().max(400, "Address must be 400 characters or fewer.").optional().default("")),
  lastDonationDate: z
    .string()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
    .optional()
    .default(""),
  availability: trimmed(z.string().max(200, "Please keep this under 200 characters.").optional().default("")),
  preferredContact: trimmed(z.string().optional().default("phone")),
});

export type DonorRegistrationInput = z.infer<typeof donorRegistrationSchema>;

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
