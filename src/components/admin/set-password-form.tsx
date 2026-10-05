"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePasswordAction } from "@/lib/actions/auth-actions";
import { INITIAL_PASSWORD_STATE } from "@/lib/actions/state";
import { FormMessage } from "@/components/forms/form-controls";
import { Input, Label } from "@/components/ui/input";
import { AuthSubmit } from "@/components/admin/auth-submit";
import { authFieldClass } from "@/components/admin/admin-auth-card";

/**
 * `requireCurrent` adds a "current password" field for administrators changing
 * their own password. The recovery flow must not ask for it: whoever holds the
 * link is not signed in and does not know it.
 */
export function SetPasswordForm({ requireCurrent = false }: { requireCurrent?: boolean }) {
  const [state, formAction] = useActionState(updatePasswordAction, INITIAL_PASSWORD_STATE);

  if (state.status === "success") {
    return (
      <div role="status" className="mt-7 space-y-5">
        <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm leading-relaxed text-emerald-100">
          {state.message}
        </div>
        <Link
          href="/admin/login"
          className="block text-center text-sm font-semibold text-gold-300 underline underline-offset-2"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <FormMessage state={state} />

      {requireCurrent ? (
        <div>
          <Label htmlFor="currentPassword" required>
            Current password
          </Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            required
            className={authFieldClass}
          />
        </div>
      ) : null}

      <div>
        <Label htmlFor="password" required hint="At least 8 characters">
          New password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={authFieldClass}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword" required>
          Confirm new password
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={authFieldClass}
        />
      </div>

      <AuthSubmit label="Save new password" pendingLabel="Saving…" />

      <p className="text-center text-xs text-white/50">
        {requireCurrent ? (
          <Link href="/admin" className="underline underline-offset-2">
            Cancel and return to the dashboard
          </Link>
        ) : (
          <Link href="/admin/login" className="underline underline-offset-2">
            Back to sign in
          </Link>
        )}
      </p>
    </form>
  );
}