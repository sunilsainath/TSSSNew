import type { Metadata } from "next";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getDonationSettings, getSiteSettings } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Donations",
  description:
    "Support the work of Srinivasula Seva Samstha. Donations are entirely voluntary with full transparency - there is no mandatory fee or contribution.",
  alternates: { canonical: "/donations" },
  openGraph: {
    title: "Donations | Srinivasula Seva Samstha",
    description:
      "Srinivasula Seva Samstha is a non-profit trust. Contributions are voluntary and fund education, blood assistance and community service.",
    url: "/donations",
  },
};

export default async function DonationsPage() {
  const [donation, settings] = await Promise.all([getDonationSettings(), getSiteSettings()]);

  const isOpen = donation?.is_donation_open ?? true;

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Support the mission</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">Donations</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Srinivasula Seva Samstha is a non-profit trust. Every contribution supports devotional programmes,
            education, blood assistance and community service.
          </p>
          <p className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            Donations are voluntary — no mandatory fee, ever
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <div className="surface-card p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-2xl font-semibold text-ink-900">Donation methods</h2>
                <Badge tone={isOpen ? "green" : "slate"}>{isOpen ? "Open" : "Currently closed"}</Badge>
              </div>

              {!isOpen ? (
                <p role="status" className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Donations are temporarily paused. Please check back soon or contact the administration.
                </p>
              ) : null}

              <div className="mt-7 space-y-5">
                <div className="rounded-3xl border border-brand-100 p-5">
                  <h3 className="text-sm font-semibold tracking-[0.12em] text-gold-700 uppercase">
                    Bank transfer
                  </h3>
                  {donation?.bank_name || donation?.account_number ? (
                    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                      {[
                        ["Account name", donation.account_name],
                        ["Bank", donation.bank_name],
                        ["Account number", donation.account_number],
                        ["IFSC", donation.ifsc],
                        ["Branch", donation.branch],
                      ]
                        .filter(([, value]) => Boolean(value))
                        .map(([label, value]) => (
                          <div key={label as string}>
                            <dt className="text-xs text-slate-500">{label}</dt>
                            <dd className="mt-0.5 font-mono text-sm font-semibold break-all text-ink-900">
                              {value}
                            </dd>
                          </div>
                        ))}
                    </dl>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">
                      Bank details will appear here once administrators publish them.
                    </p>
                  )}
                </div>

                <div className="rounded-3xl border border-brand-100 p-5">
                  <h3 className="text-sm font-semibold tracking-[0.12em] text-gold-700 uppercase">UPI</h3>
                  {donation?.upi_id ? (
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <p className="rounded-xl bg-brand-50 px-4 py-2.5 font-mono text-sm font-semibold text-ink-900">
                        {donation.upi_id}
                      </p>
                      <ButtonLink href={`upi://pay?pa=${encodeURIComponent(donation.upi_id)}`} size="sm">
                        Pay with UPI app
                      </ButtonLink>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-500">UPI ID will appear here once configured.</p>
                  )}
                </div>

                {donation?.instructions ? (
                  <div className="rounded-3xl border border-brand-100 p-5">
                    <h3 className="text-sm font-semibold tracking-[0.12em] text-gold-700 uppercase">
                      How to donate
                    </h3>
                    <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-slate-600">
                      {donation.instructions
                        .split("\n")
                        .map((line) => line.trim())
                        .filter(Boolean)
                        .map((line, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="grid size-5 shrink-0 place-items-center rounded-full bg-gold-100 text-[0.65rem] font-bold text-gold-700">
                              {index + 1}
                            </span>
                            <span>{line.replace(/^\d+[.)]\s*/, "")}</span>
                          </li>
                        ))}
                    </ol>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-3xl border border-gold-200 bg-gold-50/70 p-6 sm:p-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Transparency &amp; accountability</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">
                {donation?.transparency_note ??
                  "Donations to Srinivasula Seva Samstha are entirely voluntary. There is no mandatory fee or compulsory contribution to register, attend any programme, or receive any service from this trust. Every contribution is used only for community service, education, devotional activities and blood assistance, and is accounted for by the trust."}
              </p>
              <ul className="mt-5 space-y-2 text-sm text-slate-700">
                <li>• No payment is collected on this website — every method below is arranged directly with the trust.</li>
                <li>• Registration, blood help and event participation are free of charge.</li>
                <li>• Receipts are issued on request by the administration.</li>
              </ul>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <div className="surface-card p-6 text-center">
              <h2 className="font-display text-lg font-semibold text-ink-900">Scan &amp; donate</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Scan the QR code with any UPI app to donate directly.
              </p>
              <div className="relative mx-auto mt-5 aspect-square w-56 overflow-hidden rounded-3xl border border-brand-100 bg-white">
                {donation?.qr_code_url ? (
                  <Image
                    src={donation.qr_code_url}
                    alt="Donation QR code"
                    fill
                    sizes="224px"
                    className="object-contain p-3"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-slate-50 p-4 text-center text-xs text-slate-500">
                    Donation QR code will appear here once administrators upload it.
                  </div>
                )}
              </div>
              {settings.contact_email ? (
                <p className="mt-4 text-xs text-slate-500">
                  Need a receipt? Email{" "}
                  <a href={`mailto:${settings.contact_email}`} className="font-semibold text-gold-700">
                    {settings.contact_email}
                  </a>
                </p>
              ) : null}
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">What your support funds</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                <li className="flex gap-3">
                  <span className="text-gold-500" aria-hidden="true">
                    ✦
                  </span>
                  Devotional programmes and community gatherings
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-500" aria-hidden="true">
                    ✦
                  </span>
                  Education: school kits, scholarships and coaching
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-500" aria-hidden="true">
                    ✦
                  </span>
                  Blood assistance network across districts
                </li>
                <li className="flex gap-3">
                  <span className="text-gold-500" aria-hidden="true">
                    ✦
                  </span>
                  Relief material and community service drives
                </li>
              </ul>
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Prefer to help directly?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Volunteers are always welcome — for event service, teaching, distribution work or the blood help desk.
              </p>
              <ButtonLink href="/register" variant="secondary" className="mt-5">
                Register as a volunteer
              </ButtonLink>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
