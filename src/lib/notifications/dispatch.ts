import "server-only";

import { notify } from "@/lib/notifications";
import {
  buildEmailBody,
  buildEmailSubject,
  buildWhatsAppBody,
  type BloodHelpDetails,
} from "@/lib/notifications/templates";
import { createAdminClient } from "@/lib/supabase/server";

type DispatchInput = BloodHelpDetails & {
  requestId: string;
  isUnassigned: boolean;
  assignedAdminEmail: string | null;
  assignedAdminWhatsapp: string | null;
};

export type DispatchOutcome = {
  delivered: boolean;
  results: Array<{ channel: "email" | "whatsapp"; status: string; error?: string }>;
};

/**
 * Notifies the responsible administrator (or the central team when the
 * district/area has no administrator) and records the outcome in
 * notification_logs so the dashboard can show delivery status.
 */
export async function dispatchBloodHelpNotifications(input: DispatchInput): Promise<DispatchOutcome> {
  // Notification logs are system records written on behalf of an anonymous
  // visitor, so they use the service-role client (RLS would reject them).
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("email_notifications_enabled, whatsapp_notifications_enabled, central_admin_email")
    .limit(1)
    .maybeSingle();

  const emailEnabled = settings?.email_notifications_enabled ?? true;
  const whatsappEnabled = settings?.whatsapp_notifications_enabled ?? true;

  const details: BloodHelpDetails = {
    requestNumber: input.requestNumber,
    requesterName: input.requesterName,
    mobileNumber: input.mobileNumber,
    bloodGroup: input.bloodGroup,
    hospitalName: input.hospitalName,
    hospitalLocation: input.hospitalLocation,
    requiredDate: input.requiredDate,
    unitsRequired: input.unitsRequired,
    message: input.message,
    districtName: input.districtName,
    areaName: input.areaName,
  };

  const emailTo = input.isUnassigned
    ? (process.env.CENTRAL_ADMIN_EMAIL || settings?.central_admin_email || null)
    : input.assignedAdminEmail;

  const whatsappTo = input.isUnassigned
    ? (process.env.CENTRAL_ADMIN_WHATSAPP || null)
    : input.assignedAdminWhatsapp;

  const results: DispatchOutcome["results"] = [];

  if (emailEnabled && emailTo) {
    const outcome = await notify("email", {
      to: emailTo,
      subject: buildEmailSubject(details, input.isUnassigned),
      body: buildEmailBody(details, input.isUnassigned),
    });

    results.push({ channel: "email", status: outcome.status, error: outcome.error });
    await recordNotification(supabase, {
      requestId: input.requestId,
      channel: "email",
      recipient: emailTo,
      subject: buildEmailSubject(details, input.isUnassigned),
      body: buildEmailBody(details, input.isUnassigned),
      status: outcome.status,
      provider: outcome.provider,
      error: outcome.error,
      providerResponse: outcome.providerResponse,
    });
  } else if (!emailEnabled) {
    results.push({ channel: "email", status: "skipped" });
    await recordNotification(supabase, {
      requestId: input.requestId,
      channel: "email",
      recipient: emailTo ?? "not configured",
      subject: buildEmailSubject(details, input.isUnassigned),
      body: null,
      status: "skipped",
      provider: "disabled",
      error: "Email notifications are disabled in settings",
    });
  }

  if (whatsappEnabled && whatsappTo) {
    const body = buildWhatsAppBody(details, input.isUnassigned);
    const outcome = await notify("whatsapp", { to: whatsappTo, body });

    results.push({ channel: "whatsapp", status: outcome.status, error: outcome.error });
    await recordNotification(supabase, {
      requestId: input.requestId,
      channel: "whatsapp",
      recipient: whatsappTo,
      subject: null,
      body,
      status: outcome.status,
      provider: outcome.provider,
      error: outcome.error,
      providerResponse: outcome.providerResponse,
    });
  }

  const delivered = results.some((result) => result.status === "sent");
  return { delivered, results };
}

type LogInput = {
  requestId: string;
  channel: "email" | "whatsapp";
  recipient: string;
  subject: string | null;
  body: string | null;
  status: string;
  provider: string;
  error?: string;
  providerResponse?: unknown;
};

type NotificationLogger = {
  from: (
    table: "notification_logs",
  ) => {
    insert: (values: Record<string, unknown>) => PromiseLike<{ error: { message: string } | null }>;
  };
};

async function recordNotification(supabase: NotificationLogger, input: LogInput) {
  const { error } = await supabase
    .from("notification_logs")
    .insert({
      blood_request_id: input.requestId,
      notification_type: input.channel,
      provider: input.provider,
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      status: input.status === "sent" ? "sent" : input.status === "skipped" ? "skipped" : "failed",
      error_message: input.error ?? null,
      provider_response: input.providerResponse ?? null,
      sent_at: input.status === "sent" ? new Date().toISOString() : null,
    });

  if (error) console.error("notification log insert failed:", error.message);
}
