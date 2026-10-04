import "server-only";

import type { NotificationMessage, NotificationResult, NotificationSender } from "./types";

/**
 * WhatsApp sender.
 *
 * Uses a generic Cloud WhatsApp / WhatsApp Business Cloud API compatible
 * payload. Configure WHATSAPP_PROVIDER_API_KEY and WHATSAPP_SENDER_NUMBER to
 * activate real delivery; otherwise messages are logged.
 */
function apiSender(apiKey: string, senderNumber: string): NotificationSender {
  return async (message: NotificationMessage): Promise<Omit<NotificationResult, "channel">> => {
    try {
      const endpoint =
        process.env.WHATSAPP_API_URL ??
        `https://graph.facebook.com/v21.0/${senderNumber}/messages`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: message.to.replace(/\D/g, ""),
          type: "text",
          text: { body: message.body, preview_url: false },
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          provider: "whatsapp:cloud-api",
          status: "failed",
          recipient: message.to,
          error: `Provider responded with ${response.status}`,
        };
      }

      return {
        provider: "whatsapp:cloud-api",
        status: "sent",
        recipient: message.to,
        providerResponse: await response.json().catch(() => null),
      };
    } catch (error) {
      return {
        provider: "whatsapp:cloud-api",
        status: "failed",
        recipient: message.to,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}

export function createWhatsAppSender(): NotificationSender {
  const apiKey = process.env.WHATSAPP_PROVIDER_API_KEY;
  const senderNumber = process.env.WHATSAPP_SENDER_NUMBER;

  if (apiKey && senderNumber) {
    return apiSender(apiKey, senderNumber);
  }

  return async (message: NotificationMessage): Promise<Omit<NotificationResult, "channel">> => {
    console.info(`[whatsapp:console] to=${message.to}\n${message.body}`);
    return { provider: "whatsapp:console", status: "sent", recipient: message.to };
  };
}
