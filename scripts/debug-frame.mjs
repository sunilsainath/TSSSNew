import sharp from "sharp";

const frame = await sharp("public/images/photobooth/frame-collage-4.png")
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

console.log("frame", frame.info);

// Count fully transparent pixels to confirm the windows are cut out.
let transparent = 0;
const { data, info } = frame;
for (let i = 3; i < data.length; i += 4) if (data[i] === 0) transparent += 1;
console.log("transparent pixels:", transparent, "of", info.width * info.height);

const pixel = (x, y) => {
  const offset = (y * info.width + x) * 4;
  return Array.from(data.slice(offset, offset + 4));
};

console.log("window centre (540, 530):", pixel(540, 530));
console.log("panel area (540, 150):", pixel(540, 150));