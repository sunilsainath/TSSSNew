/**
 * Supabase session handling for Next.js 16 (`proxy.ts`).
 *
 * - refreshes the auth session on every matched request
 * - performs an optimistic redirect for /admin routes
 *
 * This is only a first line of defence: every admin page and server action
 * also re-verifies the user and their role against the database.
 */

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { WebSocket } from "ws";

type RealtimeTransport = NonNullable<
  Parameters<typeof createServerClient>[2]["realtime"]
>["transport"];
type CookieToSet = { name: string; value: string; options?: CookieOptions };

const PROTECTED_PREFIXES = ["/admin"];

/**
 * Reachable without a session.
 *
 * - `/admin/login` obviously.
 * - `/admin/forgot-password` is the reset request form.
 * - `/admin/password` is where Supabase's recovery link lands. Following it
 *   creates a short-lived recovery session, but an administrator who has merely
 *   forgotten their password arrives with no session at all and must still be
 *   able to set a new one.
 */
const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/login",
  "/admin/forgot-password",
  "/admin/password",
]);

function isProtected(pathname: string) {
  if (PUBLIC_ADMIN_PATHS.has(pathname)) return false;

  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Node 20 has no global WebSocket; `ws` satisfies Supabase's realtime client.
      realtime: { transport: WebSocket as unknown as RealtimeTransport },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // IMPORTANT: do not run code between createServerClient and getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Password recovery link. Supabase emails a PKCE `?code=` which has to be
  // exchanged for a session. This happens here rather than in the page because
  // only this layer may write cookies; a Server Component cannot.
  const code = request.nextUrl.searchParams.get("code");
  if (code && !user && pathname === "/admin/password") {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    const cleanUrl = request.nextUrl.clone();
    cleanUrl.search = "";
    return NextResponse.redirect(cleanUrl, error ? 303 : 307);
  }

  if (isProtected(pathname)) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname === "/admin/login" && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
