import type { Metadata } from "next";
import Link from "next/link";

import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { SetPasswordForm } from "@/components/admin/set-password-form";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

/**
 * Serves two purposes from one URL, because the recovery link has to land
 * somewhere an anonymous visitor can reach:
 *
 * 1. A visitor following the emailed link has a short-lived recovery session and
 *    no administrator profile, so they set a password without knowing the old one.
 * 2. A signed-in administrator reaches the same page to change their password
 *    voluntarily, which requires the current password.
 */
export default async function AdminPasswordPage() {
  const session = await getAdminSession();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed in with an administrator profile: voluntary change.
  if (session) {
    return (
      <AdminAuthCard
        title="Change your password"
        subtitle="Choose a new password for your administrator account. You will stay signed in on this device."
      >
        <SetPasswordForm requireCurrent />
      </AdminAuthCard>
    );
  }

  // Recovery session: the emailed link was valid.
  if (user) {
    return (
      <AdminAuthCard
        title="Choose a new password"
        subtitle="This link works once. Pick a password of at least 8 characters, then sign in with it."
      >
        <SetPasswordForm />
      </AdminAuthCard>
    );
  }

  // No session at all: expired link, already used, or a mistyped URL.
  return (
    <AdminAuthCard
      title="This link is no longer valid"
      subtitle="Password reset links expire after one hour and can only be used once."
      footer={
        <Link href="/admin/forgot-password" className="font-semibold text-gold-300 underline underline-offset-2">
          Request a new reset link
        </Link>
      }
    />
  );
}