import Link from "next/link";

import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";
import type { MediaItemRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function MediaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit } = await searchParams;
  const type = "youtube" as const;
  const spec = ENTITY_SPECS.media_item;
  const supabase = await createClient();

  const { data } = await supabase
    .from("media_items")
    .select("*")
    .eq("type", type)
    .order("publication_date", { ascending: false, nullsFirst: false })
    .limit(100);

  const items = (data ?? []) as MediaItemRow[];
  const editing = edit ? (items.find((row) => row.id === edit) ?? null) : null;

  return (
    <>
      <AdminPageHeader
        title="YouTube videos"
        description="Add video links with an optional thumbnail. Paste a standard YouTube watch or share URL."
        action={
          <Link
            href="/admin/media/news"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            News articles
          </Link>
        }
      />

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Video",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{row.title}</p>
                <p className="max-w-xs truncate text-xs text-slate-500">{row.url}</p>
              </div>
            ),
          },
          { key: "source", header: "Channel", render: (row) => row.source_name ?? "—" },
          { key: "date", header: "Published", render: (row) => formatDate(row.publication_date) },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex items-center gap-2">
                <StatusBadge
                  value={row.is_published ? "published" : "draft"}
                  tone={row.is_published ? "green" : "slate"}
                />
                <AdminQuickButton
                  entity="media_item"
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
              <div className="flex gap-2">
                <Link
                  href={`/admin/media/youtube?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Edit
                </Link>
                <AdminDeleteButton entity="media_item" id={row.id} />
              </div>
            ),
          },
        ]}
        rows={items}
        rowKey={(row) => row.id}
        empty="No videos added yet."
      />

      <div className="surface-card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          {editing ? `Edit: ${editing.title}` : "Add a video"}
        </h2>
        <div className="mt-5">
          <ResourceForm
            entity="media_item"
            fields={spec.fields}
            id={editing?.id}
            defaults={{
              type: "youtube",
              title: editing?.title ?? "",
              url: editing?.url ?? "",
              thumbnail_url: editing?.thumbnail_url ?? "",
              source_name: editing?.source_name ?? "",
              publication_date: editing?.publication_date ?? new Date().toISOString().slice(0, 10),
              description: editing?.description ?? "",
              display_order: String(editing?.display_order ?? items.length + 1),
              is_published: editing ? String(editing.is_published) : "false",
            }}
            submitLabel={editing ? "Update video" : "Add video"}
          />
        </div>
      </div>
    </>
  );
}
