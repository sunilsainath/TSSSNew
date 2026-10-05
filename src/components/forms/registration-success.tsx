"use client";

import Link from "next/link";

import { PrintButton } from "./print-button";

export type RegistrationConfirmation = {
  registrationNumber: string;
  fullName: string;
  dateOfBirth: string;
  village: string;
  registeredAt: string;
  /** Signed, single-use link to this member's own ID card. */
  idCardToken?: string;
};

function formatDate(value: string) {
  if (!value) return "—";
  const date = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function RegistrationSuccess({ data }: { data: RegistrationConfirmation }) {
  const rows = [
    { label: "Registered Name", value: data.fullName },
    { label: "Date of Birth", value: formatDate(data.dateOfBirth) },
    { label: "Village", value: data.village || "—" },
    { label: "Registration Date", value: formatDate(data.registeredAt) },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <div className="surface-card overflow-hidden">
        <div className="relative bg-ink-950 px-6 py-10 text-center text-white">
          <div className="aurora opacity-60" aria-hidden="true" />
          <div className="relative">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
              <svg viewBox="0 0 20 20" className="size-7" fill="currentColor" aria-hidden="true">
                <path d="M10 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Zm4 6.2-5 5.2a1 1 0 0 1-1.5 0L4.8 10.5a1 1 0 1 1 1.4-1.4l2 2 4.2-4.4a1 1 0 1 1 1.6 1.3Z" />
              </svg>
            </span>
            <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Registration Successful</h1>
            <p className="mt-2 text-sm text-white/65">
              Thank you for joining Srinivasula Seva Samstha. Please save your registration number.
            </p>
          </div>
        </div>

        <div className="px-6 py-8 print:px-0">
          <div className="rounded-3xl border-2 border-dashed border-gold-300 bg-gold-50/60 p-6 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-gold-700 uppercase">
              Your TSSS Registration Number
            </p>
            <p className="mt-3 font-mono text-4xl font-bold tracking-wider text-ink-900 print:text-3xl">
              {data.registrationNumber}
            </p>
            <p className="mt-3 text-xs text-slate-600">
              Quote this number for any enquiry about programmes, donations or blood assistance.
            </p>
          </div>

          <dl className="mt-8 divide-y divide-brand-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 py-3.5">
                <dt className="text-sm text-slate-500">{row.label}</dt>
                <dd className="text-sm font-semibold text-ink-900">{row.value}</dd>
              </div>
            ))}
          </dl>

          {data.idCardToken ? (
            <a
              href={`/api/id-card?number=${encodeURIComponent(data.registrationNumber)}&token=${encodeURIComponent(data.idCardToken)}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M10 2a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Zm-6 8h1.2a4.8 4.8 0 0 0 9.6 0H16a6 6 0 0 1-5 5.9V18H9v-2.1A6 6 0 0 1 4 10Z" />
              </svg>
              Download your ID card
            </a>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <PrintButton />
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-brand-200 bg-white px-5 text-sm font-semibold text-ink-800 transition-colors hover:border-gold-400 hover:text-gold-700"
            >
              Download / Save as PDF
            </button>
            <Link
              href="/"
              className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold text-slate-600 transition-colors hover:text-ink-900"
            >
              Back to home
            </Link>
          </div>

          {data.idCardToken ? (
            <p className="mt-4 text-xs leading-relaxed text-slate-500 print:hidden">
              Your ID card link works for one hour and is tied to this registration. If you lose it,
              the trust can print a fresh copy from your registration number.
            </p>
          ) : null}
        </div>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
        For privacy reasons we do not display registration records publicly. If you lose this number, please contact
        the trust administration with your name and date of birth.
      </p>
    </div>
  );
}
