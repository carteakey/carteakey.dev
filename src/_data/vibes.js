import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Returns an array of [url, [width, height]] for images under /img/vibes/
export default async function () {
  const srcDir = path.resolve("src/static/img/vibes");
  const urlBase = "/img/vibes";

  let entries = [];
  try {
    const files = await fs.readdir(srcDir);
    // Only include common image extensions
    const allowed = new Set([
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".avif",
      ".tiff",
      ".bmp",
      ".heic",
      ".heif",
    ]);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!allowed.has(ext)) continue;
      const abs = path.join(srcDir, file);
      try {
        const meta = await sharp(abs).metadata();
        if (meta && meta.width && meta.height) {
          entries.push([`${urlBase}/${file}`, [meta.width, meta.height]]);
        }
      } catch (_) {
        // Ignore files sharp can't read
        continue;
      }
    }
  } catch (_) {
    // Directory might not exist yet—return empty list.
    entries = [];
  }

  return { list: entries };
}
