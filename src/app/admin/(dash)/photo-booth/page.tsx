import Image from "next/image";
import Link from "next/link";

import { AdminPageHeader, AdminSection, AdminTable, ToggleBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { PhotoBoothSlotEditor } from "@/components/admin/photo-booth-slot-editor";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { PhotoBoothSlot, PhotoBoothTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PhotoBoothAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; windows?: string }>;
}) {
  const { edit, windows } = await searchParams;
  const spec = ENTITY_SPECS.photo_booth_template;
  const supabase = await createClient();

  const { data } = await supabase
    .from("photo_booth_templates")
    .select("*")
    .order("display_order", { ascending: true });

  const templates = (data ?? []) as PhotoBoothTemplate[];
  const editing = edit ? (templates.find((row) => row.id === edit) ?? null) : null;

  const windowTemplateId = windows ?? editing?.id ?? templates[0]?.id ?? "";
  const windowTemplate = templates.find((row) => row.id === windowTemplateId) ?? null;

  const { data: slotRows } = windowTemplateId
    ? await supabase
        .from("photo_booth_slots")
        .select("*")
        .eq("template_id", windowTemplateId)
        .order("display_order")
    : { data: [] };

  const slots = (slotRows ?? []) as PhotoBoothSlot[];

  return (
    <>
      <AdminPageHeader
        title="Photo Booth"
        description="Upload branded frames and define where each photo should appear. Visitors see these templates immediately — no code changes needed."
        action={
          <Link
            href="/photo-booth"
            target="_blank"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Open public page
          </Link>
        }
      />

      <AdminSection
        title="Templates"
        description="A transparent PNG frame works best: cut the photo windows out of the PNG (fully transparent) so photos show through."
      >
        <AdminTable
          columns={[
            {
              key: "name",
              header: "Template",
              render: (row) => (
                <div className="flex items-center gap-3">
                  <span className="relative block size-12 shrink-0 overflow-hidden rounded-lg bg-ink-900">
                    <Image
                      src={row.preview_image ?? row.frame_image}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-ink-900">{row.name}</p>
                    <p className="truncate text-xs text-slate-500">/{row.slug}</p>
                  </div>
                </div>
              ),
            },
            {
              key: "size",
              header: "Canvas",
              render: (row) => (
                <span className="font-mono text-xs text-slate-600">
                  {row.width}×{row.height}
                </span>
              ),
            },
            {
              key: "featured",
              header: "Featured",
              render: (row) => (
                <AdminQuickButton
                  entity="photo_booth_template"
                  id={row.id}
                  action="toggle-featured"
                  value={!row.is_featured}
                  label={row.is_featured ? "Unfeature" : "Feature"}
                />
              ),
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
                    href={`/admin/photo-booth?windows=${row.id}`}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                  >
                    Photo windows
                  </Link>
                  <Link
                    href={`/admin/photo-booth?edit=${row.id}`}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                  >
                    Edit
                  </Link>
                  <AdminQuickButton
                    entity="photo_booth_template"
                    id={row.id}
                    action="toggle-active"
                    value={!row.is_active}
                    label={row.is_active ? "Deactivate" : "Activate"}
                  />
                  <AdminDeleteButton
                    entity="photo_booth_template"
                    id={row.id}
                    confirmText={`Delete "${row.name}"? Visitors will no longer see it.`}
                  />
                </div>
              ),
            },
          ]}
          rows={templates}
          rowKey={(row) => row.id}
          empty="No templates yet. Create the first one below."
        />
      </AdminSection>

      {windowTemplate ? (
        <AdminSection
          title={`Photo windows · ${windowTemplate.name}`}
          description="Drag on the frame to move a window, hold Shift while dragging to resize, or type exact values."
        >
          <nav className="mb-4 flex flex-wrap gap-2">
            {templates.map((row) => (
              <Link
                key={row.id}
                href={`/admin/photo-booth?windows=${row.id}`}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  row.id === windowTemplate.id
                    ? "bg-ink-900 text-white"
                    : "bg-brand-50 text-ink-700 hover:bg-gold-50"
                }`}
              >
                {row.name}
              </Link>
            ))}
          </nav>

          <PhotoBoothSlotEditor
            key={windowTemplate.id}
            template={windowTemplate}
            slots={slots}
          />
        </AdminSection>
      ) : null}

      <AdminSection title={editing ? `Edit template: ${editing.name}` : "Add a template"}>
        <ResourceForm
          entity="photo_booth_template"
          fields={spec.fields}
          id={editing?.id}
          defaults={{
            name: editing?.name ?? "",
            slug: editing?.slug ?? "",
            description: editing?.description ?? "",
            frame_image: editing?.frame_image ?? "",
            preview_image: editing?.preview_image ?? "",
            width: String(editing?.width ?? 1080),
            height: String(editing?.height ?? 1350),
            display_order: String(editing?.display_order ?? templates.length + 1),
            is_active: editing ? String(editing.is_active) : "true",
            is_featured: editing ? String(editing.is_featured) : "false",
          }}
          submitLabel={editing ? "Update template" : "Create template"}
        />
        {editing ? (
          <p className="mt-4 text-xs text-slate-500">
            Last updated {formatDateTime(editing.updated_at)}.
          </p>
        ) : null}
      </AdminSection>

      <div className="rounded-3xl border border-brand-100 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold text-ink-900">Designing a frame</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs">
          <li>
            Create the frame in any design tool at the exact size you enter here (for example 1080×1350) and export
            it as a transparent PNG.
          </li>
          <li>
            Delete the areas where photos should appear — those transparent areas become the photo windows.
          </li>
          <li>
            Upload it here, set the canvas width and height to match, then position the windows on the visual editor.
          </li>
          <li>
            Generate a preview image (the frame with sample photos) so the template list looks inviting.
          </li>
        </ol>
      </div>
    </>
  );
}