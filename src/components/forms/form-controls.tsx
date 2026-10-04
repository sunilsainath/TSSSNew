"use client";

import { useFormStatus } from "react-dom";

import type { FormState } from "@/lib/actions/state";

export function SubmitButton({
  label,
  pendingLabel = "Submitting…",
  className,
  disabled,
}: {
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-busy={pending}
      className={
        className ??
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-8 text-sm font-semibold text-ink-950 shadow-[0_12px_30px_-12px_rgba(200,149,47,0.9)] transition-all hover:shadow-[0_16px_36px_-12px_rgba(200,149,47,1)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      }
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </button>
  );
}

export function Spinner({ className = "size-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-spin`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FormMessage({ state }: { state: FormState }) {
  if (!state.message) return null;

  const isError = state.status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
    >
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {isError ? (
          <svg viewBox="0 0 20 20" className="size-4.5" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.4a1 1 0 0 1 1 1v4.2a1 1 0 1 1-2 0V6.4a1 1 0 0 1 1-1Zm0 8.8a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="size-4.5" fill="currentColor">
            <path d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm3.9 6.1-4.3 4.3a1 1 0 0 1-1.4 0L5.9 10a1 1 0 1 1 1.4-1.4l1.5 1.5 3.6-3.6a1 1 0 1 1 1.4 1.4Z" />
          </svg>
        )}
      </span>
      <span>{state.message}</span>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
      {message}
    </p>
  );
}

/** Honeypot field: hidden from users, catches naive bots. */
export function Honeypot() {
  return (
    <div aria-hidden="true" className="absolute h-0 w-0 overflow-hidden opacity-0">
      <label htmlFor="website">Website</label>
      <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}
