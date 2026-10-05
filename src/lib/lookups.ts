/**
 * Domain lookups shared by the public forms, the admin panel and the ID card
 * renderer.
 *
 * The database is the authority for validation: `submit_registration_v2` and
 * `submit_donor` re-check every value against the `blood_group_t` and
 * `gender_t` enums and the `countries` / `states` tables. These lists mirror
 * migration `0006_profiles_and_blood_donation.sql` so a dropdown and a database
 * constraint cannot drift apart, and so no page has to await a query just to
 * render a select.
 */

/** The eight clinical blood groups, in donation-relevance order. */
export const BLOOD_GROUPS = [
  "O+",
  "O-",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

/**
 * The stored value for somebody who does not know their group.
 *
 * Kept as a real enum member rather than a null so the dashboard can tell
 * "never asked" apart from "told us they do not know".
 */
export const UNKNOWN_BLOOD_GROUP = "UNKNOWN";

/** Options for a member choosing their own blood group. */
export const BLOOD_GROUP_OPTIONS: { value: string; label: string }[] = [
  ...BLOOD_GROUPS.map((group) => ({ value: group, label: group })),
  { value: UNKNOWN_BLOOD_GROUP, label: "I Don't Know" },
];

/**
 * Options for a blood donor.
 *
 * "I Don't Know" is deliberately absent: a donor record with no known group
 * cannot be matched to a request, and the database rejects it too.
 */
export const DONOR_BLOOD_GROUP_OPTIONS = BLOOD_GROUPS.map((group) => ({
  value: group,
  label: group,
}));

export function isKnownBloodGroup(value: string | null | undefined): boolean {
  return !!value && (BLOOD_GROUPS as readonly string[]).includes(value);
}

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

export function isGender(value: string | null | undefined): value is Gender {
  return (
    !!value && (GENDER_OPTIONS as { value: string }[]).some((option) => option.value === value)
  );
}

export type Country = {
  /** ISO 3166-1 alpha-2. */
  code: string;
  name: string;
  /** International dialling code without the plus sign, e.g. "91". */
  dial: string;
};

/** Mirrors the `countries` table seeded by migration 0006. */
export const COUNTRIES: Country[] = [
  { code: "AE", name: "United Arab Emirates", dial: "971" },
  { code: "AR", name: "Argentina", dial: "54" },
  { code: "AT", name: "Austria", dial: "43" },
  { code: "AU", name: "Australia", dial: "61" },
  { code: "BD", name: "Bangladesh", dial: "880" },
  { code: "BE", name: "Belgium", dial: "32" },
  { code: "BH", name: "Bahrain", dial: "973" },
  { code: "BR", name: "Brazil", dial: "55" },
  { code: "BT", name: "Bhutan", dial: "975" },
  { code: "CA", name: "Canada", dial: "1" },
  { code: "CH", name: "Switzerland", dial: "41" },
  { code: "CN", name: "China", dial: "86" },
  { code: "DE", name: "Germany", dial: "49" },
  { code: "DK", name: "Denmark", dial: "45" },
  { code: "ES", name: "Spain", dial: "34" },
  { code: "FR", name: "France", dial: "33" },
  { code: "GB", name: "United Kingdom", dial: "44" },
  { code: "ID", name: "Indonesia", dial: "62" },
  { code: "IE", name: "Ireland", dial: "353" },
  { code: "IL", name: "Israel", dial: "972" },
  { code: "IN", name: "India", dial: "91" },
  { code: "IT", name: "Italy", dial: "39" },
  { code: "JP", name: "Japan", dial: "81" },
  { code: "KE", name: "Kenya", dial: "254" },
  { code: "KR", name: "South Korea", dial: "82" },
  { code: "KW", name: "Kuwait", dial: "965" },
  { code: "LK", name: "Sri Lanka", dial: "94" },
  { code: "MV", name: "Maldives", dial: "960" },
  { code: "MM", name: "Myanmar", dial: "95" },
  { code: "MX", name: "Mexico", dial: "52" },
  { code: "MY", name: "Malaysia", dial: "60" },
  { code: "NL", name: "Netherlands", dial: "31" },
  { code: "NO", name: "Norway", dial: "47" },
  { code: "NP", name: "Nepal", dial: "977" },
  { code: "NZ", name: "New Zealand", dial: "64" },
  { code: "OM", name: "Oman", dial: "968" },
  { code: "PH", name: "Philippines", dial: "63" },
  { code: "QA", name: "Qatar", dial: "974" },
  { code: "RU", name: "Russia", dial: "7" },
  { code: "SA", name: "Saudi Arabia", dial: "966" },
  { code: "SE", name: "Sweden", dial: "46" },
  { code: "SG", name: "Singapore", dial: "65" },
  { code: "TH", name: "Thailand", dial: "66" },
  { code: "US", name: "United States", dial: "1" },
  { code: "ZA", name: "South Africa", dial: "27" },
];

export const DEFAULT_COUNTRY_CODE = "IN";

export function findCountry(code: string | null | undefined): Country | undefined {
  if (!code) return undefined;
  return COUNTRIES.find((country) => country.code === code.toUpperCase());
}

/**
 * The dialling code for a country.
 *
 * Falls back to India's code rather than returning nothing, so a member record
 * with a missing country still produces a usable phone number.
 */
export function dialCodeFor(code: string | null | undefined): string {
  return findCountry(code)?.dial ?? "91";
}

export function countryName(code: string | null | undefined): string {
  if (!code) return "";
  return findCountry(code)?.name ?? code;
}

/** Mirrors the `states` table seeded by migration 0006 (India only). */
export const INDIAN_STATES: { code: string; name: string }[] = [
  { code: "TS", name: "Telangana" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "KA", name: "Karnataka" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "KL", name: "Kerala" },
  { code: "GJ", name: "Gujarat" },
  { code: "RJ", name: "Rajasthan" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "BR", name: "Bihar" },
  { code: "WB", name: "West Bengal" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "HR", name: "Haryana" },
  { code: "DL", name: "Delhi" },
  { code: "JK", name: "Jammu & Kashmir" },
  { code: "CG", name: "Chhattisgarh" },
  { code: "JH", name: "Jharkhand" },
  { code: "GA", name: "Goa" },
  { code: "PY", name: "Puducherry" },
  { code: "TR", name: "Tripura" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "NL", name: "Nagaland" },
  { code: "MZ", name: "Mizoram" },
  { code: "AS", name: "Assam" },
  { code: "SK", name: "Sikkim" },
  { code: "UK", name: "Uttarakhand" },
  { code: "AR", name: "Arunachal Pradesh" },
];

export function findState(code: string | null | undefined): { code: string; name: string } | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase();
  return INDIAN_STATES.find((state) => state.code === upper);
}

export function stateName(code: string | null | undefined): string {
  if (!code) return "";
  return findState(code)?.name ?? code;
}

/** How a donor would like to be contacted. */
export const CONTACT_PREFERENCE_OPTIONS = [
  { value: "phone", label: "Phone call" },
  { value: "whatsapp", label: "WhatsApp message" },
  { value: "email", label: "Email" },
] as const;

/** Lifecycle of a donation request, distinct from emergency blood help. */
export const DONATION_REQUEST_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "cancelled", label: "Cancelled" },
] as const;

export type DonationRequestStatus = (typeof DONATION_REQUEST_STATUSES)[number]["value"];