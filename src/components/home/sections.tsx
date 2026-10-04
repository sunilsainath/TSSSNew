import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { BrandEmblem } from "@/components/brand/brand-emblem";
import { EventCard } from "@/components/events/event-card";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { PLACEHOLDER_BLOG_IMAGE, PLACEHOLDER_MEDIA_IMAGE, SITE_NAME } from "@/lib/constants";
import type { BlogRow, EventWithCategory, MediaItemRow } from "@/lib/types";

export function UpcomingEvents({ events }: { events: EventWithCategory[] }) {
  if (events.length === 0) {
    return (
      <section className="py-20 sm:py-24">
        <div className="container-page">
          <SectionHeading eyebrow="Events" title="Upcoming events" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="surface-card overflow-hidden">
                <div className="skeleton aspect-16/10" />
                <div className="space-y-3 p-6">
                  <div className="skeleton h-5 w-3/4 rounded" />
                  <div className="skeleton h-4 w-1/2 rounded" />
                  <div className="skeleton h-3 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Events"
          title="Upcoming programmes"
          description="Devotional gatherings, community service drives and educational initiatives — all open to every Srinivas family."
          action={
            <ButtonLink href="/events" variant="secondary" size="sm">
              View all events
            </ButtonLink>
          }
        />

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <EventCard
              key={event.id}
              event={event}
              href={`/events/${event.event_categories?.slug ?? "all"}/${event.slug}`}
              priority={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function AboutPreview({
  about,
  mission,
  vision,
}: {
  about: string | null;
  mission: string | null;
  vision: string | null;
}) {
  return (
    <section className="bg-slate-50/70 py-20 sm:py-24">
      <div className="container-page grid items-center gap-14 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionHeading
            align="left"
            eyebrow="About TSSS"
            title={<>A community trust built on devotion and service</>}
            description={about ?? undefined}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="surface-card p-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
                <span className="grid size-8 place-items-center rounded-lg bg-gold-100 text-gold-700" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor"><path d="M10 1.8 2.5 4.6v5c0 4.6 3.2 8.5 7.5 10.1 4.3-1.6 7.5-5.5 7.5-10.1v-5L10 1.8Zm0 3 4.6 1.7v3.1c0 3-2 5.8-4.6 7-2.6-1.2-4.6-4-4.6-7V6.5L10 4.8Z" /></svg>
                </span>
                Our Mission
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {mission ?? "To serve society through devotion, education, relief and healthcare assistance."}
              </p>
            </div>
            <div className="surface-card p-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink-900">
                <span className="grid size-8 place-items-center rounded-lg bg-sky-100 text-sky-700" aria-hidden="true">
                  <svg viewBox="0 0 20 20" className="size-4" fill="currentColor"><path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Zm3.6 9.1a.9.9 0 0 1-1.3.4 4.9 4.9 0 0 0-4.6 0 .9.9 0 0 1-1.3-.4 1 1 0 0 1 .3-1.3 6.8 6.8 0 0 1 5.6 0 .9.9 0 0 1 .3 1.3Z" /></svg>
                </span>
                Our Vision
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {vision ?? "A united, spiritually grounded community that serves every family with dignity and care."}
              </p>
            </div>
          </div>

          <ButtonLink href="/about" variant="secondary">
            Learn More
          </ButtonLink>
        </div>

        <div className="relative">
          <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-4xl bg-[radial-gradient(circle_at_50%_35%,#0b6ab5_0%,#052540_55%,#02101f_100%)] shadow-[0_40px_90px_-45px_rgba(7,12,26,0.6)]">
            <div className="brand-halo absolute size-4/5 animate-glow rounded-full" aria-hidden="true" />
            <div className="relative grid aspect-square w-3/5 max-w-xs place-items-center rounded-full bg-white shadow-[0_28px_60px_-20px_rgba(2,16,31,0.75)] ring-1 ring-white/60">
              <BrandEmblem
                alt={`${SITE_NAME} emblem`}
                size={320}
                className="size-full scale-[0.94] object-contain"
              />
            </div>
          </div>
          <div className="glass absolute -bottom-6 -left-4 hidden max-w-xs rounded-3xl p-5 lg:block">
            <p className="text-xs font-semibold tracking-[0.16em] text-gold-300 uppercase">
              Serving since inception
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">
              One community, many hands — devotion, education, blood assistance and service.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function HelpingHands() {
  const initiatives = [
    {
      title: "Blood Assistance Network",
      description:
        "District-wise volunteers who respond to blood requests within hours, coordinated from our blood help desk.",
      icon: "M10 3.2s-5.5 3.4-5.5 7a5.5 5.5 0 0 0 11 0c0-3.6-5.5-7-5.5-7Zm0 9.3a2.3 2.3 0 0 1-2.3-2.3c0-1.4 2.3-3.3 2.3-3.3s2.3 1.9 2.3 3.3a2.3 2.3 0 0 1-2.3 2.3Z",
      href: "/blood-help",
      cta: "Request Blood Help",
    },
    {
      title: "Education & Pen Distribution",
      description:
        "School kits, notebooks and pens distributed to students, plus free spoken English and computer classes.",
      icon: "M10 3 2 6.4l8 3.4 8-3.4L10 3ZM4.6 8.9v3.6c0 1.6 2.4 3 5.4 3s5.4-1.4 5.4-3V8.9L10 11.5 4.6 8.9Z",
      href: "/events/educational-programs",
      cta: "See programmes",
    },
    {
      title: "Relief & Community Service",
      description:
        "Distribution of relief material, support to families in distress and participation in disaster response.",
      icon: "M10 17.5s-6.4-3.7-6.4-8A3.6 3.6 0 0 1 10 7.4a3.6 3.6 0 0 1 6.4 2.1c0 4.3-6.4 8-6.4 8Z",
      href: "/events/helping-hands",
      cta: "View initiatives",
    },
  ];

  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Helping Hands"
          title="Where the community stands together"
          description="Charitable work that runs on volunteers, goodwill and the trust of every family."
        />

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {initiatives.map((item) => (
            <div
              key={item.title}
              className="surface-card surface-card-hover group flex flex-col p-7"
            >
              <span
                className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 text-gold-300"
                aria-hidden="true"
              >
                <svg viewBox="0 0 20 20" className="size-6" fill="currentColor">
                  <path d={item.icon} />
                </svg>
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
              <Link
                href={item.href}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600"
              >
                {item.cta}
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LatestBlogs({ blogs }: { blogs: BlogRow[] }) {
  return (
    <section className="bg-slate-50/70 py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Stories"
          title="Latest from the community"
          description="Approved articles shared by our members and volunteers."
          action={
            <ButtonLink href="/blogs" variant="secondary" size="sm">
              All blogs
            </ButtonLink>
          }
        />

        {blogs.length === 0 ? (
          <p className="mt-12 text-center text-sm text-slate-500">
            No published articles yet. Members can submit stories from the blogs page.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <article key={blog.id} className="surface-card surface-card-hover group flex flex-col overflow-hidden">
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
                  <h3 className="font-display text-lg leading-snug font-semibold text-ink-900 group-hover:text-gold-700">
                    <Link href={`/blogs/${blog.slug}`}>{blog.title}</Link>
                  </h3>
                  {blog.excerpt ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{blog.excerpt}</p>
                  ) : null}
                  <span className="mt-auto pt-2 text-sm font-semibold text-gold-700">Read article</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function MediaPreview({ items }: { items: MediaItemRow[] }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <SectionHeading
          eyebrow="Media"
          title="Watch and read our work"
          description="Video highlights and press coverage of the trust's activities."
          action={
            <ButtonLink href="/media" variant="secondary" size="sm">
              All media
            </ButtonLink>
          }
        />

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-slate-500">
            No media published yet. Administrators can add YouTube videos and press links from the media section.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="surface-card surface-card-hover group flex flex-col overflow-hidden"
              >
                <div className="relative aspect-16/9 overflow-hidden bg-ink-800">
                  <Image
                    src={item.thumbnail_url || PLACEHOLDER_MEDIA_IMAGE}
                    alt={item.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-ink-950/25 transition-opacity group-hover:opacity-10" />
                  <span className="absolute left-3 top-3 rounded-full bg-ink-950/70 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-white uppercase backdrop-blur">
                    {item.type === "youtube" ? "Video" : "News"}
                  </span>
                  {item.type === "youtube" ? (
                    <span
                      className="absolute inset-0 grid place-items-center"
                      aria-hidden="true"
                    >
                      <span className="grid size-12 place-items-center rounded-full bg-gold-400/90 text-ink-950 shadow-lg transition-transform group-hover:scale-110">
                        <svg viewBox="0 0 20 20" className="ml-0.5 size-5" fill="currentColor">
                          <path d="M6 4.5v11l9-5.5-9-5.5Z" />
                        </svg>
                      </span>
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <p className="text-xs text-slate-500">
                    {item.source_name ?? "TSSS"}
                    {item.publication_date ? ` · ${formatDate(item.publication_date)}` : ""}
                  </p>
                  <h3 className="line-clamp-2 font-display text-base leading-snug font-semibold text-ink-900 group-hover:text-gold-700">
                    {item.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function PhotoBoothCta() {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gold-600 uppercase">
              Photo Booth
            </p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold text-balance text-ink-900 sm:text-4xl">
              Create a branded memory at your next family gathering
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Choose a TSSS frame, add your photos, adjust them until they look right and download the finished
              picture. Everything happens in your browser — your photos are never uploaded.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="/photo-booth" size="lg">
                Open Photo Booth
              </ButtonLink>
              <ButtonLink href="/events" size="lg" variant="secondary">
                See events
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { src: "/images/photobooth/frame-collage-4-preview.jpg", alt: "Four photo collage template" },
              { src: "/images/photobooth/frame-strip-3-preview.jpg", alt: "Photo strip template" },
              { src: "/images/photobooth/frame-circle-preview.jpg", alt: "Classic circle template" },
            ].map((item, index) => (
              <div
                key={item.src}
                className="surface-card overflow-hidden p-2 transition-transform duration-300 hover:-translate-y-1"
                style={{ transform: `rotate(${(index - 1) * 3}deg)` }}
              >
                <div className="relative aspect-3/4 overflow-hidden rounded-2xl bg-ink-900">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 30vw, 180px"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function BloodHelpCta() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-20 text-white sm:py-24">
      <div className="aurora opacity-60" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(115deg, transparent 40%, rgba(212,175,55,0.25) 50%, transparent 60%)",
        }}
        aria-hidden="true"
      />
      <div className="container-page relative text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-rose-200 uppercase">
          <span className="size-1.5 animate-pulse rounded-full bg-rose-300" aria-hidden="true" />
          Emergency assistance
        </span>
        <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-tight font-semibold text-balance sm:text-5xl">
          Need Blood Help?
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
          Submit a request and our district volunteer is notified immediately. Requests are routed by district and
          area, so help reaches you faster.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <a
            href="/blood-help"
            className="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-red-600 px-8 text-base font-semibold text-white shadow-[0_14px_36px_-14px_rgba(244,63,94,0.9)] transition-transform hover:scale-[1.02]"
          >
            Request Blood Help
          </a>
          <ButtonLink href="/events/helping-hands" size="lg" variant="onDark">
            How it works
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function RegistrationCta({ open }: { open: boolean }) {
  return (
    <section className="py-20 sm:py-24">
      <div className="container-page">
        <div
          className={cn(
            "relative overflow-hidden rounded-5xl px-6 py-14 text-center sm:px-14",
            "bg-gradient-to-br from-ink-900 via-ink-800 to-ink-950 text-white",
          )}
        >
          <div className="aurora opacity-70" aria-hidden="true" />
          <div className="relative mx-auto max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Membership</p>
            <h2 className="mt-4 text-3xl leading-tight font-semibold text-balance sm:text-4xl">
              Register your family with Srinivasula Seva Samstha
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/70">
              Registration is <span className="font-semibold text-gold-200">free</span> and takes under a minute. You
              will receive a permanent registration number such as{" "}
              <span className="font-mono text-gold-200">TSSS000123</span> that identifies you across every trust
              programme.
            </p>

            {open ? (
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <ButtonLink
                  href="/register"
                  size="lg"
                  className="inline-flex h-13 items-center justify-center rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-8 text-base font-semibold text-ink-950 shadow-[0_12px_30px_-12px_rgba(200,149,47,0.9)] transition-transform hover:scale-[1.02]"
                >
                  Register Now
                </ButtonLink>
                <ButtonLink
                  href="/blogs"
                  size="lg"
                  variant="onDark"
                  className="inline-flex h-13 items-center justify-center rounded-full border border-white/25 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur transition-colors hover:border-gold-400/70 hover:text-gold-100"
                >
                  Share Your Story
                </ButtonLink>
              </div>
            ) : (
              <p className="mt-8 inline-flex rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm text-white/70">
                Registration is temporarily paused. Please check back soon.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
