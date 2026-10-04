import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils/cn";

const VARIANTS = {
  primary:
    "bg-gradient-to-r from-gold-400 to-gold-500 text-ink-950 shadow-[0_10px_30px_-12px_rgba(221,167,28,0.85)] hover:shadow-[0_16px_40px_-12px_rgba(221,167,28,0.95)]",
  brand:
    "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-[0_12px_32px_-12px_rgba(11,106,181,0.95)] hover:shadow-[0_18px_44px_-12px_rgba(11,106,181,1)]",
  secondary:
    "border border-brand-200 bg-white text-ink-900 hover:border-brand-400 hover:text-brand-700 shadow-sm",
  ghost: "text-ink-700 hover:bg-brand-50 hover:text-ink-900",
  dark: "bg-ink-900 text-white hover:bg-ink-800 shadow-lg",
  danger: "bg-flag-600 text-white hover:bg-flag-700 shadow-sm",
  onDark: "border border-white/25 bg-white/5 text-white backdrop-blur hover:border-gold-400/70 hover:text-gold-100",
} as const;

const SIZES = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
} as const;

type Variant = keyof typeof VARIANTS;
type Size = keyof typeof SIZES;

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-55 active:scale-[0.98]";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: BaseProps & ComponentProps<"button">) {
  return (
    <button className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </Link>
  );
}

export function ButtonAnchor({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: BaseProps & ComponentProps<"a">) {
  return (
    <a className={cn(BASE, VARIANTS[variant], SIZES[size], className)} {...props}>
      {children}
    </a>
  );
}

export { cn };
