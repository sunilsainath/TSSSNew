import Link from "next/link";

import { BrandEmblem } from "@/components/brand/brand-emblem";
import { SITE_NAME } from "@/lib/constants";

/**
 * Shared shell for the three unauthenticated admin screens (sign in, forgot
 * password, set a new password) so they look identical.
 */
export function AdminAuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-5 py-16">
      <div className="aurora opacity-60" aria-hidden="true" />

      <div className="relative w-full max-w-md">
        <div className="glass rounded-4xl p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 p-1">
              <BrandEmblem alt={`${SITE_NAME} emblem`} size={56} priority />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{SITE_NAME}</p>
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-gold-300 uppercase">
                Admin panel
              </p>
            </div>
          </div>

          <h1 className="mt-7 font-display text-xl font-semibold text-white">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-white/65">{subtitle}</p>
          ) : null}

          {children}
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          {footer ?? (
            <>
              Sessions are secured by Supabase Auth. Contact the Super Admin if you need access.{" "}
              <Link href="/" className="underline underline-offset-2">
                Back to site
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  );
}

/**
 * Form controls on these screens sit on a dark background, so they override the
 * light defaults from `@/components/ui/input`.
 */
export const authFieldClass =
  "border-white/15 bg-white/5 text-white placeholder:text-white/35 hover:border-white/25 focus:border-gold-400";