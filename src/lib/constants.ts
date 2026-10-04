import type { SiteSettingsRow } from "@/lib/types";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const SITE_NAME = "Srinivasula Seva Samstha";
export const SITE_SHORT_NAME = "TSSS";
export const SITE_FULL_TITLE = "Srinivasula Seva Samstha (TSSS)";
export const SITE_TAGLINE = "Service · Devotion · Unity";
export const SITE_DESCRIPTION =
  "Srinivasula Seva Samstha (TSSS) is a non-profit community trust serving the Srinivas community through devotional programmes, education, blood assistance and community service.";

export type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export const PRIMARY_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About Us" },
  { href: "/events", label: "Events" },
  { href: "/donations", label: "Donations" },
  { href: "/media", label: "Media" },
  { href: "/blogs", label: "Blogs" },
  { href: "/blood-help", label: "Blood Help" },
];

/** Secondary, high-engagement links shown next to the primary navigation. */
export const FEATURE_NAV: NavItem[] = [{ href: "/photo-booth", label: "Photo Booth" }];

/** Registration is called out separately as the main call to action. */
export const REGISTER_NAV: NavItem = { href: "/register", label: "Register" };

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const BLOG_CATEGORIES = [
  "General",
  "Devotional",
  "Community Service",
  "Education",
  "Blood Help",
  "Announcements",
] as const;

export const PAGE_SIZE = 9;

/** The trust emblem (blue ring, gold lettering, crimson TSSS). */
export const LOGO_IMAGE = "/brand/tsss-emblem-original.jpg";
/** Devotional artwork, used where a traditional image suits the content. */
export const NAMALU_IMAGE = "/brand/namalu.jpg";
/** Brand colours mirrored from the emblem, for scripts and email templates. */
export const BRAND_COLORS = {
  blue: "#0b6ab5",
  blueDeep: "#052540",
  gold: "#f2c230",
  crimson: "#d8232a",
  white: "#ffffff",
} as const;

/** Placeholder artwork shipped with the project, replace with real photos. */
export const PLACEHOLDER_IMAGE = "/brand/og-default.jpg";
export const PLACEHOLDER_EVENT_IMAGE = "/images/events/devotional-1.jpg";
export const PLACEHOLDER_BLOG_IMAGE = "/images/blogs/blog-1.jpg";
export const PLACEHOLDER_MEDIA_IMAGE = "/images/media/media-1.jpg";

/**
 * The public contact form posts straight to FormSubmit, which emails the
 * enquiry straight to the trust inbox - no server action or database row.
 * Override with NEXT_PUBLIC_CONTACT_FORM_EMAIL when the inbox changes.
 */
export const CONTACT_FORM_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_FORM_EMAIL ?? "srinivasreddyvootkuri@srinivasulasevasamstha.com";

/** FormSubmit's AJAX endpoint returns JSON so the form can stay on the page. */
export const CONTACT_FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_FORM_EMAIL}`;

/** Where FormSubmit sends the visitor after a successful send. */
export const CONTACT_FORM_REDIRECT = `${SITE_URL}/contact?sent=1`;

export const FALLBACK_SETTINGS: SiteSettingsRow = {
  id: "fallback",
  organization_name: SITE_NAME,
  short_name: SITE_SHORT_NAME,
  tagline: "Service · Devotion · Unity",
  about_short: SITE_DESCRIPTION,
  mission:
    "To serve society through devotional programmes, education, relief and healthcare assistance while strengthening the bond between every Srinivas family.",
  vision:
    "A united, spiritually grounded Srinivas community that serves every family with dignity, care and compassion.",
  contact_email: null,
  contact_phone: null,
  contact_address: null,
  whatsapp_number: null,
  youtube_url: null,
  facebook_url: null,
  instagram_url: null,
  twitter_url: null,
  map_embed_url: null,
  registration_open: true,
  blood_help_open: true,
  registration_paused_message: null,
  blood_help_paused_message: null,
  central_admin_email: null,
  email_notifications_enabled: true,
  whatsapp_notifications_enabled: false,
  updated_by: null,
  updated_at: new Date(0).toISOString(),
};
