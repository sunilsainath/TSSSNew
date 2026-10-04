import Link from "next/link";

import type { SiteBannerRow } from "@/lib/types";

const TONES = {
  info: "from-sky-600 to-blue-700",
  success: "from-emerald-600 to-teal-700",
  warning: "from-amber-500 to-orange-600",
  urgent: "from-rose-600 to-red-700",
} as const;

const ICONS = {
  info: "M10 6.5v4.2M10 13.4h.01M10 2.8a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4Z",
  success: "m6.5 10.2 2.3 2.3 4.7-4.9M10 2.8a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4Z",
  warning: "M10 6.8v3.6M10 13.1h.01M8.6 3.3 2.3 14a1.3 1.3 0 0 0 1.2 2h13a1.3 1.3 0 0 0 1.2-2l-6.3-10.7a1.3 1.3 0 0 0-2.8 0Z",
  urgent: "M10 6.6v3.7M10 13.2h.01M10 2.8a7.2 7.2 0 1 0 0 14.4 7.2 7.2 0 0 0 0-14.4Z",
} as const;

/**
 * Website-wide announcement banner.
 *
 * Renders only when an administrator has enabled a banner and the optional
 * start/end window includes today. The RLS policy on `site_banners` applies
 * the same rule at the database level.
 */
export function AnnouncementBanner({ banner }: { banner: SiteBannerRow | null }) {
  if (!banner || !banner.is_enabled) return null;

  const tone = TONES[banner.banner_type] ?? TONES.info;
  const iconPath = ICONS[banner.banner_type] ?? ICONS.info;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative z-60 bg-gradient-to-r ${tone} text-white`}
    >
      <div className="container-page flex min-h-11 flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-center text-sm font-medium">
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d={iconPath} />
        </svg>
        <span>{banner.message}</span>
        {banner.link_url ? (
          <Link
            href={banner.link_url}
            className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold underline-offset-2 transition-colors hover:bg-white/30 hover:underline"
          >
            {banner.link_label ?? "Learn more"}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
