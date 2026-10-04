"use client";

import { useFormStatus } from "react-dom";

import { adminDeleteAction, adminQuickAction } from "@/lib/actions/admin-actions";

export function AdminDeleteButton({
  entity,
  id,
  label = "Delete",
  confirmText = "Delete this record? This cannot be undone.",
}: {
  entity: string;
  id: string;
  label?: string;
  confirmText?: string;
}) {
  return (
    <form
      action={async (formData) => {
        if (!window.confirm(confirmText)) return;
        await adminDeleteAction(formData);
      }}
      className="inline"
    >
      <input type="hidden" name="__entity" value={entity} />
      <input type="hidden" name="__id" value={id} />
      <DeleteButton label={label} />
    </form>
  );
}

function DeleteButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "…" : label}
    </button>
  );
}

export function AdminQuickButton({
  entity,
  id,
  action,
  value,
  label,
  className = "rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700",
}: {
  entity: string;
  id: string;
  action: string;
  value?: string | boolean;
  label: string;
  className?: string;
}) {
  return (
    <form action={adminQuickAction} className="inline">
      <input type="hidden" name="__entity" value={entity} />
      <input type="hidden" name="__id" value={id} />
      <input type="hidden" name="__action" value={action} />
      {value !== undefined ? (
        <input type="hidden" name="value" value={String(value)} />
      ) : null}
      <QuickButton label={label} className={className} />
    </form>
  );
}

function QuickButton({ label, className }: { label: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? "…" : label}
    </button>
  );
}
