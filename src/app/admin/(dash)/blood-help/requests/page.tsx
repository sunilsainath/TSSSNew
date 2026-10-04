import Link from "next/link";

import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type {
  BloodHelpAdminRow,
  BloodHelpRequestRow,
  DistrictRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUSES = ["NEW", "CONTACTED", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export default async function BloodHelpRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const spec = ENTITY_SPECS.blood_request;
  const supabase = await createClient();

  let query = supabase
    .from("blood_help_requests")
    .select("*, districts(name), areas(name), blood_help_admins(admin_name)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.status && (STATUSES as readonly string[]).includes(params.status)) {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    const term = `%${params.q.replace(/[%_,]/g, "")}%`;
    query = query.or(
      `request_number.ilike.${term},requester_name.ilike.${term},hospital_name.ilike.${term},mobile_number.ilike.${term}`,
    );
  }

  const [{ data }, { data: admins }, { data: districts }] = await Promise.all([
    query,
    supabase.from("blood_help_admins").select("id, admin_name"),
    supabase.from("districts").select("id, name"),
  ]);

  const requests = (data ?? []) as Array<
    BloodHelpRequestRow & {
      districts: { name: string } | null;
      areas: { name: string } | null;
      blood_help_admins: { admin_name: string } | null;
    }
  >;
  const adminList = (admins ?? []) as Array<{ id: string; admin_name: string }>;
  const districtList = (districts ?? []) as DistrictRow[];

  const statusFields = spec.fields.map((field) =>
    field.name === "assigned_admin_id"
      ? {
          ...field,
          options: adminList.map((admin) => ({ value: admin.id, label: admin.admin_name })),
        }
      : field,
  );

  return (
    <>
      <AdminPageHeader
        title="Blood help requests"
        description="Requests are routed automatically to the district or area administrator. Unassigned requests are flagged for the central team."
      />

      <nav aria-label="Request status filter" className="mb-5 flex flex-wrap gap-2">
        <Link
          href="/admin/blood-help/requests"
          aria-current={!params.status ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !params.status ? "bg-ink-900 text-white" : "bg-white text-ink-700 ring-1 ring-brand-200 hover:ring-gold-400"
          }`}
        >
          All
        </Link>
        {STATUSES.map((status) => (
          <Link
            key={status}
            href={`/admin/blood-help/requests?status=${status}`}
            aria-current={params.status === status ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              params.status === status
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-700 ring-1 ring-brand-200 hover:ring-gold-400"
            }`}
          >
            {status.replace("_", " ")}
          </Link>
        ))}
      </nav>

      <form action="/admin/blood-help/requests" className="mb-5 flex flex-wrap gap-2">
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        <label htmlFor="blood-search" className="sr-only">
          Search requests
        </label>
        <input
          id="blood-search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search request no, name, hospital or mobile…"
          className="h-10 w-full rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-200 focus:outline-none sm:w-80"
        />
        <button
          type="submit"
          className="h-10 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800"
        >
          Search
        </button>
      </form>

      {requests.length === 0 ? (
        <div className="surface-card p-10 text-center text-sm text-slate-500">
          No blood help requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-ink-900">
                      {request.request_number}
                    </span>
                    <StatusBadge value={request.status} />
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                      {request.blood_group}
                    </span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                      {request.units_required} unit{request.units_required === 1 ? "" : "s"}
                    </span>
                    {request.is_unassigned ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Unassigned
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 font-display text-lg font-semibold text-ink-900">
                    {request.requester_name} · {request.mobile_number}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {request.hospital_name}
                    {request.hospital_location ? `, ${request.hospital_location}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {request.areas?.name ? `${request.areas.name}, ` : ""}
                    {request.districts?.name ?? "District not set"} · Required{" "}
                    {request.required_date ?? "ASAP"} · Submitted {formatDateTime(request.created_at)}
                  </p>
                  {request.message ? (
                    <p className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm leading-relaxed text-slate-700">
                      {request.message}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-slate-500">
                    Assigned to:{" "}
                    <span className="font-semibold text-ink-800">
                      {request.blood_help_admins?.admin_name ?? "Central team (no area administrator configured)"}
                    </span>
                  </p>
                </div>
              </div>

              <details className="mt-4">
                <summary className="cursor-pointer text-xs font-semibold text-gold-700">
                  Update status / assignment
                </summary>
                <div className="mt-4">
                  <ResourceForm
                    entity="blood_request"
                    fields={statusFields}
                    id={request.id}
                    defaults={{
                      status: request.status,
                      assigned_admin_id: request.assigned_admin_id ?? "",
                      resolution_note: request.resolution_note ?? "",
                    }}
                    submitLabel="Save update"
                  />
                </div>
              </details>
            </article>
          ))}
        </div>
      )}

      <div className="surface-card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Coverage</h2>
        <p className="mt-2 text-sm text-slate-600">
          {districtList.length} district(s) configured. Assign administrators so new requests are routed automatically.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/blood-help/administrators"
            className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Manage administrators
          </Link>
          <Link
            href="/admin/blood-help/notifications"
            className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Notification logs
          </Link>
        </div>
      </div>
    </>
  );
}

export type { BloodHelpAdminRow };
