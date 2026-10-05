/**
 * Short-lived signed links for a member's own identity card.
 *
 * Registration succeeds without creating an account, so there is no session to
 * check. Rather than expose a card to anyone who can guess a registration
 * number - it carries a photograph, an address and a phone number - the success
 * screen receives a token that authorises exactly one member, for a limited time.
 *
 * The signature covers the whole payload, so the issue time inside the token
 * cannot be edited to extend its life. The member's mobile number is part of
 * the payload too, which quietly invalidates the link if the number is corrected.
 */

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/** A card link is only useful shortly after registration. */
const TOKEN_LIFETIME_SECONDS = 60 * 60;

function secret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    // Without a server secret the link cannot be signed, so no link is issued
    // rather than issuing one anybody could forge.
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to sign identity card links");
  }

  return key;
}

function signature(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export type IdCardLink = {
  registrationNumber: string;
  /** Seconds since the epoch. */
  issuedAt: number;
  token: string;
};

/** Issues a token for one member. */
export function issueIdCardToken(
  registrationNumber: string,
  mobileNumber: string,
  issuedAt: number = Math.floor(Date.now() / 1000),
): IdCardLink {
  const payload = `${issuedAt}.${registrationNumber}.${mobileNumber}`;

  return {
    registrationNumber,
    issuedAt,
    token: `${Buffer.from(payload, "utf8").toString("base64url")}.${signature(payload)}`,
  };
}

/**
 * Verifies a token against the member it should unlock.
 *
 * Returns true only when the signature matches, the member is the one named in
 * the payload, and the link has not expired.
 */
export function verifyIdCardToken(
  token: string,
  expected: { registrationNumber: string; mobileNumber: string },
  now: number = Math.floor(Date.now() / 1000),
): boolean {
  const separator = token.lastIndexOf(".");

  if (separator <= 0) return false;

  const encodedPayload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return false;
  }

  const computed = signature(payload);
  const provided = Buffer.from(providedSignature);
  const expected_ = Buffer.from(computed);

  if (provided.length !== expected_.length) return false;
  if (!timingSafeEqual(provided, expected_)) return false;

  const [issuedAtRaw, registrationNumber, mobileNumber] = payload.split(".");
  const issuedAt = Number(issuedAtRaw);

  if (!Number.isFinite(issuedAt)) return false;
  if (registrationNumber !== expected.registrationNumber) return false;
  if (mobileNumber !== expected.mobileNumber) return false;

  // Reject links issued in the future, which would pass an age test of 0.
  if (issuedAt > now + 60) return false;

  return now - issuedAt <= TOKEN_LIFETIME_SECONDS;
}