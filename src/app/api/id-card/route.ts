import { buildIdCardAssets, toIdCardMember } from "@/lib/idcard/assets";
import { idCardFileName, renderIdCardPng } from "@/lib/idcard/render-id-card";
import { verifyIdCardToken } from "@/lib/idcard/signed-link";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Serves a member's own identity card after registration.
 *
 * There is no member account, so access is proved by the signed token issued on
 * the success screen. The token authorises one registration number for one
 * hour and is invalidated if the mobile number changes.
 *
 * The row is read with the service-role client because the visitor's own session
 * cannot see `members` at all - which is the point: Row Level Security keeps
 * member data private from the public. The signature is the authorisation, and
 * nothing is returned unless it matches.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const number = url.searchParams.get("number");
  const token = url.searchParams.get("token");

  if (!number || !token) {
    return new Response("This link is incomplete.", { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: member, error } = await supabase
    .from("members")
    .select(
      "registration_number, full_name, father_name, designation, date_of_birth, gender, blood_group, mobile_number, phone_country_code, village, state_code, country_code, profile_photo_url",
    )
    .eq("registration_number", number)
    .maybeSingle();

  if (error) {
    console.error("id card: member lookup failed:", error.message);
    return new Response("We could not load your card. Please try again.", { status: 500 });
  }

  if (!member) {
    return new Response("We could not find that registration.", { status: 404 });
  }

  if (
    !verifyIdCardToken(token, {
      registrationNumber: member.registration_number,
      mobileNumber: member.mobile_number,
    })
  ) {
    return new Response("This link has expired. Please register again for a new one.", { status: 403 });
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select("contact_phone, contact_email")
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