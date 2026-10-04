import Link from "next/link";

import { BrandEmblem } from "@/components/brand/brand-emblem";
import { getSiteSettings } from "@/lib/data/public";
import { FEATURE_NAV, PRIMARY_NAV, REGISTER_NAV } from "@/lib/constants";

export async function SiteFooter({
  branding,
}: {
  branding: { name: string; shortName: string; logo: string; tagline?: string | null };
}) {
  const settings = await getSiteSettings();
  const year = new Date().getFullYear();

  const quickLinks = [...PRIMARY_NAV, ...FEATURE_NAV, REGISTER_NAV];

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-white">
      <div className="aurora opacity-40" aria-hidden="true" />
      <div className="container-page relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <div className="flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 p-1 shadow-[0_10px_30px_-12px_rgba(11,106,181,0.9)]">
                <BrandEmblem alt={`${branding.name} emblem`} size={56} />
              </span>
              <div>
                <p className="font-display text-xl leading-tight font-semibold">{branding.name}</p>
                <p className="text-[0.68rem] font-semibold tracking-[0.18em] text-gold-300 uppercase">
                  {branding.tagline ?? "Service · Devotion · Unity"}
                </p>
              </div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/65">
              {settings.about_short ??
                "A non-profit community trust serving the Srinivas community through devotion, education, blood assistance and community service."}
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Non-profit trust · Donations are voluntary
            </p>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-gold-300 uppercase">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/70 transition-colors hover:text-gold-200"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-gold-300 uppercase">Our Work</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>Devotional programmes &amp; kalyanotsavam</li>
              <li>Blood assistance network</li>
              <li>Education &amp; pen distribution</li>
              <li>Community service &amp; relief</li>
              <li>Photo booth memories</li>
              <li>Member registration</li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold tracking-[0.18em] text-gold-300 uppercase">Contact</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              {settings.contact_email ? (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-gold-200">
                    {settings.contact_email}
                  </a>
                </li>
              ) : null}
              {settings.contact_phone ? <li>{settings.contact_phone}</li> : null}
              {settings.contact_address ? <li className="leading-relaxed">{settings.contact_address}</li> : null}
              {!settings.contact_email && !settings.contact_phone && !settings.contact_address ? (
                <li className="text-white/45">Add contact details in Admin → Settings.</li>
              ) : null}
            </ul>

            <div className="mt-5 flex gap-2">
              {[
                { href: settings.youtube_url, label: "YouTube" },
                { href: settings.facebook_url, label: "Facebook" },
                { href: settings.instagram_url, label: "Instagram" },
              ]
                .filter((social) => Boolean(social.href))
                .map((social) => (
                  <a
                    key={social.label}
                    href={social.href as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-white/12 px-3 py-1.5 text-xs text-white/70 transition-colors hover:border-gold-400/60 hover:text-gold-200"
                  >
                    {social.label}
                  </a>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/50 sm:flex-row">
            <p>
              © {year} {branding.name}. All rights reserved.
            </p>
            <p className="flex items-center gap-4">
              <span>Built with devotion</span>
              <Link href="/admin/login" className="transition-colors hover:text-white/80">
                Admin
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
