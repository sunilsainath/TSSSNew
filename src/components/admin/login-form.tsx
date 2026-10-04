"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/lib/actions/auth-actions";
import { INITIAL_LOGIN_STATE, type LoginState } from "@/lib/actions/state";
import { FormMessage } from "@/components/forms/form-controls";
import { Input, Label } from "@/components/ui/input";

const INITIAL: LoginState = INITIAL_LOGIN_STATE;

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />
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
          className="border-white/15 bg-white/5 text-white placeholder:text-white/35 hover:border-white/25 focus:border-gold-400"
        />
      </div>

      <div>
        <Label htmlFor="password" required>
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="border-white/15 bg-white/5 text-white placeholder:text-white/35 hover:border-white/25 focus:border-gold-400"
        />
      </div>

      <LoginButton />
    </form>
  );
}

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
