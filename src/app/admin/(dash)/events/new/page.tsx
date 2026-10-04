import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { EventCategoryRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NewEventPage() {
  const spec = ENTITY_SPECS.event;
  const supabase = await createClient();

  const { data } = await supabase
    .from("event_categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  const categories = (data ?? []) as EventCategoryRow[];

  if (categories.length === 0) {
    redirect("/admin/events/categories");
  }

  const fields = spec.fields.map((field) =>
    field.name === "category_id"
      ? {
          ...field,
          options: categories.map((category) => ({ value: category.id, label: category.name })),
        }
      : field,
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AdminPageHeader
        title="Create event"
        description="Add a new programme. It stays hidden until you publish it."
        action={
          <Link
            href="/admin/events"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Back to events
          </Link>
        }
      />

      <div className="surface-card p-6">
        <ResourceForm
          entity="event"
          fields={fields}
          redirectTo="/admin/events"
          defaults={{
            event_date: today,
            is_published: "false",
            is_featured: "false",
            category_id: categories[0]?.id ?? "",
          }}
          submitLabel="Create event"
        />
      </div>
    </>
  );
}
