import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoBoothStudio } from "@/components/photobooth/photo-booth-studio";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getPhotoBoothTemplateBySlug, getPhotoBoothTemplates } from "@/lib/data/photo-booth";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Photo Booth",
  description:
    "Create a TSSS photo booth memory: pick a branded frame, add your photos, adjust them and download the picture instantly. Nothing is uploaded.",
  alternates: { canonical: "/photo-booth" },
  openGraph: {
    title: "Photo Booth | Srinivasula Seva Samstha",
    description:
      "Pick a template, add your photos and download a branded TSSS picture. Your photos stay on your device.",
    url: "/photo-booth",
  },
};

export default async function PhotoBoothPage() {
  const templates = await getPhotoBoothTemplates();

  if (templates.length === 0) {
    notFound();
  }

  const withCounts = await Promise.all(
    templates.map(async (template) => {
      const full = await getPhotoBoothTemplateBySlug(template.slug);
      return {
        ...template,
        slotCount: full?.slots.length ?? 0,
      };
    }),
  );

  const featured = withCounts.find((template) => template.is_featured) ?? withCounts[0];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "TSSS Photo Booth",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any",
    url: `${SITE_URL}/photo-booth`,
    description:
      "Choose a TSSS frame, add your photos, adjust them and download the finished picture.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-gold-200 uppercase">
              <span className="size-1.5 rounded-full bg-gold-300" aria-hidden="true" />
              Free · No app needed
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
              TSSS Photo Booth
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              Pick a template, add your photos, adjust them until they look right, then download the finished picture —
              perfect for family gatherings, satsangam and community events.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/70">
              {[
                "Templates maintained by the trust, ready to update anytime",
                "Drag, zoom and rotate each photo inside its frame",
                "Download as a high resolution PNG, or share straight from your phone",
                "Your photos never leave your device",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-gold-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="glass overflow-hidden rounded-4xl p-4 shadow-[0_40px_90px_-40px_rgba(212,175,55,0.45)]">
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-ink-900">
                <Image
                  src={featured.preview_image ?? featured.frame_image}
                  alt={`${featured.name} template preview`}
                  fill
                  sizes="(max-width: 640px) 90vw, 380px"
                  className="object-cover"
                  preload
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-semibold text-white">{featured.name}</p>
                  <p className="text-xs text-white/55">{featured.description}</p>
                </div>
                {featured.is_featured ? <Badge tone="gold">Popular</Badge> : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="container-page">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.22em] text-gold-600 uppercase">
                Templates
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-ink-900 sm:text-3xl">
                Create your memory
              </h2>
            </div>
            <p className="max-w-md text-sm text-slate-600">
              Choose a template to begin. New templates are added by the trust administration and appear here
              automatically.
            </p>
          </div>

          <PhotoBoothStudio templates={withCounts} />
        </div>
      </section>

      <section className="bg-slate-50/70 py-14">
        <div className="container-page grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "How to use it",
              body: "Pick a template, tap Add photo for each frame, then drag to adjust. Use the sliders to zoom or rotate.",
            },
            {
              title: "Print or share",
              body: "Download the finished PNG at full resolution and print it, or share it directly from your phone.",
            },
            {
              title: "Privacy",
              body: "Photos are processed inside your browser. Nothing is uploaded to our servers and no copy is stored.",
            },
          ].map((item) => (
            <div key={item.title} className="surface-card p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-14">
        <div className="container-page text-center">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            Print these at your next family gathering
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
            Register with the trust to receive programme announcements, and bring your printed photo booth pictures to
            the next Satsangam.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/register">Register</ButtonLink>
            <ButtonLink href="/events" variant="secondary">
              See upcoming events
            </ButtonLink>
          </div>
          <p className="mt-6 text-xs text-slate-400">
            Looking for an older event gallery?{" "}
            <Link href="/events" className="font-semibold text-gold-700">
              Browse events
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}