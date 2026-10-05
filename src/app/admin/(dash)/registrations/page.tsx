import Link from "next/link";

import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { MemberForm } from "@/components/admin/member-form";
import { MEMBER_SORTS, parseMemberQuery, queryMembers } from "@/lib/data/members";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import { COUNTRIES, INDIAN_STATES } from "@/lib/lookups";
import type { MemberRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
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
    sort?: string;
    direction?: string;
    view?: string;
    id?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseMemberQuery(params);
  const { rows, total, error } = await queryMembers(query);
  const totalPages = Math.max(1, Math.ceil(total / query.perPage));

  const buildHref = (overrides: Record<string, string | number>) => {
    const next = new URLSearchParams();
    const merged = {
      page: query.page,
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
      sort: query.sort,
      direction: query.direction,
      ...overrides,
    };

    for (const [key, value] of Object.entries(merged)) {
      if (value === "" || value === undefined) continue;
      if (key === "page" && Number(value) <= 1) continue;
      if (key === "status" && value === "all") continue;
      if (key === "donated" && value === "all") continue;
      if (key === "direction" && value === "desc") continue;
      if (key === "sort" && value === "created_at") continue;
      if (key === "search" && value === "") continue;
      next.set(key, String(value));
    }

    const suffix = next.toString();
    return suffix ? `/admin/registrations?${suffix}` : "/admin/registrations";
  };

  const selectedMember = params.view === "member" && params.id
    ? ((await queryMembers({ ...query, page: 1, search: "", perPage: 1000 })).rows.find(
        (row) => row.id === params.id,
      ) ?? null)
    : null;

  const sortToggle = (column: string) =>
    buildHref({
      sort: column,
      direction: query.sort === column && query.direction === "asc" ? "desc" : "asc",
      page: 1,
    });

  // The export and bulk-card pages read the same filters, so what is listed is
  // what is downloaded.
  const filterParams = (() => {
    const params = new URLSearchParams();
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
      if (value) params.set(key, value);
    }
    return params.toString();
  })();

  return (
    <>
      <AdminPageHeader
        title="Registered members"
        description={`${total.toLocaleString("en-IN")} registration${total === 1 ? "" : "s"} on record. This list is private and only visible to authorised administrators.`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterParams ? `/admin/registrations/id-cards?${filterParams}` : "/admin/registrations/id-cards"}
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Bulk ID cards
            </Link>
            <Link
              href={filterParams ? `/admin/registrations/export?${filterParams}` : "/admin/registrations/export"}
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Export CSV
            </Link>
          </div>
        }
      />

      <form action="/admin/registrations" method="get" className="surface-card mb-5 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1 basis-64">
            <label htmlFor="member-search" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Search
            </label>
            <input
              id="member-search"
              name="search"
              defaultValue={query.search}
              placeholder="Number, name, father's name, village, mobile or email…"
              className="h-10 w-full rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:ring-2 focus:ring-gold-200 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="member-status" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Status
            </label>
            <select
              id="member-status"
              name="status"
              defaultValue={query.status}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div>
            <label htmlFor="member-gender" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Gender
            </label>
            <select
              id="member-gender"
              name="gender"
              defaultValue={query.gender}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label htmlFor="member-blood" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Blood group
            </label>
            <select
              id="member-blood"
              name="bloodGroup"
              defaultValue={query.bloodGroup}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-", "UNKNOWN"].map((group) => (
                <option key={group} value={group}>
                  {group === "UNKNOWN" ? "I Don't Know" : group}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="member-state" className="mb-1.5 block text-xs font-semibold text-slate-600">
              State
            </label>
            <select
              id="member-state"
              name="state"
              defaultValue={query.state}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="member-country" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Country
            </label>
            <select
              id="member-country"
              name="country"
              defaultValue={query.country}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="">All</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="member-donated" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Blood donated
            </label>
            <select
              id="member-donated"
              name="donated"
              defaultValue={query.donated}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="yes">Donated</option>
              <option value="no">Never donated</option>
            </select>
          </div>
          <div>
            <label htmlFor="member-dob-from" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Born after
            </label>
            <input
              id="member-dob-from"
              name="dobFrom"
              type="date"
              defaultValue={query.dobFrom}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="member-dob-to" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Born before
            </label>
            <input
              id="member-dob-to"
              name="dobTo"
              type="date"
              defaultValue={query.dobTo}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="member-reg-from" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Registered after
            </label>
            <input
              id="member-reg-from"
              name="registeredFrom"
              type="date"
              defaultValue={query.registeredFrom}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="member-reg-to" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Registered before
            </label>
            <input
              id="member-reg-to"
              name="registeredTo"
              type="date"
              defaultValue={query.registeredTo}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="member-sort" className="mb-1.5 block text-xs font-semibold text-slate-600">
              Sort by
            </label>
            <select
              id="member-sort"
              name="sort"
              defaultValue={query.sort}
              className="h-10 rounded-full border border-brand-200 bg-white px-4 text-sm focus:border-gold-400 focus:outline-none"
            >
              {MEMBER_SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <input type="hidden" name="direction" value={query.direction} />
          <button
            type="submit"
            className="h-10 rounded-full bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Apply
          </button>
          <Link
            href="/admin/registrations"
            className="inline-flex h-10 items-center rounded-full border border-brand-200 px-4 text-sm font-semibold text-ink-700 hover:border-gold-400"
          >
            Reset
          </Link>
        </div>
      </form>

      {error ? (
        <p role="alert" className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Could not load members: {error}
        </p>
      ) : null}

      <AdminTable
        columns={[
          {
            key: "registration_number",
            header: (
              <Link href={sortToggle("registration_number")} className="hover:text-ink-900">
                Registration No.
              </Link>
            ),
            render: (row) => (
              <span className="font-mono text-xs font-semibold text-ink-900">
                {row.registration_number}
              </span>
            ),
          },
          {
            key: "full_name",
            header: (
              <Link href={sortToggle("full_name")} className="hover:text-ink-900">
                Full Name
              </Link>
            ),
            render: (row) => <span className="font-medium text-ink-900">{row.full_name}</span>,
          },
          {
            key: "date_of_birth",
            header: (
              <Link href={sortToggle("date_of_birth")} className="hover:text-ink-900">
                Date of Birth
              </Link>
            ),
            render: (row) => formatDate(row.date_of_birth),
          },
          {
            key: "village",
            header: (
              <Link href={sortToggle("village")} className="hover:text-ink-900">
                Village
              </Link>
            ),
            render: (row) => row.village ?? "—",
          },
          {
            key: "mobile_number",
            header: "Mobile",
            render: (row) => <span className="font-mono text-xs">{row.mobile_number}</span>,
          },
          {
            key: "created_at",
            header: (
              <Link href={sortToggle("created_at")} className="hover:text-ink-900">
                Registered
              </Link>
            ),
            render: (row) => formatDateTime(row.created_at),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge value={row.status} />,
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link
                  href={buildHref({ view: "member", id: row.id })}
                  className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400 hover:text-gold-700"
                >
                  View
                </Link>
                {row.status === "active" ? (
                  <AdminQuickButton entity="member" id={row.id} action="set-disabled" label="Disable" />
                ) : (
                  <AdminQuickButton entity="member" id={row.id} action="set-active" label="Activate" />
                )}
              </div>
            ),
          },
        ]}
        rows={rows}
        rowKey={(row) => row.id}
        empty="No members match these filters."
      />

      <nav
        aria-label="Pagination"
        className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600"
      >
        <p>
          Page {query.page} of {totalPages} · showing {rows.length} of {total}
        </p>
        <div className="flex gap-2">
          <Link
            href={buildHref({ page: query.page - 1 })}
            aria-disabled={query.page <= 1}
            className={`rounded-full border border-brand-200 px-4 py-2 font-semibold ${
              query.page <= 1 ? "pointer-events-none opacity-40" : "hover:border-gold-400"
            }`}
          >
            Previous
          </Link>
          <Link
            href={buildHref({ page: query.page + 1 })}
            aria-disabled={query.page >= totalPages}
            className={`rounded-full border border-brand-200 px-4 py-2 font-semibold ${
              query.page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-gold-400"
            }`}
          >
            Next
          </Link>
        </div>
      </nav>

      {selectedMember ? (
        <div className="surface-card mt-8 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Member details · {selectedMember.registration_number}
            </h2>
            <Link
              href={buildHref({ view: "" })}
              className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-gold-400"
            >
              Close
            </Link>
          </div>
          <div className="mt-5">
            <MemberForm member={selectedMember} />
          </div>
        </div>
      ) : null}
    </>
  );
}

export type { MemberRow };
