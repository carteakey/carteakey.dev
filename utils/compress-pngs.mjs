#!/usr/bin/env node
// Losslessly recompress PNG assets: identical pixels, smaller files.
// Only rewrites a file when the recompressed version is actually smaller.
//
//   node ./utils/compress-pngs.mjs src/static/img/blog-sketches
//   node ./utils/compress-pngs.mjs --check src/static/img   # report only

import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const args = process.argv.slice(2);
const reportOnly = args[0] === "--check";
const roots = (reportOnly ? args.slice(1) : args).length ? args.slice(reportOnly ? 1 : 0) : ["src/static/img"];

async function* pngFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* pngFiles(fullPath);
    } else if (entry.name.toLowerCase().endsWith(".png")) {
      yield fullPath;
    }
  }
}

let totalBefore = 0;
let totalAfter = 0;
let touched = 0;
let skipped = 0;

for (const root of roots) {
  try {
    await stat(root);
  } catch {
    console.warn(`Skipping missing path: ${root}`);
    continue;
  }

  for await (const file of pngFiles(root)) {
    let original;
    try {
      original = await readFile(file);
    } catch (error) {
      console.warn(`Read failed for ${file}: ${error.message}`);
      continue;
    }

    let optimized;
    try {
      optimized = await sharp(original).png({ compressionLevel: 9, effort: 9, adaptiveFiltering: true }).toBuffer();
    } catch (error) {
      console.warn(`Encode failed for ${file}: ${error.message}`);
      continue;
    }

    totalBefore += original.length;
    totalAfter += Math.min(original.length, optimized.length);

    if (optimized.length >= original.length) {
      skipped += 1;
      continue;
    }

    if (!reportOnly) {
      await writeFile(file, optimized);
    }
    touched += 1;
    console.log(
      `${reportOnly ? "would shrink" : "shrunk"} ${file}: ${original.length} -> ${optimized.length} (-${((1 - optimized.length / original.length) * 100).toFixed(1)}%)`,
    );
  }
}

const saved = totalBefore - totalAfter;
console.log(
  `\n${reportOnly ? "Recompressible" : "Rewrote"} ${touched} file(s), left ${skipped} unchanged. Scanned ${totalBefore} bytes, would save ${saved} bytes (${((saved / totalBefore) * 100 || 0).toFixed(1)}%).`,
);
