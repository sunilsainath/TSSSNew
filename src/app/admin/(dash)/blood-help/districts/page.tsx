import Link from "next/link";

import { AdminPageHeader, AdminSection, AdminTable, ToggleBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { AreaRow, DistrictRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DistrictsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; editArea?: string }>;
}) {
  const { edit, editArea } = await searchParams;
  const districtSpec = ENTITY_SPECS.district;
  const areaSpec = ENTITY_SPECS.area;
  const supabase = await createClient();

  const [{ data: districts }, { data: areas }] = await Promise.all([
    supabase.from("districts").select("*").order("display_order"),
    supabase.from("areas").select("*").order("display_order"),
  ]);

  const districtList = (districts ?? []) as DistrictRow[];
  const areaList = (areas ?? []) as AreaRow[];

  const editingDistrict = edit
    ? (districtList.find((row) => row.id === edit) ?? null)
    : null;
  const editingArea = editArea
    ? (areaList.find((row) => row.id === editArea) ?? null)
    : null;

  const areaFields = areaSpec.fields.map((field) =>
    field.name === "district_id"
      ? {
          ...field,
          options: districtList.map((district) => ({ value: district.id, label: district.name })),
        }
      : field,
  );

  return (
    <>
      <AdminPageHeader
        title="Districts & areas"
        description="These values power the Blood Help form and request routing. Nothing is hard-coded in the website."
      />

      <AdminSection
        title={editingDistrict ? `Edit district: ${editingDistrict.name}` : "Add district"}
      >
        <ResourceForm
          entity="district"
          fields={districtSpec.fields}
          id={editingDistrict?.id}
          defaults={{
            name: editingDistrict?.name ?? "",
            slug: editingDistrict?.slug ?? "",
            display_order: String(editingDistrict?.display_order ?? districtList.length + 1),
            is_active: editingDistrict ? String(editingDistrict.is_active) : "true",
          }}
          submitLabel={editingDistrict ? "Update district" : "Create district"}
        />
      </AdminSection>

      <div className="mb-6">
        <AdminTable
          columns={[
            {
              key: "name",
              header: "District",
              render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
            },
            { key: "slug", header: "Slug", render: (row) => <code className="text-xs">{row.slug}</code> },
            {
              key: "areas",
              header: "Areas",
              render: (row) => areaList.filter((area) => area.district_id === row.id).length,
            },
            { key: "order", header: "Order", render: (row) => row.display_order },
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
                    href={`/admin/blood-help/districts?edit=${row.id}`}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                  >
                    Edit
                  </Link>
                  <AdminQuickButton
                    entity="district"
                    id={row.id}
                    action="toggle-active"
                    value={!row.is_active}
                    label={row.is_active ? "Deactivate" : "Activate"}
                  />
                  <AdminDeleteButton
                    entity="district"
                    id={row.id}
                    confirmText="Delete this district and its areas?"
                  />
                </div>
              ),
            },
          ]}
          rows={districtList}
          rowKey={(row) => row.id}
          empty="No districts configured yet."
        />
      </div>

      <AdminSection title={editingArea ? `Edit area: ${editingArea.name}` : "Add area / mandal / city"}>
        <ResourceForm
          entity="area"
          fields={areaFields}
          id={editingArea?.id}
          defaults={{
            district_id: editingArea?.district_id ?? districtList[0]?.id ?? "",
            name: editingArea?.name ?? "",
            slug: editingArea?.slug ?? "",
            display_order: String(editingArea?.display_order ?? 1),
            is_active: editingArea ? String(editingArea.is_active) : "true",
          }}
          submitLabel={editingArea ? "Update area" : "Create area"}
        />
      </AdminSection>

      <AdminTable
        columns={[
          {
            key: "area",
            header: "Area",
            render: (row) => (
              <span className="font-medium text-ink-900">
                {row.name}
                <span className="ml-2 text-xs text-slate-500">
                  {districtList.find((district) => district.id === row.district_id)?.name ?? "—"}
                </span>
              </span>
            ),
          },
          { key: "slug", header: "Slug", render: (row) => <code className="text-xs">{row.slug}</code> },
          { key: "order", header: "Order", render: (row) => row.display_order },
          { key: "status", header: "Status", render: (row) => <ToggleBadge active={row.is_active} /> },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/blood-help/districts?editArea=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <AdminQuickButton
                  entity="area"
                  id={row.id}
                  action="toggle-active"
                  value={!row.is_active}
                  label={row.is_active ? "Deactivate" : "Activate"}
                />
                <AdminDeleteButton entity="area" id={row.id} />
              </div>
            ),
          },
        ]}
        rows={areaList}
        rowKey={(row) => row.id}
        empty="No areas yet."
      />
    </>
  );
}
