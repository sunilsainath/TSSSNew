import { NextResponse, type NextRequest } from "next/server";

import { getAdminSession, roleRank } from "@/lib/auth/session";
import { fetchAllMembers, parseMemberQuery, REGISTRATION_EXPORT_COLUMNS, toCsv } from "@/lib/data/members";
import { formatDateTime } from "@/lib/utils/format";

/** CSV export of registrations. Administrators only. */
export async function GET(request: NextRequest) {
  const session = await getAdminSession();

  if (!session || roleRank(session.user.role) < roleRank("content_manager")) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const query = parseMemberQuery({
    search: params.get("search") ?? undefined,
    status: params.get("status") ?? undefined,
  });

  const { rows } = await fetchAllMembers(query);

  const csv = toCsv(
    rows.map((row) => ({
      registration_number: row.registration_number,
      full_name: row.full_name,
      date_of_birth: row.date_of_birth,
      village: row.village ?? "",
      mobile_number: row.mobile_number,
      status: row.status,
      registered_at: formatDateTime(row.created_at as string),
    })),
    REGISTRATION_EXPORT_COLUMNS,
  );

  const filename = `tsss-registrations-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
    },
  });
}
