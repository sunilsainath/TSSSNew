import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { BrandEmblem } from "@/components/brand/brand-emblem";
import { ContactForm } from "@/components/forms/contact-form";
import { getAllDistricts, getPageContent, getSiteBranding, getSiteSettings } from "@/lib/data/public";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "About Srinivasula Seva Samstha - our mission, vision, objectives, community service, spiritual activities, educational initiatives and leadership.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Us | Srinivasula Seva Samstha",
    description:
      "The mission, vision and activities of Srinivasula Seva Samstha, a non-profit community trust.",
    url: "/about",
  },
};

const OBJECTIVES = [
  "To unite every Srinivas family across villages, districts and towns through a single community trust.",
  "To conduct regular devotional programmes, kalyanotsavam, nama sankirtanam and satsangam.",
  "To support education through school kit distribution, scholarships and free coaching classes.",
  "To run a district-wise blood assistance network for emergencies, free of cost.",
  "To serve families in distress through relief material and community service drives.",
  "To maintain complete transparency in the use of every voluntary contribution.",
];

const ACTIVITIES = [
  {
    title: "Spiritual Activities",
    description:
      "Weekly satsangam, nama sankirtanam, kalyanotsavam, pravachanam and festival celebrations that bring the community together.",
    icon: "M10 2.6c-2.6 0-4.7 2.1-4.7 4.7 0 1.2.4 2.2 1.1 3-.6.5-1 1.2-1.2 2-.2.8.2 1.6.8 2.1.6.6 1.4.8 2.2.6.6-.2 1.1 0 1.6.3.5.4.9 1 1.2 1.6h0c.3-.6.7-1.2 1.2-1.6.5-.3 1-.5 1.6-.3.8.2 1.6 0 2.2-.6.6-.5 1-1.3.8-2.1-.2-.8-.6-1.5-1.2-2 .7-.8 1.1-1.8 1.1-3 0-2.6-2.1-4.7-4.7-4.7Zm0 2.2c1.4 0 2.5 1.1 2.5 2.5S11.4 9.8 10 9.8 7.5 8.7 7.5 7.3 8.6 4.8 10 4.8Z",
    href: "/events/devotional-events",
    cta: "Devotional events",
  },
  {
    title: "Educational Initiatives",
    description:
      "Free spoken English and computer classes, scholarships for deserving students and stationery support for schools.",
    icon: "M10 3 2 6.4l8 3.4 8-3.4L10 3ZM4.6 8.9v3.6c0 1.6 2.4 3 5.4 3s5.4-1.4 5.4-3V8.9L10 11.5 4.6 8.9Z",
    href: "/events/educational-programs",
    cta: "Education programmes",
  },
  {
    title: "Community Service",
    description:
      "Relief distribution, health camps, disaster response and support to families who need help during difficult times.",
    icon: "M10 17.5s-6.4-3.7-6.4-8A3.6 3.6 0 0 1 10 7.4a3.6 3.6 0 0 1 6.4 2.1c0 4.3-6.4 8-6.4 8Z",
    href: "/events/helping-hands",
    cta: "Helping hands",
  },
];

export default async function AboutPage() {
  const [settings, branding, districts, content] = await Promise.all([
    getSiteSettings(),
    getSiteBranding(),
    getAllDistricts(),
    getPageContent(["about_intro", "about_leadership"]),
  ]);

  const intro = content.find((item) => item.key === "about_intro");
  const leadership = content.find((item) => item.key === "about_leadership");

  const leadershipMembers = Array.isArray(leadership?.meta?.members)
    ? (leadership.meta.members as Array<{ name: string; role: string }>)
    : [];

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 py-16 text-white sm:py-20">
        <div className="aurora opacity-60" aria-hidden="true" />
        <div className="container-page relative grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-gold-300 uppercase">About the trust</p>
            <h1 className="mt-4 text-4xl leading-tight font-semibold text-balance sm:text-5xl">
              {branding.name}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70">
              {intro?.body ??
                settings.about_short ??
                "A non-profit community trust bringing Srinivas families together through devotion, education and service."}
            </p>
            {settings.tagline ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold-400/25 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold tracking-[0.16em] text-gold-200 uppercase">
                {settings.tagline}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-4xl bg-[radial-gradient(circle_at_50%_35%,#0b6ab5_0%,#052540_55%,#02101f_100%)] shadow-[0_40px_90px_-45px_rgba(7,12,26,0.7)]">
              <div className="brand-halo absolute size-4/5 animate-glow rounded-full" aria-hidden="true" />
              <div className="relative grid aspect-square w-3/5 max-w-xs place-items-center rounded-full bg-white shadow-[0_28px_60px_-20px_rgba(2,16,31,0.75)] ring-1 ring-white/60">
                <BrandEmblem
                  alt={`${branding.name} emblem`}
                  size={320}
                  priority
                  className="size-full scale-[0.94] object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page grid gap-6 lg:grid-cols-2">
          {[
            { title: "Our Mission", body: settings.mission, tone: "gold" },
            { title: "Our Vision", body: settings.vision, tone: "sky" },
          ].map((item) => (
            <div key={item.title} className="surface-card p-7 sm:p-9">
              <h2 className="font-display text-2xl font-semibold text-ink-900">{item.title}</h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600">
                {item.body ??
                  "To be defined by the trust. Administrators can update this from Admin → Website → About Content."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50/70 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            align="left"
            eyebrow="Objectives"
            title="What we work towards"
            description="The commitments that guide every programme the trust conducts."
          />
          <ul className="mt-10 grid gap-4 md:grid-cols-2">
            {OBJECTIVES.map((objective, index) => (
              <li key={objective} className="surface-card flex gap-4 p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-500 text-sm font-bold text-ink-950">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-slate-700">{objective}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            align="left"
            eyebrow="Activities"
            title="How the trust serves the community"
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {ACTIVITIES.map((activity) => (
              <article key={activity.title} className="surface-card surface-card-hover flex flex-col p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-ink-900 to-ink-700 text-gold-300">
                  <svg viewBox="0 0 20 20" className="size-6" fill="currentColor" aria-hidden="true">
                    <path d={activity.icon} />
                  </svg>
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-ink-900">{activity.title}</h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-slate-600">{activity.description}</p>
                <ButtonLink href={activity.href} variant="secondary" size="sm" className="mt-5 self-start">
                  {activity.cta}
                </ButtonLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/70 py-16 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              align="left"
              eyebrow="Leadership"
              title="Trust members &amp; volunteers"
              description="The trust is served by elected members and volunteers who oversee programmes, finances and the blood help network."
            />
            {leadership?.body ? (
              <p className="mt-5 text-sm leading-relaxed text-slate-600">{leadership.body}</p>
            ) : null}
          </div>

          <div className="lg:col-span-7">
            {leadershipMembers.length === 0 ? (
              <div className="surface-card p-8 text-center">
                <h3 className="font-display text-lg font-semibold text-ink-900">Leadership details coming soon</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                  Trust members and office bearers are maintained by administrators and will appear here once
                  published.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {leadershipMembers.map((member) => (
                  <li key={member.name} className="surface-card p-5">
                    <p className="font-display text-lg font-semibold text-ink-900">{member.name}</p>
                    <p className="mt-1 text-sm text-gold-700">{member.role}</p>
                  </li>
                ))}
              </ul>
            )}

            <div className="surface-card mt-6 p-6">
              <h3 className="font-display text-lg font-semibold text-ink-900">Districts we work in</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {districts.map((district) => (
                  <li
                    key={district.id}
                    className="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-ink-700"
                  >
                    {district.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="py-16 sm:py-20">
        <div className="container-page">
          <div className="surface-card grid gap-8 p-7 sm:p-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink-900">Get in touch</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                For registration help, donation receipts, blood assistance or volunteering, contact the trust
                administration.
              </p>
              <ButtonLink href="/blood-help" className="mt-6">
                Request blood help
              </ButtonLink>

              <dl className="mt-8 grid gap-5 sm:grid-cols-2">
                {[
                  ["Email", settings.contact_email, "mailto:"],
                  ["Phone", settings.contact_phone, "tel:"],
                  ["WhatsApp", settings.whatsapp_number, "wa:"],
                  ["Address", settings.contact_address, null],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value, prefix]) => (
                    <div key={label as string}>
                      <dt className="text-xs font-semibold tracking-[0.12em] text-slate-500 uppercase">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-ink-900">
                        {prefix ? (
                          <a
                            href={`${prefix}${String(value).replace(/\s/g, prefix === "tel:" ? "" : "")}`}
                            className="hover:text-gold-700"
                          >
                            {value}
                          </a>
                        ) : (
                          value
                        )}
                      </dd>
                    </div>
                  ))}

                {!settings.contact_email && !settings.contact_phone && !settings.contact_address ? (
                  <p className="text-sm text-slate-500 sm:col-span-2">
                    Contact details have not been published yet. Administrators can add them in Admin →
                    Settings.
                  </p>
                ) : null}
              </dl>
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-ink-900">Send us a message</h3>
              <p className="mt-2 mb-5 text-sm leading-relaxed text-slate-600">
                Fill this in and the message goes straight to the trust inbox.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
