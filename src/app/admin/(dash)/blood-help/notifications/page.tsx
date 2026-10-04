import { AdminPageHeader, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { RetryNotificationsButton } from "@/components/admin/retry-notifications-button";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { NotificationLogRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotificationLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("notification_logs")
    .select("*, blood_help_requests(request_number, hospital_name, blood_group)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (params.status === "failed") query = query.eq("status", "failed");
  if (params.status === "sent") query = query.eq("status", "sent");
  if (params.status === "skipped") query = query.eq("status", "skipped");

  const { data } = await query;

  const logs = (data ?? []) as Array<
    NotificationLogRow & {
      blood_help_requests: {
        request_number: string;
        hospital_name: string;
        blood_group: string;
      } | null;
    }
  >;

  return (
    <>
      <AdminPageHeader
        title="Notification logs"
        description="Every email and WhatsApp alert triggered by a blood help request, with its delivery status."
      />

      <nav aria-label="Notification status" className="mb-5 flex flex-wrap gap-2">
        {[
          { value: "", label: "All" },
          { value: "sent", label: "Sent" },
          { value: "failed", label: "Failed" },
          { value: "skipped", label: "Skipped" },
        ].map((tab) => (
          <a
            key={tab.value || "all"}
            href={tab.value ? `/admin/blood-help/notifications?status=${tab.value}` : "/admin/blood-help/notifications"}
            aria-current={params.status === (tab.value || undefined) ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              (params.status ?? "") === tab.value
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-700 ring-1 ring-brand-200 hover:ring-gold-400"
            }`}
          >
            {tab.label}
          </a>
        ))}
      </nav>

      <AdminTable
        columns={[
          {
            key: "request",
            header: "Request",
            render: (row) => (
              <div>
                <p className="font-mono text-xs font-semibold text-ink-900">
                  {row.blood_help_requests?.request_number ?? "—"}
                </p>
                <p className="text-xs text-slate-500">
                  {row.blood_help_requests?.blood_group} · {row.blood_help_requests?.hospital_name}
                </p>
              </div>
            ),
          },
          { key: "type", header: "Channel", render: (row) => row.notification_type },
          {
            key: "recipient",
            header: "Recipient",
            render: (row) => <span className="font-mono text-xs">{row.recipient ?? "—"}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <div className="space-y-1">
                <StatusBadge value={row.status} />
                {row.error_message ? (
                  <p className="max-w-xs text-[0.65rem] leading-snug text-red-600">{row.error_message}</p>
                ) : null}
              </div>
            ),
          },
          { key: "provider", header: "Provider", render: (row) => row.provider ?? "—" },
          { key: "sent_at", header: "Sent", render: (row) => formatDateTime(row.sent_at ?? row.created_at) },
          {
            key: "actions",
            header: "",
            render: (row) =>
              row.blood_request_id && row.status !== "sent" ? (
                <RetryNotificationsButton requestId={row.blood_request_id} />
              ) : null,
          },
        ]}
        rows={logs}
        rowKey={(row) => row.id}
        empty="No notifications logged yet."
      />
    </>
  );
}
