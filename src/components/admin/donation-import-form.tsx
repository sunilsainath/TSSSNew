"use client";

import { useActionState } from "react";

import {
  confirmDonationImport,
  previewDonationImport,
} from "@/lib/actions/blood-donation-actions";
import { FieldError, SubmitButton } from "@/components/forms/form-controls";
import { Input, Label, Select } from "@/components/ui/input";

type Camp = { id: string; name: string; camp_date: string | null };

/**
 * Two steps with nothing stored between them:
 * upload and validate first, review the preview, then confirm. Confirm
 * re-validates every row from scratch, so the preview cannot be tampered with.
 */
export function DonationImportForm({ camps, preselectedCamp }: { camps: Camp[]; preselectedCamp: string }) {
  const [previewState, previewAction] = useActionState(previewDonationImport, {
    preview: null,
    error: undefined,
  });
  const [confirmState, confirmAction] = useActionState(confirmDonationImport, {
    result: null,
    error: undefined,
  });

  const preview = previewState.preview;
  const result = confirmState.result;

  if (result) {
    return (
      <div role="status" className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="font-display text-lg font-semibold text-emerald-900">Import finished</h3>
          <p className="mt-2 text-sm leading-relaxed text-emerald-800">
            {result.imported} donation(s) recorded
            {result.skippedDuplicates > 0 ? `, ${result.skippedDuplicates} duplicate(s) skipped` : ""}
            {result.skippedErrors > 0 ? `, ${result.skippedErrors} row(s) skipped with errors` : ""}.
            The dashboard picks them up immediately.
          </p>
        </div>
        {result.errors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Problem</th>
                </tr>
              </thead>
              <tbody>
                {result.errors.map((entry, index) => (
                  <tr key={`${entry.line}-${index}`}>
                    <td className="font-mono text-xs">{entry.line}</td>
                    <td className="text-xs text-red-700">{entry.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <form action={previewAction} className="space-y-5">
        {previewState.error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {previewState.error}
          </p>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="importCamp" hint="Optional">
              Donation camp
            </Label>
            <Select id="importCamp" name="campId" defaultValue={preselectedCamp}>
              <option value="">No camp — standalone donations</option>
              {camps.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                  {camp.camp_date ? ` · ${camp.camp_date}` : ""}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label htmlFor="importFile" required hint="CSV · max 2 MB">
              Spreadsheet
            </Label>
            <Input id="importFile" name="file" type="file" accept=".csv,text/csv" required />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SubmitButton label="Validate file" pendingLabel="Reading…" />
          <p className="text-xs text-slate-500">
            Nothing is written yet. You review every row before confirming.
          </p>
        </div>
      </form>

      {preview ? (
        <form action={confirmAction} className="space-y-5 border-t border-brand-100 pt-6">
          <input type="hidden" name="campId" value={preview.campId ?? ""} />
          <input type="hidden" name="rows" value={JSON.stringify(preview.rows.map((entry) => entry.row))} />

          <h3 className="font-display text-lg font-semibold text-ink-900">Review before importing</h3>
          <p className="text-sm text-slate-600">
            {preview.valid} valid row(s)
            {preview.duplicates > 0 ? `, ${preview.duplicates} already recorded` : ""}
            {preview.errors > 0 ? `, ${preview.errors} with problems` : ""}
            {preview.campName ? ` for ${preview.campName}` : ""}. Only valid new rows are written;
            the rest are skipped and listed afterwards.
          </p>

          {confirmState.error ? (
            <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {confirmState.error}
            </p>
          ) : null}

          <div className="overflow-x-auto">
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Group</th>
                  <th>Units</th>
                  <th>Date</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((entry) => (
                  <tr key={entry.row.line}>
                    <td className="font-mono text-xs">{entry.row.line}</td>
                    <td className="text-xs font-medium">{entry.row.full_name || "—"}</td>
                    <td className="font-mono text-xs">{entry.row.mobile_number || "—"}</td>
                    <td className="text-xs">{entry.row.blood_group || "—"}</td>
                    <td className="text-xs">{entry.row.units || "1"}</td>
                    <td className="text-xs">{entry.row.donation_date || "—"}</td>
                    <td className="text-xs">
                      {entry.errors.length > 0 ? (
                        <span className="font-semibold text-red-700">{entry.errors.join(" ")}</span>
                      ) : entry.duplicate ? (
                        <span className="font-semibold text-amber-700">Already recorded</span>
                      ) : (
                        <span className="font-semibold text-emerald-700">Ready</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <FieldError message={undefined} />

          <SubmitButton
            label={`Import ${preview.valid} donation(s)`}
            pendingLabel="Importing…"
            disabled={preview.valid === 0}
          />
        </form>
      ) : null}
    </div>
  );
}