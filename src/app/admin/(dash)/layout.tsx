import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/admin-nav";
import { BrandEmblem } from "@/components/brand/brand-emblem";
import { LogoutButton } from "@/components/admin/logout-button";
import { SITE_NAME } from "@/lib/constants";
import type { AppRole } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  content_manager: "Content Manager",
  blood_help_manager: "Blood Help Manager",
};

/**
 * Admin shell. Only mounted for the (dash) route group, so /admin/login is
 * never caught by the redirect below.
 */
export default async function AdminDashLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-brand-200">
                <BrandEmblem alt={`${SITE_NAME} emblem`} size={36} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-ink-900">{SITE_NAME}</span>
                <span className="block text-[0.65rem] font-semibold tracking-[0.16em] text-brand-700 uppercase">
                  Admin panel
                </span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs text-slate-500 sm:block">
              <span className="block font-semibold text-ink-800">{session.user.email}</span>
              <span className="block">{ROLE_LABELS[session.user.role]}</span>
            </span>
            <Link
              href="/"
              className="hidden rounded-full border border-brand-200 px-3.5 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:border-gold-400 hover:text-gold-700 sm:inline-flex"
            >
              View site
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <AdminNav role={session.user.role} />
        <div className="min-w-0 flex-1 pb-16">{children}</div>
      </div>
    </div>
  );
}
