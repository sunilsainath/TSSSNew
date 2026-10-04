import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

/** Active districts and areas for the public blood help form. */
export async function GET() {
  const supabase = await createClient();

  const { data: districts, error } = await supabase
    .from("districts")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("display_order");

  if (error) {
    return NextResponse.json({ error: "Unable to load districts" }, { status: 500 });
  }

  const { data: areas } = await supabase
    .from("areas")
    .select("id, district_id, name")
    .eq("is_active", true)
    .order("display_order");

  // Authentication is not required for this read-only public reference data,
  // but the helper keeps the pattern consistent for future authenticated routes.
  void getAdminSession;

  return NextResponse.json({ districts: districts ?? [], areas: areas ?? [] });
}
