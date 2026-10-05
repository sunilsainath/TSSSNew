import Link from "next/link";

import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { AdminDeleteButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

/**
 * Donation camps: where and when group donations happened, and how much was
 * collected. The per-donor records for a camp arrive through the bulk import.
 */
export default async function CampsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("donation_camps")
    .select("*")
    .order("camp_date", { ascending: false })
    .limit(100);

  const camps = data ?? [];
  const editing = params.edit ? camps.find((row) => row.id === params.edit) ?? null : null;
  const spec = ENTITY_SPECS.donation_camp;

  return (
    <>
      <AdminPageHeader
        title="Donation camps"
        description="Group donation drives. Individual donations for a camp are imported from a spreadsheet."
        action={
          <Link
            href="/admin/blood-donation/import"
            className="inline-flex h-11 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            Import donations
          </Link>
        }
      />

      <AdminTable
        columns={[
          {
            key: "name",
            header: "Camp",
            render: (row) => (
              <div>
                <p className="font-medium text-ink-900">{row.name}</p>
                <p className="text-xs text-slate-500">
                  {[row.location, row.city].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
            ),
          },
          {
            key: "camp_date",
            header: "Date",
            render: (row) => formatDate(row.camp_date),
          },
          {
            key: "organizing_organization",
            header: "Organizer",
            render: (row) => row.organizing_organization ?? "—",
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/blood-donation/camps?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/blood-donation/import?camp=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Import
                </Link>
                <AdminDeleteButton
                  entity="donation_camp"
                  id={row.id}
                  confirmText={`Delete the camp "${row.name}"? Its donation records are kept.`}
                />
              </div>
            ),
          },
        ]}
        rows={camps}
        rowKey={(row) => row.id}
        empty="No camps recorded yet."
      />

      <div className="surface-card mt-8 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {editing ? `Edit camp · ${editing.name}` : "Record a camp"}
        </h2>
        <div className="mt-5">
          <ResourceForm
            entity="donation_camp"
            fields={spec.fields}
            id={editing?.id}
            defaults={{
              camp_date: new Date().toISOString().slice(0, 10),
              ...(editing
                ? {
                    name: editing.name,
                    camp_date: editing.camp_date ?? "",
                    organizing_organization: editing.organizing_organization ?? "",
                    location: editing.location ?? "",
                    area: editing.area ?? "",
                    city: editing.city ?? "",
                    state_code: editing.state_code ?? "",
                    notes: editing.notes ?? "",
                  }
                : {}),
            }}
            submitLabel={editing ? "Save camp" : "Record camp"}
          />
        </div>
      </div>
    </>
  );
}