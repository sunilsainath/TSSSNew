import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/admin/stat-card";
import { SimpleBarChart } from "@/components/admin/simple-bar-chart";
import { getAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { BlogStatus, BloodRequestStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const supabase = await createClient();

  // Server component: the current date is read once per request.
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [
    members,
    newMembers,
    events,
    upcomingEvents,
    pendingBlogs,
    bloodRequests,
    openBloodRequests,
    mediaItems,
    activeBanners,
    recentMembers,
    openRequestRows,
    membershipSeries,
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase
      .from("members")
      .select("id", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("event_date", today),
    supabase.from("blogs").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("blood_help_requests").select("id", { count: "exact", head: true }),
    supabase
      .from("blood_help_requests")
      .select("id", { count: "exact", head: true })
      .in("status", ["NEW", "CONTACTED", "IN_PROGRESS"] as BloodRequestStatus[]),
    supabase.from("media_items").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("site_banners").select("id", { count: "exact", head: true }).eq("is_enabled", true),
    supabase
      .from("members")
      .select("registration_number, full_name, village, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("blood_help_requests")
      .select("request_number, blood_group, hospital_name, status, created_at, is_unassigned")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("members")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo)
      .order("created_at", { ascending: true }),
  ]);

  const series = (membershipSeries.data ?? []) as Array<{ created_at: string }>;
  const chartData = buildDailySeries(series.map((row) => row.created_at));

  const stats = [
    { label: "Total Members", value: members.count ?? 0, href: "/admin/registrations" },
    { label: "New (30 days)", value: newMembers.count ?? 0, href: "/admin/registrations" },
    { label: "Total Events", value: events.count ?? 0, href: "/admin/events" },
    { label: "Upcoming Events", value: upcomingEvents.count ?? 0, href: "/admin/events" },
    { label: "Pending Blogs", value: pendingBlogs.count ?? 0, href: "/admin/blogs/pending" },
    { label: "Blood Requests", value: bloodRequests.count ?? 0, href: "/admin/blood-help/requests" },
    { label: "Open Blood Requests", value: openBloodRequests.count ?? 0, href: "/admin/blood-help/requests" },
    { label: "Published Media", value: mediaItems.count ?? 0, href: "/admin/media/news" },
    { label: "Active Banners", value: activeBanners.count ?? 0, href: "/admin/banner" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Welcome back, {session?.user.full_name ?? session?.user.email}. Here is the current state of the trust
            website.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700"
        >
          View live site
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="surface-card p-6 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold text-ink-900">New registrations (last 30 days)</h2>
          <p className="mt-1 text-xs text-slate-500">Daily count of registrations submitted by the public.</p>
          <div className="mt-6">
            <SimpleBarChart
              data={chartData}
              valueLabel={(value) => String(value)}
              emptyLabel="No registrations recorded in this period."
            />
          </div>
        </div>

        <div className="surface-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink-900">Quick actions</h2>
          <div className="mt-4 grid gap-2">
            {[
              { href: "/admin/events/new", label: "Create an event" },
              { href: "/admin/blogs/pending", label: "Review pending blogs" },
              { href: "/admin/banner", label: "Update website banner" },
              { href: "/admin/donations", label: "Edit donation details" },
              { href: "/admin/blood-help/districts", label: "Manage districts & admins" },
              { href: "/admin/registrations", label: "Search registered members" },
            ].map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-ink-800 transition-colors hover:bg-gold-50 hover:text-gold-700"
              >
                {action.label}
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">Latest registrations</h2>
            <Link href="/admin/registrations" className="text-xs font-semibold text-gold-700 hover:text-gold-600">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th scope="col">Number</th>
                  <th scope="col">Name</th>
                  <th scope="col">Village</th>
                  <th scope="col">Registered</th>
                </tr>
              </thead>
              <tbody>
                {(recentMembers.data ?? []).map((member) => (
                  <tr key={member.registration_number}>
                    <td className="font-mono text-xs font-semibold text-ink-900">
                      {member.registration_number}
                    </td>
                    <td className="font-medium text-ink-800">{member.full_name}</td>
                    <td className="text-slate-600">{member.village ?? "—"}</td>
                    <td className="text-slate-500">{formatDateTime(member.created_at)}</td>
                  </tr>
                ))}
                {(recentMembers.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No registrations yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="font-display text-lg font-semibold text-ink-900">Latest blood help requests</h2>
            <Link
              href="/admin/blood-help/requests"
              className="text-xs font-semibold text-gold-700 hover:text-gold-600"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th scope="col">Request</th>
                  <th scope="col">Blood</th>
                  <th scope="col">Hospital</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {(openRequestRows.data ?? []).map((request) => (
                  <tr key={request.request_number}>
                    <td className="font-mono text-xs font-semibold text-ink-900">
                      {request.request_number}
                      {request.is_unassigned ? (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[0.6rem] font-semibold text-amber-800">
                          Unassigned
                        </span>
                      ) : null}
                    </td>
                    <td className="font-medium text-ink-800">{request.blood_group}</td>
                    <td className="text-slate-600">{request.hospital_name}</td>
                    <td className="text-xs font-semibold text-slate-600">{request.status}</td>
                  </tr>
                ))}
                {(openRequestRows.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No blood help requests yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Blog moderation queue currently holds {(pendingBlogs.count ?? 0) as number} pending article(s). Blog statuses
        available: {(["pending", "approved", "rejected", "unpublished"] satisfies BlogStatus[]).join(", ")}.
      </p>
    </div>
  );
}

function buildDailySeries(dates: string[]) {
  const days = 30;
  const buckets = new Map<string, number>();

  for (let index = days - 1; index >= 0; index -= 1) {
    const date = new Date(Date.now() - index * 86_400_000).toISOString().slice(0, 10);
    buckets.set(date, 0);
  }

  for (const value of dates) {
    const key = value.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries())
    .slice(-14)
    .map(([date, value]) => ({ label: date.slice(5), value }));
}
