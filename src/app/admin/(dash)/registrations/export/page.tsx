import { AdminPageHeader } from "@/components/admin/admin-table";
import { fetchAllMembers, parseMemberQuery, REGISTRATION_EXPORT_COLUMNS, toCsv } from "@/lib/data/members";
import { formatDateTime } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

/** Streams a CSV download of the registration list (server-side only). */
export default async function ExportRegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    status?: string;
    gender?: string;
    bloodGroup?: string;
    state?: string;
    country?: string;
    donated?: string;
    dobFrom?: string;
    dobTo?: string;
    registeredFrom?: string;
    registeredTo?: string;
    perPage?: string;
  }>;
}) {
  const params = await searchParams;
  const query = parseMemberQuery(params);
  const { rows, error } = await fetchAllMembers(query);

  const activeFilters = [
    query.search ? `for "${query.search}"` : "",
    query.status !== "all" ? `with status ${query.status}` : "",
    query.gender ? `gender ${query.gender}` : "",
    query.bloodGroup ? `blood group ${query.bloodGroup}` : "",
    query.state ? `state ${query.state}` : "",
    query.country ? `country ${query.country}` : "",
    query.donated !== "all" ? (query.donated === "yes" ? "who donated blood" : "who never donated") : "",
  ].filter(Boolean);

  const downloadParams = new URLSearchParams();
  for (const [key, value] of Object.entries({
    search: query.search,
    status: query.status,
    gender: query.gender,
    bloodGroup: query.bloodGroup,
    state: query.state,
    country: query.country,
    donated: query.donated,
    dobFrom: query.dobFrom,
    dobTo: query.dobTo,
    registeredFrom: query.registeredFrom,
    registeredTo: query.registeredTo,
  })) {
    if (value) downloadParams.set(key, value);
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

  return (
    <>
      <AdminPageHeader
        title="Export registrations"
        description="Downloads a CSV file for your records. Keep member data private and store it securely."
      />

      <div className="surface-card p-6">
        {error ? (
          <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {rows.length.toLocaleString("en-IN")} record(s) ready to export
              {activeFilters.length > 0 ? ` ${activeFilters.join(", ")}` : ""}.
            </p>
            <a
              href={`/api/admin/export/registrations?${downloadParams.toString()}`}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-ink-900 px-6 text-sm font-semibold text-white hover:bg-ink-800"
              download
            >
              Download CSV
            </a>
            <details className="mt-8">
              <summary className="cursor-pointer text-sm font-semibold text-ink-800">
                Preview first rows
              </summary>
              <div className="mt-4 overflow-x-auto">
                <table className="admin-table w-full">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Name</th>
                      <th>Village</th>
                      <th>Mobile</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 10).map((row) => (
                      <tr key={String(row.registration_number)}>
                        <td className="font-mono text-xs">{String(row.registration_number)}</td>
                        <td>{String(row.full_name)}</td>
                        <td>{String(row.village ?? "—")}</td>
                        <td className="font-mono text-xs">{String(row.mobile_number)}</td>
                        <td>{String(row.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 ? (
                <p className="mt-3 text-xs text-slate-500">Showing 10 of {rows.length} records.</p>
              ) : null}
            </details>
            <pre className="mt-6 max-h-64 overflow-auto rounded-2xl bg-ink-950 p-4 text-[0.65rem] leading-relaxed text-emerald-200/80">
              {csv.slice(0, 2000)}
            </pre>
          </>
        )}
      </div>
    </>
  );
}
