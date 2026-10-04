import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/constants";
import { getAllPublishedEvents, getEventCategories, getPublishedBlogs } from "@/lib/data/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, blogs, categories] = await Promise.all([
    getAllPublishedEvents(200),
    getPublishedBlogs({ limit: 200 }),
    getEventCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/events`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/donations`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/media`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/blogs`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/photo-booth`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/blood-help`, changeFrequency: "monthly", priority: 0.9 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/events/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const eventRoutes: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${SITE_URL}/events/${event.event_categories?.slug ?? "all"}/${event.slug}`,
    lastModified: event.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogs.blogs.map((blog) => ({
    url: `${SITE_URL}/blogs/${blog.slug}`,
    lastModified: blog.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...eventRoutes, ...blogRoutes];
}
