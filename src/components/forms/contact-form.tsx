"use client";

import { useState, type FormEvent } from "react";

import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Spinner, SubmitButton } from "./form-controls";
import { CONTACT_FORM_ENDPOINT, CONTACT_FORM_REDIRECT, SITE_NAME } from "@/lib/constants";

const SUBJECTS = [
  "Registration help",
  "Donation or receipt",
  "Blood assistance",
  "Volunteering",
  "Event or programme",
  "Feedback or complaint",
  "Something else",
] as const;

type Status = "idle" | "sending" | "success" | "error";

/**
 * Posts to FormSubmit's AJAX endpoint, so the message is delivered by email
 * without a server action, database row or API key. The first submission from a
 * new address has to be confirmed from the activation mail FormSubmit sends,
 * otherwise it silently drops every message.
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const payload = new FormData(form);

    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(payload.entries())),
      });

      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setStatus("error");
        setMessage(
          result?.message ??
            "We could not send your message. Please email us directly or try again shortly.",
        );
        return;
      }

      form.reset();
      setStatus("success");
      setMessage(
        result?.message ?? "Thank you. Your message has reached the trust administration.",
      );
    } catch {
      setStatus("error");
      setMessage(
        "We could not reach the mail service. Please check your connection and try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-display text-lg font-semibold text-emerald-900">Message sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">{message}</p>
        <button
          type="button"
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
          className="mt-4 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-600"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form
      action={CONTACT_FORM_ENDPOINT}
      method="POST"
      onSubmit={handleSubmit}
      className="space-y-5"
      noValidate
    >
      {/* FormSubmit configuration */}
      <input type="hidden" name="_subject" value={`New enquiry from the ${SITE_NAME} website`} />
      <input type="hidden" name="_template" value="table" />
      <input type="hidden" name="_captcha" value="false" />
      <input type="hidden" name="_next" value={CONTACT_FORM_REDIRECT} />
      <input type="hidden" name="_honey" value="" />

      {status === "error" ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contactName" required>
            Full Name
          </Label>
          <Input id="contactName" name="contactName" autoComplete="name" required maxLength={100} />
        </div>
        <div>
          <Label htmlFor="contactEmail" required>
            Email
          </Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="contactMobile" hint="Optional">
            Mobile Number
          </Label>
          <Input
            id="contactMobile"
            name="contactMobile"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            maxLength={20}
          />
        </div>
        <div>
          <Label htmlFor="contactSubject" required>
            What is this about?
          </Label>
          <Select id="contactSubject" name="contactSubject" defaultValue={SUBJECTS[0]} required>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="contactMessage" required hint="Minimum 20 characters">
          Message
        </Label>
        <Textarea
          id="contactMessage"
          name="contactMessage"
          rows={6}
          required
          minLength={20}
          maxLength={4000}
          placeholder="Tell us how we can help. Please do not include bank account or card details."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton label="Send message" pendingLabel="Sending…" disabled={status === "sending"} />
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          {status === "sending" ? <Spinner className="size-3.5" /> : null}
          We reply to email only. Emergency blood requests should use the blood help form.
        </p>
      </div>
    </form>
  );
}