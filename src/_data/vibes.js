import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const allowedExtensions = new Set([
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

function toDisplayName(filename) {
  return filename
    .replace(path.extname(filename), "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Returns an array of [url, [width, height]] for images under /img/vibes/
export default async function () {
  const srcDir = path.resolve("src/static/img/vibes");
  const urlBase = "/img/vibes";

  let rawEntries = [];
  try {
    const files = await fs.readdir(srcDir);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (!allowedExtensions.has(ext)) continue;

      const abs = path.join(srcDir, file);

      try {
        const [meta, stats] = await Promise.all([
          sharp(abs).metadata(),
          fs.stat(abs),
        ]);

        if (!meta?.width || !meta?.height) continue;

        const birth = stats.birthtime instanceof Date ? stats.birthtime : null;
        const timestamp = birth && !Number.isNaN(birth.valueOf()) ? birth : stats.mtime;

        rawEntries.push({
          url: `${urlBase}/${file}`,
          width: meta.width,
          height: meta.height,
          filename: file,
          date: timestamp,
        });
      } catch (_) {
        // Ignore files sharp can't read or stat failures
        continue;
      }
    }
  } catch (_) {
    rawEntries = [];
  }

  const list = rawEntries.map((entry) => [entry.url, [entry.width, entry.height]]);
  const feed = rawEntries.map((entry) => {
    const displayName = toDisplayName(entry.filename) || "Vibe";
    return {
      title: displayName,
      date: entry.date,
      url: entry.url,
      media: {
        src: entry.url,
        alt: displayName,
        width: entry.width,
        height: entry.height,
      },
    };
  });

  return { list, feed };
}
