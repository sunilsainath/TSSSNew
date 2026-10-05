/**
 * Prepares the images the identity card needs: the trust emblem and the
 * member's own photograph.
 *
 * Both are inlined as data URIs because the card is rendered by librsvg, which
 * will not follow remote URLs. A photograph is cropped square-ish and capped in
 * size first so a large phone photo cannot make rendering slow.
 */

import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import type { IdCardAssets, IdCardMember } from "@/lib/idcard/render-id-card";

const EMBLEM_FILE = path.join("public", "brand", "tsss-emblem.png");

/** Matches the identity card template. */
export const DEFAULT_ORGANIZATION_PHONE = "+91 8143538604";
export const DEFAULT_ORGANIZATION_EMAIL = "tgsrinivasulasevasamstha@gmail.com";
export const DEFAULT_MOTTO = "Unity in Service, Strength in Society";

async function inline(
  buffer: Buffer,
  contentType = "image/png",
): Promise<string> {
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

/**
 * The circular emblem, so the artwork's white rectangle never shows against the
 * blue header.
 *
 * Read from disk rather than fetched over HTTP: a self-request would need a
 * reachable public origin, which does not exist in local development or from
 * inside a serverless function.
 */
export async function loadEmblem(): Promise<string | null> {
  try {
    const buffer = await readFile(path.join(process.cwd(), EMBLEM_FILE));
    return await inline(buffer);
  } catch {
    // The renderer falls back to a drawn placeholder, so a missing emblem must
    // not fail the whole card.
    console.error("trust emblem could not be read from public/brand/tsss-emblem.png");
    return null;
  }
}

const PHOTO_WIDTH = 728;
const PHOTO_HEIGHT = 924;

/** Fetches and normalises a member photograph. */
export async function loadMemberPhoto(url: string | null): Promise<string | null> {
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) return null;

    const buffer = Buffer.from(await response.arrayBuffer());

    // `cover` matches the `preserveAspectRatio="xMidYMid slice"` on the card,
    // so the crop here and the crop there agree.
    const resized = await sharp(buffer)
      .resize(PHOTO_WIDTH, PHOTO_HEIGHT, { fit: "cover", position: "top" })
      .jpeg({ quality: 88 })
      .toBuffer();

    return await inline(resized, "image/jpeg");
  } catch (error) {
    console.error("member photo could not be loaded:", error);
    return null;
  }
}

/** Maps a member row onto the shape the renderer expects. */
export function toIdCardMember(row: {
  registration_number: string;
  full_name: string;
  father_name: string | null;
  designation: string | null;
  date_of_birth: string | null;
  gender: string | null;
  blood_group: string | null;
  mobile_number: string;
  phone_country_code: string | null;
  village: string | null;
  state_code: string | null;
  country_code: string | null;
  profile_photo_url: string | null;
}): IdCardMember {
  return {
    registrationNumber: row.registration_number,
    fullName: row.full_name,
    fatherName: row.father_name,
    designation: row.designation,
    dateOfBirth: row.date_of_birth,
    gender: (row.gender ?? null) as IdCardMember["gender"],
    bloodGroup: row.blood_group,
    mobileNumber: row.mobile_number,
    phoneCountryCode: row.phone_country_code,
    village: row.village,
    stateCode: row.state_code,
    countryCode: row.country_code,
    profilePhotoUrl: row.profile_photo_url,
  };
}

/** Builds the full asset bundle for one member. */
export async function buildIdCardAssets(
  profilePhotoUrl: string | null,
  contact: { phone?: string | null; email?: string | null } = {},
): Promise<IdCardAssets> {
  const [emblem, photo] = await Promise.all([
    loadEmblem(),
    loadMemberPhoto(profilePhotoUrl),
  ]);

  return {
    emblem,
    photo,
    organizationPhone: contact.phone || DEFAULT_ORGANIZATION_PHONE,
    organizationEmail: contact.email || DEFAULT_ORGANIZATION_EMAIL,
    motto: DEFAULT_MOTTO,
  };
}