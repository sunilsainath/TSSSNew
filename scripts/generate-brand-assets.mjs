/**
 * Derives app icons and the social share image from the trust emblem
 * (`public/brand/tsss-emblem.png`).
 *
 * Run this after replacing the emblem:
 *   npm run brand:icons
 *
 * Outputs:
 *   src/app/icon.png           512x512 app icon
 *   src/app/apple-icon.png     180x180 apple touch icon
 *   public/brand/og-default.jpg 1200x630 Open Graph / Twitter share image
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const emblemPath = path.join(root, "public/brand/tsss-emblem.png");

const CRIMSON = "#d8232a";
const GOLD = "#f2c230";

const emblem = await sharp(emblemPath).toBuffer();
const metadata = await sharp(emblem).metadata();
console.log(`emblem: ${metadata.width}x${metadata.height} ${metadata.format}`);

/* Square app icon on a white field. */
const icon = await sharp({
  create: { width: 512, height: 512, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
})
  .composite([{ input: await sharp(emblem).resize(480, 480).png().toBuffer(), top: 16, left: 16 }])
  .png()
  .toBuffer();

await writeFile(path.join(root, "src/app/icon.png"), icon);
await writeFile(path.join(root, "src/app/apple-icon.png"), icon);
console.log("wrote src/app/icon.png + src/app/apple-icon.png");

/* Social share image: emblem on a brand-blue field. */
const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#02101f"/>
      <stop offset="55%" stop-color="#052540"/>
      <stop offset="100%" stop-color="#0b6ab5"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <g opacity="0.22">
    ${Array.from({ length: 70 }, (_, i) => `<circle cx="${(i * 197) % 1200}" cy="${(i * 149) % 630}" r="${3 + (i % 5)}" fill="${GOLD}"/>`).join("")}
  </g>
  <text x="770" y="252" text-anchor="middle" font-family="Georgia, serif" font-size="62" fill="#ffffff">Srinivasula</text>
  <text x="770" y="322" text-anchor="middle" font-family="Georgia, serif" font-size="62" fill="#ffffff">Seva Samstha</text>
  <text x="770" y="384" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${CRIMSON}" letter-spacing="10">TSSS</text>
  <text x="770" y="446" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="${GOLD}" letter-spacing="5">SERVICE · DEVOTION · UNITY</text>
</svg>`;

const emblemBadge = await sharp(emblem).resize(420, 420, { fit: "inside" }).png().toBuffer();

await writeFile(
  path.join(root, "public/brand/og-default.jpg"),
  await sharp(Buffer.from(ogSvg), { density: 72 })
    .resize(1200, 630, { fit: "cover" })
    .composite([{ input: emblemBadge, left: 90, top: 105 }])
    .jpeg({ quality: 90, progressive: true })
    .toBuffer(),
);
console.log("wrote public/brand/og-default.jpg");
