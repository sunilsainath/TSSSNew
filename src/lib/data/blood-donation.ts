/**
 * Blood donation dashboard metrics.
 *
 * Read through the request-scoped client so Row Level Security applies: only
 * roles that may manage blood help see these numbers. Areas are derived from
 * the records themselves rather than a fixed list, so a camp in a new city
 * appears without any configuration.
 */

import "server-only";

import { createClient } from "@/lib/supabase/server";

export type OverallMetrics = {
  donors: number;
  donations: number;
  unitsDonated: number;
  requests: number;
  fulfilledRequests: number;
  pendingRequests: number;
  unitsRequested: number;
  unitsFulfilled: number;
};

export type GroupMetrics = {
  group: string;
  donors: number;
  donations: number;
  units: number;
  requests: number;
};

export type AreaMetrics = {
  key: string;
  label: string;
  donors: number;
  donations: number;
  units: number;
  requests: number;
  fulfilled: number;
};

export type Drilldown = {
  state: string;
  city: string;
  area: string;
};

async function count(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string,
  match: Record<string, unknown> = {},
): Promise<number> {
  const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).match(match);
  return count ?? 0;
}

export async function getOverallMetrics(scope: Partial<Drilldown> = {}): Promise<OverallMetrics> {
  const supabase = await createClient();

  const areaMatch: Record<string, unknown> = {};
  if (scope.state) areaMatch.state_code = scope.state;
  if (scope.city) areaMatch.city = scope.city;
  if (scope.area) areaMatch.area = scope.area;

  const [donors, donationStats, requests, fulfilledRequests, pendingRequests] = await Promise.all([
    (async () => {
      let query = supabase
        .from("donors")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("is_willing", true);
      if (scope.state) query = query.eq("state_code", scope.state);
      if (scope.city) query = query.eq("city", scope.city);
      if (scope.area) query = query.eq("area", scope.area);
      const { count } = await query;
      return count ?? 0;
    })(),
    (async () => {
      let query = supabase.from("donations").select("id, units, donors!inner(state_code, city, area)", {
        count: "exact",
      });
      if (scope.state) query = query.eq("donors.state_code", scope.state);
      if (scope.city) query = query.eq("donors.city", scope.city);
      if (scope.area) query = query.eq("donors.area", scope.area);
      const { data, count } = await query;
      const units = (data ?? []).reduce((sum, row) => sum + (row.units ?? 0), 0);
      return { count: count ?? 0, units };
    })(),
    count(supabase, "donation_requests", { ...areaMatch }),
    count(supabase, "donation_requests", { ...areaMatch, status: "fulfilled" }),
    count(supabase, "donation_requests", { ...areaMatch, status: "pending" }),
  ]);

  const [requestedUnits, fulfilledUnits] = await (async () => {
    let query = supabase.from("donation_requests").select("units_required, fulfilled_units");
    if (scope.state) query = query.eq("state_code", scope.state);
    if (scope.city) query = query.eq("city", scope.city);
    if (scope.area) query = query.eq("area", scope.area);
    const { data } = await query;
    return [
      (data ?? []).reduce((sum, row) => sum + (row.units_required ?? 0), 0),
      (data ?? []).reduce((sum, row) => sum + (row.fulfilled_units ?? 0), 0),
    ];
  })();

  return {
    donors,
    donations: donationStats.count,
    unitsDonated: donationStats.units,
    requests,
    fulfilledRequests,
    pendingRequests,
    unitsRequested: requestedUnits,
    unitsFulfilled: fulfilledUnits,
  };
}

export async function getGroupMetrics(): Promise<GroupMetrics[]> {
  const supabase = await createClient();

  const [donors, donations, requests] = await Promise.all([
    supabase.from("donors").select("blood_group").eq("is_active", true).eq("is_willing", true),
    supabase.from("donations").select("units, donors!inner(blood_group)"),
    supabase.from("donation_requests").select("blood_group, units_required"),
  ]);

  const byGroup = new Map<string, GroupMetrics>();

  const ensure = (group: string): GroupMetrics => {
    let entry = byGroup.get(group);
    if (!entry) {
      entry = { group, donors: 0, donations: 0, units: 0, requests: 0 };
      byGroup.set(group, entry);
    }
    return entry;
  };

  for (const row of donors.data ?? []) {
    if (row.blood_group) ensure(row.blood_group).donors += 1;
  }

  for (const row of donations.data ?? []) {
    const group = (row.donors as unknown as { blood_group: string } | null)?.blood_group;
    if (group) {
      const entry = ensure(group);
      entry.donations += 1;
      entry.units += row.units ?? 0;
    }
  }

  for (const row of requests.data ?? []) {
    if (row.blood_group) ensure(row.blood_group).requests += 1;
  }

  const order = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
  return [...byGroup.values()].sort(
    (a, b) => order.indexOf(a.group) - order.indexOf(b.group),
  );
}

/** Column selected by the current drill-down depth. */
type AreaColumn = "state_code" | "city" | "area";

/**
 * Area metrics at the next level down from the current drill-down.
 * Country -> states, state -> cities, city -> areas.
 */
export async function getAreaMetrics(scope: Partial<Drilldown> = {}): Promise<{
  level: "state" | "city" | "area";
  rows: AreaMetrics[];
}> {
  const supabase = await createClient();

  if (!scope.state) {
    return { level: "state", rows: await aggregate(supabase, "state_code", {}) };
  }

  if (!scope.city) {
    return { level: "city", rows: await aggregate(supabase, "city", { state_code: scope.state }) };
  }

  return {
    level: "area",
    rows: await aggregate(supabase, "area", { state_code: scope.state, city: scope.city }),
  };
}

async function aggregate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  column: AreaColumn,
  match: Record<string, string>,
): Promise<AreaMetrics[]> {
  const [donors, donations, requests] = await Promise.all([
    (async () => {
      let query = supabase.from("donors").select(column).eq("is_active", true).eq("is_willing", true);
      for (const [key, value] of Object.entries(match)) query = query.eq(key, value);
      return query;
    })(),
    (async () => {
      let query = supabase.from("donations").select(`units, donors!inner(${column})`);
      for (const [key, value] of Object.entries(match)) query = query.eq(`donors.${key}`, value);
      return query;
    })(),
    (async () => {
      let query = supabase.from("donation_requests").select(`${column}, status`);
      for (const [key, value] of Object.entries(match)) query = query.eq(key, value);
      return query;
    })(),
  ]);

  const byKey = new Map<string, AreaMetrics>();

  const ensure = (key: string | null): AreaMetrics | null => {
    if (!key) return null;
    let entry = byKey.get(key);
    if (!entry) {
      entry = { key, label: key, donors: 0, donations: 0, units: 0, requests: 0, fulfilled: 0 };
      byKey.set(key, entry);
    }
    return entry;
  };

  for (const row of donors.data ?? []) {
    const entry = ensure((row as Record<string, string | null>)[column]);
    if (entry) entry.donors += 1;
  }

  for (const row of donations.data ?? []) {
    const donor = row.donors as unknown as Record<string, string | null> | null;
    const entry = ensure(donor?.[column] ?? null);
    if (entry) {
      entry.donations += 1;
      entry.units += row.units ?? 0;
    }
  }

  for (const row of requests.data ?? []) {
    const entry = ensure((row as Record<string, string | null>)[column]);
    if (entry) {
      entry.requests += 1;
      if ((row as Record<string, string | null>).status === "fulfilled") entry.fulfilled += 1;
    }
  }

  return [...byKey.values()].sort((a, b) => b.donations - a.donations || b.donors - a.donors);
}