import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { getAdminSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Lets an administrator write a post directly, instead of the only existing
 * path: a visitor submitting one and an administrator approving it.
 *
 * The author fields default to the signed-in administrator, who can replace
 * them with a guest author when publishing on somebody else's behalf.
 */
export default async function NewBlogPage() {
  const spec = ENTITY_SPECS.blog;
  const session = await getAdminSession();

  const adminName = session?.user.full_name || session?.authEmail || "";
  const adminEmail = session?.authEmail || session?.user.email || "";

  return (
    <>
      <AdminPageHeader
        title="Write a post"
        description="Admin-authored posts skip the review queue. Save as approved to publish immediately."
        action={
          <Link
            href="/admin/blogs/pending"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Back to review queue
          </Link>
        }
      />

      <div className="surface-card p-6">
        <ResourceForm
          entity="blog"
          fields={spec.fields}
          redirectTo="/admin/blogs/approved"
          defaults={{
            author_name: adminName,
            author_email: adminEmail,
            category: "General",
            status: "approved",
            is_featured: "false",
          }}
          submitLabel="Publish post"
        />
      </div>
    </>
  );
}