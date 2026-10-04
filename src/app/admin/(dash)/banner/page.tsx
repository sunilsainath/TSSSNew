import Link from "next/link";

import { AdminPageHeader, AdminSection, StatusBadge } from "@/components/admin/admin-table";
import { AdminDeleteButton, AdminQuickButton } from "@/components/admin/admin-actions-buttons";
import { ResourceForm } from "@/components/admin/resource-form";
import { ENTITY_SPECS } from "@/lib/admin/entities";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import type { SiteBannerRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BannerAdminPage() {
  const spec = ENTITY_SPECS.banner;
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_banners")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const banner = (data ?? null) as SiteBannerRow | null;

  return (
    <>
      <AdminPageHeader
        title="Website banner"
        description="The banner appears at the top of every page. It is shown only while enabled and inside the optional date window."
      />

      {banner ? (
        <AdminSection title="Current banner status">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge
              value={banner.is_enabled ? "enabled" : "disabled"}
              tone={banner.is_enabled ? "green" : "slate"}
            />
            <p className="text-sm text-slate-600">
              {banner.is_enabled
                ? "Visible on the website right now."
                : "Hidden from visitors."}
              {banner.start_date || banner.end_date ? (
                <>
                  {" "}
                  Window: {banner.start_date ? formatDateTime(banner.start_date) : "always"} →{" "}
                  {banner.end_date ? formatDateTime(banner.end_date) : "always"}.
                </>
              ) : null}
            </p>
            <QuickBannerToggle id={banner.id} enabled={banner.is_enabled} />
            <AdminDeleteButton entity="banner" id={banner.id} confirmText="Delete this banner?" />
          </div>
          <p className="mt-3 rounded-2xl bg-brand-50 p-4 text-sm text-slate-700">{banner.message}</p>
        </AdminSection>
      ) : null}

      <AdminSection title={banner ? "Edit banner" : "Create banner"}>        <ResourceForm
          entity="banner"
          fields={spec.fields}
          id={banner?.id}
          defaults={{
            message: banner?.message ?? "",
            banner_type: banner?.banner_type ?? "info",
            link_url: banner?.link_url ?? "",
            link_label: banner?.link_label ?? "",
            is_enabled: banner ? String(banner.is_enabled) : "false",
            start_date: banner?.start_date ? banner.start_date.slice(0, 16) : "",
            end_date: banner?.end_date ? banner.end_date.slice(0, 16) : "",
          }}
          submitLabel={banner ? "Update banner" : "Create banner"}
        />
      </AdminSection>

      <p className="text-xs text-slate-400">
        Only one banner is used at a time. Saving creates or updates the single banner record.{" "}
        <Link href="/" className="font-semibold text-gold-700">
          View the site
        </Link>
      </p>
    </>
  );
}

function QuickBannerToggle({ id, enabled }: { id: string; enabled: boolean }) {
  return (
    <AdminQuickButton
      entity="banner"
      id={id}
      action="toggle-published"
      value={!enabled}
      label={enabled ? "Disable banner" : "Enable banner"}
      className="rounded-full bg-ink-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink-800"
    />
  );
}
