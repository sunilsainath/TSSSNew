"use client";

import { useActionState } from "react";

import { registerMember } from "@/lib/actions/public-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/state";
import { FieldError, FormMessage, Honeypot, SubmitButton } from "./form-controls";
import { RegistrationSuccess } from "./registration-success";
import { Input, Label } from "@/components/ui/input";

const INITIAL: FormState = INITIAL_FORM_STATE;

export function RegisterForm({ registrationOpen }: { registrationOpen: boolean }) {
  const [state, formAction] = useActionState(registerMember, INITIAL);
  const errors = (state.errors ?? {}) as Record<string, string>;

  if (state.status === "success" && state.data) {
    return (
      <RegistrationSuccess
        data={{
          registrationNumber: String(state.data.registrationNumber ?? ""),
          fullName: String(state.data.fullName ?? ""),
          dateOfBirth: String(state.data.dateOfBirth ?? ""),
          village: String(state.data.village ?? ""),
          registeredAt: String(state.data.registeredAt ?? ""),
        }}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Honeypot />
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="fullName" required>
            Full Name
          </Label>
          <Input
            id="fullName"
            name="fullName"
            autoComplete="name"
            placeholder="e.g. Srinivasa Reddy"
            required
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
          />
          <span id="fullName-error">
            <FieldError message={errors.fullName} />
          </span>
        </div>

        <div>
          <Label htmlFor="dateOfBirth" required>
            Date of Birth
          </Label>
          <Input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            required
            aria-invalid={Boolean(errors.dateOfBirth)}
          />
          <FieldError message={errors.dateOfBirth} />
        </div>

        <div>
          <Label htmlFor="village" required>
            Village
          </Label>
          <Input
            id="village"
            name="village"
            autoComplete="address-level2"
            placeholder="e.g. Sriramapuram"
            required
            aria-invalid={Boolean(errors.village)}
          />
          <FieldError message={errors.village} />
        </div>

        <div>
          <Label htmlFor="mobileNumber" required hint="10 digits">
            Mobile Number
          </Label>
          <Input
            id="mobileNumber"
            name="mobileNumber"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            pattern="[0-9 +()-]{10,15}"
            required
            aria-invalid={Boolean(errors.mobileNumber)}
          />
          <FieldError message={errors.mobileNumber} />
        </div>
      </div>

      <div>
        <Label htmlFor="email" hint="For event updates">
          Email Address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
        />
        <FieldError message={errors.email} />
      </div>

      <div className="rounded-2xl border border-brand-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600">
        <p className="font-semibold text-ink-800">Before you submit</p>
        <ul className="mt-2 space-y-1.5">
          <li>• Registration is completely free. There is no mandatory fee or donation.</li>
          <li>
            • We check for an existing registration using your{" "}
            <span className="font-semibold text-ink-800">name and date of birth</span>, so please enter your details
            exactly as they should appear on record.
          </li>
          <li>• You will receive a unique registration number such as TSSS000123.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton
          label="Submit Registration"
          pendingLabel="Checking records…"
          disabled={!registrationOpen}
          className={
            registrationOpen
              ? undefined
              : "inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-full border border-brand-200 bg-slate-100 px-8 text-sm font-semibold text-slate-500 sm:w-auto"
          }
        />
        <p className="text-xs text-slate-500">
          By registering you consent to the trust contacting you about programmes and emergency blood requests.
        </p>
      </div>
    </form>
  );
}
