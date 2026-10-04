import { Hero } from "@/components/home/hero";
import {
  AboutPreview,
  BloodHelpCta,
  HelpingHands,
  LatestBlogs,
  MediaPreview,
  PhotoBoothCta,
  RegistrationCta,
  UpcomingEvents,
} from "@/components/home/sections";
import { ImpactStats } from "@/components/home/impact-stats";
import { getPhotoBoothTemplates } from "@/lib/data/photo-booth";
import {
  getFeaturedBlog,
  getImpactStats,
  getMediaItems,
  getPublishedBlogs,
  getSiteBranding,
  getSiteSettings,
  getUpcomingEvents,
} from "@/lib/data/public";

export const revalidate = 300;

export default async function HomePage() {
  const [branding, settings, upcoming, stats, featuredBlog, latestBlogs, media, boothTemplates] =
    await Promise.all([
      getSiteBranding(),
      getSiteSettings(),
      getUpcomingEvents(3),
      getImpactStats(),
      getFeaturedBlog(),
      getPublishedBlogs({ limit: 3 }),
      getMediaItems({ limit: 4 }),
      getPhotoBoothTemplates(),
    ]);

  const blogs = featuredBlog
    ? [featuredBlog, ...latestBlogs.blogs.filter((blog) => blog.id !== featuredBlog.id)].slice(0, 3)
    : latestBlogs.blogs;

  return (
    <>
      <Hero name={branding.name} tagline={settings.tagline} nextEvent={upcoming[0] ?? null} />

      <AboutPreview about={settings.about_short} mission={settings.mission} vision={settings.vision} />

      <UpcomingEvents events={upcoming} />

      <ImpactStats stats={stats} />

      <HelpingHands />

      {boothTemplates.length > 0 ? <PhotoBoothCta /> : null}

      <LatestBlogs blogs={blogs} />

      <MediaPreview items={media} />

      <BloodHelpCta />

      <RegistrationCta open={settings.registration_open} />
    </>
  );
}
