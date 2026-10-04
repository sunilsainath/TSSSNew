import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { EventCategoryRow, EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const spec = ENTITY_SPECS.event;
  const supabase = await createClient();

  const [{ data: event }, { data: categories }] = await Promise.all([
    supabase.from("events").select("*").eq("id", id).maybeSingle(),
    supabase.from("event_categories").select("*").order("display_order"),
  ]);

  if (!event) notFound();

  const row = event as EventRow;
  const categoryList = (categories ?? []) as EventCategoryRow[];

  const fields = spec.fields.map((field) =>
    field.name === "category_id"
      ? {
          ...field,
          options: categoryList.map((category) => ({ value: category.id, label: category.name })),
        }
      : field,
  );

  return (
    <>
      <AdminPageHeader
        title={`Edit: ${row.title}`}
        description="Update the programme details, gallery links and publishing status."
        action={
          <div className="flex gap-2">
            <Link
              href={`/admin/events/galleries?event=${row.id}`}
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Manage gallery
            </Link>
            <Link
              href="/admin/events"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="surface-card p-6">
        <ResourceForm
          entity="event"
          fields={fields}
          id={row.id}
          defaults={{
            category_id: row.category_id,
            title: row.title,
            slug: row.slug,
            event_date: row.event_date,
            end_date: row.end_date ?? "",
            location: row.location ?? "",
            summary: row.summary ?? "",
            content: row.content ?? "",
            cover_image: row.cover_image ?? "",
            youtube_url: row.youtube_url ?? "",
            external_links: row.external_links ?? "",
            is_featured: String(row.is_featured),
            is_published: String(row.is_published),
          }}
          submitLabel="Update event"
        />
      </div>
    </>
  );
}
