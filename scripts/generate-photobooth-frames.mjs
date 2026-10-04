/**
 * Generates the starter Photo Booth frames: transparent PNG frames (photo
 * windows erased) plus JPG previews with sample photos behind the windows.
 *
 * Slot rectangles here must match the slots stored for each template.
 * Admin can change both later from Admin → Photo Booth.
 *
 * Run with: node scripts/generate-photobooth-frames.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const OUT = path.join(root, "public/images/photobooth");

const GOLD = "#f2c230";
const GOLD_DEEP = "#b2801a";
const INK = "#02101f";
const BRAND = "#0b6ab5";
const CRIMSON = "#d8232a";

/** Opaque background artwork of the frame (the photo holes are erased later). */
function panelSvg({ width, height, title, subtitle }) {
  const dots = Array.from({ length: 46 }, (_, i) => {
    const x = (i * 149) % width;
    const y = (i * 223) % height;
    const r = 3 + ((i * 5) % 8);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${GOLD}" opacity="${(0.05 + ((i * 7) % 9) / 90).toFixed(2)}"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#073252"/>
      <stop offset="55%" stop-color="${INK}"/>
      <stop offset="100%" stop-color="#052540"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${BRAND}" stop-opacity="0.35"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#panel)"/>
  <rect width="${width}" height="${height}" fill="url(#sheen)"/>
  ${dots}
  <g opacity="0.95">
    <circle cx="${width / 2}" cy="150" r="34" fill="none" stroke="${CRIMSON}" stroke-width="8"/>
    <path d="M${width / 2 - 44} 206 h88" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>
    <path d="M${width / 2 - 28} 240 h56" stroke="${GOLD}" stroke-width="4" stroke-linecap="round" opacity="0.7"/>
  </g>
  <text x="50%" y="108" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(width * 0.08)}" fill="#f8ecc9">${title}</text>
  <text x="50%" y="${height - 96}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(width * 0.032)}" fill="#ffffff" opacity="0.75" letter-spacing="${Math.round(width * 0.006)}">${subtitle}</text>
  <g opacity="0.9">
    <path d="M${width / 2 - 160} ${height - 170} q160 -58 320 0" fill="none" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="${width / 2 - 180}" cy="${height - 170}" r="10" fill="${GOLD}"/>
    <circle cx="${width / 2 + 180}" cy="${height - 170}" r="10" fill="${GOLD}"/>
  </g>
</svg>`;
}

/** Transparent layer used to erase the photo windows (alpha = 255 means erase). */
function holesSvg({ width, height, windows }) {
  const shapes = windows
    .map(
      (w) =>
        w.shape === "circle"
          ? `<circle cx="${w.x + w.width / 2}" cy="${w.y + w.height / 2}" r="${Math.min(w.width, w.height) / 2}" fill="white"/>`
          : `<rect x="${w.x}" y="${w.y}" width="${w.width}" height="${w.height}" rx="${w.radius ?? 24}" fill="white"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="none"/>
  ${shapes}
</svg>`;
}

/** Gold outlines drawn on top of everything (skipped where photos show through). */
function guidesSvg({ width, height, windows, inset }) {
  const guides = windows
    .map(
      (w) =>
        w.shape === "circle"
          ? `<circle cx="${w.x + w.width / 2}" cy="${w.y + w.height / 2}" r="${Math.min(w.width, w.height) / 2 + 6}" fill="none" stroke="${GOLD}" stroke-width="7"/>`
          : `<rect x="${w.x - 7}" y="${w.y - 7}" width="${w.width + 14}" height="${w.height + 14}" rx="${(w.radius ?? 24) + 7}" fill="none" stroke="${GOLD}" stroke-width="7"/>`,
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  ${guides}
  <rect x="4" y="4" width="${width - 8}" height="${height - 8}" rx="${inset}" fill="none" stroke="${GOLD_DEEP}" stroke-width="8"/>
</svg>`;
}

/** One placeholder photo rendered exactly at window size. */
async function placeholderPhoto({ width, height, bg, fg }) {
  return sharp(
    Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bg}"/>
          <stop offset="100%" stop-color="${fg}"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#g)"/>
      <circle cx="${width * 0.74}" cy="${height * 0.28}" r="${Math.min(width, height) * 0.13}" fill="#ffffff" opacity="0.35"/>
      <path d="M0 ${height} q${width * 0.35} ${-height * 0.4} ${width * 0.7} 0 t${width * 0.3} 0 v${height} z" fill="#000000" opacity="0.2"/>
      <rect x="${width * 0.1}" y="${height * 0.56}" width="${width * 0.32}" height="${height * 0.28}" rx="${Math.min(width, height) * 0.05}" fill="#ffffff" opacity="0.22"/>
    </svg>`),
  )
    .png()
    .toBuffer();
}

const PALETTE = [
  ["#073252", "#479fec"],
  ["#0e4776", "#7dbdf6"],
  ["#052540", "#479fec"],
  ["#103d63", "#b0d8fb"],
  ["#1b84dd", "#d8ecfd"],
  ["#0a4f86", "#8ec9f9"],
];

async function buildFrame(template) {
  const { width, height, windows, title, subtitle } = template;
  const inset = Math.round(width * 0.035);

  const panel = await sharp(Buffer.from(panelSvg({ width, height, title, subtitle })))
    .png()
    .toBuffer();
  const holes = await sharp(Buffer.from(holesSvg({ width, height, windows })))
    .png()
    .toBuffer();
  const guides = await sharp(Buffer.from(guidesSvg({ width, height, windows, inset })))
    .png()
    .toBuffer();

  return sharp(panel)
    .composite([{ input: holes, blend: "dest-out" }, { input: guides }])
    .png()
    .toBuffer();
}

async function buildPreview(template, frameBuffer) {
  const composites = [];

  for (const [index, window] of template.windows.entries()) {
    const [bg, fg] = PALETTE[index % PALETTE.length];
    composites.push({
      input: await placeholderPhoto({ ...window, bg, fg }),
      left: window.x,
      top: window.y,
    });
  }

  return sharp({
    create: {
      width: template.width,
      height: template.height,
      channels: 4,
      background: { r: 7, g: 12, b: 26, alpha: 1 },
    },
  })
    .composite([...composites, { input: frameBuffer }])
    .jpeg({ quality: 84, progressive: true })
    .toBuffer();
}

const templates = [
  {
    slug: "four-photo-collage",
    file: "frame-collage-4",
    name: "Four Photo Collage",
    title: "TSSS",
    subtitle: "SRINIVASULA SEVA SAMSTHA",
    width: 1080,
    height: 1350,
    windows: [
      { x: 90, y: 320, width: 900, height: 420, radius: 28 },
      { x: 90, y: 780, width: 430, height: 380, radius: 28 },
      { x: 560, y: 780, width: 430, height: 380, radius: 28 },
    ],
  },
  {
    slug: "photo-strip",
    file: "frame-strip-3",
    name: "Photo Strip",
    title: "SEVA SAMSTHA",
    subtitle: "TOGETHER WE SERVE",
    width: 900,
    height: 1600,
    windows: [
      { x: 110, y: 300, width: 680, height: 330, radius: 26 },
      { x: 110, y: 670, width: 680, height: 330, radius: 26 },
      { x: 110, y: 1040, width: 680, height: 330, radius: 26 },
    ],
  },
  {
    slug: "single-circle",
    file: "frame-circle",
    name: "Classic Circle",
    title: "TSSS",
    subtitle: "MY FAMILY · MY PRIDE",
    width: 1080,
    height: 1080,
    windows: [{ x: 190, y: 250, width: 700, height: 700, shape: "circle" }],
  },
  {
    slug: "twin-collage",
    file: "frame-twin",
    name: "Twin Collage",
    title: "UNITY",
    subtitle: "DEVOTION · SERVICE",
    width: 1080,
    height: 1200,
    windows: [
      { x: 90, y: 300, width: 430, height: 640, radius: 30 },
      { x: 560, y: 300, width: 430, height: 640, radius: 30 },
    ],
  },
];

await mkdir(OUT, { recursive: true });

const manifest = [];

for (const template of templates) {
  const frameBuffer = await buildFrame(template);

  await writeFile(path.join(OUT, `${template.file}.png`), frameBuffer);
  await writeFile(path.join(OUT, `${template.file}-preview.jpg`), await buildPreview(template, frameBuffer));

  manifest.push({
    slug: template.slug,
    name: template.name,
    frame_image: `/images/photobooth/${template.file}.png`,
    preview_image: `/images/photobooth/${template.file}-preview.jpg`,
    width: template.width,
    height: template.height,
    windows: template.windows.map((window, index) => ({
      label: `Photo ${index + 1}`,
      shape: window.shape ?? "rect",
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
      rotation: 0,
    })),
  });

  console.log(`wrote ${template.file}.png + ${template.file}-preview.jpg`);
}

await writeFile(path.join(OUT, "templates.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log("wrote templates.json");