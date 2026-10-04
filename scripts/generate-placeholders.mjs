/**
 * Generates temporary placeholder JPG assets.
 * Run with: node scripts/generate-placeholders.mjs
 * Replace the produced files with real photography later (keep the same file names).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");

const PALETTES = [
  { a: "#02101f", b: "#0b6ab5", c: "#f2c230" },
  { a: "#052540", b: "#1b84dd", c: "#d8232a" },
  { a: "#04213a", b: "#0a4f86", c: "#f6cf4f" },
  { a: "#062a4a", b: "#479fec", c: "#fdf1c6" },
  { a: "#03182c", b: "#0e4776", c: "#fca5a5" },
];

const escapeXml = (value) =>
  String(value).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

function svg({ w, h, palette, label, sub }) {
  const p = palette;
  const safeLabel = escapeXml(label);
  const safeSub = escapeXml(sub);
  const dots = Array.from({ length: 26 }, (_, i) => {
    const x = (i * 97) % w;
    const y = (i * 53) % h;
    const r = 2 + ((i * 7) % 5);
    const o = 0.05 + ((i * 3) % 7) / 60;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.c}" opacity="${o.toFixed(2)}"/>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${p.a}"/>
      <stop offset="55%" stop-color="${p.b}"/>
      <stop offset="100%" stop-color="${p.a}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="${p.c}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${p.c}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  ${dots}
  <g opacity="0.5" fill="none" stroke="${p.c}" stroke-width="1.5">
    <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.28}"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.34}"/>
  </g>
  <text x="50%" y="${h / 2 + 8}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(h * 0.11)}" fill="${p.c}">${safeLabel}</text>
  <text x="50%" y="${h / 2 + Math.round(h * 0.11) + 26}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(h * 0.05)}" fill="#ffffff" opacity="0.72">${safeSub}</text>
</svg>`;
}

async function make(relPath, label, sub, width, height, paletteIndex) {
  const abs = path.join(root, "public", relPath);
  await mkdir(path.dirname(abs), { recursive: true });
  const buffer = await sharp(Buffer.from(svg({ w: width, h: height, palette: PALETTES[paletteIndex % PALETTES.length], label, sub })))
    .jpeg({ quality: 78, progressive: true })
    .toBuffer();
  await writeFile(abs, buffer);
  console.log("wrote", relPath);
}

/* Paths must match the URLs stored in the database, i.e. /images/<folder>/<file>. */
const targets = [
  ["images/events/anniversary-1.jpg", "1st Anniversary", "Grand temple celebration", 1200, 800, 0],
  ["images/events/anniversary-2.jpg", "2nd Anniversary", "Community gathering", 1200, 800, 1],
  ["images/events/devotional-1.jpg", "Devotional Event", "Kalyanotsavam and bhajans", 1200, 800, 2],
  ["images/events/devotional-2.jpg", "Satsangam", "Weekly spiritual discourse", 1200, 800, 3],
  ["images/events/helping-hands-1.jpg", "Helping Hands", "Relief and support drive", 1200, 800, 4],
  ["images/events/pen-distribution-1.jpg", "Pen Distribution", "School kits for students", 1200, 800, 1],
  ["images/events/education-1.jpg", "Educational Program", "Scholarship & coaching", 1200, 800, 2],
  ["images/gallery/gallery-1.jpg", "Gallery", "Community photo 1", 1000, 750, 0],
  ["images/gallery/gallery-2.jpg", "Gallery", "Community photo 2", 1000, 750, 3],
  ["images/gallery/gallery-3.jpg", "Gallery", "Community photo 3", 1000, 750, 2],
  ["images/gallery/gallery-4.jpg", "Gallery", "Community photo 4", 1000, 750, 4],
  ["images/blogs/blog-1.jpg", "Blog Cover", "Community story 1", 1000, 600, 1],
  ["images/blogs/blog-2.jpg", "Blog Cover", "Community story 2", 1000, 600, 2],
  ["images/blogs/blog-3.jpg", "Blog Cover", "Community story 3", 1000, 600, 3],
  ["images/media/media-1.jpg", "Media", "Press coverage", 1000, 562, 0],
  ["images/media/media-2.jpg", "Media", "Channel interview", 1000, 562, 4],
  ["images/donations/qr-placeholder.jpg", "Donation QR", "Replace with real UPI QR", 512, 512, 2],
  ["brand/namalu.jpg", "Venkateshwara Namalu", "Sample placeholder", 640, 360, 1],
];

for (const [rel, label, sub, w, h, p] of targets) {
  await make(rel, label, sub, w, h, p);
}

/* The emblem, app icons and share image come from `npm run brand:emblem` and
   `npm run brand:icons`, which use the real logo. */
