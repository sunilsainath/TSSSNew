/**
 * Renders a member identity card as a PNG, following the approved TSSS
 * template: a blue header carrying the emblem and the trust name, a white body
 * with the portrait and the member's details, a blue footer, and the
 * holographic security strip down the right edge.
 *
 * Rendering happens on the server with sharp (librsvg), so the output is
 * identical everywhere and needs no browser. The whole layout is expressed in
 * one SVG so it stays editable: change a coordinate here, re-run, and look.
 *
 * Output is 1000x1600, which is roughly print quality at 63.5x101.6 mm.
 */

import "server-only";

import sharp from "sharp";

import {
  BLOOD_GROUPS,
  UNKNOWN_BLOOD_GROUP,
  countryName,
  stateName,
} from "@/lib/lookups";
import type { Gender } from "@/lib/lookups";

export const ID_CARD_WIDTH = 1000;
export const ID_CARD_HEIGHT = 1600;

/** Brand colours lifted from the emblem so the card matches the website. */
const BLUE_DARK = "#0a3f8f";
const BLUE_MID = "#1565c0";
const RED = "#d8232a";
const GOLD = "#f2c230";
const INK = "#0a1c33";
const ROSE = "#e8455f";

export type IdCardMember = {
  registrationNumber: string;
  fullName: string;
  fatherName: string | null;
  designation: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  bloodGroup: string | null;
  mobileNumber: string;
  phoneCountryCode: string | null;
  village: string | null;
  stateCode: string | null;
  countryCode: string | null;
  profilePhotoUrl: string | null;
};

export type IdCardAssets = {
  /** The trust emblem as a base64 data URI, or null when unavailable. */
  emblem: string | null;
  /** The member's photograph as a data URI, or null when none was uploaded. */
  photo: string | null;
  organizationPhone: string;
  organizationEmail: string;
  motto: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Keeps a value inside the card; a very long village name must not overflow. */
function clip(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function formatDateDdMmYyyy(value: string | null): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return "—";
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function ageFrom(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateOfBirth);
  if (!match) return "—";

  const born = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(born.getTime())) return "—";

  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) age -= 1;

  return age >= 0 && age < 130 ? `${age}` : "—";
}

function genderLabel(gender: Gender | null): string {
  switch (gender) {
    case "male":
      return "Male";
    case "female":
      return "Female";
    case "other":
      return "Other";
    case "prefer_not_to_say":
      return "Not stated";
    default:
      return "—";
  }
}

/**
 * The blood drop with the group inside it, drawn rather than shipped as an
 * asset so it always matches the text beside it.
 */
function bloodDrop(group: string): string {
  const cx = 790;
  const cy = 800;
  const r = 62;

  // A drop is a circle with a point on top.
  const top = cy - r * 1.72;

  return `
    <g>
      <path d="M ${cx} ${top}
               C ${cx - r * 0.62} ${cy - r * 0.55}, ${cx - r} ${cy - r * 0.18}, ${cx - r} ${cy + r * 0.18}
               A ${r} ${r} 0 1 0 ${cx + r} ${cy + r * 0.18}
               C ${cx + r} ${cy - r * 0.18}, ${cx + r * 0.62} ${cy - r * 0.55}, ${cx} ${top} Z"
            fill="${RED}"/>
      <text x="${cx - r * 0.1}" y="${cy + 16}" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="54" font-weight="700"
            fill="#ffffff">${escapeXml(group)}</text>
    </g>`;
}

/** Repeats the emblem faintly across the white body, as on the template. */
function watermark(emblem: string | null): string {
  if (!emblem) return "";

  const spots = [
    [90, 470],
    [878, 470],
    [90, 690],
    [878, 690],
    [90, 910],
    [878, 910],
    [120, 1120],
    [858, 1120],
    [490, 1200],
  ];

  return spots
    .map(
      ([x, y]) =>
        `<image href="${emblem}" x="${x - 58}" y="${y - 58}" width="116" height="116" opacity="0.08"/>`,
    )
    .join("\n    ");
}

/**
 * Label and value columns.
 *
 * Labels are right-aligned onto a fixed edge so their colons line up and a long
 * label like "Designation" can never run into the value beside it.
 */
const LABEL_RIGHT = 286;
const COLON_X = 298;
const VALUE_X = 330;

function fieldRow(
  label: string,
  value: string,
  y: number,
  colour: string,
  valueSize = 38,
): string {
  return `
    <text x="${LABEL_RIGHT}" y="${y}" text-anchor="end" font-family="Arial, Helvetica, sans-serif"
          font-size="34" font-weight="700" fill="${INK}">${escapeXml(label)}</text>
    <text x="${COLON_X}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="34"
          font-weight="700" fill="${INK}">:</text>
    <text x="${VALUE_X}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${valueSize}"
          font-weight="700" fill="${colour}">${escapeXml(value)}</text>`;
}

export function buildIdCardSvg(member: IdCardMember, assets: IdCardAssets): string {
  const {
    registrationNumber,
    fullName,
    fatherName,
    designation,
    dateOfBirth,
    gender,
    bloodGroup,
    mobileNumber,
    phoneCountryCode,
    village,
    stateCode,
    countryCode,
  } = member;

  const group =
    bloodGroup && bloodGroup !== UNKNOWN_BLOOD_GROUP && (BLOOD_GROUPS as readonly string[]).includes(bloodGroup)
      ? bloodGroup
      : "—";

  const dial = phoneCountryCode ?? "91";
  const fullPhone = `${dial.startsWith("+") ? dial : `+${dial}`} ${mobileNumber}`;

  const addressLines = [
    village ? `Vill. & Mdl: ${clip(village, 30)}` : "Vill. & Mdl: —",
    [
      stateCode ? stateName(stateCode) : null,
      countryCode ? countryName(countryCode) : null,
    ]
      .filter(Boolean)
      .join(", ") || "State: —",
  ];

  const photoBox = { x: 318, y: 404, w: 364, h: 462 };

  const photo = assets.photo
    ? `<image href="${assets.photo}" x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.w}" height="${photoBox.h}" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.w}" height="${photoBox.h}" fill="#eef2f7"/>
       <text x="${photoBox.x + photoBox.w / 2}" y="${photoBox.y + photoBox.h / 2}" text-anchor="middle"
             font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#8aa0b8">No photo</text>`;

  const emblemMark = assets.emblem
    ? `<image href="${assets.emblem}" x="52" y="34" width="330" height="330"/>`
    : `<circle cx="217" cy="199" r="150" fill="#ffffff"/>
       <text x="217" y="215" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
             font-size="64" font-weight="700" fill="${RED}">TSSS</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${ID_CARD_WIDTH}" height="${ID_CARD_HEIGHT}" viewBox="0 0 ${ID_CARD_WIDTH} ${ID_CARD_HEIGHT}">
  <defs>
    <linearGradient id="hologram" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="25%" stop-color="#ffd6e8" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#c9f2ff" stop-opacity="0.9"/>
      <stop offset="75%" stop-color="#e6ffd9" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#fff2c2" stop-opacity="0.9"/>
    </linearGradient>
    <linearGradient id="headerBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BLUE_MID}"/>
      <stop offset="100%" stop-color="${BLUE_DARK}"/>
    </linearGradient>
    <linearGradient id="footerBlue" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BLUE_DARK}"/>
      <stop offset="100%" stop-color="#062a63"/>
    </linearGradient>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${ID_CARD_WIDTH}" height="${ID_CARD_HEIGHT}"/>
    </clipPath>
  </defs>

  <g clip-path="url(#cardClip)">
    <rect width="${ID_CARD_WIDTH}" height="${ID_CARD_HEIGHT}" fill="#ffffff"/>

    <!-- Header -->
    <rect x="0" y="0" width="${ID_CARD_WIDTH}" height="352" fill="url(#headerBlue)"/>
    ${emblemMark}
    <g font-family="Arial, Helvetica, sans-serif" font-weight="800" fill="#ffffff" font-size="60"
       letter-spacing="1">
      <text x="424" y="132">TELANGANA</text>
      <text x="424" y="214">SRINIVASULA</text>
      <text x="424" y="296">SEVA SAMSTHA</text>
    </g>
    <path d="M 0 330 C 240 392, 620 396, 1000 330 L 1000 392 C 620 452, 240 448, 0 386 Z"
          fill="${RED}"/>

    <!-- Body -->
    ${watermark(assets.emblem)}

    <text x="196" y="410" font-family="Arial, Helvetica, sans-serif" font-size="52"
          font-weight="800" fill="none" stroke="${ROSE}" stroke-width="1.6"
          transform="rotate(90 196 410)" letter-spacing="4">IDENTITY CARD</text>

    <rect x="${photoBox.x}" y="${photoBox.y}" width="${photoBox.w}" height="${photoBox.h}"
          fill="none" stroke="#9c6b3f" stroke-width="5"/>
    ${photo}
    ${bloodDrop(group)}

    ${fieldRow("Name", clip(fullName, 24), 946, RED, 44)}
    ${fieldRow("Son of", clip(fatherName || "—", 26), 1000, "#1c3f94", 36)}
    ${fieldRow("Designation", clip(designation || "Member", 22), 1054, "#127a2f", 34)}
    ${fieldRow("Mobile", clip(fullPhone, 16), 1108, "#1c3f94", 34)}

    ${fieldRow("Address", addressLines[0], 1162, "#1c3f94", 30)}
    <text x="${VALUE_X}" y="${1206}" font-family="Arial, Helvetica, sans-serif"
          font-size="30" font-weight="700" fill="#1c3f94">${escapeXml(addressLines[1])}</text>

    <text x="${LABEL_RIGHT}" y="1258" text-anchor="end" font-family="Arial, Helvetica, sans-serif"
          font-size="26" font-weight="700" fill="#5a6b80">Details</text>
    <text x="${COLON_X}" y="1258" font-family="Arial, Helvetica, sans-serif" font-size="26"
          font-weight="700" fill="#5a6b80">:</text>
    <text x="${VALUE_X}" y="1258" font-family="Arial, Helvetica, sans-serif" font-size="26"
          font-weight="700" fill="#5a6b80">DOB ${escapeXml(formatDateDdMmYyyy(dateOfBirth))}   ·   ${escapeXml(genderLabel(gender))}   ·   Age ${escapeXml(ageFrom(dateOfBirth))}</text>

    <!-- Footer -->
    <path d="M 0 1330 C 260 1272, 640 1270, 1000 1330 L 1000 1600 L 0 1600 Z"
          fill="url(#footerBlue)"/>
    <path d="M 0 1308 C 260 1250, 640 1248, 1000 1308 L 1000 1332 C 640 1272, 260 1274, 0 1332 Z"
          fill="${RED}"/>

    <text x="450" y="1392" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="30" font-weight="700" fill="${GOLD}">ID No: ${escapeXml(registrationNumber)}</text>
    <text x="450" y="1438" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="30" fill="#ffffff">Organization Ph: ${escapeXml(assets.organizationPhone)}</text>
    <text x="450" y="1482" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="25" fill="#ffffff">email: ${escapeXml(assets.organizationEmail)}</text>
    <text x="450" y="1540" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="31" font-weight="700" fill="#ffffff">"${escapeXml(assets.motto)}"</text>

    <!-- Security strip -->
    <rect x="906" y="0" width="94" height="${ID_CARD_HEIGHT}" fill="url(#hologram)" opacity="0.55"/>
    ${Array.from({ length: 4 }, (_, index) => {
      const y = 250 + index * 400;
      return `<text x="953" y="${y}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
              font-size="18" font-weight="700" fill="#1b2a44" opacity="0.8"
              transform="rotate(-90 953 ${y})" letter-spacing="0.5">TELANGANA SRINIVASULA SEVA SAMSTHA</text>`;
    }).join("\n    ")}

    <text x="953" y="1570" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
          font-size="20" font-weight="700" fill="#b8860b" opacity="0.9">TSSS</text>
  </g>
</svg>`;
}

/** Renders the SVG to a PNG buffer. */
export async function renderIdCardPng(
  member: IdCardMember,
  assets: IdCardAssets,
): Promise<Buffer> {
  return sharp(Buffer.from(buildIdCardSvg(member, assets)), { density: 144 })
    .resize(ID_CARD_WIDTH, ID_CARD_HEIGHT)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/** Filename used for downloads. */
export function idCardFileName(member: IdCardMember): string {
  const safe = member.registrationNumber.replace(/[^A-Za-z0-9_-]/g, "");
  return `${safe || "member"}-id-card.png`;
}