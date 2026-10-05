import Link from "next/link";

import { AdminPageHeader, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "in_progress", "fulfilled", "cancelled"] as const;

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

/**
 * Donation requests are the non-emergency queue: a planned transfusion, a camp
 * follow-up, a scheduled surgery. Emergencies keep going through Blood Help,
 * which routes and notifies automatically. Nothing here sends notifications.
 */
export default async function DonationRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const status = (params.status ?? "") as string;

  const supabase = await createClient();

  let builder = supabase
    .from("donation_requests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if ((STATUSES as readonly string[]).includes(status)) {
    builder = builder.eq("status", status);
  }

  const { data } = await builder;
  const requests = data ?? [];

  const editing = params.edit ? requests.find((row) => row.id === params.edit) ?? null : null;
  const spec = ENTITY_SPECS.donation_request;

  return (
    <>
      <AdminPageHeader
        title="Donation requests"
        description="Planned, non-emergency requests. For emergencies use Blood Help, which notifies volunteers automatically."
      />

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <Link
          href="/admin/blood-donation/requests"
          aria-current={!status ? "page" : undefined}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !status ? "bg-ink-900 text-white" : "bg-brand-50 text-ink-700 hover:bg-gold-50"
          }`}
        >
          All
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={`/admin/blood-donation/requests?status=${value}`}
            aria-current={status === value ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              status === value ? "bg-ink-900 text-white" : "bg-brand-50 text-ink-700 hover:bg-gold-50"
            }`}
          >
            {STATUS_LABEL[value]}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <p className="surface-card p-6 text-sm text-slate-600">No donation requests in this queue.</p>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="surface-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-semibold text-ink-900">
                  {request.request_number}
                </span>
                <StatusBadge value={request.status} />
                <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                  {request.blood_group}
                </span>
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                  {request.units_required} unit(s) needed
                  {request.fulfilled_units > 0 ? ` · ${request.fulfilled_units} fulfilled` : ""}
                </span>
              </div>

              <p className="mt-3 text-sm text-slate-700">
                <span className="font-semibold text-ink-900">{request.patient_name}</span>
                {" · "}
                {request.hospital_name}
                {request.hospital_location ? `, ${request.hospital_location}` : ""}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {[request.area, request.city, request.state_code].filter(Boolean).join(", ")}
                {" · "}
                Contact: {request.contact_person ? `${request.contact_person} · ` : ""}
                {request.contact_number}
                {" · "}
                Required {request.required_date ? formatDate(request.required_date) : "ASAP"}
              </p>
              {request.notes ? (
                <p className="mt-2 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-slate-600">
                  {request.notes}
                </p>
              ) : null}

              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-brand-700">
                  Update status
                </summary>
                <div className="mt-3">
                  <ResourceForm
                    entity="donation_request"
                    fields={spec.fields.filter((field) =>
                      ["status", "fulfilled_units", "notes"].includes(field.name),
                    )}
                    id={request.id}
                    defaults={{
                      status: request.status,
                      fulfilled_units: String(request.fulfilled_units ?? 0),
                      notes: request.notes ?? "",
                    }}
                    submitLabel="Save update"
                  />
                </div>
              </details>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/admin/blood-donation/requests?edit=${request.id}${status ? `&status=${status}` : ""}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit details
                </Link>
                {request.status === "pending" ? (
                  <AdminQuickButton entity="donation_request" id={request.id} action="set-in-progress" label="Start progress" />
                ) : null}
                {request.status === "in_progress" ? (
                  <AdminQuickButton entity="donation_request" id={request.id} action="set-fulfilled" label="Mark fulfilled" />
                ) : null}
                <AdminDeleteButton
                  entity="donation_request"
                  id={request.id}
                  confirmText={`Delete request ${request.request_number}?`}
                />
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="surface-card mt-8 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {editing ? `Edit request · ${editing.request_number}` : "Record a request"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {editing
            ? "Correct the recorded details."
            : "For phone-ins and walk-ins. The request number is assigned automatically."}
        </p>
        <div className="mt-5">
          <ResourceForm
            entity="donation_request"
            fields={spec.fields}
            id={editing?.id}
            defaults={{
              status: "pending",
              units_required: "1",
              fulfilled_units: "0",
              contact_country_code: "91",
              request_date: new Date().toISOString().slice(0, 10),
              ...(editing
                ? {
                    status: editing.status,
                    patient_name: editing.patient_name,
                    blood_group: editing.blood_group,
                    units_required: String(editing.units_required ?? 1),
                    fulfilled_units: String(editing.fulfilled_units ?? 0),
                    hospital_name: editing.hospital_name,
                    hospital_location: editing.hospital_location ?? "",
                    area: editing.area ?? "",
                    city: editing.city ?? "",
                    state_code: editing.state_code ?? "",
                    contact_person: editing.contact_person ?? "",
                    contact_number: editing.contact_number,
                    contact_country_code: editing.contact_country_code ?? "",
                    request_date: editing.request_date ?? "",
                    required_date: editing.required_date ?? "",
                    notes: editing.notes ?? "",
                  }
                : {}),
            }}
            submitLabel={editing ? "Save request" : "Record request"}
          />
        </div>
      </div>
    </>
  );
}