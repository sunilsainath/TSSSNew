import "server-only";

import type { NotificationMessage, NotificationResult, NotificationSender } from "./types";

/**
 * Generic HTTP email sender.
 *
 * Works with any transactional email API that accepts a JSON payload. Set
 * EMAIL_PROVIDER_API_KEY (and optionally EMAIL_API_URL) to activate it; the
 * default provider logs the message instead of sending it.
 */
function httpEmailSender(apiUrl: string, apiKey: string, from: string): NotificationSender {
  return async (message: NotificationMessage): Promise<Omit<NotificationResult, "channel">> => {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: message.to,
          subject: message.subject,
          text: message.body,
        }),
        cache: "no-store",
      });

      if (!response.ok) {
        return {
          provider: "email:http",
          status: "failed",
          recipient: message.to,
          error: `Provider responded with ${response.status}`,
        };
      }

      return {
        provider: "email:http",
        status: "sent",
        recipient: message.to,
        providerResponse: await response.json().catch(() => null),
      };
    } catch (error) {
      return {
        provider: "email:http",
        status: "failed",
        recipient: message.to,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };
}

export function createEmailSender(): NotificationSender {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Srinivasula Seva Samstha <no-reply@example.com>";

  if (apiKey) {
    const apiUrl = process.env.EMAIL_API_URL ?? "https://api.resend.com/emails";
    return httpEmailSender(apiUrl, apiKey, from);
  }

  // Development default: log instead of sending.
  return async (message: NotificationMessage): Promise<Omit<NotificationResult, "channel">> => {
    console.info(
      `[email:console] to=${message.to}\nsubject=${message.subject ?? "-"}\n${message.body}`,
    );
    return { provider: "email:console", status: "sent", recipient: message.to };
  };
}
