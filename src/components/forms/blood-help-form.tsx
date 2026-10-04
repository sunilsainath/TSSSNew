"use client";

import { useActionState, useState } from "react";

import { submitBloodHelpRequest } from "@/lib/actions/public-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/state";
import { BLOOD_GROUPS } from "@/lib/constants";
import type { AreaRow, DistrictRow } from "@/lib/types";
import { FieldError, FormMessage, Honeypot, SubmitButton } from "./form-controls";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const INITIAL: FormState = INITIAL_FORM_STATE;

export function BloodHelpForm({
  districts,
  areas,
  bloodHelpOpen,
}: {
  districts: DistrictRow[];
  areas: AreaRow[];
  bloodHelpOpen: boolean;
}) {
  const [state, formAction] = useActionState(submitBloodHelpRequest, INITIAL);
  const errors = (state.errors ?? {}) as Record<string, string>;
  const [selection, setSelection] = useState({ districtId: "", areaId: "" });
  const { districtId, areaId } = selection;

  const areaOptions = areas.filter((area) => area.district_id === districtId);
  const selectedDistrict = districts.find((district) => district.id === districtId);
  const selectedArea = areas.find((area) => area.id === areaId);

  if (state.status === "success" && state.data?.requestNumber) {
    const unassigned = Boolean(state.data.unassigned);
    return (
      <div className="surface-card overflow-hidden">
        <div className="bg-ink-950 px-6 py-9 text-center text-white">
          <div className="aurora opacity-50" aria-hidden="true" />
          <div className="relative">
            <span
              className={`mx-auto grid size-14 place-items-center rounded-full ring-1 ${
                unassigned
                  ? "bg-amber-500/15 text-amber-300 ring-amber-400/30"
                  : "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30"
              }`}
            >
              <svg viewBox="0 0 20 20" className="size-7" fill="currentColor" aria-hidden="true">
                <path d="M10 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4Zm4 6.2-5 5.2a1 1 0 0 1-1.5 0L4.8 10.5a1 1 0 1 1 1.4-1.4l2 2 4.2-4.4a1 1 0 1 1 1.6 1.3Z" />
              </svg>
            </span>
            <h2 className="mt-4 text-2xl font-semibold">Request Submitted</h2>
            <p className="mt-2 text-sm text-white/65">
              Your reference number is{" "}
              <span className="font-mono font-semibold text-gold-200">
                {String(state.data.requestNumber)}
              </span>
            </p>
          </div>
        </div>
        <div className="p-6">
          <p role="status" className="text-sm leading-relaxed text-slate-700">
            {state.message}
          </p>
          <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
            <p className="font-semibold">If this is an emergency</p>
            <p className="mt-1">
              Please contact the nearest blood bank or hospital directly while our volunteer coordinates donors. Keep
              this reference number handy.
            </p>
          </div>
          <a
            href="/blood-help"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-brand-200 bg-white px-5 text-sm font-semibold text-ink-800 transition-colors hover:border-gold-400 hover:text-gold-700"
          >
            Submit another request
          </a>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      <Honeypot />
      {/* names for the notification body */}
      <input type="hidden" name="districtName" value={selectedDistrict?.name ?? ""} />
      <input type="hidden" name="areaName" value={selectedArea?.name ?? ""} />

      <FormMessage state={state} />

      {!bloodHelpOpen ? (
        <p role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          The online blood help form is temporarily unavailable. Please contact the administration by phone.
        </p>
      ) : null}

      <fieldset className="space-y-6" disabled={!bloodHelpOpen}>
        <legend className="sr-only">Blood help request details</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="requesterName" required>
              Requester Name
            </Label>
            <Input
              id="requesterName"
              name="requesterName"
              autoComplete="name"
              required
              placeholder="Person needing blood"
              aria-invalid={Boolean(errors.requesterName)}
            />
            <FieldError message={errors.requesterName} />
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
              required
              placeholder="98765 43210"
              aria-invalid={Boolean(errors.mobileNumber)}
            />
            <FieldError message={errors.mobileNumber} />
          </div>

          <div>
            <Label htmlFor="bloodGroup" required>
              Blood Group
            </Label>
            <Select id="bloodGroup" name="bloodGroup" required aria-invalid={Boolean(errors.bloodGroup)}>
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </Select>
            <FieldError message={errors.bloodGroup} />
          </div>

          <div>
            <Label htmlFor="unitsRequired" required>
              Units Required
            </Label>
            <Input
              id="unitsRequired"
              name="unitsRequired"
              type="number"
              min={1}
              max={50}
              defaultValue={1}
              required
              aria-invalid={Boolean(errors.unitsRequired)}
            />
            <FieldError message={errors.unitsRequired} />
          </div>
        </div>

        <div>
          <Label htmlFor="hospitalName" required>
            Hospital Name
          </Label>
          <Input
            id="hospitalName"
            name="hospitalName"
            required
            placeholder="e.g. Government General Hospital"
            aria-invalid={Boolean(errors.hospitalName)}
          />
          <FieldError message={errors.hospitalName} />
        </div>

        <div>
          <Label htmlFor="hospitalLocation" hint="Ward / street / landmark">
            Hospital Location
          </Label>
          <Input
            id="hospitalLocation"
            name="hospitalLocation"
            placeholder="e.g. Gandhi Nagar, near bus stop"
            aria-invalid={Boolean(errors.hospitalLocation)}
          />
          <FieldError message={errors.hospitalLocation} />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="districtId" required>
              District
            </Label>
            <Select
              id="districtId"
              name="districtId"
              required
              value={districtId}
              onChange={(event) =>
                setSelection({ districtId: event.target.value, areaId: "" })
              }
              aria-invalid={Boolean(errors.districtId)}
            >
              <option value="">Select district</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.districtId} />
            <p className="mt-1.5 text-xs text-slate-400">
              Your district routes the request to the right volunteer.
            </p>
          </div>

          <div>
            <Label htmlFor="areaId" hint="Optional">
              Area / Mandal / City
            </Label>
            <Select
              id="areaId"
              name="areaId"
              value={areaId}
              onChange={(event) =>
                setSelection((current) => ({ ...current, areaId: event.target.value }))
              }
              disabled={!districtId}
            >
              <option value="">{districtId ? "Select area" : "Select a district first"}</option>
              {areaOptions.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
            <FieldError message={errors.areaId} />
          </div>
        </div>

        <div>
          <Label htmlFor="requiredDate" hint="Today or later">
            Required Date
          </Label>
          <Input
            id="requiredDate"
            name="requiredDate"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            aria-invalid={Boolean(errors.requiredDate)}
          />
          <FieldError message={errors.requiredDate} />
        </div>

        <div>
          <Label htmlFor="message" hint="Patient relation, ward number, etc.">
            Message / Additional Information
          </Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            maxLength={1000}
            placeholder="e.g. Patient is my father, admitted in ward 302. Any group donor is helpful."
            aria-invalid={Boolean(errors.message)}
          />
          <FieldError message={errors.message} />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SubmitButton label="Submit Blood Help Request" pendingLabel="Submitting request…" />
          <p className="text-xs leading-relaxed text-slate-500">
            We share only the essential details with the volunteer assigned to your district. Please do not include
            unnecessary personal information.
          </p>
        </div>
      </fieldset>
    </form>
  );
}
