import type { Metadata } from "next";

import { RegisterForm } from "@/components/forms/register-form";
import { getSiteSettings } from "@/lib/data/public";

export const metadata: Metadata = {
  title: "Register",
  description:
    "Register your family with Srinivasula Seva Samstha and receive a unique registration number. Registration is free and there is no mandatory donation.",
  alternates: { canonical: "/register" },
  openGraph: {
    title: "Register | Srinivasula Seva Samstha",
    description:
      "Free family registration for the Srinivasula Seva Samstha community trust. Receive a permanent registration number.",
    url: "/register",
  },
};

const STEPS = [
  { title: "Fill your details", description: "Name, date of birth, village and mobile number." },
  { title: "We verify", description: "Your name and date of birth are checked against existing records." },
  { title: "You get a number", description: "A unique registration number such as TSSS000123 is issued instantly." },
];

export default async function RegisterPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative text-center">
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">Membership</p>
          <h1 className="mt-4 text-4xl font-semibold text-balance sm:text-5xl">Register with TSSS</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/70">
            Registration is free for every Srinivas family member. It takes under a minute and gives you a permanent
            registration number used across all trust programmes.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="surface-card p-6 sm:p-8">
              <h2 className="font-display text-2xl font-semibold text-ink-900">Registration form</h2>
              <p className="mt-1.5 text-sm text-slate-600">
                Fields marked <span className="text-red-600">*</span> are required.
              </p>
              <div className="mt-7">
                <RegisterForm registrationOpen={settings.registration_open} />
              </div>

              {!settings.registration_open ? (
                <p
                  role="status"
                  className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                >
                  {settings.registration_paused_message ??
                    "Registration is temporarily paused. Please check back soon or contact the administration."}
                </p>
              ) : null}
            </div>
          </div>

          <aside className="space-y-6 lg:col-span-5">
            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">How registration works</h2>
              <ol className="mt-5 space-y-5">
                {STEPS.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-sm font-bold text-ink-950">
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

            <div className="rounded-3xl border border-gold-200 bg-gold-50/70 p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Your privacy</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
                <li>• Registration details are never shown publicly on this website.</li>
                <li>• Only authorised trust administrators can view the member list.</li>
                <li>
                  • Duplicate detection uses your name and date of birth, and never reveals another person&apos;s
                  information.
                </li>
              </ul>
            </div>

            <div className="surface-card p-6">
              <h2 className="font-display text-lg font-semibold text-ink-900">Already registered?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Submitting the same name and date of birth again will show a message that you are already registered.
                If that is not you, or your details were entered incorrectly, please contact the administration.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
