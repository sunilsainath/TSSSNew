import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { getAllPublishedEvents, getEventCategories, getEventCountsByCategory } from "@/lib/data/public";
import { PLACEHOLDER_EVENT_IMAGE } from "@/lib/constants";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Devotional events, anniversaries, helping hands drives, pen distributions and educational programmes organised by Srinivasula Seva Samstha.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Events | Srinivasula Seva Samstha",
    description:
      "All programmes organised by the trust: devotional events, community service, education and blood help drives.",
    url: "/events",
  },
};

export default async function EventsPage() {
  const [categories, counts, events] = await Promise.all([
    getEventCategories(),
    getEventCountsByCategory(),
    getAllPublishedEvents(48),
  ]);

  const upcoming = events.filter((event) => event.event_date >= new Date().toISOString().slice(0, 10));
  const past = events.filter((event) => event.event_date < new Date().toISOString().slice(0, 10));

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Our programmes</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">Events</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Every programme the trust conducts — from kalyanotsavam and satsangam to education, relief work and blood
            assistance drives.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            align="left"
            eyebrow="Categories"
            title="Browse by category"
            description="Administrators manage these categories, so new programmes appear here automatically."
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/events/${category.slug}`}
                className="surface-card surface-card-hover group relative flex min-h-44 flex-col justify-end overflow-hidden p-6"
              >
                <div className="absolute inset-0 -z-10">
                  <Image
                    src={category.cover_image || PLACEHOLDER_EVENT_IMAGE}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover opacity-18 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/80 to-ink-950/40" />
                </div>
                <p className="text-xs font-semibold tracking-[0.16em] text-gold-300 uppercase">
                  {counts[category.id] ?? 0} upcoming
                </p>
                <h2 className="mt-2 font-display text-xl font-semibold text-white group-hover:text-gold-200">
                  {category.name}
                </h2>
                {category.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/60">
                    {category.description}
                  </p>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {upcoming.length > 0 ? (
        <section className="bg-slate-50/70 py-16 sm:py-20">
          <div className="container-page">
            <SectionHeading
              align="left"
              eyebrow="Upcoming"
              title="Upcoming events"
              action={
                <ButtonLink href="/register" variant="secondary" size="sm">
                  Register to attend
                </ButtonLink>
              }
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  href={`/events/${event.event_categories?.slug ?? "all"}/${event.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section className="py-16 sm:py-20">
          <div className="container-page">
            <SectionHeading align="left" eyebrow="Archive" title="Recently held" />
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {past.slice(0, 9).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  href={`/events/${event.event_categories?.slug ?? "all"}/${event.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
