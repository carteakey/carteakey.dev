#!/usr/bin/env node
// Converts a source photo into a genuine halftone dot-screen: dot *radius*
// modulated by the source's actual per-pixel luminance (a real print-style
// halftone), not a CSS filter approximation. See ../SKILL.md for the full
// reasoning and when to reach for this vs. a CSS filter.
//
// Usage:
//   node generate-halftone.mjs <input> <output.png> [options]
//
// Options (all optional, shown with defaults):
//   --width=1920          output pixel width
//   --height=480          output pixel height
//   --cell=3.2            spacing between dot centers, in output px
//                          (smaller = finer/denser grid, larger file)
//   --max-radius=2.0       largest dot radius, in output px
//   --contrast=1.3         pre-boost on the luminance curve before mapping
//                          to radius (>1 = punchier, more graphic; 1 = off)
//   --color=#2323e6        dot fill color (hex)
//   --backdrop=transparent  "transparent" | a hex color
//   --backdrop-opacity=0.05 only used when --backdrop is a hex color -
//                           see "Day vs. night" in SKILL.md before setting
//                           this above ~0.1
//   --grain=1               1 to include the fine speckle/grain layer
//                           (recommended - a plain dot grid alone reads as
//                           flat/digital; the grain is what sells it as
//                           print/halftone texture), 0 to disable
//   --crop=cover            "cover" (crop to fill, centered) - only mode
//                           implemented; for a manual crop, pre-crop the
//                           source with your own sharp/imagemagick call
//                           and pass the pre-cropped file as input instead
//
// Requires: sharp (already a dependency of this project via eleventy-img).

import sharp from "sharp";
import { writeFileSync } from "node:fs";

function parseArgs(argv) {
  const [input, output, ...rest] = argv;
  const opts = {
    width: 1920,
    height: 480,
    cell: 3.2,
    maxRadius: 2.0,
    contrast: 1.3,
    color: "#2323e6",
    backdrop: "transparent",
    backdropOpacity: 0.05,
    grain: true,
  };
  for (const arg of rest) {
    const [key, val] = arg.replace(/^--/, "").split("=");
    if (key === "width") opts.width = Number(val);
    else if (key === "height") opts.height = Number(val);
    else if (key === "cell") opts.cell = Number(val);
    else if (key === "max-radius") opts.maxRadius = Number(val);
    else if (key === "contrast") opts.contrast = Number(val);
    else if (key === "color") opts.color = val;
    else if (key === "backdrop") opts.backdrop = val;
    else if (key === "backdrop-opacity") opts.backdropOpacity = Number(val);
    else if (key === "grain") opts.grain = val !== "0";
  }
  if (!input || !output) {
    console.error("Usage: node generate-halftone.mjs <input> <output.png> [options]");
    process.exit(1);
  }
  return { input, output, opts };
}

function buildHalftoneSvg(gray, width, height, channels, opts) {
  const { cell, maxRadius, contrast, color, backdrop, backdropOpacity, grain } = opts;
  const cols = Math.floor(width / cell);
  const rows = Math.floor(height / cell);

  let circles = "";
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      const px = Math.min(width - 1, (cx * cell + cell / 2) | 0);
      const py = Math.min(height - 1, (ry * cell + cell / 2) | 0);
      const lum = gray[(py * width + px) * channels] / 255;
      let darkness = 1 - lum;
      darkness = Math.max(0, Math.min(1, (darkness - 0.5) * contrast + 0.5));
      const r = darkness * maxRadius;
      if (r > 0.18) {
        const x = (cx * cell + cell / 2).toFixed(1);
        const y = (ry * cell + cell / 2).toFixed(1);
        circles += `<circle cx='${x}' cy='${y}' r='${r.toFixed(2)}'/>`;
      }
    }
  }

  let grainMarkup = "";
  if (grain) {
    const grainCount = Math.floor((width * height) / 45);
    for (let i = 0; i < grainCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const px = Math.min(width - 1, x | 0);
      const py = Math.min(height - 1, y | 0);
      const darkness = 1 - gray[(py * width + px) * channels] / 255;
      if (Math.random() < 0.12 + darkness * 0.5) {
        const r = (Math.random() * 0.7 + 0.25).toFixed(2);
        grainMarkup += `<circle cx='${x.toFixed(1)}' cy='${y.toFixed(1)}' r='${r}'/>`;
      }
    }
  }

  const backdropRect =
    backdrop === "transparent"
      ? ""
      : `<rect width='100%' height='100%' fill='${backdrop}' fill-opacity='${backdropOpacity}'/>`;

  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' width='${width}' height='${height}'>${backdropRect}<g fill='${color}'>${circles}</g><g fill='${color}' fill-opacity='0.55'>${grainMarkup}</g></svg>`;
}

async function main() {
  const { input, output, opts } = parseArgs(process.argv.slice(2));

  const { data, info } = await sharp(input)
    .resize(opts.width, opts.height, { fit: "cover" })
    .removeAlpha()
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const svg = buildHalftoneSvg(data, info.width, info.height, info.channels, opts);

  if (output.endsWith(".svg")) {
    writeFileSync(output, svg);
  } else {
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(output);
  }

  console.log(`Wrote ${output} (${info.width}x${info.height}, cell=${opts.cell}, backdrop=${opts.backdrop})`);
}

main();
