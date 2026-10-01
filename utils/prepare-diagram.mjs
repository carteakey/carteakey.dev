// Convert a generated whiteboard/sketch PNG (ink on near-white paper) into a
// true ink-on-transparent PNG. Unlike prepare-sketch.mjs this does not key on a
// fixed paper colour: it un-mattes against white, so cool, warm, or hazy paper
// all work and ink keeps its real colour (black, cobalt) with a proper alpha.
//
// Usage: node utils/prepare-diagram.mjs <input> <output> [--pad 24] [--floor 0.07]
import sharp from "sharp";

const args = process.argv.slice(2);
const [input, output] = args.filter(
  (a) => !a.startsWith("--") && Number.isNaN(Number(a)),
);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? Number(args[i + 1]) : fallback;
};
const pad = opt("pad", 24);
const floor = opt("floor", 0.07); // paper haze below this ink amount becomes fully clear

if (!input || !output) {
  console.error(
    "Usage: node prepare-diagram.mjs <input> <output> [--pad 24] [--floor 0.07]",
  );
  process.exit(1);
}

const { data, info } = await sharp(input)
  .removeAlpha()
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const r = data[i],
    g = data[i + 1],
    b = data[i + 2];
  // Ink amount = how far the darkest channel is from white.
  let a = 1 - Math.min(r, g, b) / 255;
  a = a <= floor ? 0 : Math.min(1, ((a - floor) / (1 - floor)) * 1.15);
  if (a === 0) {
    data[i] = data[i + 1] = data[i + 2] = data[i + 3] = 0;
    continue;
  }
  // Recover the ink colour that produced this pixel over white paper.
  const un = (c) =>
    Math.max(0, Math.min(255, Math.round((c - (1 - a) * 255) / a)));
  data[i] = un(r);
  data[i + 1] = un(g);
  data[i + 2] = un(b);
  data[i + 3] = Math.round(a * 255);
}

const trimmed = await sharp(data, { raw: info })
  .png()
  .trim({ threshold: 1 })
  .toBuffer();
await sharp(trimmed)
  .extend({
    top: pad,
    bottom: pad,
    left: pad,
    right: pad,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(output);
console.log(output);
