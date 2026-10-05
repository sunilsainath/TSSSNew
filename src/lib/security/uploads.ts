/**
 * Upload validation that does not trust the client.
 *
 * `File.type` is a string the browser sends alongside the bytes; anyone can
 * post `image/png` with a PHP shell inside. The only thing that matters is
 * whether the bytes actually decode as the claimed image format, so every
 * upload is decoded with sharp before it is stored. Callers upload the
 * returned buffer rather than the original file, which also guarantees the
 * stored object matches what was verified.
 */

import "server-only";

import sharp from "sharp";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;

/** Matches the bucket policy; update both together. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** sharp's format names for the allowed types. */
const FORMAT_FOR_TYPE: Record<string, string[]> = {
  "image/jpeg": ["jpeg", "jpg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
  "image/avif": ["avif"],
};

export type VerifiedImage =
  | { ok: true; buffer: Buffer; format: string; extension: string }
  | { ok: false; error: string };

export async function verifyImageFile(file: File): Promise<VerifiedImage> {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Only JPG, PNG, WebP or AVIF images are allowed." };
  }

  if (file.size === 0) {
    return { ok: false, error: "The selected file is empty." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Image must be smaller than 4 MB." };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return { ok: false, error: "That file could not be read. Please try a different file." };
  }

  let format: string | undefined;
  try {
    ({ format } = await sharp(buffer).metadata());
  } catch {
    return {
      ok: false,
      error: "That file is not a valid image, even though it claims to be one.",
    };
  }

  // The decoded format must agree with the claimed MIME type. A script
  // renamed to .png fails here because sharp reads bytes, not extensions.
  if (!format || !(FORMAT_FOR_TYPE[file.type] ?? []).includes(format)) {
    return {
      ok: false,
      error: "That file's contents do not match its claimed image type.",
    };
  }

  const extension = file.type.split("/")[1].replace("jpeg", "jpg");

  return { ok: true, buffer, format, extension };
}

/** Randomised object key inside the caller's folder. */
export function uploadObjectKey(folder: string, extension: string): string {
  return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`;
}