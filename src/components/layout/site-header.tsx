import Link from "next/link";

import { BrandEmblem } from "@/components/brand/brand-emblem";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { FEATURE_NAV, PRIMARY_NAV, REGISTER_NAV } from "@/lib/constants";

type Branding = {
  name: string;
  shortName: string;
  logo: string;
};

export function SiteHeader({ branding }: { branding: Branding }) {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-100/70 bg-white/90 backdrop-blur-xl">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-3"
          aria-label={`${branding.name} home`}
        >
          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(11,106,181,0.85)] ring-1 ring-brand-200 transition-transform duration-300 group-hover:scale-105 sm:size-14">
            <BrandEmblem alt={`${branding.name} emblem`} size={56} priority />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold text-ink-900 transition-colors group-hover:text-brand-700 sm:text-xl">
              {branding.name}
            </span>
            <span className="block text-[0.68rem] font-semibold tracking-[0.2em] text-brand-700 uppercase">
              {branding.shortName} · Service · Devotion · Unity
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative rounded-full px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/photo-booth"
            className="hidden items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-100 md:inline-flex"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4" fill="currentColor">
              <path d="M9.3 3.6a1 1 0 0 1 1.9.5l.4 1.6a6.6 6.6 0 0 1 2.2 1.3l1.6-.4a1 1 0 0 1 1.1 1.6l-1 1.3a6.7 6.7 0 0 1 0 2.6l1 1.3a1 1 0 0 1-1.1 1.6l-1.6-.4a6.6 6.6 0 0 1-2.2 1.3l-.4 1.6a1 1 0 0 1-1.9.5l-.6-1.5a6.7 6.7 0 0 1-2.6 0L5.9 17a1 1 0 0 1-1.9-.5l-.4-1.6a6.6 6.6 0 0 1-2.2-1.3l-1.6.4a1 1 0 0 1-1.1-1.6l1-1.3a6.7 6.7 0 0 1 0-2.6l-1-1.3a1 1 0 0 1 1.1-1.6l1.6.4a6.6 6.6 0 0 1 2.2-1.3l.4-1.6A1 1 0 0 1 6.9 2.6L7.5 4a6.7 6.7 0 0 1 2.6 0l-.8-1.4Z" />
            </svg>
            Photo Booth
          </Link>
          <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
            Register
          </ButtonLink>
          <details className="group relative lg:hidden">
            <summary
              className="flex size-10 cursor-pointer list-none items-center justify-center rounded-xl border border-brand-200 text-ink-800 transition-colors hover:border-brand-400 [&::-webkit-details-marker]:hidden"
              aria-label="Open navigation menu"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5" fill="currentColor">
                <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
              </svg>
            </summary>
            <div
              className={cn(
                "absolute right-0 z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-brand-100 bg-white p-2 shadow-[0_24px_60px_-24px_rgba(5,37,64,0.45)]",
              )}
            >
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              <div className="my-2 divider-gold" />
              {FEATURE_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={REGISTER_NAV.href}
                className="mt-1 block rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-center text-sm font-semibold text-white sm:hidden"
              >
                {REGISTER_NAV.label}
              </Link>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}