"use client";

import { useActionState, useState } from "react";

import { registerMember } from "@/lib/actions/public-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/state";
import { FieldError, FormMessage, Honeypot, SubmitButton } from "./form-controls";
import { RegistrationSuccess } from "./registration-success";
import { Input, Label, Select } from "@/components/ui/input";
import {
  BLOOD_GROUP_OPTIONS,
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  GENDER_OPTIONS,
  INDIAN_STATES,
  dialCodeFor,
} from "@/lib/lookups";

const INITIAL: FormState = INITIAL_FORM_STATE;

/** Full international number, assembled from the code and the local number. */
function formatInternational(dial: string, mobile: string): string {
  return `+${dial} ${mobile}`.trim();
}

export function RegisterForm({ registrationOpen }: { registrationOpen: boolean }) {
  const [state, formAction] = useActionState(registerMember, INITIAL);
  const errors = (state.errors ?? {}) as Record<string, string>;

  // Selecting a country switches the dialling code, which is displayed next to
  // the number rather than typed into it.
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const dialCode = dialCodeFor(countryCode);

  if (state.status === "success" && state.data) {
    return (
      <RegistrationSuccess
        data={{
          registrationNumber: String(state.data.registrationNumber ?? ""),
          fullName: String(state.data.fullName ?? ""),
          dateOfBirth: String(state.data.dateOfBirth ?? ""),
          village: String(state.data.village ?? ""),
          registeredAt: String(state.data.registeredAt ?? ""),
          idCardToken: String(state.data.idCardToken ?? ""),
        }}
      />
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Honeypot />
      <FormMessage state={state} />

      {/* Identity */}
      <fieldset className="space-y-5">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
          Who you are
        </legend>

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
            />
            <FieldError message={errors.fullName} />
          </div>

          <div>
            <Label htmlFor="fatherName" required>
              Father&apos;s Name
            </Label>
            <Input
              id="fatherName"
              name="fatherName"
              autoComplete="additional-name"
              placeholder="e.g. Venkata Reddy"
              required
              aria-invalid={Boolean(errors.fatherName)}
            />
            <FieldError message={errors.fatherName} />
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
            <Label htmlFor="gender" required>
              Gender
            </Label>
            <Select id="gender" name="gender" defaultValue="" required>
              <option value="" disabled>
                Select gender
              </option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.gender} />
          </div>

          <div>
            <Label htmlFor="bloodGroup" required>
              Blood Group
            </Label>
            <Select id="bloodGroup" name="bloodGroup" defaultValue="" required>
              <option value="" disabled>
                Select blood group
              </option>
              {BLOOD_GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.bloodGroup} />
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
        </div>
      </fieldset>

      {/* Location and contact */}
      <fieldset className="space-y-5">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
          Where you are and how to reach you
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="countryCode" required>
              Country
            </Label>
            <Select
              id="countryCode"
              name="countryCode"
              value={countryCode}
              onChange={(event) => setCountryCode(event.target.value)}
              required
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.countryCode} />
          </div>

          <div>
            <Label htmlFor="stateCode" required>
              State
            </Label>
            <Select id="stateCode" name="stateCode" defaultValue="TS" required>
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.stateCode} />
          </div>

          <div>
            <Label htmlFor="mobileNumber" required hint="10 digits">
              Mobile Number
            </Label>
            <div className="flex items-stretch gap-2">
              <span
                className="flex shrink-0 items-center rounded-2xl border border-brand-200 bg-slate-50 px-3.5 text-sm font-semibold text-ink-800"
                title="International dialling code for the selected country"
              >
                +{dialCode}
              </span>
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
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              Stored as {formatInternational(dialCode, "98765 43210")}
            </p>
            <FieldError message={errors.mobileNumber} />
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
        </div>

        <div>
          <Label htmlFor="profilePhoto" hint="Optional · JPG or PNG · max 4 MB">
            Photo
          </Label>
          <Input
            id="profilePhoto"
            name="profilePhoto"
            type="file"
            accept="image/jpeg,image/png"
            aria-invalid={Boolean(errors.profilePhoto)}
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Used on your ID card. A clear head-and-shoulders photograph works best.
          </p>
          <FieldError message={errors.profilePhoto} />
        </div>
      </fieldset>

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
          <li>• Your photograph, if you add one, appears on your downloadable ID card.</li>
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