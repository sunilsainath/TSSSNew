import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { getAllPublishedEvents, getEventBySlug, getEventGallery } from "@/lib/data/public";
import { PLACEHOLDER_EVENT_IMAGE, SITE_URL } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const events = await getAllPublishedEvents(200);
  return events.map((event) => ({
    category: event.event_categories?.slug ?? "all",
    slug: event.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  const { category, slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) return { title: "Event not found" };

  const url = `/events/${event.event_categories?.slug ?? category}/${event.slug}`;

  return {
    title: event.title,
    description: event.summary ?? `Details of ${event.title} organised by Srinivasula Seva Samstha.`,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: `${event.title} | Srinivasula Seva Samstha`,
      description: event.summary ?? undefined,
      url,
      images: [{ url: event.cover_image || PLACEHOLDER_EVENT_IMAGE }],
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.summary ?? undefined,
      images: [event.cover_image || PLACEHOLDER_EVENT_IMAGE],
    },
  };
}

function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const categorySlug = event.event_categories?.slug ?? category;
  const gallery = await getEventGallery(event.id);
  const videoId = youtubeId(event.youtube_url);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.summary ?? event.title,
    startDate: event.event_date,
    endDate: event.end_date ?? event.event_date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location ?? "Srinivasula Seva Samstha",
      address: event.location ?? undefined,
    },
    image: event.cover_image ? `${SITE_URL}${event.cover_image}` : undefined,
    organizer: {
      "@type": "Organization",
      name: "Srinivasula Seva Samstha",
      url: SITE_URL,
    },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        // Structured data is generated from validated database content.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="relative isolate overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 -z-10">
          <Image
            src={event.cover_image || PLACEHOLDER_EVENT_IMAGE}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-35"
            preload
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 to-ink-950" />
          <div className="aurora opacity-50" />
        </div>

        <div className="container-page relative py-16 sm:py-20">
          <nav aria-label="Breadcrumb" className="text-xs text-white/50">
            <Link href="/events" className="hover:text-gold-200">
              Events
            </Link>
            {event.event_categories ? (
              <>
                <span className="mx-2">/</span>
                <Link href={`/events/${event.event_categories.slug}`} className="hover:text-gold-200">
                  {event.event_categories.name}
                </Link>
              </>
            ) : null}
          </nav>

          <p className="mt-6 inline-flex rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-gold-200 uppercase">
            {event.event_categories?.name ?? "Event"}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
            {event.title}
          </h1>
          {event.summary ? (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/70">{event.summary}</p>
          ) : null}

          <dl className="mt-8 flex flex-wrap gap-3">
            <div className="glass rounded-2xl px-4 py-3">
              <dt className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">Date</dt>
              <dd className="mt-1 text-sm font-semibold text-white">{formatDate(event.event_date)}</dd>
            </div>
            {event.location ? (
              <div className="glass rounded-2xl px-4 py-3">
                <dt className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">
                  Location
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white">{event.location}</dd>
              </div>
            ) : null}
            <div className="glass rounded-2xl px-4 py-3">
              <dt className="text-[0.65rem] font-semibold tracking-[0.14em] text-gold-300 uppercase">Entry</dt>
              <dd className="mt-1 text-sm font-semibold text-white">Free for members</dd>
            </div>
          </dl>

          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/register" size="sm">
              Register to attend
            </ButtonLink>
            <ButtonLink href={`/events/${categorySlug}`} size="sm" variant="onDark">
              More {event.event_categories?.name ?? "events"}
            </ButtonLink>
            {event.youtube_url ? (
              <ButtonAnchor href={event.youtube_url} target="_blank" rel="noopener noreferrer" size="sm" variant="onDark">
                Watch video
              </ButtonAnchor>
            ) : null}
          </div>
        </div>
      </header>

      <div className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {event.content ? (
              <section>
                <h2 className="font-display text-2xl font-semibold text-ink-900">About this event</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700">
                  {event.content.split(/\n{2,}/).map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ) : null}

            {videoId ? (
              <section>
                <h2 className="font-display text-2xl font-semibold text-ink-900">Event video</h2>
                <div className="mt-4 aspect-video overflow-hidden rounded-3xl border border-brand-100 bg-ink-950 shadow-sm">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title={event.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="size-full"
                  />
                </div>
              </section>
            ) : null}

            {gallery.length > 0 ? (
              <section>
                <h2 className="font-display text-2xl font-semibold text-ink-900">Gallery</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((image) => (
                    <figure key={image.id} className="group relative aspect-4/3 overflow-hidden rounded-2xl">
                      <Image
                        src={image.image_url}
                        alt={image.caption ?? `${event.title} gallery image`}
                        fill
                        sizes="(max-width: 640px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {image.caption ? (
                        <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-3 text-xs text-white">
                          {image.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {event.external_links ? (
              <section>
                <h2 className="font-display text-2xl font-semibold text-ink-900">Related links</h2>
                <ul className="mt-4 space-y-2">
                  {event.external_links
                    .split("\n")
                    .map((link) => link.trim())
                    .filter(Boolean)
                    .map((link, index) => (
                      <li key={index}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold-700 hover:text-gold-600"
                        >
                          {link}
                          <span aria-hidden="true">↗</span>
                        </a>
                      </li>
                    ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="lg:col-span-4">
            <div className="surface-card sticky top-24 p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Take part</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Registration is free and helps volunteers plan food, seating and materials for every programme.
              </p>
              <ButtonLink href="/register" className="mt-5 w-full">
                Register for the trust
              </ButtonLink>
              <div className="mt-5 divider-gold" />
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Date</dt>
                  <dd className="text-right font-semibold text-ink-900">{formatDate(event.event_date)}</dd>
                </div>
                {event.location ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Location</dt>
                    <dd className="text-right font-semibold text-ink-900">{event.location}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Organiser</dt>
                  <dd className="text-right font-semibold text-ink-900">Srinivasula Seva Samstha</dd>
                </div>
              </dl>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
