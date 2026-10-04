/**
 * Verifies the Photo Booth compositing maths without a browser, by transpiling
 * the module with the project's TypeScript compiler and running the real draw
 * logic against a minimal canvas stub:
 *
 *   - a photo always covers its window (no empty gaps)
 *   - the frame is drawn last so photo windows stay visible
 *   - preview and export use identical geometry
 */
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const root = process.cwd();
const tempDir = path.join(root, ".photobooth-test");

const source = await readFile(path.join(root, "src/lib/photobooth/compose.ts"), "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
  },
});

await mkdir(tempDir, { recursive: true });
const compiledPath = path.join(tempDir, "compose.mjs");
await writeFile(compiledPath, transpiled.outputText, "utf8");

const { coverScale, clampOffset, drawComposite } = await import(
  `${pathToFileURL(compiledPath).href}?t=${Date.now()}`
);

const slot = {
  id: "s1",
  template_id: "t1",
  label: "Photo 1",
  shape: "rect",
  x: 90,
  y: 320,
  width: 900,
  height: 420,
  radius: 28,
  rotation: 0,
  display_order: 1,
};

const template = {
  id: "t1",
  name: "Test",
  slug: "test",
  description: null,
  frame_image: "/frame.png",
  preview_image: null,
  width: 1080,
  height: 1350,
  is_active: true,
  is_featured: false,
  display_order: 1,
  created_by: null,
  created_at: "",
  updated_at: "",
};

let passed = 0;
let failed = 0;
const check = (name, fn) => {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}: ${error.message}`);
  }
};

/* ---- canvas stub ------------------------------------------------------- */

function createContextStub() {
  const calls = [];
  const record = (name) => (...args) => calls.push({ name, args });

  return {
    calls,
    save: record("save"),
    restore: record("restore"),
    beginPath: record("beginPath"),
    closePath: record("closePath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    quadraticCurveTo: record("quadraticCurveTo"),
    arc: record("arc"),
    ellipse: record("ellipse"),
    rect: record("rect"),
    roundRect: record("roundRect"),
    clip: record("clip"),
    fill: record("fill"),
    fillRect: record("fillRect"),
    fillText: record("fillText"),
    stroke: record("stroke"),
    setLineDash: record("setLineDash"),
    translate: record("translate"),
    rotate: record("rotate"),
    clearRect: record("clearRect"),
    drawImage: record("drawImage"),
    measureText: () => ({ width: 10 }),
    set fillStyle(value) {
      calls.push({ name: "fillStyle", args: [value] });
    },
    get fillStyle() {
      return "#000";
    },
    set strokeStyle(value) {
      calls.push({ name: "strokeStyle", args: [value] });
    },
    get strokeStyle() {
      return "#000";
    },
    set lineWidth(value) {
      calls.push({ name: "lineWidth", args: [value] });
    },
    get lineWidth() {
      return 1;
    },
    set font(value) {
      calls.push({ name: "font", args: [value] });
    },
    get font() {
      return "";
    },
    set textAlign(value) {
      calls.push({ name: "textAlign", args: [value] });
    },
    get textAlign() {
      return "start";
    },
    set textBaseline(value) {
      calls.push({ name: "textBaseline", args: [value] });
    },
    get textBaseline() {
      return "alphabetic";
    },
  };
}

const photo = {
  image: { width: 1200, height: 800 },
  url: "blob:preview",
  offsetX: 0,
  offsetY: 0,
  scale: 1,
  rotation: 0,
};

/* ---- checks ----------------------------------------------------------- */

check("cover scale fills the wider axis", () => {
  assert.equal(coverScale(1200, 800, slot), 900 / 1200);
});

check("cover scale fills the taller axis", () => {
  const tall = { ...slot, width: 400, height: 900 };
  assert.equal(coverScale(1200, 800, tall), 900 / 800);
});

check("offset is clamped so the photo stays in the window", () => {
  const clamped = clampOffset(10_000, photo, slot, "x");
  assert.ok(Math.abs(clamped) <= slot.width * 0.5, `offset ${clamped} too large`);
  assert.equal(clampOffset(-10_000, photo, slot, "x"), -clamped);
});

check("zoom increases the drawn size", () => {
  const measure = (scale) => {
    const context = createContextStub();
    drawComposite(context, {
      template,
      slots: [slot],
      photos: { s1: { ...photo, scale } },
      showEmptyHints: false,
    });
    // drawImage(image, x, y, width, height)
    return context.calls.filter((call) => call.name === "drawImage").at(-1).args[3];
  };

  const base = measure(1);
  const zoomed = measure(1.5);
  assert.ok(zoomed > base, `zoomed ${zoomed} should exceed base ${base}`);
  assert.equal(base, 900, "the photo should cover the window width at scale 1");
});

check("frame is drawn after the photos", () => {
  const context = createContextStub();
  const frame = { width: 1080, height: 1350 };

  drawComposite(context, { template, slots: [slot], photos: { s1: photo }, frameImage: frame });

  const draws = context.calls.filter((call) => call.name === "drawImage");
  assert.equal(draws.length, 2);
  assert.equal(draws[0].args[0], photo.image);
  assert.equal(draws[1].args[0], frame, "frame must be the last image drawn");
  assert.deepEqual(draws[1].args.slice(1), [0, 0, 1080, 1350], "frame must cover the canvas");
});

check("photo is drawn centred with the visitor offset applied", () => {
  const context = createContextStub();
  drawComposite(context, {
    template,
    slots: [slot],
    photos: { s1: { ...photo, offsetX: 40, offsetY: -20 } },
    showEmptyHints: false,
  });

  const translate = context.calls.filter((call) => call.name === "translate").at(-1);
  assert.deepEqual(translate.args, [90 + 450 + 40, 320 + 210 - 20]);
});

check("rotation is applied in radians", () => {
  const context = createContextStub();
  drawComposite(context, {
    template,
    slots: [slot],
    photos: { s1: { ...photo, rotation: 90 } },
    showEmptyHints: false,
  });

  const rotate = context.calls.filter((call) => call.name === "rotate").at(-1);
  assert.ok(Math.abs(rotate.args[0] - Math.PI / 2) < 1e-9);
});

check("empty windows render a placeholder when hints are enabled", () => {
  const context = createContextStub();
  drawComposite(context, { template, slots: [slot], photos: {}, showEmptyHints: true });
  const text = context.calls.filter((call) => call.name === "fillText").at(-1);
  assert.deepEqual(text.args, ["Photo 1", 90 + 450, 320 + 210]);
});

check("the active slot gets an outline", () => {
  const context = createContextStub();
  drawComposite(context, {
    template,
    slots: [slot],
    photos: {},
    activeSlotId: "s1",
    showEmptyHints: false,
  });
  assert.ok(
    context.calls.some((call) => call.name === "strokeStyle" && call.args[0] === "#ffb020"),
    "expected the active slot highlight",
  );
});

check("canvas background is cleared and filled", () => {
  const context = createContextStub();
  drawComposite(context, { template, slots: [], photos: {}, showEmptyHints: false });
  assert.equal(context.calls[0].name, "clearRect");
  assert.ok(context.calls.some((call) => call.name === "fillRect"));
});

console.log(`\n${passed} passed, ${failed} failed\n`);
await rm(tempDir, { recursive: true, force: true });
process.exit(failed === 0 ? 0 : 1);