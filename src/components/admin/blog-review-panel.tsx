"use client";

import { useState } from "react";
import Image from "next/image";

import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import type { BlogRow, BlogStatus } from "@/lib/types";
import { PLACEHOLDER_BLOG_IMAGE } from "@/lib/constants";

export function BlogReviewPanel({ blog, status }: { blog: BlogRow; status: BlogStatus }) {
  const [open, setOpen] = useState(true);
  const spec = ENTITY_SPECS.blog;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:border-gold-400"
      >
        Review “{blog.title}” again
      </button>
    );
  }

  return (
    <section className="surface-card mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Review: {blog.title}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400"
        >
          Close
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Author", blog.author_name],
              ["Email", blog.author_email],
              ["Mobile", blog.author_mobile ?? "—"],
              ["Category", blog.category],
              ["Submitted", new Date(blog.created_at).toLocaleString("en-IN")],
              ["Queue", status],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-slate-500">{label}</dt>
                <dd className="mt-0.5 font-medium text-ink-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <p className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
              Submitted content
            </p>
            <div
              className="mt-2 max-h-80 overflow-y-auto rounded-2xl border border-brand-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-700 [&_a]:text-gold-700 [&_a]:underline [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-3 [&_ul]:space-y-1"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative mb-5 aspect-4/3 overflow-hidden rounded-2xl bg-brand-50">
            <Image
              src={blog.featured_image || PLACEHOLDER_BLOG_IMAGE}
              alt={blog.title}
              fill
              sizes="400px"
              className="object-cover"
            />
          </div>

          <ResourceForm
            entity="blog"
            fields={spec.fields}
            id={blog.id}
            defaults={{
              title: blog.title,
              slug: blog.slug,
              category: blog.category,
              featured_image: blog.featured_image ?? "",
              excerpt: blog.excerpt ?? "",
              content: blog.content,
              is_featured: String(blog.is_featured),
              status: blog.status,
              review_note: blog.review_note ?? "",
            }}
            submitLabel="Save changes"
          />
        </div>
      </div>
    </section>
  );
}
