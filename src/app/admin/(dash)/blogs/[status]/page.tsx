import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { BlogRow, BlogStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const TABS: Array<{ status: BlogStatus; label: string; href: string }> = [
  { status: "pending", label: "Pending", href: "/admin/blogs/pending" },
  { status: "approved", label: "Approved", href: "/admin/blogs/approved" },
  { status: "rejected", label: "Rejected", href: "/admin/blogs/rejected" },
  { status: "unpublished", label: "Unpublished", href: "/admin/blogs/unpublished" },
];

export default async function BlogQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ status: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { status: rawStatus } = await params;
  const { edit } = await searchParams;

  const status = (TABS.some((tab) => tab.status === rawStatus) ? rawStatus : "pending") as BlogStatus;
  const supabase = await createClient();

  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  const blogs = (data ?? []) as BlogRow[];

  return (
    <>
      <AdminPageHeader
        title={`Blogs · ${status}`}
        description="Only approved blogs appear on the public website. Review each submission before approving."
        action={
          <Link
            href="/admin/blogs/new"
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
          >
            + New post
          </Link>
        }
      />

      <nav aria-label="Blog queues" className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.status}
            href={tab.href}
            aria-current={status === tab.status ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition-colors ${
              status === tab.status
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-700 ring-1 ring-brand-200 hover:ring-gold-400"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <AdminTable
        columns={[
          {
            key: "title",
            header: "Article",
            render: (row) => (
              <div className="min-w-0">
                <p className="font-medium text-ink-900">{row.title}</p>
                <p className="text-xs text-slate-500">
                  {row.category} · by {row.author_name} · {formatDateTime(row.created_at)}
                </p>
              </div>
            ),
          },
          {
            key: "excerpt",
            header: "Excerpt",
            render: (row) => (
              <span className="line-clamp-2 max-w-sm text-xs text-slate-600">{row.excerpt ?? "—"}</span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="flex items-center gap-2">
                <StatusBadge value={row.status} />
                {row.is_featured ? (
                  <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[0.6rem] font-semibold text-gold-700">
                    Featured
                  </span>
                ) : null}
              </div>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/blogs/${status}?edit=${row.id}`}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  Review
                </Link>
                {row.status !== "approved" ? (
                  <AdminQuickButton
                    entity="blog"
                    id={row.id}
                    action="set-approved"
                    label="Approve"
                    className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  />
                ) : null}
                {row.status === "approved" ? (
                  <AdminQuickButton
                    entity="blog"
                    id={row.id}
                    action="set-unpublished"
                    label="Unpublish"
                  />
                ) : null}
                {row.status !== "rejected" ? (
                  <AdminQuickButton
                    entity="blog"
                    id={row.id}
                    action="set-rejected"
                    label="Reject"
                    className="rounded-full border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                  />
                ) : null}
                {row.status === "approved" ? (
                  <Link
                    href={`/blogs/${row.slug}`}
                    className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400"
                  >
                    View
                  </Link>
                ) : null}
                <AdminDeleteButton entity="blog" id={row.id} confirmText={`Delete "${row.title}"?`} />
              </div>
            ),
          },
        ]}
        rows={blogs}
        rowKey={(row) => row.id}
        empty={`No ${status} blogs right now.`}
      />

      {edit ? <BlogEditor id={edit} status={status} /> : null}
    </>
  );
}

async function BlogEditor({ id, status }: { id: string; status: BlogStatus }) {
  const supabase = await createClient();
  const { data } = await supabase.from("blogs").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const blog = data as BlogRow;

  const { BlogReviewPanel } = await import("@/components/admin/blog-review-panel");

  return <BlogReviewPanel blog={blog} status={status} />;
}
