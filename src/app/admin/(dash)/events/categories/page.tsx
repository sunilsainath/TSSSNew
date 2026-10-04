import Link from "next/link";

import { AdminPageHeader, AdminTable, ToggleBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { EventCategoryRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EventCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const spec = ENTITY_SPECS.event_category;
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_categories")
    .select("*")
    .order("display_order", { ascending: true });

  const categories = (data ?? []) as EventCategoryRow[];
  const editing = edit ? (categories.find((row) => row.id === edit) ?? null) : null;

  return (
    <>
      <AdminPageHeader
        title="Event categories"
        description="Categories are fully admin managed — new categories appear on the website without any code changes."
      />

      <AdminTable
        columns={[
          {
            key: "name",
            header: "Category",
            render: (row) => <span className="font-medium text-ink-900">{row.name}</span>,
          },
          { key: "slug", header: "Slug", render: (row) => <code className="text-xs">{row.slug}</code> },
          {
            key: "description",
            header: "Description",
            render: (row) => (
              <span className="line-clamp-2 max-w-md text-slate-600">{row.description ?? "—"}</span>
            ),
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
                  href={`/admin/events/categories?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <AdminQuickButton
                  entity="event_category"
                  id={row.id}
                  action="toggle-active"
                  value={!row.is_active}
                  label={row.is_active ? "Deactivate" : "Activate"}
                />
                <AdminDeleteButton
                  entity="event_category"
                  id={row.id}
                  confirmText="Delete this category? Events in it must be moved first."
                />
              </div>
            ),
          },
        ]}
        rows={categories}
        rowKey={(row) => row.id}
        empty="No categories yet. Create the first one below."
      />

      <div className="surface-card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {editing ? `Edit: ${editing.name}` : "Add a category"}
        </h2>
        <div className="mt-5">
          <ResourceForm
            entity="event_category"
            fields={spec.fields}
            id={editing?.id}
            defaults={{
              name: editing?.name ?? "",
              slug: editing?.slug ?? "",
              description: editing?.description ?? "",
              cover_image: editing?.cover_image ?? "",
              display_order: String(editing?.display_order ?? categories.length + 1),
              is_active: editing ? String(editing.is_active) : "true",
            }}
            submitLabel={editing ? "Update category" : "Create category"}
          />
        </div>
      </div>
    </>
  );
}
