import Link from "next/link";

import { AdminPageHeader, AdminSection, AdminTable, ToggleBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { AreaRow, BloodHelpAdminRow, DistrictRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BloodHelpAdministratorsPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const spec = ENTITY_SPECS.blood_help_admin;
  const supabase = await createClient();

  const [{ data: admins }, { data: districts }, { data: areas }] = await Promise.all([
    supabase
      .from("blood_help_admins")
      .select("*, districts(name), areas(name)")
      .order("created_at", { ascending: false }),
    supabase.from("districts").select("*").order("display_order"),
    supabase.from("areas").select("*").order("display_order"),
  ]);

  const adminList = (admins ?? []) as Array<
    BloodHelpAdminRow & { districts: { name: string } | null; areas: { name: string } | null }
  >;
  const districtList = (districts ?? []) as DistrictRow[];
  const areaList = (areas ?? []) as AreaRow[];

  const editing = edit ? (adminList.find((row) => row.id === edit) ?? null) : null;

  const fields = spec.fields.map((field) => {
    if (field.name === "district_id") {
      return {
        ...field,
        options: districtList.map((district) => ({ value: district.id, label: district.name })),
      };
    }
    if (field.name === "area_id") {
      return {
        ...field,
        options: areaList.map((area) => ({
          value: area.id,
          label: `${districtList.find((district) => district.id === area.district_id)?.name ?? "?"} · ${area.name}`,
        })),
      };
    }
    return field;
  });

  return (
    <>
      <AdminPageHeader
        title="Blood help administrators"
        description="Assign a responsible volunteer per district or area. If an area has no administrator, the district level one is used, and finally the central team."
        action={
          <Link
            href="/admin/blood-help/requests"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            View requests
          </Link>
        }
      />

      <AdminTable
        columns={[
          {
            key: "admin_name",
            header: "Administrator",
            render: (row) => (
              <div>
                <p className="font-medium text-ink-900">{row.admin_name}</p>
                <p className="text-xs text-slate-500">{row.email ?? "no email"}</p>
              </div>
            ),
          },
          {
            key: "coverage",
            header: "Coverage",
            render: (row) => (
              <span className="text-xs text-slate-600">
                {row.areas?.name
                  ? `${row.areas.name} (${row.districts?.name ?? "?"})`
                  : row.districts?.name
                    ? `All of ${row.districts.name}`
                    : "Unassigned"}
              </span>
            ),
          },
          {
            key: "whatsapp",
            header: "WhatsApp",
            render: (row) => <span className="font-mono text-xs">{row.whatsapp_number ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <ToggleBadge active={row.is_active} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/blood-help/administrators?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <AdminQuickButton
                  entity="blood_help_admin"
                  id={row.id}
                  action="toggle-active"
                  value={!row.is_active}
                  label={row.is_active ? "Deactivate" : "Activate"}
                />
                <AdminDeleteButton
                  entity="blood_help_admin"
                  id={row.id}
                  confirmText="Remove this administrator from routing?"
                />
              </div>
            ),
          },
        ]}
        rows={adminList}
        rowKey={(row) => row.id}
        empty="No blood help administrators configured yet."
      />

      <AdminSection
        title={editing ? `Edit administrator: ${editing.admin_name}` : "Add administrator"}
        className="mt-6"
      >
        <ResourceForm
          entity="blood_help_admin"
          fields={fields}
          id={editing?.id}
          defaults={{
            admin_name: editing?.admin_name ?? "",
            email: editing?.email ?? "",
            whatsapp_number: editing?.whatsapp_number ?? "",
            phone_number: editing?.phone_number ?? "",
            district_id: editing?.district_id ?? districtList[0]?.id ?? "",
            area_id: editing?.area_id ?? "",
            is_active: editing ? String(editing.is_active) : "true",
          }}
          submitLabel={editing ? "Update administrator" : "Create administrator"}
        />
      </AdminSection>

      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-relaxed text-amber-900">
        <p className="font-semibold">Routing order</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Area level administrator (most specific).</li>
          <li>District level administrator (no area selected).</li>
          <li>Central admin email if neither exists — the request is flagged as unassigned.</li>
        </ol>
      </div>
    </>
  );
}
