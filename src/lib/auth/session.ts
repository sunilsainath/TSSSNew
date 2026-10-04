import { createClient } from "@/lib/supabase/server";
import type { AppRole, UserRow } from "@/lib/types";

export type AdminSession = {
  user: UserRow;
  authEmail: string;
};

export class AuthorizationError extends Error {
  constructor(message = "Not authorised") {
    super(message);
    this.name = "AuthorizationError";
  }
}

const RANK: Record<AppRole, number> = {
  blood_help_manager: 1,
  content_manager: 2,
  admin: 3,
  super_admin: 4,
};

export function roleRank(role: AppRole): number {
  return RANK[role] ?? 0;
}

/**
 * Returns the signed-in administrator, or null.
 *
 * Always verifies the user with Supabase Auth and then loads the profile row,
 * so a deleted or deactivated profile immediately loses access.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (!profile || profile.is_active === false) return null;

  return {
    user: profile as UserRow,
    authEmail: user.email ?? profile.email,
  };
}

/** Throws when the visitor is not an administrator. */
export async function requireAdmin(minimum: AppRole = "blood_help_manager"): Promise<AdminSession> {
  const session = await getAdminSession();

  if (!session) throw new AuthorizationError("Authentication required");
  if (roleRank(session.user.role) < roleRank(minimum)) {
    throw new AuthorizationError("Insufficient permissions");
  }

  return session;
}

export async function requireContentManager(): Promise<AdminSession> {
  return requireAdmin("content_manager");
}

export async function requireSuperAdmin(): Promise<AdminSession> {
  return requireAdmin("super_admin");
}
