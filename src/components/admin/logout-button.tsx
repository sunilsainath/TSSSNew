"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "@/lib/actions/auth-actions";

export function LogoutButton() {
  const { pending } = useFormStatus();

  return (
    <form action={logoutAction}>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-brand-200 px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </form>
  );
}
