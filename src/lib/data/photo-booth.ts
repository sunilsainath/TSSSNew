import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import type { PhotoBoothSlot, PhotoBoothTemplate } from "@/lib/types";

/** Active templates visitors may choose from, with their photo windows. */
export async function getPhotoBoothTemplates(options: {
  includeInactive?: boolean;
} = {}): Promise<PhotoBoothTemplate[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("photo_booth_templates")
    .select("*")
    .order("display_order", { ascending: true });

  if (!options.includeInactive) query = query.eq("is_active", true);

  const { data } = await query;
  return (data ?? []) as PhotoBoothTemplate[];
}

export async function getPhotoBoothTemplate(
  id: string,
  options: { includeInactive?: boolean } = {},
): Promise<(PhotoBoothTemplate & { slots: PhotoBoothSlot[] }) | null> {
  const supabase = createPublicClient();

  const { data: template } = await supabase
    .from("photo_booth_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) return null;
  if (!template.is_active && !options.includeInactive) return null;

  const { data: slots } = await supabase
    .from("photo_booth_slots")
    .select("*")
    .eq("template_id", id)
    .order("display_order", { ascending: true });

  return { ...(template as PhotoBoothTemplate), slots: (slots ?? []) as PhotoBoothSlot[] };
}

export async function getPhotoBoothTemplateBySlug(
  slug: string,
): Promise<(PhotoBoothTemplate & { slots: PhotoBoothSlot[] }) | null> {
  const supabase = createPublicClient();

  const { data: template } = await supabase
    .from("photo_booth_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!template || !template.is_active) return null;

  const { data: slots } = await supabase
    .from("photo_booth_slots")
    .select("*")
    .eq("template_id", template.id)
    .order("display_order", { ascending: true });

  return { ...(template as PhotoBoothTemplate), slots: (slots ?? []) as PhotoBoothSlot[] };
}

export async function hasPhotoBoothTemplates(): Promise<boolean> {
  const templates = await getPhotoBoothTemplates();
  return templates.length > 0;
}