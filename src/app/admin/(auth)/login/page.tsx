import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login-form";
import { AdminAuthCard } from "@/components/admin/admin-auth-card";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const session = await getAdminSession();
  if (session) redirect("/admin");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed in with Supabase but without an admin profile.
  const hasAuth = Boolean(user);

  return (
    <AdminAuthCard title="Sign in to continue">
      {hasAuth ? (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100"
        >
          <p className="font-semibold">No administrator access</p>
          <p className="mt-1">
            You are signed in, but this account is not an administrator. Ask a Super Admin to add
            you from Admin → Team &amp; Roles.
          </p>
          <Link href="/admin/login" className="mt-3 inline-block text-xs font-semibold underline underline-offset-2">
            Switch account
          </Link>
        </div>
      ) : (
        <Suspense fallback={null}>
          <LoginForm nextPath={next} />
        </Suspense>
      )}
    </AdminAuthCard>
  );
}