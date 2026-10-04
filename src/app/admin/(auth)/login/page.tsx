import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/login-form";
import { BrandEmblem } from "@/components/brand/brand-emblem";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME } from "@/lib/constants";

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
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ink-950 px-5 py-16">
      <div className="aurora opacity-60" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="glass rounded-4xl p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-white/95 p-1">
              <BrandEmblem alt={`${SITE_NAME} emblem`} size={56} priority />
            </span>
            <div>
              <p className="font-display text-lg font-semibold text-white">{SITE_NAME}</p>
              <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-gold-300 uppercase">
                Admin panel
              </p>
            </div>
          </div>

          {hasAuth ? (
            <div
              role="alert"
              className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100"
            >
              <p className="font-semibold">No administrator access</p>
              <p className="mt-1">
                You are signed in, but this account is not an administrator. Ask a Super Admin to add you from Admin →
                Team &amp; Roles.
              </p>
              <Link
                href="/admin/login"
                className="mt-3 inline-block text-xs font-semibold underline underline-offset-2"
              >
                Switch account
              </Link>
            </div>
          ) : (
            <Suspense fallback={null}>
              <LoginForm nextPath={next} />
            </Suspense>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/45">
          Sessions are secured by Supabase Auth. Contact the Super Admin if you need access.
        </p>
      </div>
    </main>
  );
}
