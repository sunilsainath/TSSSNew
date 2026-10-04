"use client";

import { useState } from "react";

type Status = { state: "idle" | "sending" | "sent" | "error"; message?: string };

export function TestNotificationButton({
  channel,
  defaultRecipient,
}: {
  channel: "email" | "whatsapp";
  defaultRecipient?: string;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function send() {
    setStatus({ state: "sending" });
    try {
      const response = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ channel, recipient: defaultRecipient }),
      });
      const result = (await response.json()) as { status?: string; provider?: string; error?: string };

      if (response.ok && result.status === "sent") {
        setStatus({ state: "sent", message: `Sent via ${result.provider}.` });
      } else {
        setStatus({ state: "error", message: result.error ?? "The notification could not be sent." });
      }
    } catch {
      setStatus({ state: "error", message: "Network error while sending the test notification." });
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-brand-100 bg-slate-50/70 p-4">
      <p className="text-sm font-semibold text-ink-900">Test {channel} delivery</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">
        Sends a sample blood help notification so you can confirm the provider credentials work.
      </p>
      <button
        type="button"
        onClick={send}
        disabled={status.state === "sending"}
        className="mt-3 rounded-full bg-ink-900 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
      >
        {status.state === "sending" ? "Sending…" : `Send test ${channel}`}
      </button>

      {status.message ? (
        <p
          role="status"
          className={`mt-3 text-xs leading-relaxed ${
            status.state === "sent" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {status.message}
        </p>
      ) : null}
    </div>
  );
}