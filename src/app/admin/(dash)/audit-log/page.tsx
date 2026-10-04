import { AdminPageHeader, AdminTable } from "@/components/admin/admin-table";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { AuditLogRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const perPage = 50;
  const supabase = await createClient();

  let query = supabase
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (params.entity) query = query.eq("entity", params.entity);

  const { data, count } = await query;
  const logs = (data ?? []) as AuditLogRow[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Every important administrative action with the actor, timestamp and previous/new values. Visible to Super Admins only."
      />

      <AdminTable
        columns={[
          { key: "when", header: "When", render: (row) => formatDateTime(row.created_at) },
          {
            key: "actor",
            header: "Administrator",
            render: (row) => <span className="font-medium text-ink-800">{row.actor_email ?? "system"}</span>,
          },
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-ink-700">
                {row.action.replace(/_/g, " ")}
              </span>
            ),
          },
          { key: "entity", header: "Entity", render: (row) => row.entity },
          {
            key: "entity_id",
            header: "Record",
            render: (row) => (
              <span className="font-mono text-[0.65rem] text-slate-500">{row.entity_id?.slice(0, 8) ?? "—"}</span>
            ),
          },
          {
            key: "change",
            header: "Change",
            render: (row) => (
              <details className="max-w-md">
                <summary className="cursor-pointer text-xs font-semibold text-gold-700">
                  View values
                </summary>
                <pre className="mt-2 max-h-56 overflow-auto rounded-xl bg-ink-950 p-3 text-[0.6rem] leading-relaxed text-emerald-200/80">
                  {JSON.stringify({ previous: row.previous_value, next: row.new_value }, null, 2)}
                </pre>
              </details>
            ),
          },
        ]}
        rows={logs}
        rowKey={(row) => row.id}
        empty="No administrative actions recorded yet."
      />

      <nav aria-label="Pagination" className="mt-5 flex items-center justify-between text-sm text-slate-600">
        <p>
          Page {page} of {totalPages} · {total} entries
        </p>
        <div className="flex gap-2">
          <a
            href={`/admin/audit-log?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-full border border-brand-200 px-4 py-2 font-semibold ${
              page <= 1 ? "pointer-events-none opacity-40" : "hover:border-gold-400"
            }`}
          >
            Previous
          </a>
          <a
            href={`/admin/audit-log?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-full border border-brand-200 px-4 py-2 font-semibold ${
              page >= totalPages ? "pointer-events-none opacity-40" : "hover:border-gold-400"
            }`}
          >
            Next
          </a>
        </div>
      </nav>
    </>
  );
}
