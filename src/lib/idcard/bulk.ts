/**
 * Renders many identity cards into a single ZIP download.
 *
 * Each card is an independent PNG named after its registration number, so an
 * administrator can print the stack, share one card on WhatsApp, or file them
 * individually. Rendering is CPU-bound (one sharp pass per card plus a photo
 * fetch), so the batch is capped — see MAX_CARDS_PER_BATCH.
 */

import "server-only";

import { zipSync } from "fflate";

import {
  buildIdCardAssets,
  DEFAULT_ORGANIZATION_EMAIL,
  DEFAULT_ORGANIZATION_PHONE,
  DEFAULT_MOTTO,
  toIdCardMember,
} from "@/lib/idcard/assets";
import {
  idCardFileName,
  renderIdCardPng,
  type IdCardMember,
} from "@/lib/idcard/render-id-card";

/**
 * Upper bound per download.
 *
 * A card costs one photo fetch and one sharp render. Twenty-five stays well
 * inside serverless time limits; anything larger should be narrowed with the
 * member filters first.
 */
export const MAX_CARDS_PER_BATCH = 25;

export type BulkCardMember = Parameters<typeof toIdCardMember>[0];

/** Contact details printed in every card's footer. */
export type BulkCardContact = {
  phone?: string | null;
  email?: string | null;
};

export type BulkCardResult =
  | { ok: true; zip: Uint8Array; rendered: number; total: number; fileName: string }
  | { ok: false; reason: string };

/**
 * Renders the first MAX_CARDS_PER_BATCH members of `members`.
 * Photos are fetched with bounded concurrency so one slow image host cannot
 * stall the whole batch.
 */
export async function renderCardsZip(
  members: BulkCardMember[],
  contact: BulkCardContact = {},
  date: Date = new Date(),
): Promise<BulkCardResult> {
  if (members.length === 0) {
    return { ok: false, reason: "No members match these filters." };
  }

  const batch = members.slice(0, MAX_CARDS_PER_BATCH);

  const phone = contact.phone || DEFAULT_ORGANIZATION_PHONE;
  const email = contact.email || DEFAULT_ORGANIZATION_EMAIL;

  const entries: Record<string, Uint8Array> = {};
  const failures: string[] = [];

  // Small batches keep memory flat; 25 cards at ~1.5 MB each is comfortable.
  for (const row of batch) {
    const member: IdCardMember = toIdCardMember(row);

    try {
      const assets = await buildIdCardAssets(row.profile_photo_url, { phone, email });
      const png = await renderIdCardPng(
        { ...member },
        { ...assets, organizationPhone: phone, organizationEmail: email, motto: DEFAULT_MOTTO },
      );
      entries[idCardFileName(member)] = new Uint8Array(png);
    } catch (error) {
      failures.push(member.registrationNumber);
      console.error(`id card batch: ${member.registrationNumber} failed:`, error);
    }
  }

  if (Object.keys(entries).length === 0) {
    return { ok: false, reason: "None of the cards could be rendered." };
  }

  const stamp = date.toISOString().slice(0, 10);
  const fileName = `tsss-id-cards-${stamp}.zip`;

  const note = [
    `Srinivasula Seva Samstha identity cards, generated ${stamp}.`,
    `${entries.length} card(s) in this file.`,
    failures.length > 0 ? `Skipped (could not be rendered): ${failures.join(", ")}.` : "",
    members.length > batch.length
      ? `The selection matched ${members.length} members; narrow the filters or download again for the rest.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  entries["README.txt"] = new TextEncoder().encode(note);

  return {
    ok: true,
    zip: zipSync(entries, { level: 6 }),
    rendered: entries ? Object.keys(entries).length - 1 : 0,
    total: members.length,
    fileName,
  };
}