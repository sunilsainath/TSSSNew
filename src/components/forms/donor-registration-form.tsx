"use client";

import { useActionState, useState } from "react";

import { registerDonor } from "@/lib/actions/public-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/state";
import { FieldError, FormMessage, Honeypot, SubmitButton } from "./form-controls";
import { Input, Label, Select } from "@/components/ui/input";
import {
  BLOOD_GROUP_OPTIONS,
  CONTACT_PREFERENCE_OPTIONS,
  COUNTRIES,
  DEFAULT_COUNTRY_CODE,
  GENDER_OPTIONS,
  INDIAN_STATES,
  dialCodeFor,
} from "@/lib/lookups";

const INITIAL: FormState = INITIAL_FORM_STATE;

/**
 * "Willing to donate" registration.
 *
 * Records intent only: no routing, no notifications, no emergency handling.
 * When a matching blood request arrives, an administrator calls the donor.
 */
export function DonorRegistrationForm() {
  const [state, formAction] = useActionState(registerDonor, INITIAL);
  const errors = (state.errors ?? {}) as Record<string, string>;

  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const dialCode = dialCodeFor(countryCode);

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-display text-lg font-semibold text-emerald-900">You are on the donor roll</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">{state.message}</p>
        <p className="mt-3 text-xs text-emerald-700">
          There is nothing more to do. Keep your phone reachable — a volunteer will call when your
          blood group is needed nearby.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Honeypot />
      <FormMessage state={state} />

      <fieldset className="space-y-5">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
          Who you are
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="donorName" required>
              Full Name
            </Label>
            <Input id="donorName" name="fullName" autoComplete="name" required maxLength={120} />
            <FieldError message={errors.fullName} />
          </div>

          <div>
            <Label htmlFor="donorFather" hint="Optional">
              Father&apos;s Name
            </Label>
            <Input id="donorFather" name="fatherName" maxLength={120} />
            <FieldError message={errors.fatherName} />
          </div>

          <div>
            <Label htmlFor="donorDob" hint="Optional">
              Date of Birth
            </Label>
            <Input
              id="donorDob"
              name="dateOfBirth"
              type="date"
              autoComplete="bday"
              max={new Date().toISOString().slice(0, 10)}
            />
            <FieldError message={errors.dateOfBirth} />
          </div>

          <div>
            <Label htmlFor="donorGender" hint="Optional">
              Gender
            </Label>
            <Select id="donorGender" name="gender" defaultValue="">
              <option value="">Prefer not to say</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.gender} />
          </div>

          <div>
            <Label htmlFor="donorBlood" required>
              Blood Group
            </Label>
            <Select id="donorBlood" name="bloodGroup" defaultValue="" required>
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
            <Label htmlFor="donorLastDonation" hint="Optional · DD/MM/YYYY">
              Last Donation Date
            </Label>
            <Input
              id="donorLastDonation"
              name="lastDonationDate"
              type="date"
              max={new Date().toISOString().slice(0, 10)}
            />
            <FieldError message={errors.lastDonationDate} />
          </div>
        </div>
      </fieldset>

      <fieldset className="space-y-5">
        <legend className="font-display text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
          Where you are and how to reach you
        </legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="donorCountry" required>
              Country
            </Label>
            <Select
              id="donorCountry"
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
            <Label htmlFor="donorState" hint="Optional">
              State
            </Label>
            <Select id="donorState" name="stateCode" defaultValue="TS">
              {INDIAN_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.stateCode} />
          </div>

          <div>
            <Label htmlFor="donorCity" hint="Optional">
              City / District
            </Label>
            <Input id="donorCity" name="city" autoComplete="address-level2" maxLength={120} />
            <FieldError message={errors.city} />
          </div>

          <div>
            <Label htmlFor="donorArea" hint="Optional">
              Area / Locality
            </Label>
            <Input id="donorArea" name="area" maxLength={120} placeholder="e.g. Sriramapuram" />
            <FieldError message={errors.area} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="donorAddress" hint="Optional">
              Address
            </Label>
            <Input id="donorAddress" name="address" autoComplete="street-address" maxLength={400} />
            <FieldError message={errors.address} />
          </div>

          <div>
            <Label htmlFor="donorMobile" required hint="10 digits">
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
                id="donorMobile"
                name="mobileNumber"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                pattern="[0-9 +()-]{10,15}"
                required
              />
            </div>
            <FieldError message={errors.mobileNumber} />
          </div>

          <div>
            <Label htmlFor="donorEmail" hint="Optional">
              Email Address
            </Label>
            <Input id="donorEmail" name="email" type="email" autoComplete="email" maxLength={160} />
            <FieldError message={errors.email} />
          </div>

          <div>
            <Label htmlFor="donorContact" hint="How should we call you?">
              Preferred Contact
            </Label>
            <Select id="donorContact" name="preferredContact" defaultValue="phone">
              {CONTACT_PREFERENCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <FieldError message={errors.preferredContact} />
          </div>

          <div>
            <Label htmlFor="donorAvailability" hint="Optional · e.g. weekends, evenings">
              Availability
            </Label>
            <Input id="donorAvailability" name="availability" maxLength={200} />
            <FieldError message={errors.availability} />
          </div>
        </div>
      </fieldset>

      <div className="rounded-2xl border border-brand-100 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-600">
        <p className="font-semibold text-ink-800">What happens next</p>
        <ul className="mt-2 space-y-1.5">
          <li>• Your details join the donor roll. Nothing else happens until you are needed.</li>
          <li>• When a matching request arrives, a volunteer calls you — never an automated message.</li>
          <li>• You can ask to be removed at any time by contacting the trust.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton label="I am willing to donate" pendingLabel="Recording…" />
        <p className="text-xs text-slate-500">
          Donating blood is voluntary and free. A doctor checks you are fit before every donation.
        </p>
      </div>
    </form>
  );
}