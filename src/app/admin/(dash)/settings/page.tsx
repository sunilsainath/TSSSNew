import { AdminPageHeader, AdminSection } from "@/components/admin/admin-table";
import { ResourceForm } from "@/components/admin/resource-form";
import { TestNotificationButton } from "@/components/admin/test-notification-button";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { SiteSettingsRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const spec = ENTITY_SPECS.site_settings;
  const supabase = await createClient();

  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  const settings = (data ?? null) as SiteSettingsRow | null;

  return (
    <>
      <AdminPageHeader
        title="Organization & contact settings"
        description="These values drive the site name, contact details, social links and which public forms are open."
      />

      <AdminSection
        title="General"
        description={settings ? `Last updated ${formatDateTime(settings.updated_at)}` : undefined}
      >
        <ResourceForm
          entity="site_settings"
          fields={spec.fields}
          id={settings?.id}
          defaults={{
            organization_name: settings?.organization_name ?? "Srinivasula Seva Samstha",
            short_name: settings?.short_name ?? "TSSS",
            tagline: settings?.tagline ?? "",
            about_short: settings?.about_short ?? "",
            mission: settings?.mission ?? "",
            vision: settings?.vision ?? "",
            contact_email: settings?.contact_email ?? "",
            contact_phone: settings?.contact_phone ?? "",
            contact_address: settings?.contact_address ?? "",
            whatsapp_number: settings?.whatsapp_number ?? "",
            youtube_url: settings?.youtube_url ?? "",
            facebook_url: settings?.facebook_url ?? "",
            instagram_url: settings?.instagram_url ?? "",
            twitter_url: settings?.twitter_url ?? "",
            map_embed_url: settings?.map_embed_url ?? "",
            registration_open: settings ? String(settings.registration_open) : "true",
            blood_help_open: settings ? String(settings.blood_help_open) : "true",
            registration_paused_message: settings?.registration_paused_message ?? "",
            blood_help_paused_message: settings?.blood_help_paused_message ?? "",
            central_admin_email: settings?.central_admin_email ?? "",
            email_notifications_enabled: settings
              ? String(settings.email_notifications_enabled)
              : "true",
            whatsapp_notifications_enabled: settings
              ? String(settings.whatsapp_notifications_enabled)
              : "false",
          }}
          submitLabel="Save settings"
        />
      </AdminSection>

      <AdminSection title="Email & WhatsApp provider credentials">
        <p className="text-sm leading-relaxed text-slate-600">
          Provider API keys are environment variables and are never stored in the database or exposed to the browser.
          Set the following on the server (Vercel → Project → Settings → Environment Variables):
        </p>
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-ink-950 p-4 text-xs leading-relaxed text-emerald-200/90">
{`EMAIL_PROVIDER_API_KEY=…
EMAIL_FROM="Srinivasula Seva Samstha <no-reply@yourdomain.com>"
EMAIL_API_URL=https://api.resend.com/emails
WHATSAPP_PROVIDER_API_KEY=…
WHATSAPP_SENDER_NUMBER=919999999999
CENTRAL_ADMIN_EMAIL=central-admin@yourdomain.com
CENTRAL_ADMIN_WHATSAPP=919999999999`}
        </pre>
        <p className="mt-3 text-xs text-slate-500">
          Without these keys the notification layer runs in console mode: messages are logged on the server instead of
          being delivered. The provider can be swapped at any time without changing code.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <TestNotificationButton channel="email" />
          <TestNotificationButton channel="whatsapp" />
        </div>
      </AdminSection>
    </>
  );
}
