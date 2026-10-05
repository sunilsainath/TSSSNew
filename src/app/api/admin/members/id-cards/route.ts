import { getAdminSession, roleRank } from "@/lib/auth/session";
import { fetchAllMembers, parseMemberQuery } from "@/lib/data/members";
import { MAX_CARDS_PER_BATCH, renderCardsZip } from "@/lib/idcard/bulk";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Downloads a ZIP of identity cards for every member matching the filters.
 *
 * Query parameters are the member-list filters (search, status, gender,
 * bloodGroup, state, country, donated, dobFrom, dobTo, registeredFrom,
 * registeredTo). Only the first MAX_CARDS_PER_BATCH members are rendered per
 * request, so narrow the filters for a large roll.
 */
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return new Response("Not authorised", { status: 403 });
  if (roleRank(session.user.role) < roleRank("content_manager")) {
    return new Response("Not authorised", { status: 403 });
  }

  const url = new URL(request.url);
  const get = (name: string) => url.searchParams.get(name) ?? undefined;

  const query = parseMemberQuery({
    search: get("search"),
    status: get("status"),
    gender: get("gender"),
    bloodGroup: get("bloodGroup"),
    state: get("state"),
    country: get("country"),
    donated: get("donated"),
    dobFrom: get("dobFrom"),
    dobTo: get("dobTo"),
    registeredFrom: get("registeredFrom"),
    registeredTo: get("registeredTo"),
  });

  const { rows, error } = await fetchAllMembers(query);

  if (error) {
    console.error("bulk id cards: member lookup failed:", error);
    return new Response("Could not load the member list.", { status: 500 });
  }

  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("contact_phone, contact_email")
    .limit(1)
    .maybeSingle();

  const result = await renderCardsZip(rows, {
    phone: settings?.contact_phone ?? null,
    email: settings?.contact_email ?? null,
  });

  if (!result.ok) {
    return new Response(result.reason, { status: 400 });
  }

  return new Response(new Uint8Array(result.zip), {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${result.fileName}"`,
      "cache-control": "no-store",
      "x-cards-rendered": String(result.rendered),
      "x-cards-total": String(result.total),
      "x-cards-limit": String(MAX_CARDS_PER_BATCH),
    },
  });
}