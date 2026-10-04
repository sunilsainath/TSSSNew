import { NextResponse } from "next/server";

import { getPhotoBoothTemplateBySlug } from "@/lib/data/photo-booth";

/** Public read-only: returns one active template with its photo windows. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const template = await getPhotoBoothTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  return NextResponse.json({
    template: {
      id: template.id,
      name: template.name,
      slug: template.slug,
      description: template.description,
      frame_image: template.frame_image,
      preview_image: template.preview_image,
      width: template.width,
      height: template.height,
      is_featured: template.is_featured,
      display_order: template.display_order,
    },
    slots: template.slots,
  });
}