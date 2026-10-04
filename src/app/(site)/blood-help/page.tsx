import type { Metadata } from "next";

import { BloodHelpForm } from "@/components/forms/blood-help-form";
import { ButtonAnchor } from "@/components/ui/button";
import { getAreas, getDistricts, getSiteSettings } from "@/lib/data/public";
import { BLOOD_GROUPS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Blood Help",
  description:
    "Request emergency blood assistance from Srinivasula Seva Samstha. Requests are routed to district volunteers by district and area for the fastest response.",
  alternates: { canonical: "/blood-help" },
  openGraph: {
    title: "Need Blood Help? | Srinivasula Seva Samstha",
    description:
      "Submit a blood request and our district volunteer is notified immediately. Free emergency blood coordination for the community.",
    url: "/blood-help",
  },
};

const STEPS = [
  {
    title: "You submit the request",
    description: "Blood group, hospital, district and units needed.",
  },
  {
    title: "We match your district",
    description: "The request routes to the active administrator for your district or area.",
  },
  {
    title: "Volunteers are notified",
    description: "Email and WhatsApp alerts go out immediately with the essential details.",
  },
  {
    title: "Donors are coordinated",
    description: "The volunteer contacts donors and the hospital until the request is resolved.",
  },
];

export default async function BloodHelpPage() {
  const [districts, areas, settings] = await Promise.all([
    getDistricts(),
    getAreas(),
    getSiteSettings(),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-10 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/15 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-rose-200 uppercase">
              <span className="size-1.5 animate-pulse rounded-full bg-rose-300" aria-hidden="true" />
              Emergency assistance
            </span>
            <h1 className="mt-6 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
              Need Blood Help?
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              Our blood help network connects patients with willing donors across the community. Submit a request and
              the volunteer responsible for your district is alerted by email and WhatsApp straight away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {BLOOD_GROUPS.map((group) => (
                <span
                  key={group}
                  className="rounded-full border border-white/12 bg-white/5 px-3.5 py-1.5 text-sm font-semibold text-white/80"
                >
                  {group}
                </span>
              ))}
            </div>
            {settings.contact_phone || settings.whatsapp_number ? (
              <div className="mt-8 flex flex-wrap gap-3">
                {settings.contact_phone ? (
                  <ButtonAnchor href={`tel:${settings.contact_phone.replace(/\s/g, "")}`} size="sm" variant="onDark">
                    Call {settings.contact_phone}
                  </ButtonAnchor>
                ) : null}
                {settings.whatsapp_number ? (
                  <ButtonAnchor
                    href={`https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="sm"
                    variant="onDark"
                  >
                    WhatsApp us
                  </ButtonAnchor>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="glass rounded-4xl p-6">
            <h2 className="font-display text-xl font-semibold text-white">How it works</h2>
            <ol className="mt-5 space-y-5">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-sm font-bold text-ink-950">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-white/60">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="surface-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Blood help request</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Fields marked <span className="text-red-600">*</span> are required. All fields marked optional can be
                filled later.
              </p>
              <div className="mt-7">
                <BloodHelpForm
                  districts={districts}
                  areas={areas}
                  bloodHelpOpen={settings.blood_help_open}
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6">
              <h2 className="font-display text-lg font-semibold text-red-900">In an emergency</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-red-800">
                <li>• Contact the treating hospital or the nearest blood bank immediately.</li>
                <li>• Ask the hospital blood bank for the required group and units.</li>
                <li>• Submit this form in parallel so our volunteers can widen the search.</li>
              </ul>
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">For donors</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Are you willing to donate blood? Register with the trust and share your blood group and district with
                the administration so volunteers can contact you when a matching request comes in.
              </p>
              <ButtonAnchor href="/register" className="mt-5" size="sm">
                Register as a donor
              </ButtonAnchor>
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Districts we serve</h2>
              {districts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  District list is being updated. Please contact the administration.
                </p>
              ) : (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {districts.map((district) => (
                    <li
                      key={district.id}
                      className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-ink-700"
                    >
                      {district.name}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-slate-500">
                District and area values are maintained by administrators, so this list always reflects current
                coverage.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
