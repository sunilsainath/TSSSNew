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
    gender: params.get("gender") ?? undefined,
    bloodGroup: params.get("bloodGroup") ?? undefined,
    state: params.get("state") ?? undefined,
    country: params.get("country") ?? undefined,
    donated: params.get("donated") ?? undefined,
    dobFrom: params.get("dobFrom") ?? undefined,
    dobTo: params.get("dobTo") ?? undefined,
    registeredFrom: params.get("registeredFrom") ?? undefined,
    registeredTo: params.get("registeredTo") ?? undefined,
  });

  const { rows, error } = await fetchAllMembers(query);

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const csv = toCsv(
    rows.map((row) => ({
      registration_number: row.registration_number,
      full_name: row.full_name,
      father_name: row.father_name ?? "",
      date_of_birth: row.date_of_birth,
      gender: row.gender ?? "",
      blood_group: row.blood_group ?? "",
      village: row.village ?? "",
      state_code: row.state_code ?? "",
      country_code: row.country_code ?? "",
      mobile_number: row.mobile_number,
      email: row.email ?? "",
      designation: row.designation ?? "",
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
