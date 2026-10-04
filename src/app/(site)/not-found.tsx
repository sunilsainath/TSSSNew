import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-ink-950 py-24 text-white sm:py-32">
      <div className="aurora opacity-50" aria-hidden="true" />
      <div className="container-page relative text-center">
        <p className="font-display text-7xl font-semibold text-gradient-gold sm:text-8xl">404</p>
        <h1 className="mt-6 text-3xl font-semibold sm:text-4xl">This page could not be found</h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-white/70">
          The page you are looking for may have been moved, renamed, or is not published yet.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/">Back to home</ButtonLink>
          <Link
            href="/events"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/25 bg-white/5 px-6 text-sm font-semibold text-white transition-colors hover:border-gold-400/70 hover:text-gold-100"
          >
            Browse events
          </Link>
        </div>
      </div>
    </section>
  );
}
