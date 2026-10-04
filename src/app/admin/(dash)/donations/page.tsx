import { AdminPageHeader, AdminSection } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { DonationSettingsRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DonationsAdminPage() {
  const spec = ENTITY_SPECS.donation_settings;
  const supabase = await createClient();

  const { data } = await supabase.from("donation_settings").select("*").limit(1).maybeSingle();
  const settings = (data ?? null) as DonationSettingsRow | null;

  return (
    <>
      <AdminPageHeader
        title="Donation information"
        description="Bank, UPI and QR details shown on the public Donations page. The website never collects payments."
      />

      <AdminSection
        title={settings ? "Current details" : "Donation details"}
        description={
          settings
            ? `Last updated ${formatDateTime(settings.updated_at)}`
            : "Add your trust's bank and UPI details."
        }
      >
        <ResourceForm
          entity="donation_settings"
          fields={spec.fields}
          id={settings?.id}
          defaults={{
            account_name: settings?.account_name ?? "",
            bank_name: settings?.bank_name ?? "",
            account_number: settings?.account_number ?? "",
            ifsc: settings?.ifsc ?? "",
            branch: settings?.branch ?? "",
            upi_id: settings?.upi_id ?? "",
            qr_code_url: settings?.qr_code_url ?? "",
            instructions: settings?.instructions ?? "",
            transparency_note: settings?.transparency_note ?? "",
            is_donation_open: settings ? String(settings.is_donation_open) : "true",
          }}
          submitLabel="Save donation details"
        />
      </AdminSection>

      <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
        Donations on this website are always voluntary. Keep the transparency note explaining that there is no
        mandatory fee for registration, events or blood assistance.
      </p>
    </>
  );
}
