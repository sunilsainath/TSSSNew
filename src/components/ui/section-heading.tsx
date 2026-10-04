import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
  tone?: "light" | "dark";
  action?: ReactNode;
  className?: string;
}) {
  const isDark = tone === "dark";

  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        action ? "sm:flex-row sm:items-end sm:justify-between sm:text-left" : undefined,
        className,
      )}
    >
      <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <p
            className={cn(
              "text-xs font-semibold tracking-[0.22em] uppercase",
              isDark ? "text-gold-300" : "text-gold-600",
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2
          className={cn(
            "text-3xl leading-tight font-semibold text-balance sm:text-4xl",
            isDark ? "text-white" : "text-ink-900",
          )}
        >
          {title}
        </h2>
        {description ? (
          <p className={cn("text-base leading-relaxed", isDark ? "text-white/70" : "text-slate-600")}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
