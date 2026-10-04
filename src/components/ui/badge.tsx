import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

const TONES = {
  gold: "bg-gold-100 text-gold-700 ring-gold-300/60",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  light: "bg-white/15 text-white ring-white/25 backdrop-blur",
  outline: "bg-white text-ink-700 ring-brand-200",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
