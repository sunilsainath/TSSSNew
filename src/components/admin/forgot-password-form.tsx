"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordResetAction } from "@/lib/actions/auth-actions";
import { INITIAL_PASSWORD_STATE } from "@/lib/actions/state";
import { FormMessage } from "@/components/forms/form-controls";
import { Input, Label } from "@/components/ui/input";
import { AuthSubmit } from "@/components/admin/auth-submit";
import { authFieldClass } from "@/components/admin/admin-auth-card";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(requestPasswordResetAction, INITIAL_PASSWORD_STATE);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <FormMessage state={state} />

      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@trust.org"
          className={authFieldClass}
        />
      </div>

      <AuthSubmit label="Send reset link" pendingLabel="Sending…" />

      <p className="text-center text-xs text-white/50">
        <Link href="/admin/login" className="underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}