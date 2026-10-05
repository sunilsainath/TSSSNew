import Link from "next/link";

import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const BLOOD_FILTERS = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

/**
 * Everyone on the donor roll. Donors arrive from the public /blood-donate form;
 * administrators add walk-ins here and toggle willingness when somebody asks to
 * be removed.
 */
export default async function DonorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; blood?: string; willing?: string; edit?: string }>;
}) {
  const params = await searchParams;
  const search = (params.q ?? "").trim().slice(0, 120);
  const blood = (params.blood ?? "").trim();
  const willing = params.willing === "yes" ? true : params.willing === "no" ? false : null;

  const supabase = await createClient();

  let builder = supabase
    .from("donors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    const term = search.replace(/[%_,()]/g, " ");
    builder = builder.or(
      `full_name.ilike.%${term}%,mobile_number.ilike.%${term}%,city.ilike.%${term}%,area.ilike.%${term}%`,
    );
  }
  if (blood) builder = builder.eq("blood_group", blood);
  if (willing !== null) builder = builder.eq("is_willing", willing);

  const { data } = await builder;
  const donors = data ?? [];

  const editing = params.edit ? donors.find((row) => row.id === params.edit) ?? null : null;
  const spec = ENTITY_SPECS.donor;

  return (
    <>
      <AdminPageHeader
        title="Blood donors"
        description={`${donors.length} donor(s) shown. The roll feeds the dashboard and tells volunteers who to call.`}
        action={
          <Link
            href="/admin/blood-donation/donors"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Clear filters
          </Link>
        }
      />

      <form action="/admin/blood-donation/donors" method="get" className="surface-card mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-52 flex-1">
            <label htmlFor="donor-search" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Search
            </label>
            <input
              id="donor-search"
              name="q"
              defaultValue={search}
              placeholder="Name, mobile, city or area…"
              className="h-10 w-full rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="donor-blood" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Blood group
            </label>
            <select
              id="donor-blood"
              name="blood"
              defaultValue={blood}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              {BLOOD_FILTERS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="donor-willing" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Willingness
            </label>
            <select
              id="donor-willing"
              name="willing"
              defaultValue={params.willing ?? ""}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              <option value="yes">Willing</option>
              <option value="no">Not willing</option>
            </select>
          </div>
          <button
            type="submit"
            className="h-10 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Apply
          </button>
        </div>
      </form>

      <AdminTable
        columns={[
          {
            key: "full_name",
            header: "Donor",
            render: (row) => (
              <div>
                <p className="font-medium text-ink-900">{row.full_name}</p>
                <p className="font-mono text-xs text-slate-500">{row.mobile_number}</p>
              </div>
            ),
          },
          {
            key: "blood_group",
            header: "Group",
            render: (row) => (
              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">
                {row.blood_group}
              </span>
            ),
          },
          {
            key: "area",
            header: "Area",
            render: (row) => [row.area, row.city].filter(Boolean).join(", ") || "—",
          },
          {
            key: "last_donation_date",
            header: "Last donated",
            render: (row) => (row.last_donation_date ? formatDate(row.last_donation_date) : "—"),
          },
          {
            key: "is_willing",
            header: "Willing",
            render: (row) => <StatusBadge value={row.is_willing ? "active" : "disabled"} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/blood-donation/donors?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                {row.is_willing ? (
                  <AdminQuickButton entity="donor" id={row.id} action="set-unwilling" label="Mark unwilling" />
                ) : (
                  <AdminQuickButton entity="donor" id={row.id} action="set-willing" label="Mark willing" />
                )}
                <AdminDeleteButton entity="donor" id={row.id} confirmText={`Remove ${row.full_name} from the donor roll?`} />
              </div>
            ),
          },
        ]}
        rows={donors}
        rowKey={(row) => row.id}
        empty="No donors match these filters."
      />

      <div className="surface-card mt-8 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {editing ? `Edit donor · ${editing.full_name}` : "Add a donor"}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {editing
            ? "Correct details or record a change of willingness."
            : "For walk-ins and phone registrations. Online sign-ups appear here automatically."}
        </p>
        <div className="mt-5">
          <ResourceForm
            entity="donor"
            fields={spec.fields}
            id={editing?.id}
            defaults={{
              is_willing: "true",
              is_active: "true",
              country_code: "IN",
              phone_country_code: "91",
              preferred_contact: "phone",
              ...(editing
                ? {
                    full_name: editing.full_name,
                    father_name: editing.father_name ?? "",
                    blood_group: editing.blood_group,
                    mobile_number: editing.mobile_number,
                    phone_country_code: editing.phone_country_code ?? "",
                    email: editing.email ?? "",
                    date_of_birth: editing.date_of_birth ?? "",
                    gender: editing.gender ?? "",
                    country_code: editing.country_code ?? "",
                    state_code: editing.state_code ?? "",
                    city: editing.city ?? "",
                    area: editing.area ?? "",
                    address: editing.address ?? "",
                    last_donation_date: editing.last_donation_date ?? "",
                    is_willing: editing.is_willing ? "true" : "false",
                    availability: editing.availability ?? "",
                    preferred_contact: editing.preferred_contact ?? "phone",
                    is_active: editing.is_active ? "true" : "false",
                  }
                : {}),
            }}
            submitLabel={editing ? "Save donor" : "Add donor"}
          />
        </div>
      </div>
    </>
  );
}