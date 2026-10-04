import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const BASE =
  "w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-ink-300 focus:border-gold-400 focus:ring-2 focus:ring-gold-200 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50";

export function Label({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink-800">
        {children}
        {required ? (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
        )}
      </label>
      {hint ? <span className="text-xs text-slate-400">{hint}</span> : null}
    </div>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(BASE, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(BASE, "min-h-32 resize-y", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        BASE,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2364748b%22><path d=%22M5.5 7.5 10 12l4.5-4.5z%22/></svg>')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-11",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: ComponentProps<"input"> & { label: string; description?: string }) {
  const id = props.id ?? props.name;

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-200 bg-white p-3.5 transition-colors hover:border-gold-300",
        className,
      )}
    >
      <input
        type="checkbox"
        className="mt-0.5 size-4.5 shrink-0 rounded border-ink-300 text-gold-500 accent-gold-500 focus:ring-gold-300"
        {...props}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-ink-800">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
        ) : null}
      </span>
    </label>
  );
}

export function FormRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("space-y-1.5", className)}>{children}</div>;
}
