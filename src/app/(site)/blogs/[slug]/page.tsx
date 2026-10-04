import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCard } from "@/components/blogs/blog-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PLACEHOLDER_BLOG_IMAGE, SITE_URL } from "@/lib/constants";
import { getBlogBySlug, getRelatedBlogs } from "@/lib/data/public";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 120;

export async function generateStaticParams() {
  const { blogs } = await import("@/lib/data/public").then((mod) => mod.getPublishedBlogs({ limit: 100 }));
  return blogs.map((blog) => ({ slug: blog.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);

  if (!blog) return { title: "Article not found" };

  return {
    title: blog.title,
    description: blog.excerpt ?? `Read ${blog.title} on the Srinivasula Seva Samstha blog.`,
    alternates: { canonical: `/blogs/${blog.slug}` },
    openGraph: {
      type: "article",
      title: `${blog.title} | Srinivasula Seva Samstha`,
      description: blog.excerpt ?? undefined,
      url: `/blogs/${blog.slug}`,
      publishedTime: blog.created_at,
      authors: [blog.author_name],
      images: [{ url: blog.featured_image || PLACEHOLDER_BLOG_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.excerpt ?? undefined,
      images: [blog.featured_image || PLACEHOLDER_BLOG_IMAGE],
    },
  };
}

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const blog = await getBlogBySlug(slug);
  if (!blog) notFound();

  const related = await getRelatedBlogs(blog, 3);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt ?? blog.title,
    image: blog.featured_image ? `${SITE_URL}${blog.featured_image}` : undefined,
    datePublished: blog.created_at,
    dateModified: blog.updated_at,
    author: { "@type": "Person", name: blog.author_name },
    publisher: {
      "@type": "Organization",
      name: "Srinivasula Seva Samstha",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/blogs/${blog.slug}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="relative isolate overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src={blog.featured_image || PLACEHOLDER_BLOG_IMAGE}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30"
            preload
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 to-ink-950" />
          <div className="aurora opacity-50" />
        </div>

        <div className="container-page relative py-16 sm:py-20">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <Link href="/blogs" className="hover:text-gold-200">
              Blogs
            </Link>
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge tone="gold">{blog.category}</Badge>
            <span className="text-xs text-white/50">{formatDate(blog.created_at)}</span>
          </div>
          <h1 className="mt-4 max-w-3xl text-3xl leading-tight font-semibold text-balance sm:text-5xl">
            {blog.title}
          </h1>
          <p className="mt-4 text-sm text-white/60">
            By <span className="font-semibold text-gold-200">{blog.author_name}</span>
          </p>
        </div>
      </header>

      <div className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="surface-card p-6 sm:p-10">
              {/* Content is sanitised on write by submit_blog(); stored HTML is
                  rendered with a strict allow-list server-side. */}
              <div
                className="space-y-5 text-base leading-relaxed text-slate-700 [&_a]:text-gold-700 [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-gold-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink-900 [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink-900 [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-2 [&_ol]:space-y-2"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/blogs" variant="secondary">
                All articles
              </ButtonLink>
              <ButtonLink href="/register">Join the trust</ButtonLink>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">About the author</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {blog.author_name} is part of the Srinivasula Seva Samstha community. This article was submitted
                through the trust blog and approved for publication.
              </p>
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="bg-slate-50/70 py-16">
          <div className="container-page">
            <h2 className="font-display text-2xl font-semibold text-ink-900">More from {blog.category}</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <BlogCard key={item.id} blog={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </article>
  );
}
