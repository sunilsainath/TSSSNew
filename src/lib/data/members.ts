/**
 * Shared, server-side query handling for the registrations table.
 *
 * Filtering lives in the `filter_members` database function
 * (migration 0008) so the member list and the CSV export run the same query:
 * what you see is what you export. Pagination, search, sorting and every
 * filter stay in the database, so the browser never loads the full list.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  BLOOD_GROUP_OPTIONS,
  COUNTRIES,
  GENDER_OPTIONS,
  INDIAN_STATES,
} from "@/lib/lookups";
import type { MemberRow } from "@/lib/types";

export type MemberQuery = {
  page: number;
  perPage: number;
  search: string;
  status: "all" | "active" | "disabled";
  gender: string;
  bloodGroup: string;
  state: string;
  country: string;
  donated: "all" | "yes" | "no";
  dobFrom: string;
  dobTo: string;
  registeredFrom: string;
  registeredTo: string;
  sort: "created_at" | "full_name" | "village" | "registration_number" | "date_of_birth";
  direction: "asc" | "desc";
};

export const DEFAULT_MEMBER_QUERY: MemberQuery = {
  page: 1,
  perPage: 25,
  search: "",
  status: "all",
  gender: "",
  bloodGroup: "",
  state: "",
  country: "",
  donated: "all",
  dobFrom: "",
  dobTo: "",
  registeredFrom: "",
  registeredTo: "",
  sort: "created_at",
  direction: "desc",
};

export const MEMBER_SORTS: Array<{ value: MemberQuery["sort"]; label: string }> = [
  { value: "created_at", label: "Registration date" },
  { value: "registration_number", label: "Registration number" },
  { value: "full_name", label: "Name" },
  { value: "village", label: "Village" },
  { value: "date_of_birth", label: "Date of birth" },
];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function cleanDate(value: string | undefined): string {
  const trimmed = (value ?? "").trim();
  return DATE_PATTERN.test(trimmed) ? trimmed : "";
}

const KNOWN_GENDERS = new Set(GENDER_OPTIONS.map((option) => option.value.toUpperCase()));
const KNOWN_BLOOD_GROUPS = new Set(BLOOD_GROUP_OPTIONS.map((option) => option.value.toUpperCase()));
const KNOWN_STATES = new Set(INDIAN_STATES.map((state) => state.code.toUpperCase()));
const KNOWN_COUNTRIES = new Set(COUNTRIES.map((country) => country.code.toUpperCase()));

/**
 * A value the UI could never have produced is treated as unset, so a typo in a
 * hand-edited URL shows the full list instead of a mysteriously empty one.
 */
function known(value: string, knownValues: Set<string>): string {
  const upper = value.trim().toUpperCase();
  return knownValues.has(upper) ? upper : "";
}

export function parseMemberQuery(params: {
  page?: string;
  search?: string;
  status?: string;
  gender?: string;
  bloodGroup?: string;
  state?: string;
  country?: string;
  donated?: string;
  dobFrom?: string;
  dobTo?: string;
  registeredFrom?: string;
  registeredTo?: string;
  sort?: string;
  direction?: string;
  perPage?: string;
}): MemberQuery {
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const perPage = Math.min(200, Math.max(10, Number(params.perPage ?? "25") || 25));
  const search = (params.search ?? "").trim().slice(0, 120);
  const status = (["all", "active", "disabled"] as const).find(
    (value) => value === params.status,
  ) ?? "all";
  const donated = (["all", "yes", "no"] as const).find(
    (value) => value === params.donated,
  ) ?? "all";
  const sort = (MEMBER_SORTS.map((item) => item.value) as string[]).includes(params.sort ?? "")
    ? (params.sort as MemberQuery["sort"])
    : "created_at";
  const direction = params.direction === "asc" ? "asc" : "desc";

  return {
    page,
    perPage,
    search,
    status,
    gender: known(params.gender ?? "", KNOWN_GENDERS).toLowerCase(),
    bloodGroup: known(params.bloodGroup ?? "", KNOWN_BLOOD_GROUPS),
    state: known(params.state ?? "", KNOWN_STATES),
    country: known(params.country ?? "", KNOWN_COUNTRIES),
    donated,
    dobFrom: cleanDate(params.dobFrom),
    dobTo: cleanDate(params.dobTo),
    registeredFrom: cleanDate(params.registeredFrom),
    registeredTo: cleanDate(params.registeredTo),
    sort,
    direction,
  };
}

type RpcRow = MemberRow & { total_count: number | string };

function toRows(data: RpcRow[] | null): { rows: MemberRow[]; total: number } {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const rows = (data ?? []).map(({ total_count, ...row }) => row);
  const total = Number(data?.[0]?.total_count ?? 0);
  return { rows, total };
}

export async function queryMembers(query: MemberQuery) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("filter_members", {
    p_search: query.search || null,
    p_status: query.status === "all" ? null : query.status,
    p_gender: query.gender || null,
    p_blood_group: query.bloodGroup || null,
    p_state: query.state || null,
    p_country: query.country || null,
    p_dob_from: query.dobFrom || null,
    p_dob_to: query.dobTo || null,
    p_registered_from: query.registeredFrom || null,
    p_registered_to: query.registeredTo || null,
    p_donated: query.donated === "all" ? null : query.donated === "yes",
    p_sort: query.sort,
    p_direction: query.direction,
    p_limit: query.perPage,
    p_offset: (query.page - 1) * query.perPage,
  });

  if (error) {
    return { rows: [] as MemberRow[], total: 0, error: error.message };
  }

  const { rows, total } = toRows(data as RpcRow[] | null);
  return { rows, total, error: null as string | null };
}

export async function fetchAllMembers(query: MemberQuery) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("filter_members", {
    p_search: query.search || null,
    p_status: query.status === "all" ? null : query.status,
    p_gender: query.gender || null,
    p_blood_group: query.bloodGroup || null,
    p_state: query.state || null,
    p_country: query.country || null,
    p_dob_from: query.dobFrom || null,
    p_dob_to: query.dobTo || null,
    p_registered_from: query.registeredFrom || null,
    p_registered_to: query.registeredTo || null,
    p_donated: query.donated === "all" ? null : query.donated === "yes",
    p_sort: "registration_number",
    p_direction: "asc",
    p_limit: 10000,
    p_offset: 0,
  });

  if (error) {
    return { rows: [], error: error.message as string | null };
  }

  const { rows } = toRows(data as RpcRow[] | null);
  return { rows, error: null as string | null };
}

export const REGISTRATION_EXPORT_COLUMNS = [
  "registration_number",
  "full_name",
  "father_name",
  "date_of_birth",
  "gender",
  "blood_group",
  "village",
  "state_code",
  "country_code",
  "mobile_number",
  "email",
  "designation",
  "status",
  "registered_at",
] as const;

export function toCsv(
  rows: Record<string, unknown>[],
  columns: readonly string[] = Object.keys(rows[0] ?? {}),
): string {
  if (columns.length === 0) return "";

  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escape(row[column])).join(",")),
  ].join("\n");
}