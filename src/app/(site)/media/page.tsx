import type { Metadata } from "next";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { getMediaItems, getSiteSettings } from "@/lib/data/public";
import { PLACEHOLDER_MEDIA_IMAGE } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import type { MediaItemRow } from "@/lib/types";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Media",
  description:
    "Watch videos and read press coverage of Srinivasula Seva Samstha programmes, community service and devotional events.",
  alternates: { canonical: "/media" },
  openGraph: {
    title: "Media | Srinivasula Seva Samstha",
    description: "Video highlights and press coverage from the trust.",
    url: "/media",
  },
};

function youtubeId(url: string): string | null {
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

function MediaCard({ item }: { item: MediaItemRow }) {
  const videoId = item.type === "youtube" ? youtubeId(item.url) : null;

  return (
    <article className="surface-card surface-card-hover group flex flex-col overflow-hidden">
      <div className="relative aspect-16/9 overflow-hidden bg-ink-800">
        {videoId ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title={item.title}
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        ) : (
          <>
            <Image
              src={item.thumbnail_url || PLACEHOLDER_MEDIA_IMAGE}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-ink-950/20 transition-opacity group-hover:opacity-0" />
          </>
        )}
        <span className="absolute left-3 top-3">
          <Badge tone={item.type === "youtube" ? "red" : "blue"}>
            {item.type === "youtube" ? "Video" : "News"}
          </Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-6">
        <p className="text-xs text-slate-500">
          {item.source_name ?? "TSSS"}
          {item.publication_date ? ` · ${formatDate(item.publication_date)}` : ""}
        </p>
        <h2 className="font-display text-lg leading-snug font-semibold text-ink-900">{item.title}</h2>
        {item.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
        ) : null}
        <div className="mt-auto pt-3">
          <ButtonAnchor
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="secondary"
          >
            {item.type === "youtube" ? "Watch on YouTube" : "Read article"}
          </ButtonAnchor>
        </div>
      </div>
    </article>
  );
}

export default async function MediaPage() {
  const [videos, news, settings] = await Promise.all([
    getMediaItems({ type: "youtube", limit: 24 }),
    getMediaItems({ type: "news", limit: 24 }),
    getSiteSettings(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-50" aria-hidden="true" />
        <div className="container-page relative text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Watch &amp; read</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">Media</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Video highlights from our programmes and press coverage of the trust&apos;s service work.
          </p>
          {settings.youtube_url ? (
            <ButtonAnchor
              href={settings.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8"
              size="sm"
            >
              Subscribe on YouTube
            </ButtonAnchor>
          ) : null}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page space-y-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="YouTube"
              title="Videos"
              description="Devotional highlights, community service drives and awareness programmes."
            />
            {videos.length === 0 ? (
              <p className="mt-8 text-sm text-slate-500">
                No videos published yet. Administrators can add YouTube links from the admin panel.
              </p>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {videos.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div>
            <SectionHeading
              align="left"
              eyebrow="Press"
              title="News &amp; media coverage"
              description="Coverage of the trust's activities in newspapers, television and online media."
            />
            {news.length === 0 ? (
              <p className="mt-8 text-sm text-slate-500">
                No press coverage published yet. Articles added by administrators appear here.
              </p>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {news.map((item) => (
                  <MediaCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          <div className="surface-card flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Have coverage about our work?</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Send the link to the administration and it will be published here for the community.
              </p>
            </div>
            <ButtonLink href="/about#contact" variant="secondary" className="shrink-0">
              Contact the trust
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
