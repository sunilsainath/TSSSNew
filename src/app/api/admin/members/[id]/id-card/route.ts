import { getAdminSession, roleRank } from "@/lib/auth/session";
import { buildIdCardAssets, toIdCardMember } from "@/lib/idcard/assets";
import { idCardFileName, renderIdCardPng } from "@/lib/idcard/render-id-card";
import { createAdminClient } from "@/lib/supabase/server";

/** Streams one member's identity card as a PNG download. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) return new Response("Not authorised", { status: 403 });
  if (roleRank(session.user.role) < roleRank("content_manager")) {
    return new Response("Not authorised", { status: 403 });
  }

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });

  const supabase = createAdminClient();

  const { data: member, error } = await supabase
    .from("members")
    .select(
      "registration_number, full_name, father_name, designation, date_of_birth, gender, blood_group, mobile_number, phone_country_code, village, state_code, country_code, profile_photo_url",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("id card: member lookup failed:", error.message);
    return new Response("Could not load this member", { status: 500 });
  }

  if (!member) return new Response("Not found", { status: 404 });

  const { data: settings } = await supabase
    .from("site_settings")
    .select("contact_phone, central_admin_email, contact_email")
    .limit(1)
    .maybeSingle();

  const assets = await buildIdCardAssets(member.profile_photo_url, {
    phone: settings?.contact_phone ?? null,
    email: settings?.contact_email ?? null,
  });

  const idCardMember = toIdCardMember(member);
  const png = await renderIdCardPng(idCardMember, assets);

  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "content-disposition": `attachment; filename="${idCardFileName(idCardMember)}"`,
      "cache-control": "no-store",
    },
  });
}