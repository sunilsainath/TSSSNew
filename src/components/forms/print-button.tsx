"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-5 text-sm font-semibold text-ink-950 shadow-[0_10px_26px_-12px_rgba(200,149,47,0.9)] transition-transform hover:scale-[1.02]"
    >
      <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
        <path d="M6 8V3h8v5h1.5A1.5 1.5 0 0 1 17 9.5v4a1 1 0 0 1-1 1h-1v3H5v-3H4a1 1 0 0 1-1-1v-4A1.5 1.5 0 0 1 4.5 8H6Zm2 0h4V5H8v3Zm-3 6v2h6v-2H5Zm8 0v2h2v-2h-2Z" />
      </svg>
      {label}
    </button>
  );
}
