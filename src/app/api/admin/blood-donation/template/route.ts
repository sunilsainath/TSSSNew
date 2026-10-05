import { getAdminSession, roleRank } from "@/lib/auth/session";
import { donationImportTemplate } from "@/lib/blood-donation/csv";

/** Downloads the CSV template for bulk donation imports. */
export async function GET() {
  const session = await getAdminSession();
  if (!session || roleRank(session.user.role) < roleRank("content_manager")) {
    return new Response("Not authorised", { status: 403 });
  }

  return new Response(donationImportTemplate(), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="tsss-donation-import-template.csv"',
      "cache-control": "no-store",
    },
  });
}