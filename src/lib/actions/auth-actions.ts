"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/session";
import type { LoginState } from "@/lib/actions/state";
import { clientIdentifier, rateLimit } from "@/lib/security/rate-limit";

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { status: "error", message: "Enter both email and password." };
  }

  const headerList = await headers();
  const identifier = clientIdentifier(headerList);
  const limit = rateLimit(`admin-login:${identifier}`, { limit: 10, windowSeconds: 900 });
  if (!limit.allowed) {
    return { status: "error", message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    // Never reveal whether the account exists.
    return { status: "error", message: "Invalid email or password." };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .limit(1)
    .maybeSingle();

  if (!profile || profile.is_active === false) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account does not have administrator access.",
    };
  }

  revalidatePath("/admin", "layout");
  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}

export async function getCurrentSessionEmail(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.authEmail ?? null;
}
