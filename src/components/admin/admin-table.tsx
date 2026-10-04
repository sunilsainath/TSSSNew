import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
};

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {action}
    </header>
  );
}

export function AdminTable<T>({
  columns,
  rows,
  rowKey,
  empty = "Nothing here yet.",
  rowHref,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  empty?: string;
  rowHref?: (row: T) => string | null;
}) {
  if (rows.length === 0) {
    return <div className="surface-card p-10 text-center text-sm text-slate-500">{empty}</div>;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="admin-table w-full">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={column.className}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column, index) => {
                  const href = index === 0 ? rowHref?.(row) : null;
                  return (
                    <td key={column.key} className={column.className}>
                      {href ? (
                        <Link href={href} className="font-medium hover:text-gold-700">
                          {column.render(row)}
                        </Link>
                      ) : (
                        column.render(row)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatusBadge({
  value,
  tone,
}: {
  value: string;
  tone?: "green" | "red" | "gold" | "blue" | "slate" | "light";
}) {
  const normalized = value.toLowerCase();
  const resolved =
    tone ??
    (["active", "approved", "published", "sent", "resolved"].includes(normalized)
      ? "green"
      : ["pending", "new", "in_progress", "contacted"].includes(normalized)
        ? "gold"
        : ["rejected", "failed", "disabled", "closed"].includes(normalized)
          ? "red"
          : "slate");

  return <Badge tone={resolved}>{value.replace(/_/g, " ")}</Badge>;
}

export function AdminSection({
  title,
  description,
  children,
  id,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("surface-card mb-6 p-6", className)}>
      <h2 className="font-display text-lg font-semibold text-ink-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function ToggleBadge({
  active,
  onLabel = "Active",
  offLabel = "Inactive",
}: {
  active: boolean;
  onLabel?: string;
  offLabel?: string;
}) {
  return <Badge tone={active ? "green" : "slate"}>{active ? onLabel : offLabel}</Badge>;
}
