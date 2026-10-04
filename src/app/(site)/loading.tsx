import Link from "next/link";

import { ButtonLink } from "@/components/ui/button";

export default function Loading() {
  return (
    <div className="container-page py-20">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-2/3 rounded-full" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-5/6 rounded" />
        <div className="grid gap-4 pt-8 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-40 rounded-3xl" />
          ))}
        </div>
      </div>
      <p className="sr-only" role="status">
        Loading content
      </p>
    </div>
  );
}

export function QuickLinksFallback() {
  return (
    <div className="flex flex-wrap gap-3">
      <ButtonLink href="/events">Events</ButtonLink>
      <Link href="/about" className="text-sm text-slate-600 underline">
        About
      </Link>
    </div>
  );
}
