/**
 * Server-side administrator authentication hardening.
 *
 * Two problems this solves:
 *
 * 1. `src/lib/security/rate-limit.ts` is an in-process `Map`. Vercel functions are
 *    ephemeral, so a distributed attacker got a fresh bucket on every cold start
 *    and the lockout never engaged. Every check here is a database round trip, so
 *    the counter is shared by every instance.
 *
 * 2. Sign-in, sign-out and password changes were never recorded. They are the
 *    events an administrator most wants during a dispute, so they are written to
 *    the audit log alongside every data change.
 */

import "server-only";

import { createAdminClient } from "@/lib/supabase/server";

/** Failed attempts allowed from one address before it is locked out. */
export const LOGIN_MAX_ATTEMPTS = 10;
/** Lockout window in seconds (15 minutes). */
export const LOGIN_WINDOW_SECONDS = 900;
/** Failed attempts allowed against one account before it is locked out. */
export const ACCOUNT_MAX_ATTEMPTS = 10;
/** Per-account lockout window in seconds (15 minutes). */
export const ACCOUNT_WINDOW_SECONDS = 900;

const db = () => createAdminClient().schema("public");

/** Keys are namespaced so a shared address cannot exhaust another feature. */
const ipKey = (identifier: string) => `admin-login:ip:${identifier}`;
const accountKey = (email: string) => `admin-login:account:${email.toLowerCase()}`;

async function isBlockedByIp(identifier: string): Promise<boolean> {
  const { data, error } = await db().rpc("rate_limit_blocked", {
    p_key: ipKey(identifier),
    p_max_hits: LOGIN_MAX_ATTEMPTS,
    p_window_seconds: LOGIN_WINDOW_SECONDS,
  });

  if (error) {
    // Fail open on infrastructure trouble, otherwise a database blip would lock
    // every administrator out of the panel.
    console.error("rate_limit_blocked failed:", error.message);
    return false;
  }

  return data === true;
}

async function isBlockedByAccount(email: string): Promise<boolean> {
  if (!email) return false;

  const { data, error } = await db().rpc("admin_login_blocked", {
    p_identifier: accountKey(email),
    p_max_hits: ACCOUNT_MAX_ATTEMPTS,
    p_window_seconds: ACCOUNT_WINDOW_SECONDS,
  });

  if (error) {
    console.error("admin_login_blocked failed:", error.message);
    return false;
  }

  return data === true;
}

/** True when either the address or the account is currently locked out. */
export async function isLoginBlocked(identifier: string, email: string): Promise<boolean> {
  const [byIp, byAccount] = await Promise.all([
    isBlockedByIp(identifier),
    isBlockedByAccount(email),
  ]);

  return byIp || byAccount;
}

/**
 * Records a failed attempt against both the address and the account.
 *
 * Only failures are counted, so a busy administrator signing in from the same
 * office address is never penalised for signing in successfully.
 */
export async function recordFailedLogin(
  identifier: string,
  email: string,
  context: { ip?: string | null; userAgent?: string | null },
): Promise<void> {
  const results = await Promise.allSettled([
    db().rpc("rate_limit_hit", {
      p_key: ipKey(identifier),
      p_max_hits: LOGIN_MAX_ATTEMPTS,
      p_window_seconds: LOGIN_WINDOW_SECONDS,
    }),
    db().rpc("rate_limit_hit", {
      p_key: accountKey(email),
      p_max_hits: ACCOUNT_MAX_ATTEMPTS,
      p_window_seconds: ACCOUNT_WINDOW_SECONDS,
    }),
    db().rpc("record_admin_login_attempt", {
      p_identifier: accountKey(email),
      p_email: email,
      p_succeeded: false,
      p_ip: context.ip ?? null,
      p_user_agent: context.userAgent ?? null,
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("recordFailedLogin part failed:", result.reason?.message ?? result.reason);
    }
  }
}

/** Clears the counters after a successful sign-in. */
export async function clearLoginFailures(identifier: string, email: string): Promise<void> {
  const account = accountKey(email);

  const results = await Promise.allSettled([
    db().rpc("clear_rate_limit", { p_key: ipKey(identifier) }),
    db().rpc("clear_rate_limit", { p_key: account }),
    // The per-account lockout counts rows in `admin_login_attempts`, so those
    // have to go too, not just the shared counter.
    db().rpc("clear_login_failures", { p_identifier: account }),
    db().rpc("record_admin_login_attempt", {
      p_identifier: account,
      p_email: email,
      p_succeeded: true,
      p_ip: null,
      p_user_agent: null,
    }),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("clearLoginFailures part failed:", result.reason?.message ?? result.reason);
    }
  }
}

/**
 * Writes an authentication event to the audit log.
 *
 * Recorded actions: `sign_in`, `sign_in_failed`, `sign_out`,
 * `password_reset_requested`, `password_changed`, `access_denied`.
 */
export async function recordAuthEvent(
  action: string,
  actorEmail: string | null,
  detail?: string,
): Promise<void> {
  const { error } = await db().rpc("record_admin_auth_event", {
    p_action: action,
    p_actor_email: actorEmail,
    p_detail: detail ?? null,
  });

  // Never let audit trouble break an administrator's sign-in.
  if (error) console.error("recordAuthEvent failed:", error.message);
}