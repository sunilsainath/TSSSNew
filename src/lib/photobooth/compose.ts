/**
 * Photo Booth rendering.
 *
 * The preview on screen and the exported PNG are produced by the same drawing
 * routine, so what a visitor sees is exactly what they download.
 *
 * Visitor photos are only held in memory: they are never uploaded.
 */

import type { PhotoBoothSlot, PhotoBoothTemplate, PhotoPlacement } from "@/lib/types";

export type CompositeOptions = {
  template: PhotoBoothTemplate;
  slots: PhotoBoothSlot[];
  /** Photo per slot id, keyed by slot id. */
  photos: Record<string, PhotoPlacement>;
  frameImage?: CanvasImageSource | null;
  /** Highlights the selected slot (preview only). */
  activeSlotId?: string | null;
  showEmptyHints?: boolean;
};

/** Rounded rectangle path with a manual fallback for older browsers. */
function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();

  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, r);
    return;
  }

  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
}

export function slotPath(
  context: CanvasRenderingContext2D,
  slot: PhotoBoothSlot,
  inset = 0,
) {
  if (slot.shape === "circle") {
    context.beginPath();
    context.ellipse(
      slot.x + slot.width / 2,
      slot.y + slot.height / 2,
      Math.min(slot.width, slot.height) / 2 - inset,
      Math.min(slot.width, slot.height) / 2 - inset,
      0,
      0,
      Math.PI * 2,
    );
    return;
  }

  roundedRectPath(
    context,
    slot.x + inset,
    slot.y + inset,
    slot.width - inset * 2,
    slot.height - inset * 2,
    Math.max(0, slot.radius - inset),
  );
}

/** Scale at which the photo exactly covers the slot. */
export function coverScale(
  imageWidth: number,
  imageHeight: number,
  slot: PhotoBoothSlot,
): number {
  return Math.max(slot.width / imageWidth, slot.height / imageHeight);
}

/** Draws one photo into its slot, honouring the visitor's adjustments. */
function drawSlotPhoto(
  context: CanvasRenderingContext2D,
  slot: PhotoBoothSlot,
  placement: PhotoPlacement,
) {
  const imageWidth = placement.image.width;
  const imageHeight = placement.image.height;

  context.save();
  slotPath(context, slot);
  context.clip();

  // Empty windows are filled so nothing shows through to the page background.
  context.fillStyle = "#0b1120";
  context.fillRect(slot.x, slot.y, slot.width, slot.height);

  const scale = coverScale(imageWidth, imageHeight, slot) * placement.scale;
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;

  const centreX = slot.x + slot.width / 2 + placement.offsetX;
  const centreY = slot.y + slot.height / 2 + placement.offsetY;

  context.translate(centreX, centreY);
  if (placement.rotation !== 0) {
    context.rotate((placement.rotation * Math.PI) / 180);
  }
  context.drawImage(placement.image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
  context.restore();
}

/** Renders the whole composite. Used for both the preview and the export. */
export function drawComposite(
  context: CanvasRenderingContext2D,
  { template, slots, photos, frameImage, activeSlotId, showEmptyHints }: CompositeOptions,
) {
  context.clearRect(0, 0, template.width, template.height);

  context.fillStyle = "#070c1a";
  context.fillRect(0, 0, template.width, template.height);

  for (const slot of slots) {
    const placement = photos[slot.id];

    if (placement) {
      drawSlotPhoto(context, slot, placement);
      continue;
    }

    // Placeholder for a window without a photo yet.
    context.save();
    slotPath(context, slot);
    context.fillStyle = "#131e3a";
    context.fill();
    context.strokeStyle = "rgba(217, 173, 70, 0.55)";
    context.lineWidth = Math.max(2, template.width / 400);
    context.setLineDash([12, 10]);
    context.stroke();
    context.restore();

    if (showEmptyHints) {
      context.save();
      context.fillStyle = "rgba(255, 255, 255, 0.65)";
      context.font = `600 ${Math.round(template.width / 34)}px system-ui, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(
        slot.label ?? "Add photo",
        slot.x + slot.width / 2,
        slot.y + slot.height / 2,
      );
      context.restore();
    }
  }

  if (frameImage) {
    context.drawImage(frameImage, 0, 0, template.width, template.height);
  }

  if (activeSlotId) {
    const active = slots.find((slot) => slot.id === activeSlotId);
    if (active) {
      context.save();
      slotPath(context, active, -3);
      context.strokeStyle = "#ffb020";
      context.lineWidth = Math.max(3, template.width / 260);
      context.stroke();
      context.restore();
    }
  }
}

/** Loads an image file, returning the decoded bitmap and an object URL. */
export async function loadPhoto(file: File): Promise<PhotoPlacement> {
  const url = URL.createObjectURL(file);

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("The selected image could not be read."));
    element.src = url;
  });

  return { image, url, offsetX: 0, offsetY: 0, scale: 1, rotation: 0 };
}

/** Keeps the photo from being dragged completely out of its window. */
export function clampOffset(
  offset: number,
  placement: PhotoPlacement,
  slot: PhotoBoothSlot,
  axis: "x" | "y",
): number {
  const imageWidth = placement.image.width;
  const imageHeight = placement.image.height;
  const scale = coverScale(imageWidth, imageHeight, slot) * placement.scale;

  if (axis === "x") {
    const limit = Math.max(
      Math.max(0, slot.width - imageWidth * scale) / 2,
      Math.max(24, slot.width * 0.4),
    );
    return Math.max(-limit, Math.min(limit, offset));
  }

  const limitY = Math.max(
    Math.max(0, slot.height - imageHeight * scale) / 2,
    Math.max(24, slot.height * 0.4),
  );
  return Math.max(-limitY, Math.min(limitY, offset));
}

/** Renders the composite at full template resolution and triggers a download. */
export async function exportComposite(
  options: CompositeOptions,
  filename: string,
): Promise<{ ok: boolean; message?: string }> {
  const { template, frameImage } = options;

  const canvas = document.createElement("canvas");
  canvas.width = template.width;
  canvas.height = template.height;

  const context = canvas.getContext("2d");
  if (!context) return { ok: false, message: "Your browser could not create the image." };

  const frame = await loadFrame(frameImage);
  drawComposite(context, { ...options, frameImage: frame, activeSlotId: null });

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) return { ok: false, message: "The photo could not be exported." };

  const downloadName = `${filename.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.png`;

  const file = new File([blob], downloadName, { type: "image/png" });

  // Mobile sharing when the browser supports sharing files.
  const shareData = { files: [file], title: template.name };
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare(shareData);

  if (canShare) {
    try {
      await navigator.share(shareData);
      return { ok: true };
    } catch {
      // The visitor dismissed the share sheet: fall through to a download.
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = downloadName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);

  return { ok: true };
}

async function loadFrame(
  frameImage: CompositeOptions["frameImage"],
): Promise<CanvasImageSource | null> {
  if (!frameImage) return null;
  if (typeof frameImage === "string") {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = frameImage;
    });
  }
  return frameImage;
}