import "server-only";

import { cache } from "react";

import { createClient, createPublicClient } from "@/lib/supabase/server";
import {
  BLOOD_GROUPS,
  FALLBACK_SETTINGS,
  LOGO_IMAGE,
  NAMALU_IMAGE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHORT_NAME,
  SITE_URL,
} from "@/lib/constants";
import type {
  AreaRow,
  BloodHelpAdminRow,
  BlogRow,
  DistrictRow,
  DonationSettingsRow,
  EventCategoryRow,
  EventGalleryRow,
  EventWithCategory,
  MediaItemRow,
  SiteBannerRow,
  SiteSettingsRow,
  UserRow,
} from "@/lib/types";

/**
 * All Supabase access for the public site lives here (data access layer).
 * RLS still applies: public users only ever see published/approved rows.
 */

/* -------------------------------------------------------------------------- */
/* Site wide                                                                  */
/* -------------------------------------------------------------------------- */

export const getSiteSettings = cache(async (): Promise<SiteSettingsRow> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) return FALLBACK_SETTINGS;
  return data as SiteSettingsRow;
});

export const getSiteBranding = cache(async () => {
  const settings = await getSiteSettings();
  return {
    name: settings.organization_name || SITE_NAME,
    shortName: settings.short_name || SITE_SHORT_NAME,
    tagline: settings.tagline,
    description: settings.about_short || SITE_DESCRIPTION,
    logo: LOGO_IMAGE,
    namalu: NAMALU_IMAGE,
  };
});

/** Returns the banner only when enabled and inside its optional date window. */
export const getActiveBanner = cache(async (): Promise<SiteBannerRow | null> => {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("site_banners")
    .select("*")
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as SiteBannerRow | null) ?? null;
});

/** Admin preview helper: newest banner regardless of enable state. */
export async function getLatestBannerForAdmin(): Promise<SiteBannerRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as SiteBannerRow | null) ?? null;
}

export async function getPageContent(keys: string[]) {
  if (keys.length === 0) return [];
  const supabase = createPublicClient();
  const { data } = await supabase.from("page_content").select("*").in("key", keys);
  return (data ?? []) as Array<{
    key: string;
    title: string | null;
    subtitle: string | null;
    body: string | null;
    meta: Record<string, unknown>;
  }>;
}

/* -------------------------------------------------------------------------- */
/* Events                                                                     */
/* -------------------------------------------------------------------------- */

export async function getEventCategories(includeInactive = false): Promise<EventCategoryRow[]> {
  const supabase = createPublicClient();
  let query = supabase.from("event_categories").select("*").order("display_order");
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as EventCategoryRow[];
}

export async function getEventCategoryBySlug(slug: string): Promise<EventCategoryRow | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("event_categories")
    .select("*")
    .eq("slug", slug)
    .limit(1)
    .maybeSingle();
  return (data as EventCategoryRow | null) ?? null;
}

export async function getEventsByCategory(
  categoryId: string,
  options: { limit?: number; includePast?: boolean } = {},
): Promise<EventWithCategory[]> {
  const supabase = createPublicClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .eq("category_id", categoryId)
    .eq("is_published", true)
    .order("event_date", { ascending: !options.includePast })
    .limit(options.limit ?? 100);

  if (!options.includePast) query = query.gte("event_date", today);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as EventWithCategory[];
}

export async function getEventCountsByCategory(): Promise<Record<string, number>> {
  const categories = await getEventCategories();
  if (categories.length === 0) return {};
  const today = new Date().toISOString().slice(0, 10);

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("events")
    .select("category_id, event_date")
    .eq("is_published", true)
    .gte("event_date", today);

  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ category_id: string }>) {
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export async function getUpcomingEvents(limit = 3): Promise<EventWithCategory[]> {
  const supabase = createPublicClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .eq("is_published", true)
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as EventWithCategory[];
}

export async function getFeaturedEvents(limit = 6): Promise<EventWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("event_date", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as EventWithCategory[];
}

export async function getAllPublishedEvents(limit = 60): Promise<EventWithCategory[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .eq("is_published", true)
    .order("event_date", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as EventWithCategory[];
}

export async function getEventBySlug(slug: string): Promise<EventWithCategory | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_categories(id, name, slug)")
    .eq("slug", slug)
    .eq("is_published", true)
    .limit(1)
    .maybeSingle();
  return (data as EventWithCategory | null) ?? null;
}

export async function getEventGallery(eventId: string): Promise<EventGalleryRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("event_gallery")
    .select("*")
    .eq("event_id", eventId)
    .order("display_order");
  return (data ?? []) as EventGalleryRow[];
}

/* -------------------------------------------------------------------------- */
/* Blogs                                                                      */
/* -------------------------------------------------------------------------- */

export async function getPublishedBlogs(options: {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  featuredOnly?: boolean;
} = {}): Promise<{ blogs: BlogRow[]; total: number }> {
  const supabase = createPublicClient();
  const limit = options.limit ?? 9;
  const offset = options.offset ?? 0;

  let query = supabase
    .from("blogs")
    .select("*", { count: "exact" })
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.category && options.category !== "all") query = query.eq("category", options.category);
  if (options.featuredOnly) query = query.eq("is_featured", true);
  if (options.search) {
    const term = `%${options.search.replace(/[%_,]/g, "")}%`;
    query = query.or(`title.ilike.${term},excerpt.ilike.${term},content.ilike.${term}`);
  }

  const { data, error, count } = await query;
  if (error) return { blogs: [], total: 0 };
  return { blogs: (data ?? []) as BlogRow[], total: count ?? 0 };
}

export async function getFeaturedBlog(): Promise<BlogRow | null> {
  const { blogs } = await getPublishedBlogs({ featuredOnly: true, limit: 1 });
  return blogs[0] ?? null;
}

export async function getBlogBySlug(slug: string): Promise<BlogRow | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("blogs")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  return (data as BlogRow | null) ?? null;
}

export async function getBlogCategories(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("blogs").select("category").eq("status", "approved");
  const categories = new Set<string>();
  for (const row of (data ?? []) as Array<{ category: string }>) categories.add(row.category);
  return Array.from(categories).sort();
}

export async function getRelatedBlogs(blog: BlogRow, limit = 3): Promise<BlogRow[]> {
  const { blogs } = await getPublishedBlogs({ category: blog.category, limit: limit + 1 });
  return blogs.filter((item) => item.id !== blog.id).slice(0, limit);
}

/* -------------------------------------------------------------------------- */
/* Media                                                                      */
/* -------------------------------------------------------------------------- */

export async function getMediaItems(
  options: { type?: "youtube" | "news"; limit?: number } = {},
): Promise<MediaItemRow[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("media_items")
    .select("*")
    .eq("is_published", true)
    .order("publication_date", { ascending: false, nullsFirst: false })
    .limit(options.limit ?? 24);

  if (options.type) query = query.eq("type", options.type);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as MediaItemRow[];
}

/* -------------------------------------------------------------------------- */
/* Donations                                                                  */
/* -------------------------------------------------------------------------- */

export async function getDonationSettings(): Promise<DonationSettingsRow | null> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("donation_settings").select("*").limit(1).maybeSingle();
  return (data as DonationSettingsRow | null) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Community impact statistics                                                */
/* -------------------------------------------------------------------------- */

export async function getImpactStats(): Promise<
  Array<{ label: string; value: number; description: string }>
> {
  const supabase = createPublicClient();
  const today = new Date().toISOString().slice(0, 10);

  const [members, events, upcoming, bloodRequests, stories, categories] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true)
      .gte("event_date", today),
    supabase.from("blood_help_requests").select("id", { count: "exact", head: true }),
    supabase.from("blogs").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase
      .from("event_categories")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  return [
    {
      label: "Registered Members",
      value: members.count ?? 0,
      description: "Srinivas families registered with the trust",
    },
    {
      label: "Events Conducted",
      value: events.count ?? 0,
      description: "Devotional and community programmes published",
    },
    {
      label: "Upcoming Events",
      value: upcoming.count ?? 0,
      description: "Programmes scheduled ahead",
    },
    {
      label: "Blood Assistance",
      value: bloodRequests.count ?? 0,
      description: "Blood help requests coordinated",
    },
    {
      label: "Community Stories",
      value: stories.count ?? 0,
      description: "Approved articles published on this website",
    },
    {
      label: "Service Categories",
      value: categories.count ?? 0,
      description: "Areas where the trust is active",
    },
  ];
}

/* -------------------------------------------------------------------------- */
/* Blood help reference data                                                  */
/* -------------------------------------------------------------------------- */

export async function getDistricts(): Promise<DistrictRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("districts")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  return (data ?? []) as DistrictRow[];
}

export async function getAllDistricts(): Promise<DistrictRow[]> {
  const supabase = createPublicClient();
  const { data } = await supabase.from("districts").select("*").order("display_order");
  return (data ?? []) as DistrictRow[];
}

export async function getAreas(districtId?: string): Promise<AreaRow[]> {
  const supabase = createPublicClient();
  let query = supabase.from("areas").select("*").eq("is_active", true).order("display_order");
  if (districtId) query = query.eq("district_id", districtId);
  const { data } = await query;
  return (data ?? []) as AreaRow[];
}

/* -------------------------------------------------------------------------- */
/* Admin helpers (caller must already be authenticated)                        */
/* -------------------------------------------------------------------------- */

export async function getCurrentAdmin(): Promise<UserRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("users").select("*").eq("id", user.id).limit(1).maybeSingle();
  if (!data || data.is_active === false) return null;
  return data as UserRow;
}

export async function getBloodHelpAdmins(): Promise<BloodHelpAdminRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("blood_help_admins")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as BloodHelpAdminRow[];
}

export const BLOOD_GROUP_LIST = BLOOD_GROUPS;
export { SITE_URL };
