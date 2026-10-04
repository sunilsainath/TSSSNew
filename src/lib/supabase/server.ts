/**
 * Server Supabase clients.
 *
 * - `createClient()`  : request scoped, honours the visitor's session (RLS applies)
 * - `createAdminClient()` : service role, bypasses RLS. Server only. Use it
 *   exclusively for operations that have already been authorised in code, such
 *   as reading the member list for an authenticated administrator.
 */

import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import {
  createClient as createSupabaseClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { WebSocket } from "ws";

type RealtimeTransport = NonNullable<
  SupabaseClientOptions<"public">["realtime"]
>["transport"];
type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Node 20 has no global WebSocket, which Supabase's realtime client expects.
 * The `ws` package provides it. Realtime subscriptions are not used by this
 * application today, but the client constructor requires the transport.
 */
const realtimeOptions = {
  realtime: { transport: WebSocket as unknown as RealtimeTransport },
} as const;

export async function createClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...realtimeOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component: cookie writes are not allowed.
            // `proxy.ts` refreshes the session on every request instead.
          }
        },
      },
    },
  );
}

let anonClient: SupabaseClient | null = null;

/**
 * Session-less client for public, cacheable reads.
 *
 * Uses the anon key so Row Level Security still decides what is visible, but
 * touches no cookies - which means it also works at build time inside
 * `generateStaticParams`.
 */
export function createPublicClient(): SupabaseClient {
  if (!anonClient) {
    anonClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        ...realtimeOptions,
        auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
      },
    );
  }
  return anonClient;
}

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  if (!adminClient) {
    adminClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        ...realtimeOptions,
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return adminClient;
}
