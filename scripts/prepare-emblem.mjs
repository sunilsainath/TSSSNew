/**
 * Prepares the display copy of the trust emblem.
 *
 * Input  : public/brand/tsss-emblem-original.png  (untouched artwork)
 * Output : public/brand/tsss-emblem.png           (1024px, circular, transparent
 *                                                  outside the badge)
 *
 * The artwork ships as a small white rectangle, which looks wrong on the dark
 * sections of the site. This script trims the white margin, rounds the corners
 * into the badge circle and upscales it for high-density screens.
 *
 *   npm run brand:emblem
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const originalPath = path.join(root, "public/brand/tsss-emblem-original.png");
const outputPath = path.join(root, "public/brand/tsss-emblem.png");
const originalJpgPath = path.join(root, "public/brand/tsss-emblem-original.jpg");
const jpgPath = path.join(root, "public/brand/tsss-emblem.jpg");

const TARGET = 1024;

const { data: trimmed, info } = await sharp(originalPath).trim({ threshold: 12 }).toBuffer({
  resolveWithObject: true,
});

const scale = TARGET / Math.max(info.width, info.height);
const width = Math.round(info.width * scale);
const height = Math.round(info.height * scale);

const badge = await sharp(trimmed).resize(width, height, { kernel: "lanczos3" }).png().toBuffer();

// The artwork is ringed by a soft anti-aliased white edge; inset the mask by a
// hair so that fringe is cut away instead of showing as a halo.
const inset = Math.round(Math.min(width, height) * 0.012);
const mask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <ellipse cx="${width / 2}" cy="${height / 2}" rx="${width / 2 - inset}" ry="${height / 2 - inset}" fill="#fff"/>
  </svg>`,
);

const emblem = await sharp(badge)
  .composite([{ input: mask, blend: "dest-in" }])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(outputPath, emblem);

/* JPEG copies: JPG has no alpha, so the badge is flattened onto white. */
await writeFile(originalJpgPath, await sharp(originalPath).jpeg({ quality: 96, chromaSubsampling: "4:4:4" }).toBuffer());
await writeFile(jpgPath, await sharp(emblem).flatten({ background: "#ffffff" }).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer());

console.log(`emblem: ${width}x${height} png (from ${info.width}x${info.height} artwork)`);
console.log("wrote public/brand/tsss-emblem.png");
console.log("wrote public/brand/tsss-emblem-original.jpg");
console.log("wrote public/brand/tsss-emblem.jpg");