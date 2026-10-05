import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-table";
import { DonationImportForm } from "@/components/admin/donation-import-form";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Bulk import for camp and historical donations: upload a CSV, review every
 * row, then confirm. Duplicates are recognised by the per-camp reference, so
 * re-uploading the same file never double counts.
 */
export default async function DonationImportPage({
  searchParams,
}: {
  searchParams: Promise<{ camp?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data } = await supabase
    .from("donation_camps")
    .select("id, name, camp_date")
    .order("camp_date", { ascending: false })
    .limit(100);

  const camps = (data ?? []) as Array<{ id: string; name: string; camp_date: string | null }>;
  const preselected = params.camp ?? "";

  return (
    <>
      <AdminPageHeader
        title="Import donations"
        description="Record a whole camp at once. Upload the file, check every row, then confirm."
        action={
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/blood-donation/template"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
              download
            >
              Download template
            </a>
            <Link
              href="/admin/blood-donation/camps"
              className="inline-flex h-11 items-center justify-center rounded-full border border-brand-200 px-5 text-sm font-semibold text-ink-700 hover:border-gold-400"
            >
              Back to camps
            </Link>
          </div>
        }
      />

      <div className="surface-card p-6">
        <DonationImportForm camps={camps} preselectedCamp={preselected} />
      </div>

      <div className="surface-card mt-6 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Preparing the file</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-slate-600">
          <li>Start from the template so the columns match. Keep its first row exactly.</li>
          <li>
            Working in Excel? Use <em>Save As → CSV</em> when you are done. The importer reads CSV
            only.
          </li>
          <li>
            Give every row its own reference (the last column) so a second upload of the same
            file is recognised as a duplicate instead of new donations.
          </li>
          <li>Dates are YYYY-MM-DD. Blood groups are O+ O- A+ A- B+ B- AB+ AB-.</li>
        </ul>
      </div>
    </>
  );
}