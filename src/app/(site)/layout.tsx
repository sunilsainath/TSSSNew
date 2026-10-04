import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getActiveBanner, getSiteBranding } from "@/lib/data/public";

/**
 * Public website chrome: announcement banner, header, page content and footer.
 * The admin panel uses its own layouts and never renders this.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [banner, branding] = await Promise.all([getActiveBanner(), getSiteBranding()]);

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink-900 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-gold-200"
      >
        Skip to main content
      </a>
      <AnnouncementBanner banner={banner} />
      <SiteHeader branding={branding} />
      <main id="main-content">{children}</main>
      <SiteFooter branding={branding} />
    </>
  );
}
