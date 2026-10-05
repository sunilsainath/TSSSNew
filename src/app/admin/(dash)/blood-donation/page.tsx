import Link from "next/link";

import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { StatCard } from "@/components/admin/stat-card";
import {
  getAreaMetrics,
  getGroupMetrics,
  getOverallMetrics,
} from "@/lib/data/blood-donation";

export const dynamic = "force-dynamic";

/**
 * Blood donation dashboard: overall metrics, per blood group, and area-wise
 * drill-down from state to city to area.
 */
export default async function BloodDonationDashboard({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; city?: string; area?: string }>;
}) {
  const params = await searchParams;
  const scope = {
    state: (params.state ?? "").trim().toUpperCase(),
    city: (params.city ?? "").trim(),
    area: (params.area ?? "").trim(),
  };

  const [overall, groups, areas] = await Promise.all([
    getOverallMetrics(scope.state || scope.city || scope.area ? scope : {}),
    getGroupMetrics(),
    getAreaMetrics(scope.state || scope.city ? scope : {}),
  ]);

  const crumbs = [
    { label: "All states", href: "/admin/blood-donation" },
    ...(scope.state
      ? [{ label: scope.state, href: `/admin/blood-donation?state=${encodeURIComponent(scope.state)}` }]
      : []),
    ...(scope.city
      ? [
          {
            label: scope.city,
            href: `/admin/blood-donation?state=${encodeURIComponent(scope.state)}&city=${encodeURIComponent(scope.city)}`,
          },
        ]
      : []),
  ];

  const drillHref = (row: { key: string }) => {
    if (areas.level === "state") return `/admin/blood-donation?state=${encodeURIComponent(row.key)}`;
    if (areas.level === "city") {
      return `/admin/blood-donation?state=${encodeURIComponent(scope.state)}&city=${encodeURIComponent(row.key)}`;
    }
    return `/admin/blood-donation?state=${encodeURIComponent(scope.state)}&city=${encodeURIComponent(scope.city)}&area=${encodeURIComponent(row.key)}`;
  };

  return (
    <>
      <AdminPageHeader
        title="Blood donation dashboard"
        description="Donors, donations and requests. Historical camps feed these numbers through the bulk import."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/blood-donation/import"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Import donations
            </Link>
            <Link
              href="/admin/blood-donation/donors"
              className="inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-5 text-sm font-semibold text-white hover:bg-ink-800"
            >
              Donor roll
            </Link>
          </div>
        }
      />

      {(scope.state || scope.city || scope.area) && (
        <nav aria-label="Area" className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          {crumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 ? <span aria-hidden="true" className="text-slate-400">/</span> : null}
              <Link href={crumb.href} className="font-semibold text-brand-700 hover:text-brand-600">
                {crumb.label}
              </Link>
            </span>
          ))}
          {scope.area ? <span className="font-semibold text-ink-900">{scope.area}</span> : null}
        </nav>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Registered donors" value={overall.donors} href="/admin/blood-donation/donors" />
        <StatCard label="Blood donations" value={overall.donations} />
        <StatCard label="Units donated" value={overall.unitsDonated} />
        <StatCard label="Blood requests" value={overall.requests} href="/admin/blood-donation/requests" />
        <StatCard label="Requests fulfilled" value={overall.fulfilledRequests} />
        <StatCard label="Pending requests" value={overall.pendingRequests} />
        <StatCard label="Units requested" value={overall.unitsRequested} />
        <StatCard label="Units fulfilled" value={overall.unitsFulfilled} />
      </div>

      <h2 className="mt-10 font-display text-lg font-semibold text-ink-900">By blood group</h2>
      <AdminTable
        columns={[
          { key: "group", header: "Group", render: (row) => (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700">{row.group}</span>
          ) },
          { key: "donors", header: "Donors", render: (row) => row.donors },
          { key: "donations", header: "Donations", render: (row) => row.donations },
          { key: "units", header: "Units", render: (row) => row.units },
          { key: "requests", header: "Requests", render: (row) => row.requests },
        ]}
        rows={groups}
        rowKey={(row) => row.group}
        empty="No donation activity recorded yet."
      />

      <h2 className="mt-10 font-display text-lg font-semibold text-ink-900">
        By {areas.level === "state" ? "state" : areas.level === "city" ? "city" : "area"}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        {areas.level === "area"
          ? "Deepest level reached. Go back up to compare."
          : "Select a row to drill down."}
      </p>
      <div className="mt-4">
        <AdminTable
          columns={[
            {
              key: "label",
              header: areas.level === "state" ? "State" : areas.level === "city" ? "City" : "Area",
              render: (row) =>
                areas.level === "area" ? (
                  <span className="font-medium text-ink-900">{row.label}</span>
                ) : (
                  <Link href={drillHref(row)} className="font-medium text-brand-700 hover:text-brand-600">
                    {row.label}
                  </Link>
                ),
            },
            { key: "donors", header: "Donors", render: (row) => row.donors },
            { key: "donations", header: "Donations", render: (row) => row.donations },
            { key: "units", header: "Units", render: (row) => row.units },
            { key: "requests", header: "Requests", render: (row) => row.requests },
            { key: "fulfilled", header: "Fulfilled", render: (row) => row.fulfilled },
          ]}
          rows={areas.rows}
          rowKey={(row) => row.key}
          empty="No activity recorded for this selection yet."
        />
      </div>
    </>
  );
}