import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/events/event-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getEventCategories, getEventCategoryBySlug, getEventsByCategory } from "@/lib/data/public";

export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getEventCategories();
  return categories.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getEventCategoryBySlug(slug);

  if (!category) {
    return { title: "Category not found" };
  }

  return {
    title: category.name,
    description:
      category.description ??
      `${category.name} programmes organised by Srinivasula Seva Samstha.`,
    alternates: { canonical: `/events/${category.slug}` },
    openGraph: {
      title: `${category.name} | Srinivasula Seva Samstha`,
      description: category.description ?? `All ${category.name} events.`,
      url: `/events/${category.slug}`,
      images: category.cover_image ? [{ url: category.cover_image }] : undefined,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await getEventCategoryBySlug(slug);

  if (!category || !category.is_active) notFound();

  const [upcoming, past, categories] = await Promise.all([
    getEventsByCategory(category.id),
    getEventsByCategory(category.id, { includePast: true }),
    getEventCategories(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-50" aria-hidden="true" />
        <div className="container-page relative">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <Link href="/events" className="transition-colors hover:text-gold-200">
              Events
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white/80">{category.name}</span>
          </nav>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{category.description}</p>
          ) : null}
        </div>
      </section>

      <section className="border-b border-brand-100 bg-white">
        <div className="container-page">
          <nav aria-label="Event categories" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto py-4">
            {categories.map((item) => (
              <Link
                key={item.id}
                href={`/events/${item.slug}`}
                aria-current={item.id === category.id ? "page" : undefined}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  item.id === category.id
                    ? "bg-ink-900 text-white"
                    : "bg-brand-50 text-ink-700 hover:bg-gold-50 hover:text-gold-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          {upcoming.length > 0 ? (
            <>
              <SectionHeading align="left" eyebrow="Upcoming" title={`Upcoming ${category.name.toLowerCase()}`} />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} href={`/events/${category.slug}/${event.slug}`} />
                ))}
              </div>
            </>
          ) : (
            <div className="surface-card p-10 text-center">
              <h2 className="font-display text-xl font-semibold text-ink-900">No upcoming programmes</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                There are no scheduled events in this category right now. Register with the trust to be notified when
                programmes are announced.
              </p>
              <ButtonLink href="/register" className="mt-6">
                Register for updates
              </ButtonLink>
            </div>
          )}

          {past.length > 0 ? (
            <>
              <SectionHeading
                align="left"
                className="mt-20"
                eyebrow="Archive"
                title={`Past ${category.name.toLowerCase()}`}
              />
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {past.map((event) => (
                  <EventCard key={event.id} event={event} href={`/events/${category.slug}/${event.slug}`} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </section>
    </>
  );
}
