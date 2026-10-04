/**
 * Browser Supabase client.
 *
 * Only ever receives NEXT_PUBLIC_* values, so the service role key cannot
 * reach the client bundle.
 */

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
