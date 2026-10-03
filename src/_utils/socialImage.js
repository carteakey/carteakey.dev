import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const previews = new Map();
const background = "#f4f3ee";

export function clearSocialImageCache() {
  previews.clear();
}

// Social crawlers cannot apply the site's dark-mode CSS to transparent ink.
// Keep the source for the page; give crawlers an opaque, uncropped derivative.
export async function resolveSocialImage(source, siteUrl, outputRoot) {
  const url = new URL(source, siteUrl);
  if (url.origin !== new URL(siteUrl).origin) {
    return { url: url.href };
  }

  const publicPath = decodeURIComponent(url.pathname);
  if (!publicPath.startsWith("/img/")) {
    return { url: url.href };
  }

  const sourcePath = path.resolve("src/static", `.${publicPath}`);
  const key = `${sourcePath}:${outputRoot}`;
  if (!previews.has(key)) {
    previews.set(
      key,
      (async () => {
        const input = await readFile(sourcePath);
        const metadata = await sharp(input).metadata();
        if (!metadata.hasAlpha || (await sharp(input).stats()).isOpaque) {
          return {
            path: publicPath,
            width: metadata.width,
            height: metadata.height,
          };
        }

        const hash = createHash("sha256")
          .update("social-paper-v1:1200x630:48:#f4f3ee")
          .update(input)
          .digest("hex")
          .slice(0, 12);
        const filename = `${path.parse(sourcePath).name}-${hash}.png`;
        const previewPath = `/img/og/${filename}`;
        const outputPath = path.join(outputRoot, previewPath.slice(1));
        await mkdir(path.dirname(outputPath), { recursive: true });
        await sharp(input)
          .flatten({ background })
          .resize(1104, 534, { fit: "contain", background })
          .extend({ top: 48, bottom: 48, left: 48, right: 48, background })
          .removeAlpha()
          .png()
          .toFile(outputPath);
        return { path: previewPath, width: 1200, height: 630 };
      })(),
    );
  }

  const preview = await previews.get(key);
  return { ...preview, url: new URL(preview.path, siteUrl).href };
}
