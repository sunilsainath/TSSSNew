"use client";

import { useFormStatus } from "react-dom";

import { adminRetryNotificationsAction } from "@/lib/actions/admin-actions";

export function RetryNotificationsButton({ requestId }: { requestId: string }) {
  return (
    <form action={adminRetryNotificationsAction} className="inline">
      <input type="hidden" name="__id" value={requestId} />
      <RetryButton />
    </form>
  );
}

function RetryButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-brand-200 px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700 disabled:opacity-60"
    >
      {pending ? "Sending…" : "Retry"}
    </button>
  );
}
