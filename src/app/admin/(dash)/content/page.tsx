import Link from "next/link";

import { AdminPageHeader, AdminSection } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { PageContentRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const KEYS = ["home_intro", "blogs_intro", "home_helping_hands", "home_blood_cta", "home_register_cta"];

export default async function HomepageContentPage() {
  const spec = ENTITY_SPECS.page_content;
  const supabase = await createClient();

  const { data } = await supabase
    .from("page_content")
    .select("*")
    .in("key", KEYS)
    .order("key");

  const blocks = (data ?? []) as PageContentRow[];

  return (
    <>
      <AdminPageHeader
        title="Homepage content"
        description="Editable text blocks used across the homepage. Leave a block empty to fall back to the default copy."
      />

      <AdminSection title="Content blocks">
        <div className="space-y-3">
          {blocks.length === 0 ? (
            <p className="text-sm text-slate-500">
              No blocks yet. Create one using the form below with a key from the list.
            </p>
          ) : (
            blocks.map((block) => (
              <div
                key={block.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-100 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-xs font-semibold text-ink-900">{block.key}</p>
                  <p className="mt-0.5 truncate text-sm text-slate-600">
                    {block.title || block.subtitle || block.body || "No content"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Updated {formatDateTime(block.updated_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <AdminQuickButton
                    entity="page_content"
                    id={block.id}
                    action="toggle-published"
                    value={!block.is_published}
                    label={block.is_published ? "Unpublish" : "Publish"}
                  />
                  <AdminDeleteButton entity="page_content" id={block.id} />
                </div>
              </div>
            ))
          )}
        </div>
      </AdminSection>

      <AdminSection title="Add or update a block">
        <p className="mb-5 text-sm text-slate-600">
          Use an existing key to update that block, or a new key to create one. Known keys:{" "}
          <span className="font-mono text-xs text-ink-800">{KEYS.join(", ")}</span>,{" "}
          <span className="font-mono text-xs text-ink-800">about_intro</span>,{" "}
          <span className="font-mono text-xs text-ink-800">about_leadership</span>.
        </p>
        <ResourceForm entity="page_content" fields={spec.fields} submitLabel="Save block" />
      </AdminSection>

      <p className="text-xs text-slate-400">
        Looking for the About page copy?{" "}
        <Link href="/admin/content/about" className="font-semibold text-gold-700">
          Manage About content
        </Link>
      </p>
    </>
  );
}
