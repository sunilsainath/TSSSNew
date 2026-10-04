import { AdminPageHeader, AdminSection, AdminTable, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/utils/format";
import type { UserRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  blood_help_manager: "Blood Help Manager",
};

export default async function UsersPage() {
  const spec = ENTITY_SPECS.user;
  const supabase = await createClient();
  const session = await getAdminSession();

  const { data } = await supabase.from("users").select("*").order("created_at", { ascending: false });
  const users = (data ?? []) as UserRow[];

  return (
    <>
      <AdminPageHeader
        title="Team & roles"
        description="Roles control what each administrator can do. Permissions are enforced by database row level security, not just the interface."
      />

      <div className="surface-card mb-6 p-5 text-sm leading-relaxed text-slate-700">
        <p className="font-semibold text-ink-900">Role capabilities</p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>
            <strong>Super Admin</strong> — everything, including team management and the audit log.
          </li>
          <li>
            <strong>Admin</strong> — content plus organization settings.
          </li>
          <li>
            <strong>Content Manager</strong> — website content, events, media, blogs and registrations.
          </li>
          <li>
            <strong>Blood Help Manager</strong> — blood requests, districts and administrators.
          </li>
        </ul>
      </div>

      <AdminTable
        columns={[
          {
            key: "email",
            header: "Administrator",
            render: (row) => (
              <div>
                <p className="font-medium text-ink-900">{row.email}</p>
                <p className="text-xs text-slate-500">
                  {row.full_name ?? "—"} · joined {formatDateTime(row.created_at)}
                </p>
              </div>
            ),
          },
          {
            key: "role",
            header: "Role",
            render: (row) => <StatusBadge value={row.role} tone="blue" />,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge value={row.is_active ? "active" : "disabled"} tone={row.is_active ? "green" : "red"} />
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500">Role: {ROLE_LABELS[row.role]}</span>
                {row.id === session?.user.id ? (
                  <span className="text-xs text-slate-400">(you)</span>
                ) : (
                  <>
                    <AdminQuickButton
                      entity="user"
                      id={row.id}
                      action="set-active"
                      value={!row.is_active}
                      label={row.is_active ? "Deactivate" : "Activate"}
                    />
                    <AdminDeleteButton
                      entity="user"
                      id={row.id}
                      confirmText="Remove this administrator? They will lose access immediately."
                    />
                  </>
                )}
              </div>
            ),
          },
        ]}
        rows={users}
        rowKey={(row) => row.id}
        empty="No administrators yet."
      />

      <AdminSection title="Add administrator" className="mt-6">
        <p className="mb-5 text-sm text-slate-600">
          Creates a Supabase login with the role below. Share the temporary password securely and ask the person to
          change it after signing in.
        </p>
        <ResourceForm
          entity="user"
          fields={spec.fields}
          defaults={{ role: "content_manager", is_active: "true" }}
          submitLabel="Create login"
        />
      </AdminSection>

      <AdminSection title="Change a role">
        <p className="mb-5 text-sm text-slate-600">
          To change an existing role, deactivate and re-add the person, or edit the row directly in Supabase. Roles are
          also protected by row level security, so they cannot be escalated from the browser.
        </p>
      </AdminSection>
    </>
  );
}
