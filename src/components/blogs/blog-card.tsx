import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PLACEHOLDER_BLOG_IMAGE } from "@/lib/constants";
import type { BlogRow } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

export function BlogCard({ blog }: { blog: BlogRow }) {
  return (
    <article className="surface-card surface-card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-16/10 overflow-hidden bg-ink-800">
        <Image
          src={blog.featured_image || PLACEHOLDER_BLOG_IMAGE}
          alt={blog.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <Badge tone="gold">{blog.category}</Badge>
          <span>{formatDate(blog.created_at)}</span>
        </div>
        <h3 className="font-display text-lg leading-snug font-semibold text-ink-900">
          <Link href={`/blogs/${blog.slug}`} className="transition-colors group-hover:text-gold-700">
            {blog.title}
          </Link>
        </h3>
        {blog.excerpt ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{blog.excerpt}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-xs text-slate-500">
          <span className="truncate">By {blog.author_name}</span>
          <span className="shrink-0 font-semibold text-gold-700">Read article</span>
        </div>
      </div>
    </article>
  );
}
