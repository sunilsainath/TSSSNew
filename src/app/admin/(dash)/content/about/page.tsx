import { AdminPageHeader, AdminSection } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import type { PageContentRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AboutContentPage() {
  const spec = ENTITY_SPECS.page_content;
  const supabase = await createClient();

  const { data } = await supabase
    .from("page_content")
    .select("*")
    .in("key", ["about_intro", "about_leadership"])
    .order("key");

  const intro = ((data ?? []) as PageContentRow[]).find((row) => row.key === "about_intro");
  const leadership = ((data ?? []) as PageContentRow[]).find((row) => row.key === "about_leadership");

  return (
    <>
      <AdminPageHeader
        title="About content"
        description="The introduction shown on the About page and the trust leadership list."
      />

      <AdminSection title="About introduction" description="Key: about_intro">
        <ResourceForm
          entity="page_content"
          fields={spec.fields.filter((field) => field.name !== "key")}
          id={intro?.id}
          defaults={{
            title: intro?.title ?? "",
            subtitle: intro?.subtitle ?? "",
            body: intro?.body ?? "",
            meta_json: intro ? JSON.stringify(intro.meta ?? {}, null, 2) : "{}",
            is_published: intro ? String(intro.is_published) : "true",
          }}
          submitLabel="Save introduction"
        />
      </AdminSection>

      <AdminSection
        title="Leadership / trust members"
        description='Key: about_leadership. Store the list in the Meta JSON field, e.g. {"members":[{"name":"…","role":"…"}]}'
      >
        <ResourceForm
          entity="page_content"
          fields={spec.fields.filter((field) => field.name !== "key")}
          id={leadership?.id}
          defaults={{
            title: leadership?.title ?? "",
            subtitle: leadership?.subtitle ?? "",
            body: leadership?.body ?? "",
            meta_json: leadership
              ? JSON.stringify(
                  leadership.meta ?? { members: [{ name: "", role: "" }] },
                  null,
                  2,
                )
              : JSON.stringify({ members: [{ name: "", role: "" }] }, null, 2),
            is_published: leadership ? String(leadership.is_published) : "true",
          }}
          submitLabel="Save leadership"
        />
      </AdminSection>
    </>
  );
}
