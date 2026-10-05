import type { Metadata } from "next";

import { DonorRegistrationForm } from "@/components/forms/donor-registration-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Donate Blood",
  description:
    "Join the Srinivasula Seva Samstha blood donor roll. Register your willingness to donate and we will call you when your blood group is needed.",
  alternates: { canonical: "/blood-donate" },
  openGraph: {
    title: "Donate Blood | Srinivasula Seva Samstha",
    description:
      "Become a blood donor. One registration puts you on the roll for every future emergency.",
    url: "/blood-donate",
  },
};

const STEPS = [
  { title: "Tell us your group", description: "Your blood group, phone number and area." },
  { title: "We add you to the roll", description: "Nothing happens until your group is needed." },
  { title: "We call when it matters", description: "A volunteer calls you for a specific patient." },
];

export default function BloodDonatePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">
            Blood donation
          </p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">
            Become a blood donor
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            One registration puts you on the donor roll. When a patient nearby needs your blood
            group, a volunteer calls you directly. Need blood urgently instead?{" "}
            <a href="/blood-help" className="font-semibold text-gold-300 underline underline-offset-2">
              Request blood help
            </a>
            .
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="surface-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Donor registration</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Fields marked <span className="text-red-600">*</span> are required.
              </p>
              <div className="mt-7">
                <DonorRegistrationForm />
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-5">
            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">How donor matching works</h2>
              <ol className="mt-4 space-y-4">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-600 font-display text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{step.title}</p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Good to know</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-600">
                <li>• You must be 18 or older and feeling well on the day.</li>
                <li>• Most adults can donate every three months.</li>
                <li>• If you do not know your blood group, choose &ldquo;I Don&rsquo;t Know&rdquo; — the trust will arrange a free test for you.</li>
              </ul>
              <ButtonLink href="/blood-help" variant="secondary" className="mt-5">
                I need blood urgently
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}