import { BrandEmblem } from "@/components/brand/brand-emblem";
import { ButtonLink } from "@/components/ui/button";
import type { EventWithCategory } from "@/lib/types";
import { formatDate } from "@/lib/utils/format";

type Props = {
  name: string;
  tagline: string | null;
  nextEvent?: EventWithCategory | null;
};

export function Hero({ name, tagline, nextEvent }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-ink-950 text-white">
      {/* background layers */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/92 via-ink-900 to-ink-950" />
        <div className="aurora animate-glow" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(27,132,221,0.5) 1px, transparent 0)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 75%)",
          }}
        />
      </div>

      <div
        className="pointer-events-none absolute -left-32 top-16 -z-10 hidden size-96 animate-float-slow rounded-full bg-brand-500/20 blur-3xl lg:block"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-8 -z-10 hidden size-96 animate-float rounded-full bg-gold-400/10 blur-3xl lg:block"
        aria-hidden="true"
      />

      <div className="container-page relative py-20 sm:py-24 lg:py-32">
        <div className="grid items-center gap-14 lg:grid-cols-12">
          {/* Emblem */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <div className="relative mx-auto w-full max-w-sm lg:max-w-none">
              <div className="brand-halo absolute -inset-10 -z-10 animate-glow rounded-full" aria-hidden="true" />

              <div className="glass relative overflow-hidden rounded-5xl p-6 shadow-[0_50px_110px_-45px_rgba(11,106,181,0.85)] sm:p-8">
                <div className="relative mx-auto aspect-square w-full max-w-[19rem] rounded-full bg-white shadow-[0_18px_45px_-12px_rgba(2,16,31,0.7)] ring-1 ring-white/60">
                  <BrandEmblem
                    alt={`${name} emblem`}
                    size={320}
                    priority
                    className="size-full scale-[0.94] object-contain"
                  />
                </div>

                <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
                  <p className="font-display text-lg leading-tight font-semibold text-white sm:text-xl">
                    Telangana Srinivasula Seva Samstha
                  </p>
                  <p className="mt-1.5 text-[0.68rem] font-semibold tracking-[0.24em] text-gold-300 uppercase">
                    Est. for Service
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Copy + CTAs */}
          <div className="order-1 lg:order-2 lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/15 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-brand-200 uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-gold-300" aria-hidden="true" />
              Non-profit community trust
            </p>

            <h1 className="mt-6 text-4xl leading-[1.08] font-semibold text-balance sm:text-5xl lg:text-6xl">
              <span className="text-white">{name}</span>
              <span className="mt-2 block text-gradient-gold">
                Service · Devotion · Unity
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/70 sm:text-lg">
              {tagline ??
                "Bringing every Srinivas family together through devotional programmes, education, blood assistance and community service."}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/register" size="lg" variant="brand">
                Register Now
              </ButtonLink>
              <ButtonLink href="/blood-help" size="lg" variant="onDark">
                Blood Help
              </ButtonLink>
              <ButtonLink href="/events" size="lg" variant="onDark">
                Upcoming Events
              </ButtonLink>
              <ButtonLink href="/donations" size="lg" variant="onDark">
                Donate
              </ButtonLink>
            </div>

            {nextEvent ? (
              <div className="glass mt-10 flex flex-col gap-3 rounded-3xl p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.68rem] font-semibold tracking-[0.2em] text-gold-300 uppercase">
                    Next programme
                  </p>
                  <p className="mt-1.5 truncate font-display text-lg font-semibold text-white">
                    {nextEvent.title}
                  </p>
                  <p className="mt-1 text-sm text-white/60">
                    {formatDate(nextEvent.event_date)}
                    {nextEvent.location ? ` · ${nextEvent.location}` : ""}
                  </p>
                </div>
                <ButtonLink
                  href={`/events/${nextEvent.event_categories?.slug ?? "all"}/${nextEvent.slug}`}
                  size="sm"
                  variant="onDark"
                  className="shrink-0"
                >
                  View Event
                </ButtonLink>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}