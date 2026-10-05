import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-table";
import { fetchAllMembers, parseMemberQuery } from "@/lib/data/members";
import { MAX_CARDS_PER_BATCH } from "@/lib/idcard/bulk";

export const dynamic = "force-dynamic";

/**
 * Confirms a bulk identity card download: how many members match, how many
 * cards one file holds, and a link that generates them.
 */
export default async function BulkIdCardsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    gender?: string;
    bloodGroup?: string;
    state?: string;
    country?: string;
    donated?: string;
    dobFrom?: string;
    dobTo?: string;
    registeredFrom?: string;
    registeredTo?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseMemberQuery(params);
  const { rows, error } = await fetchAllMembers(query);

  const activeFilters = [
    query.search ? `for "${query.search}"` : "",
    query.status !== "all" ? `with status ${query.status}` : "",
    query.gender ? `gender ${query.gender}` : "",
    query.bloodGroup ? `blood group ${query.bloodGroup}` : "",
    query.state ? `state ${query.state}` : "",
    query.country ? `country ${query.country}` : "",
    query.donated !== "all" ? (query.donated === "yes" ? "who donated blood" : "who never donated") : "",
  ].filter(Boolean);

  const downloadParams = new URLSearchParams();
  for (const [key, value] of Object.entries({
    search: query.search,
    status: query.status,
    gender: query.gender,
    bloodGroup: query.bloodGroup,
    state: query.state,
    country: query.country,
    donated: query.donated,
    dobFrom: query.dobFrom,
    dobTo: query.dobTo,
    registeredFrom: query.registeredFrom,
    registeredTo: query.registeredTo,
  })) {
    if (value) downloadParams.set(key, value);
  }

  const renderable = Math.min(rows.length, MAX_CARDS_PER_BATCH);

  return (
    <>
      <AdminPageHeader
        title="Bulk identity cards"
        description="Each card is regenerated from the member's current details, so the download always reflects the latest edits."
        action={
          <Link
            href="/admin/registrations"
            className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Back to members
          </Link>
        }
      />

      <div className="surface-card p-6">
        {error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-slate-600">
            No members match these filters{activeFilters.length > 0 ? ` ${activeFilters.join(", ")}` : ""}.
            Loosen the filters on the member list and try again.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {rows.length.toLocaleString("en-IN")} member(s) match
              {activeFilters.length > 0 ? ` ${activeFilters.join(", ")}` : ""}. This file holds the
              first {renderable} card(s), one PNG per member named by registration number, plus a
              README listing what is inside.
            </p>
            {rows.length > MAX_CARDS_PER_BATCH ? (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                The selection is larger than one file ({MAX_CARDS_PER_BATCH} cards per download).
                Narrow the filters — by village, blood group or registration date — and download
                each slice separately.
              </p>
            ) : null}
            <a
              href={`/api/admin/members/id-cards?${downloadParams.toString()}`}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              download
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M10 2a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Zm-6 8h1.2a4.8 4.8 0 0 0 9.6 0H16a6 6 0 0 1-5 5.9V18H9v-2.1A6 6 0 0 1 4 10Z" />
              </svg>
              Download {renderable} card(s) as ZIP
            </a>
          </>
        )}
      </div>
    </>
  );
}