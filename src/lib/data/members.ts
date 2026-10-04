/**
 * Shared, server-side query handling for the registrations table.
 * Keeps pagination, search, sorting and filtering in the database so the
 * browser never loads the full member list.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MemberRow } from "@/lib/types";

export type MemberQuery = {
  page: number;
  perPage: number;
  search: string;
  status: "all" | "active" | "disabled";
  sort: "created_at" | "full_name" | "village" | "registration_number" | "date_of_birth";
  direction: "asc" | "desc";
};

export const DEFAULT_MEMBER_QUERY: MemberQuery = {
  page: 1,
  perPage: 25,
  search: "",
  status: "all",
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

export function parseMemberQuery(params: {
  page?: string;
  search?: string;
  status?: string;
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
  const sort = (MEMBER_SORTS.map((item) => item.value) as string[]).includes(params.sort ?? "")
    ? (params.sort as MemberQuery["sort"])
    : "created_at";
  const direction = params.direction === "asc" ? "asc" : "desc";

  return { page, perPage, search, status, sort, direction };
}

export async function queryMembers(query: MemberQuery) {
  const supabase = await createClient();
  const from = (query.page - 1) * query.perPage;
  const to = from + query.perPage - 1;

  let builder = supabase
    .from("members")
    .select("*", { count: "exact" })
    .order(query.sort, { ascending: query.direction === "asc", nullsFirst: false })
    .range(from, to);

  if (query.status !== "all") builder = builder.eq("status", query.status);

  if (query.search) {
    const term = query.search.replace(/[%_,()]/g, " ");
    builder = builder.or(
      `registration_number.ilike.%${term}%,full_name.ilike.%${term}%,village.ilike.%${term}%,mobile_number.ilike.%${term}%`,
    );
  }

  const { data, error, count } = await builder;

  return {
    rows: (data ?? []) as MemberRow[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function fetchAllMembers(query: Pick<MemberQuery, "search" | "status">) {
  const supabase = await createClient();

  let builder = supabase
    .from("members")
    .select(
      "registration_number,full_name,date_of_birth,village,mobile_number,status,created_at,updated_at",
    )
    .order("registration_number", { ascending: true })
    .limit(10000);

  if (query.status !== "all") builder = builder.eq("status", query.status);

  if (query.search) {
    const term = query.search.replace(/[%_,()]/g, " ");
    builder = builder.or(
      `registration_number.ilike.%${term}%,full_name.ilike.%${term}%,village.ilike.%${term}%,mobile_number.ilike.%${term}%`,
    );
  }

  const { data, error } = await builder;
  return { rows: data ?? [], error: error?.message ?? null };
}

export const REGISTRATION_EXPORT_COLUMNS = [
  "registration_number",
  "full_name",
  "date_of_birth",
  "village",
  "mobile_number",
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
