import sharp from "sharp";

const [, , input, output] = process.argv;

if (!input || !output) {
  console.error("Usage: node prepare-sketch.mjs <input> <output>");
  process.exit(1);
}

const background = [252, 250, 244];

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const dr = data[i] - background[0];
  const dg = data[i + 1] - background[1];
  const db = data[i + 2] - background[2];
  const distance = Math.sqrt(dr * dr + dg * dg + db * db);
  let alpha = Math.round((distance - 6) * 18);
  alpha = Math.max(0, Math.min(255, alpha));
  if (alpha < 10) alpha = 0;
  data[i + 3] = Math.min(data[i + 3], alpha);
}

await sharp(data, { raw: info }).trim().png().toFile(output);
console.log(output);
