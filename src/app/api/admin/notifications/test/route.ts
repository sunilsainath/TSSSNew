import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession, roleRank } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";
import {
  buildEmailBody,
  buildEmailSubject,
  buildWhatsAppBody,
} from "@/lib/notifications/templates";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils/format";

/**
 * Sends a test email/WhatsApp message so administrators can confirm that the
 * provider credentials are configured correctly.
 * Super Admin only.
 */
export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session || roleRank(session.user.role) < roleRank("super_admin")) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  let payload: { channel?: string; recipient?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const channel = payload.channel === "whatsapp" ? "whatsapp" : "email";
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("central_admin_email, whatsapp_number, email_notifications_enabled, whatsapp_notifications_enabled")
    .limit(1)
    .maybeSingle();

  const recipient =
    payload.recipient?.trim() ||
    (channel === "email"
      ? (settings?.central_admin_email ?? process.env.CENTRAL_ADMIN_EMAIL ?? "")
      : (process.env.CENTRAL_ADMIN_WHATSAPP ?? ""));

  if (!recipient) {
    return NextResponse.json(
      { error: `No ${channel} recipient configured. Add one in Settings first.` },
      { status: 400 },
    );
  }

  const details = {
    requestNumber: "BH999999",
    requesterName: "Test Requester",
    mobileNumber: "9876543210",
    bloodGroup: "O+",
    hospitalName: "TSSS Test Hospital",
    hospitalLocation: "Test Location",
    requiredDate: new Date().toISOString().slice(0, 10),
    unitsRequired: 2,
    message: "This is a test notification from the TSSS admin panel.",
    districtName: "Test District",
    areaName: "Test Area",
  };

  const outcome = await notify(channel, {
    to: recipient,
    subject: channel === "email" ? buildEmailSubject(details, false) : undefined,
    body:
      channel === "email"
        ? `${buildEmailBody(details, false)}\n\nSent: ${formatDate(new Date().toISOString())}`
        : buildWhatsAppBody(details, false),
  });

  return NextResponse.json({ channel, recipient, ...outcome }, { status: outcome.status === "failed" ? 502 : 200 });
}