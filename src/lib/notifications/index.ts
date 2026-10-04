import "server-only";

import { createEmailSender } from "./email";
import { createWhatsAppSender } from "./whatsapp";
import type { NotificationChannel, NotificationMessage, NotificationSender } from "./types";

let emailSender: NotificationSender | null = null;
let whatsappSender: NotificationSender | null = null;

export function getSender(channel: NotificationChannel): NotificationSender {
  if (channel === "email") {
    emailSender ??= createEmailSender();
    return emailSender;
  }
  whatsappSender ??= createWhatsAppSender();
  return whatsappSender;
}

/** Sends through the configured provider and always returns a result object. */
export async function notify(
  channel: NotificationChannel,
  message: NotificationMessage,
): Promise<{
  status: "sent" | "failed" | "skipped";
  provider: string;
  error?: string;
  providerResponse?: unknown;
}> {
  if (!message.to) {
    return { status: "skipped", provider: channel, error: "No recipient configured" };
  }

  try {
    const sender = getSender(channel);
    const result = await sender(message);
    return {
      status: result.status,
      provider: result.provider,
      error: result.error,
      providerResponse: result.providerResponse,
    };
  } catch (error) {
    return {
      status: "failed",
      provider: channel,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
