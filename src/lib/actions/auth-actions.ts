"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/session";
import {
  clearLoginFailures,
  isLoginBlocked,
  recordAuthEvent,
  recordFailedLogin,
} from "@/lib/auth/login-security";
import { clientIdentifier } from "@/lib/security/rate-limit";
import { SITE_URL } from "@/lib/constants";
import type { LoginState, PasswordState } from "@/lib/actions/state";

/** Where the recovery link in the reset email lands. */
const PASSWORD_UPDATE_PATH = "/admin/password";

/**
 * Deliberately vague: the reset form must not reveal whether an address belongs
 * to an administrator account.
 */
const RESET_SENT_MESSAGE =
  "If that address belongs to an administrator, a reset link is on its way. The link expires in one hour.";

async function requestContext() {
  const headerList = await headers();

  return {
    identifier: clientIdentifier(headerList),
    ip: headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: headerList.get("user-agent"),
  };
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/admin");

  if (!email || !password) {
    return { status: "error", message: "Enter both email and password." };
  }

  const { identifier, ip, userAgent } = await requestContext();

  // Durable, database-backed lockout. The old in-process limiter is useless on
  // serverless, where every cold start began with an empty bucket.
  if (await isLoginBlocked(identifier, email)) {
    await recordAuthEvent("access_denied", email, "login blocked by rate limit");
    return {
      status: "error",
      message: "Too many failed attempts. Please wait 15 minutes and try again.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    await recordFailedLogin(identifier, email, { ip, userAgent });
    // The reason is fixed rather than the provider's message, so no internal
    // detail is copied into a permanent audit record.
    await recordAuthEvent("sign_in_failed", email, "invalid credentials");
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
    await recordAuthEvent("access_denied", email, "no active administrator profile");
    return {
      status: "error",
      message: "This account does not have administrator access.",
    };
  }

  await clearLoginFailures(identifier, email);
  await recordAuthEvent("sign_in", email, profile.role);

  revalidatePath("/admin", "layout");
  redirect(nextPath.startsWith("/admin") ? nextPath : "/admin");
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();

  // Capture the identity before the session is destroyed.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();
  await recordAuthEvent("sign_out", user?.email ?? null);

  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}

export async function getCurrentSessionEmail(): Promise<string | null> {
  const session = await getAdminSession();
  return session?.authEmail ?? null;
}

/**
 * Starts a password reset.
 *
 * Always reports success, whether or not the address exists, so the form cannot
 * be used to discover which email addresses have administrator accounts.
 */
export async function requestPasswordResetAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { status: "error", message: "Enter the email address for your account." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}${PASSWORD_UPDATE_PATH}`,
  });

  if (error) {
    console.error("resetPasswordForEmail failed:", error.message);
    // Still report success so the response does not leak account existence.
    return { status: "success", message: RESET_SENT_MESSAGE };
  }

  await recordAuthEvent("password_reset_requested", email);

  return { status: "success", message: RESET_SENT_MESSAGE };
}

/**
 * Sets a new password.
 *
 * Used by two callers: an administrator changing their own password while signed
 * in, and a visitor following the recovery link (Supabase signs them in for the
 * duration of the reset).
 */
export async function updatePasswordAction(
  _previous: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters." };
  }

  if (password !== confirm) {
    return { status: "error", message: "The two passwords do not match." };
  }

  if (password === String(formData.get("currentPassword") ?? "") && formData.get("currentPassword")) {
    return { status: "error", message: "Choose a password you have not used before." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The recovery session grants a short-lived authenticated state without a
  // profile row, which is expected and correct here.
  if (!user) {
    return {
      status: "error",
      message: "This reset link has expired or was already used. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("updateUser failed:", error.message);
    return {
      status: "error",
      message: "The password could not be changed. Request a fresh reset link and try again.",
    };
  }

  await recordAuthEvent("password_changed", user.email ?? null);

  // A recovery session must not linger once the password is set.
  await supabase.auth.signOut();

  return { status: "success", message: "Your password has been changed. Sign in with it now." };
}