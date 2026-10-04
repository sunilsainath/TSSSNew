/**
 * Notification layer.
 *
 * Providers are resolved at runtime from environment variables so the email or
 * WhatsApp vendor can be swapped without touching feature code. Never import
 * provider credentials into client components.
 */

export type NotificationChannel = "email" | "whatsapp";

export type NotificationMessage = {
  to: string;
  subject?: string;
  body: string;
  /** WhatsApp only. */
  template?: string;
  variables?: Record<string, string>;
};

export type NotificationResult = {
  channel: NotificationChannel;
  provider: string;
  status: "sent" | "failed" | "skipped";
  recipient: string;
  error?: string;
  providerResponse?: unknown;
};

export interface NotificationProvider {
  readonly name: NotificationChannel;
  send(message: NotificationMessage): Promise<Omit<NotificationResult, "channel">>;
}

export type NotificationSender = (
  message: NotificationMessage,
) => Promise<Omit<NotificationResult, "channel">>;
