"use client";

import { useFormStatus } from "react-dom";

/** Gold pill submit button used on the dark admin authentication screens. */
export function AuthSubmit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 text-sm font-semibold text-ink-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}