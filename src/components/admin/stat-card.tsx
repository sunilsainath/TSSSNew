import Link from "next/link";

import { cn } from "@/lib/utils/cn";

const TONES = {
  gold: "from-gold-400/20 to-gold-500/5 text-gold-700",
  blue: "from-sky-400/20 to-sky-500/5 text-sky-700",
  green: "from-emerald-400/20 to-emerald-500/5 text-emerald-700",
  rose: "from-rose-400/20 to-rose-500/5 text-rose-700",
  slate: "from-slate-400/20 to-slate-500/5 text-slate-700",
} as const;

export function StatCard({
  label,
  value,
  href,
  tone = "slate",
}: {
  label: string;
  value: number;
  href?: string;
  tone?: keyof typeof TONES;
}) {
  const body = (
    <div
      className={cn(
        "surface-card surface-card-hover h-full bg-gradient-to-br p-5",
        TONES[tone] ?? TONES.slate,
      )}
    >
      <p className="text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink-900">{value.toLocaleString("en-IN")}</p>
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className="block">
      {body}
    </Link>
  );
}
