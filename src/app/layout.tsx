import type { Metadata } from "next";

import { SITE_DESCRIPTION, SITE_FULL_TITLE, SITE_NAME, SITE_SHORT_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";

import "./globals.css";

/**
 * Fonts are loaded through the Google Fonts stylesheet instead of
 * `next/font/google` so the site still renders (with the system fallback stack
 * in globals.css) when the build machine has no outbound network access.
 */
const FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_FULL_TITLE} | ${SITE_TAGLINE}`,
    template: `%s | ${SITE_SHORT_NAME} · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_FULL_TITLE,
  keywords: [
    "Srinivasula Seva Samstha",
    "TSSS",
    "Telangana Srinivasula",
    "Srinivas community",
    "trust",
    "non-profit",
    "devotional events",
    "blood donation",
    "community service",
    "education",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: { title: SITE_SHORT_NAME },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: SITE_FULL_TITLE,
    title: `${SITE_FULL_TITLE} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/og-default.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_FULL_TITLE} emblem - service, devotion and unity`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_FULL_TITLE} | ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/brand/og-default.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: "/" },
  formatDetection: { telephone: true },
};

export const viewport = {
  themeColor: "#052540",
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONT_STYLESHEET} />
      </head>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  );
}
