"use client";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section className="py-24">
      <div className="container-page text-center">
        <p className="font-display text-5xl font-semibold text-gradient-ink">Oops</p>
        <h1 className="mt-4 text-2xl font-semibold text-ink-900">This section could not be loaded</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
          An unexpected error occurred. Please try again — if it keeps happening, contact the trust administration.
        </p>
        {error.digest ? (
          <p className="mt-3 text-xs text-slate-400">Reference: {error.digest}</p>
        ) : null}
        <button
          type="button"
          onClick={retry}
          className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-gold-400 to-gold-500 px-8 text-sm font-semibold text-ink-950"
        >
          Try again
        </button>
      </div>
    </section>
  );
}
