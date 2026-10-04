import Link from "next/link";

import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { EventRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .order("event_date", { ascending: false })
    .limit(200);

  if (params.q) {
    const term = `%${params.q.replace(/[%_,]/g, "")}%`;
    query = query.or(`title.ilike.${term},location.ilike.${term},slug.ilike.${term}`);
  }
  if (params.status === "published") query = query.eq("is_published", true);
  if (params.status === "draft") query = query.eq("is_published", false);

  const { data } = await query;
  const events = (data ?? []) as Array<EventRow & { event_categories: { name: string; slug: string } | null }>;

  return (
    <>
      <AdminPageHeader
        title="Events"
        description="Create, edit, publish and feature events. Galleries are managed per event."
        action={
          <Link
            href="/admin/events/new"
            className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
          >
            New event
          </Link>
        }
      />

      <form action="/admin/events" className="mb-5 flex flex-wrap gap-2">
        {params.q ? <input type="hidden" name="q" value={params.q} /> : null}
        {params.status ? <input type="hidden" name="status" value={params.status} /> : null}
        <label htmlFor="event-search" className="sr-only">
          Search events
        </label>
        <input
          id="event-search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search title, location or slug…"
          className="h-10 w-full rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-200 focus:outline-none sm:w-72"
        />
        <button
          type="submit"
          className="h-10 rounded-full bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800"
        >
          Search
        </button>
        <Link
          href="/admin/events"
          className="inline-flex h-10 items-center rounded-full border border-brand-200 px-4 text-sm font-semibold text-ink-700 hover:border-gold-400"
        >
          Reset
        </Link>
        <Link
          href="/admin/events?status=draft"
          className="inline-flex h-10 items-center rounded-full border border-brand-200 px-4 text-sm font-semibold text-ink-700 hover:border-gold-400"
        >
          Drafts
        </Link>
        <Link
          href="/admin/events?status=published"
          className="inline-flex h-10 items-center rounded-full border border-brand-200 px-4 text-sm font-semibold text-ink-700 hover:border-gold-400"
        >
          Published
        </Link>
      </form>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Event",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{row.title}</p>
                <p className="text-xs text-slate-500">/{row.slug}</p>
              </div>
            ),
          },
          { key: "category", header: "Category", render: (row) => row.event_categories?.name ?? "—" },
          { key: "date", header: "Date", render: (row) => formatDate(row.event_date) },
          {
            key: "location",
            header: "Location",
            render: (row) => <span className="max-w-40 truncate">{row.location ?? "—"}</span>,
          },
          {
            key: "featured",
            header: "Featured",
            render: (row) => (
              <AdminQuickButton
                entity="event"
                id={row.id}
                action="toggle-featured"
                value={!row.is_featured}
                label={row.is_featured ? "Unfeature" : "Feature"}
              />
            ),
          },
          {
            key: "published",
            header: "Status",
            render: (row) => (
              <div className="flex items-center gap-2">
                <StatusBadge
                  value={row.is_published ? "published" : "draft"}
                  tone={row.is_published ? "green" : "slate"}
                />
                <AdminQuickButton
                  entity="event"
                  id={row.id}
                  action="toggle-published"
                  value={!row.is_published}
                  label={row.is_published ? "Unpublish" : "Publish"}
                />
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/events/${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <Link
                  href={`/admin/events/galleries?event=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Gallery
                </Link>
                {row.is_published ? (
                  <Link
                    href={`/events/${row.event_categories?.slug ?? "all"}/${row.slug}`}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                  >
                    View
                  </Link>
                ) : null}
                <AdminDeleteButton entity="event" id={row.id} confirmText={`Delete "${row.title}"?`} />
              </div>
            ),
          },
        ]}
        rows={events}
        rowKey={(row) => row.id}
        empty="No events found."
      />
    </>
  );
}
