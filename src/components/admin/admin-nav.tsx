"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/utils/cn";
import type { AppRole } from "@/lib/types";

type NavItem = { href: string; label: string; minimum: AppRole };

type NavGroup = { title: string; items: NavItem[] };

const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", minimum: "blood_help_manager" }],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/banner", label: "Banner", minimum: "content_manager" },
      { href: "/admin/content", label: "Homepage Content", minimum: "content_manager" },
      { href: "/admin/content/about", label: "About Content", minimum: "content_manager" },
    ],
  },
  {
    title: "Events",
    items: [
      { href: "/admin/events/categories", label: "Categories", minimum: "content_manager" },
      { href: "/admin/events", label: "Events", minimum: "content_manager" },
      { href: "/admin/events/galleries", label: "Galleries", minimum: "content_manager" },
    ],
  },
  {
    title: "Donations",
    items: [{ href: "/admin/donations", label: "Donation Information", minimum: "content_manager" }],
  },
  {
    title: "Media",
    items: [
      { href: "/admin/media/youtube", label: "YouTube", minimum: "content_manager" },
      { href: "/admin/media/news", label: "News Articles", minimum: "content_manager" },
      { href: "/admin/photo-booth", label: "Photo Booth", minimum: "content_manager" },
    ],
  },
  {
    title: "Blogs",
    items: [
      { href: "/admin/blogs/pending", label: "Pending", minimum: "content_manager" },
      { href: "/admin/blogs/approved", label: "Approved", minimum: "content_manager" },
      { href: "/admin/blogs/rejected", label: "Rejected", minimum: "content_manager" },
    ],
  },
  {
    title: "Registrations",
    items: [
      { href: "/admin/registrations", label: "Registered Members", minimum: "content_manager" },
      { href: "/admin/registrations/export", label: "Export", minimum: "content_manager" },
    ],
  },
  {
    title: "Blood Help",
    items: [
      { href: "/admin/blood-help/requests", label: "Requests", minimum: "blood_help_manager" },
      { href: "/admin/blood-help/districts", label: "Districts / Areas", minimum: "blood_help_manager" },
      { href: "/admin/blood-help/administrators", label: "Administrators", minimum: "blood_help_manager" },
      { href: "/admin/blood-help/notifications", label: "Notification Logs", minimum: "blood_help_manager" },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/admin/settings", label: "Organization & Contact", minimum: "admin" },
      { href: "/admin/users", label: "Team & Roles", minimum: "super_admin" },
      { href: "/admin/audit-log", label: "Audit Log", minimum: "super_admin" },
    ],
  },
];

const RANK: Record<AppRole, number> = {
  blood_help_manager: 1,
  content_manager: 2,
  admin: 3,
  super_admin: 4,
};

export function AdminNav({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const visible = NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => RANK[role] >= RANK[item.minimum]),
  })).filter((group) => group.items.length > 0);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-semibold text-ink-800 lg:hidden"
      >
        <svg viewBox="0 0 20 20" className="size-4" fill="currentColor" aria-hidden="true">
          <path d="M3 5h14v2H3V5Zm0 4h14v2H3V9Zm0 4h14v2H3v-2Z" />
        </svg>
        Menu
      </button>

      <nav
        aria-label="Admin sections"
        className={cn(
          "w-full shrink-0 lg:block lg:w-60",
          open ? "block" : "hidden",
          "rounded-3xl border border-brand-100 bg-white p-4 lg:sticky lg:top-22 lg:h-fit",
        )}
      >
        <div className="space-y-5">
          {visible.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[0.65rem] font-semibold tracking-[0.16em] text-slate-400 uppercase">
                {group.title}
              </p>
              <ul className="mt-2 space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-gradient-to-r from-brand-700 to-brand-600 text-white"
                        : "text-slate-600 hover:bg-brand-50 hover:text-brand-800",
                    )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
