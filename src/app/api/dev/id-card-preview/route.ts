import { readFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

import { getAdminSession, roleRank } from "@/lib/auth/session";
import { renderIdCardPng, type IdCardMember } from "@/lib/idcard/render-id-card";

/**
 * Development-only: renders sample identity cards so the layout can be checked
 * against the approved template. Delete once the design is signed off.
 *
 * Gated behind an administrator session so it cannot be reached if the route is
 * ever deployed by accident.
 */
export const dynamic = "force-dynamic";

async function dataUri(relativePath: string): Promise<string> {
  const buffer = await readFile(path.join(process.cwd(), relativePath));
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

async function placeholderPhoto(): Promise<string> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="364" height="462">
    <rect width="364" height="462" fill="#dfe6ee"/>
    <circle cx="182" cy="160" r="76" fill="#b9c6d4"/>
    <path d="M 62 462 C 62 350, 128 296, 182 296 C 236 296, 302 350, 302 462 Z" fill="#b9c6d4"/>
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

const SAMPLES: { file: string; label: string; withPhoto: boolean; member: IdCardMember }[] = [
  {
    file: "01-full.png",
    label: "Fully populated, matches the template",
    withPhoto: true,
    member: {
      registrationNumber: "TSSS000001",
      fullName: "Srinivas Reddy Vootkuri",
      fatherName: "Laxma Reddy",
      designation: "Founder & Chairman",
      dateOfBirth: "1970-04-12",
      gender: "male",
      bloodGroup: "O+",
      mobileNumber: "8143538604",
      phoneCountryCode: "91",
      village: "Karimnagar",
      stateCode: "TS",
      countryCode: "IN",
      profilePhotoUrl: null,
    },
  },
  {
    file: "02-sparse.png",
    label: "Legacy member: missing optional fields",
    withPhoto: true,
    member: {
      registrationNumber: "TSSS000074",
      fullName: "srinivas paka",
      fatherName: null,
      designation: null,
      dateOfBirth: "1985-11-02",
      gender: null,
      bloodGroup: "UNKNOWN",
      mobileNumber: "9876543210",
      phoneCountryCode: "91",
      village: null,
      stateCode: null,
      countryCode: null,
      profilePhotoUrl: null,
    },
  },
  {
    file: "03-no-photo.png",
    label: "No photograph, long names, international dialling code",
    withPhoto: false,
    member: {
      registrationNumber: "TSSS000002",
      fullName: "Verylongname Venkatasubramanyam",
      fatherName: "Venkataswamyappa",
      designation: "Volunteer Coordinator",
      dateOfBirth: "2001-01-31",
      gender: "female",
      bloodGroup: "B-",
      mobileNumber: "900000001",
      phoneCountryCode: "971",
      village: "Kolanupaka",
      stateCode: "TS",
      countryCode: "AE",
      profilePhotoUrl: null,
    },
  },
];

export async function GET() {
  const session = await getAdminSession();
  if (!session || roleRank(session.user.role) < roleRank("admin")) {
    return new Response("Not authorised", { status: 403 });
  }

  const outDir = path.join(process.cwd(), ".idcard-preview");
  const { mkdir, writeFile } = await import("node:fs/promises");
  await mkdir(outDir, { recursive: true });

  const base = {
    // The circular variant, so the emblem does not show the artwork's white
    // rectangle against the blue header.
    emblem: await dataUri("public/brand/tsss-emblem.png"),
    photo: await placeholderPhoto(),
    organizationPhone: "+91 8143538604",
    organizationEmail: "tgsrinivasulasevasamstha@gmail.com",
    motto: "Unity in Service, Strength in Society",
  };

  const written: string[] = [];

  for (const sample of SAMPLES) {
    const png = await renderIdCardPng(sample.member, {
      ...base,
      photo: sample.withPhoto ? base.photo : null,
    });
    await writeFile(path.join(outDir, sample.file), png);
    written.push(`${sample.file} — ${sample.label}`);
  }

  return Response.json({ written, outDir });
}