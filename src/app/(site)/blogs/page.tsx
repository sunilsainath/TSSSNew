import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BlogCard } from "@/components/blogs/blog-card";
import { BlogSubmitForm } from "@/components/forms/blog-submit-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { PLACEHOLDER_BLOG_IMAGE } from "@/lib/constants";
import { getBlogCategories, getFeaturedBlog, getPageContent, getPublishedBlogs } from "@/lib/data/public";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Read community stories, devotional reflections and service updates shared by members and volunteers of Srinivasula Seva Samstha.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Blogs | Srinivasula Seva Samstha",
    description: "Community stories and service updates from the trust.",
    url: "/blogs",
  },
};

const PER_PAGE = 6;

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const category = params.category ?? "all";
  const search = params.q?.trim() ?? "";

  const [{ blogs, total }, categories, featured, content] = await Promise.all([
    getPublishedBlogs({
      limit: PER_PAGE,
      offset: (page - 1) * PER_PAGE,
      category,
      search,
    }),
    getBlogCategories(),
    getFeaturedBlog(),
    getPageContent(["blogs_intro"]),
  ]);

  const intro = content[0];
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const buildHref = (next: { page?: number; category?: string; q?: string }) => {
    const query = new URLSearchParams();
    if (next.category && next.category !== "all") query.set("category", next.category);
    if (next.q) query.set("q", next.q);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const suffix = query.toString();
    return suffix ? `/blogs?${suffix}` : "/blogs";
  };

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-50" aria-hidden="true" />
        <div className="container-page relative">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Stories</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">Blogs</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            {intro?.body ??
              "Community stories, devotional reflections and updates from our volunteers — approved and published by the trust."}
          </p>
        </div>
      </section>

      {featured && (!search && category === "all") ? (
        <section className="py-14 sm:py-16">
          <div className="container-page">
            <Link
              href={`/blogs/${featured.slug}`}
              className="surface-card surface-card-hover group grid overflow-hidden lg:grid-cols-2"
            >
              <div className="relative aspect-16/10 overflow-hidden bg-ink-800 lg:aspect-auto lg:min-h-80">
                <Image
                  src={featured.featured_image || PLACEHOLDER_BLOG_IMAGE}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                <span className="inline-flex w-fit rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-700">
                  Featured
                </span>
                <h2 className="font-display text-2xl leading-snug font-semibold text-ink-900 sm:text-3xl group-hover:text-gold-700">
                  {featured.title}
                </h2>
                {featured.excerpt ? (
                  <p className="text-sm leading-relaxed text-slate-600">{featured.excerpt}</p>
                ) : null}
                <p className="text-xs text-slate-500">
                  {featured.category} · {formatDate(featured.created_at)}
                </p>
              </div>
            </Link>
          </div>
        </section>
      ) : null}

      <section className="pb-16 sm:pb-20">
        <div className="container-page">
          {/* Filters */}
          <div className="flex flex-col gap-4 border-y border-brand-100 py-5 lg:flex-row lg:items-center lg:justify-between">
            <nav aria-label="Blog categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto">
              <Link
                href={buildHref({ category: "all" })}
                aria-current={category === "all" ? "page" : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  category === "all"
                    ? "bg-ink-900 text-white"
                    : "bg-brand-50 text-ink-700 hover:bg-gold-50 hover:text-gold-700"
                }`}
              >
                All
              </Link>
              {categories.map((item) => (
                <Link
                  key={item}
                  href={buildHref({ category: item })}
                  aria-current={category === item ? "page" : undefined}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    category === item
                      ? "bg-ink-900 text-white"
                      : "bg-brand-50 text-ink-700 hover:bg-gold-50 hover:text-gold-700"
                  }`}
                >
                  {item}
                </Link>
              ))}
            </nav>

            <form action="/blogs" method="get" className="flex w-full gap-2 lg:w-auto">
              {category !== "all" ? <input type="hidden" name="category" value={category} /> : null}
              <label htmlFor="blog-search" className="sr-only">
                Search blogs
              </label>
              <input
                id="blog-search"
                type="search"
                name="q"
                defaultValue={search}
                placeholder="Search articles…"
                className="h-10 w-full rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-200 focus:outline-none sm:w-64"
              />
              <button
                type="submit"
                className="h-10 shrink-0 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-ink-800"
              >
                Search
              </button>
            </form>
          </div>

          {blogs.length === 0 ? (
            <div className="py-20 text-center">
              <h2 className="font-display text-xl font-semibold text-ink-900">No articles found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                {search
                  ? `No articles match "${search}". Try a different keyword or clear the filters.`
                  : "There are no published articles in this category yet."}
              </p>
              <ButtonLink href="/blogs" variant="secondary" className="mt-6">
                Clear filters
              </ButtonLink>
            </div>
          ) : (
            <>
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>

              {totalPages > 1 ? (
                <nav
                  aria-label="Pagination"
                  className="mt-12 flex items-center justify-center gap-2"
                >
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
                    <Link
                      key={item}
                      href={buildHref({ page: item, category, q: search })}
                      aria-current={item === page ? "page" : undefined}
                      className={`grid size-10 place-items-center rounded-full text-sm font-semibold transition-colors ${
                        item === page
                          ? "bg-ink-900 text-white"
                          : "bg-white text-ink-700 ring-1 ring-brand-200 hover:ring-gold-400"
                      }`}
                    >
                      {item}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </>
          )}
        </div>
      </section>

      <section className="bg-slate-50/70 py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              align="left"
              eyebrow="Contribute"
              title="Share your story"
              description="Members and volunteers can submit articles about devotional programmes, community service or personal experiences. Every submission is reviewed by an administrator before it appears publicly."
            />
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-slate-600">
              <li>• Submissions start as <span className="font-semibold text-ink-800">pending</span>.</li>
              <li>• Only approved articles are published on this page.</li>
              <li>• You can submit a featured image (JPG, PNG or WebP up to 4 MB).</li>
            </ul>
          </div>
          <div className="surface-card p-6 sm:p-8 lg:col-span-7">
            <BlogSubmitForm categories={categories} />
          </div>
        </div>
      </section>
    </>
  );
}
