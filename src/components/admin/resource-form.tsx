"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { adminSaveAction } from "@/lib/actions/admin-actions";
import { INITIAL_ADMIN_STATE } from "@/lib/actions/state";
import type { EntityKey, FieldSpec } from "@/lib/admin/entities";
import { FormMessage } from "@/components/forms/form-controls";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

type Props = {
  entity: EntityKey;
  fields: FieldSpec[];
  id?: string;
  defaults?: Record<string, unknown>;
  submitLabel?: string;
  /** Redirect after a successful create. */
  redirectTo?: string;
};

export function ResourceForm({
  entity,
  fields,
  id,
  defaults = {},
  submitLabel = "Save",
  redirectTo,
}: Props) {
  const [state, formAction] = useActionState(adminSaveAction, INITIAL_ADMIN_STATE);
  const router = useRouter();
  const previousStatus = useRef(state.status);

  useEffect(() => {
    if (state.status === "success" && previousStatus.current !== "success") {
      if (!id && redirectTo) {
        router.push(redirectTo);
        router.refresh();
      }
    }
    previousStatus.current = state.status;
  }, [state.status, id, redirectTo, router]);

  const errors = (state.errors ?? {}) as Record<string, string>;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <input type="hidden" name="__entity" value={entity} />
      {id ? <input type="hidden" name="__id" value={id} /> : null}
      <input type="hidden" name="__intent" value="save" />

      <FormMessage state={state as never} />

      <div className="grid gap-5 md:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.name}
            field={field}
            defaultValue={defaults[field.name]}
            error={errors[field.name]}
          />
        ))}
      </div>

      <SaveButton label={submitLabel} />
    </form>
  );
}

function Field({
  field,
  defaultValue,
  error,
}: {
  field: FieldSpec;
  defaultValue: unknown;
  error?: string;
}) {
  const span = field.colSpan === 2 ? "md:col-span-2" : "";
  const value = defaultValue === null || defaultValue === undefined ? "" : String(defaultValue);

  if (field.type === "checkbox") {
    return (
      <div className={span}>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-brand-200 bg-white p-3.5">
          <input
            type="checkbox"
            name={field.name}
            defaultChecked={value === "true" || value === "1"}
            className="mt-0.5 size-4.5 rounded border-ink-300 accent-gold-500"
          />
          <span>
            <span className="block text-sm font-medium text-ink-800">{field.label}</span>
            {field.hint ? (
              <span className="mt-0.5 block text-xs text-slate-500">{field.hint}</span>
            ) : null}
          </span>
        </label>
      </div>
    );
  }

  if (field.type === "image") {
    return (
      <div className={span}>
        <Label htmlFor={field.name} required={field.required}>
          {field.label}
        </Label>
        {value ? (
          <p className="mb-2 truncate rounded-lg bg-brand-50 px-3 py-2 font-mono text-xs text-slate-600">
            Current: {value}
          </p>
        ) : null}
        <Input
          id={field.name}
          name={`${field.name}File`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
        />
        <input type="hidden" name={field.name} defaultValue={value} />
        {field.hint ? <p className="mt-1.5 text-xs text-slate-500">{field.hint}</p> : null}
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className={span}>
        <Label htmlFor={field.name} required={field.required} hint={field.hint}>
          {field.label}
        </Label>
        <Textarea
          id={field.name}
          name={field.name}
          rows={field.rows ?? 4}
          defaultValue={value}
          placeholder={field.placeholder}
          required={field.required}
        />
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={span}>
        <Label htmlFor={field.name} required={field.required} hint={field.hint}>
          {field.label}
        </Label>
        <Select id={field.name} name={field.name} defaultValue={value} required={field.required}>
          <option value="">{field.placeholder ?? `Select ${field.label.toLowerCase()}`}</option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  const inputType =
    field.type === "number"
      ? "number"
      : field.type === "date"
        ? "date"
        : field.type === "email"
          ? "email"
          : field.type === "tel"
            ? "tel"
            : field.type === "url"
              ? "url"
              : field.type === "password"
                ? "password"
                : "text";

  return (
    <div className={span}>
      <Label htmlFor={field.name} required={field.required} hint={field.hint}>
        {field.label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        type={inputType}
        defaultValue={value}
        placeholder={"placeholder" in field ? field.placeholder : undefined}
        required={field.required}
        min={field.type === "number" ? field.min : undefined}
        max={field.type === "number" ? field.max : undefined}
        step={field.type === "number" ? (field.step ?? "1") : undefined}
      />
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
        ) : null}
    </div>
  );
}

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ink-900 px-6 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
