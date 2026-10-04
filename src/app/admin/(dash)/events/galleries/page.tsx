import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, AdminSection, AdminTable } from "@/components/admin/admin-table";
import { AdminDeleteButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { EventGalleryRow, EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function GalleriesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const spec = ENTITY_SPECS.event_gallery;
  const supabase = await createClient();

  const [{ data: events }, { data: images }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, event_categories(name)")
      .order("event_date", { ascending: false })
      .limit(200),
    supabase
      .from("event_gallery")
      .select("*")
      .eq("event_id", eventId ?? "")
      .order("display_order"),
  ]);

  const eventList = (events ?? []) as unknown as Array<
    EventRow & { event_categories: { name: string } | null }
  >;
  const gallery = (images ?? []) as EventGalleryRow[];

  const fields = spec.fields.map((field) =>
    field.name === "event_id"
      ? {
          ...field,
          options: eventList.map((event) => ({
            value: event.id,
            label: `${event.event_categories?.name ?? "Uncategorised"} · ${event.title}`,
          })),
        }
      : field,
  );

  const selectedEvent = eventList.find((event) => event.id === eventId);

  return (
    <>
      <AdminPageHeader
        title="Event galleries"
        description="Upload and order images for each event. Images appear in the gallery on the event page."
      />

      <div className="surface-card mb-6 flex flex-wrap gap-2 p-4">
        <Link
          href="/admin/events/galleries"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            !eventId ? "bg-ink-900 text-white" : "bg-brand-50 text-ink-700 hover:bg-gold-50"
          }`}
        >
          Select an event
        </Link>
        {eventList.slice(0, 12).map((event) => (
          <Link
            key={event.id}
            href={`/admin/events/galleries?event=${event.id}`}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              eventId === event.id
                ? "bg-ink-900 text-white"
                : "bg-brand-50 text-ink-700 hover:bg-gold-50 hover:text-gold-700"
            }`}
          >
            {event.title}
          </Link>
        ))}
      </div>

      {selectedEvent ? (
        <AdminSection
          title={`Gallery · ${selectedEvent.title}`}
          description="Set display order to control the sequence on the website."
        >
          {gallery.length === 0 ? (
            <p className="text-sm text-slate-500">No images yet. Add the first one below.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((image) => (
                <figure key={image.id} className="overflow-hidden rounded-2xl border border-brand-100">
                  <div className="relative aspect-4/3 bg-brand-50">
                    <Image
                      src={image.image_url}
                      alt={image.caption ?? "Gallery image"}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-ink-800">
                        {image.caption || "No caption"}
                      </p>
                      <p className="text-[0.65rem] text-slate-500">Order {image.display_order}</p>
                    </div>
                    <AdminDeleteButton entity="event_gallery" id={image.id} />
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </AdminSection>
      ) : null}

      <AdminSection title="Add image">
        <ResourceForm
          entity="event_gallery"
          fields={fields}
          defaults={{
            event_id: eventId ?? eventList[0]?.id ?? "",
            display_order: String(gallery.length + 1),
          }}
          submitLabel="Add image"
        />
      </AdminSection>

      <div className="mt-6">
        <AdminTable
          columns={[
            { key: "image", header: "Image", render: (row) => <span className="font-mono text-xs">{row.image_url}</span> },
            { key: "caption", header: "Caption", render: (row) => row.caption ?? "—" },
            { key: "order", header: "Order", render: (row) => row.display_order },
          ]}
          rows={gallery}
          rowKey={(row) => row.id}
          empty=""
        />
      </div>
    </>
  );
}
