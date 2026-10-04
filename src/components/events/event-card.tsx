import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";
import { formatDate, isFutureDate } from "@/lib/utils/format";
import { PLACEHOLDER_EVENT_IMAGE } from "@/lib/constants";
import type { EventWithCategory } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Props = {
  event: EventWithCategory;
  href: string;
  className?: string;
  priority?: boolean;
  showCategory?: boolean;
};

export function EventCard({ event, href, className, priority, showCategory = true }: Props) {
  const upcoming = isFutureDate(event.event_date);

  return (
    <article
      className={cn(
        "surface-card surface-card-hover group relative flex h-full flex-col overflow-hidden",
        className,
      )}
    >      <div className="relative aspect-16/10 overflow-hidden bg-ink-800">
        <Image
          src={event.cover_image || PLACEHOLDER_EVENT_IMAGE}
          alt={event.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          {...(priority ? { preload: true } : {})}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/20 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          {showCategory && event.event_categories ? (
            <Badge tone="gold">{event.event_categories.name}</Badge>
          ) : null}
          {event.is_featured ? <Badge tone="light">Featured</Badge> : null}
        </div>
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-ink-950/70 px-3 py-1.5 backdrop-blur">
          <span className="text-xs font-semibold text-gold-100">{formatDate(event.event_date)}</span>
          <span className="text-xs text-white/60">·</span>
          <span className="text-xs text-white/80">{upcoming ? "Upcoming" : "Held"}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-lg leading-snug font-semibold text-ink-900 transition-colors group-hover:text-gold-700">
          <Link href={href} className="before:absolute before:inset-0">
            {event.title}
          </Link>
        </h3>
        {event.location ? (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="size-4 shrink-0 text-gold-500" fill="currentColor">
              <path d="M10 2a5.5 5.5 0 0 0-5.5 5.5c0 3.9 4.6 9.3 4.8 9.5a1 1 0 0 0 1.4 0c.2-.2 4.8-5.6 4.8-9.5A5.5 5.5 0 0 0 10 2Zm0 7.6a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Z" />
            </svg>
            <span className="truncate">{event.location}</span>
          </p>
        ) : null}
        {event.summary ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{event.summary}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-semibold text-gold-700">
          View Event
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 transition-transform group-hover:translate-x-1" fill="currentColor">
            <path d="M8.2 2.3a.9.9 0 0 0 0 1.3l3.5 3.5H2.8a.9.9 0 1 0 0 1.8h8.9l-3.5 3.5a.9.9 0 1 0 1.3 1.3l5-5a.9.9 0 0 0 0-1.3l-5-5a.9.9 0 0 0-1.3 0Z" />
          </svg>
        </span>      </div>
    </article>
  );
}
