import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const outputDir = path.resolve(process.argv[2] || "_site");
const siteOrigin = "https://carteakey.dev";
const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

async function readOutput(relativePath) {
  return readFile(path.join(outputDir, relativePath), "utf8");
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await walk(entryPath) : [entryPath]));
  }

  return files;
}

function attribute(html, selectorPattern, attributeName) {
  const tag = html.match(selectorPattern)?.[0];
  return tag?.match(new RegExp(`${attributeName}=["']([^"']+)["']`, "i"))?.[1];
}

function jsonLdBlocks(html) {
  return [
    ...html.matchAll(
      /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((match) => match[1].trim());
}

async function verifyLocalImage(urlValue, label) {
  let parsed;

  try {
    parsed = new URL(urlValue);
  } catch {
    check(false, `${label} is an absolute URL`);
    return;
  }

  check(parsed.protocol === "https:", `${label} uses HTTPS`);

  if (parsed.origin === siteOrigin) {
    const localPath = path.join(
      outputDir,
      decodeURIComponent(parsed.pathname).replace(/^\//, ""),
    );
    try {
      await access(localPath);
      check(true, `${label} exists in the built site`);
    } catch {
      check(false, `${label} exists in the built site (${parsed.pathname})`);
    }
  }
}

async function verifyMetadata(html, label) {
  const canonical = attribute(
    html,
    /<link\b[^>]*rel=["']canonical["'][^>]*>/i,
    "href",
  );
  const ogUrl = attribute(
    html,
    /<meta\b[^>]*property=["']og:url["'][^>]*>/i,
    "content",
  );
  const ogImage = attribute(
    html,
    /<meta\b[^>]*property=["']og:image["'][^>]*>/i,
    "content",
  );
  const twitterCard = attribute(
    html,
    /<meta\b[^>]*name=["']twitter:card["'][^>]*>/i,
    "content",
  );
  const twitterUrl = attribute(
    html,
    /<meta\b[^>]*name=["']twitter:url["'][^>]*>/i,
    "content",
  );
  const twitterImage = attribute(
    html,
    /<meta\b[^>]*name=["']twitter:image["'][^>]*>/i,
    "content",
  );

  for (const [name, value] of Object.entries({
    canonical,
    ogUrl,
    ogImage,
    twitterUrl,
    twitterImage,
  })) {
    check(
      Boolean(value) &&
        URL.canParse(value) &&
        new URL(value).protocol === "https:",
      `${label}: ${name} is an absolute HTTPS URL`,
    );
  }

  check(
    twitterCard === "summary_large_image",
    `${label}: Twitter card is summary_large_image`,
  );
  check(
    canonical === ogUrl && canonical === twitterUrl,
    `${label}: canonical, Open Graph, and Twitter URLs agree`,
  );
  check(
    ogImage === twitterImage,
    `${label}: Open Graph and Twitter images agree`,
  );

  if (ogImage) {
    await verifyLocalImage(ogImage, `${label}: social image`);
  }

  const blocks = jsonLdBlocks(html);
  check(blocks.length > 0, `${label}: JSON-LD is present`);
  for (const [index, block] of blocks.entries()) {
    try {
      JSON.parse(block);
      check(true, `${label}: JSON-LD block ${index + 1} parses`);
    } catch (error) {
      check(
        false,
        `${label}: JSON-LD block ${index + 1} parses (${error.message})`,
      );
    }
  }
}

async function verifySocialPreview(html, label) {
  const meta = (property) =>
    attribute(
      html,
      new RegExp(`<meta\\b[^>]*property=["']${property}["'][^>]*>`, "i"),
      "content",
    );
  const source = meta("og:image");
  const twitterSource = attribute(
    html,
    /<meta\b[^>]*name=["']twitter:image["'][^>]*>/i,
    "content",
  );
  check(source === twitterSource, `${label}: social preview URLs agree`);
  if (!source || !URL.canParse(source)) {
    check(false, `${label}: social preview has a valid URL`);
    return;
  }
  const url = new URL(source);
  if (url.origin !== siteOrigin) return;
  const imagePath = path.join(
    outputDir,
    decodeURIComponent(url.pathname).replace(/^\//, ""),
  );
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const opaque = !metadata.hasAlpha || (await image.stats()).isOpaque;
    check(opaque, `${label}: social preview is opaque`);
    check(
      Number(meta("og:image:width")) === metadata.width &&
        Number(meta("og:image:height")) === metadata.height,
      `${label}: social dimensions match the actual image`,
    );
    check(
      !url.pathname.startsWith("/img/blog-sketches/"),
      `${label}: social preview uses a derivative, not the raw sketch`,
    );
    if (/\/img\/og\/.*-[a-f0-9]{12}\.png$/.test(url.pathname)) {
      check(
        metadata.width === 1200 && metadata.height === 630,
        `${label}: generated preview is 1200 × 630`,
      );
    }
  } catch (error) {
    check(false, `${label}: social preview can be read (${error.message})`);
  }
}

async function main() {
  const home = await readOutput("index.html");
  const archive = await readOutput("blog/index.html");
  const notes = await readOutput("notes/index.html");
  const projects = await readOutput("projects/index.html");
  const easterEggs = await readOutput("static/js/easter-eggs.js");
  const collectionViews = await readOutput("static/js/collection-views.js");
  const blogRoot = path.join(outputDir, "blog");
  const blogFiles = (await walk(blogRoot)).filter(
    (file) =>
      file.endsWith("index.html") && file !== path.join(blogRoot, "index.html"),
  );
  let representativePost;
  let representativePath;

  for (const file of blogFiles) {
    const html = await readFile(file, "utf8");
    if (html.includes('"@type": "BlogPosting"')) {
      representativePost ||= html;
      representativePath ||= path.relative(outputDir, file);
      await verifySocialPreview(
        html,
        `Post (${path.relative(outputDir, file)})`,
      );
    }
  }

  check(
    Boolean(representativePost),
    "A generated BlogPosting page is available for metadata checks",
  );
  check(
    home.includes("/static/js/easter-eggs.js"),
    "The shared layout loads the easter-egg script",
  );
  check(
    home.includes('src="/img/headshot-halftone.svg"'),
    "The home profile image uses the halftone portrait",
  );
  try {
    await access(path.join(outputDir, "img/headshot-halftone.svg"));
    check(true, "The halftone portrait exists in the built site");
  } catch {
    check(false, "The halftone portrait exists in the built site");
  }
  check(
    easterEggs.includes("konamiCode") &&
      easterEggs.includes("showSecretMessage") &&
      easterEggs.includes("sparkleMode"),
    "All three easter-egg triggers remain in the script",
  );
  check(
    archive.includes("feed-list-row") &&
      archive.includes("feed-list-row-thumb"),
    "The post list keeps its shared row and thumbnail classes",
  );
  check(
    archive.includes('class="collection-list"') &&
      archive.includes("collection-wall feed-masonry") &&
      archive.includes("collectionView('blog-view', 'list'"),
    "Writing renders its list and wall views through the collection engine",
  );
  check(
    projects.includes("projects-collection-grid") &&
      projects.includes("['grid', 'list']"),
    "Projects keeps both wall and list layouts",
  );
  check(
    projects.includes("collectionView('projects-view', 'grid'"),
    "Projects defaults to the project wall",
  );
  check(
    notes.includes("['stream', 'list']") &&
      notes.includes("data-collection-index"),
    "Notes renders stream and list layouts through the collection engine",
  );
  check(
    notes.includes("collectionView('notes-view', 'stream'"),
    "Notes defaults to the reading stream",
  );
  check(
    collectionViews.includes("localStorage.setItem") &&
      collectionViews.includes("feed:layout"),
    "Collection view preferences persist and relayout masonry grids",
  );
  try {
    await access(path.join(outputDir, "hi/index.html"));
    check(
      false,
      "The Hindi proof page remains unpublished while translation work is paused",
    );
  } catch {
    check(
      true,
      "The Hindi proof page remains unpublished while translation work is paused",
    );
  }

  await verifyMetadata(home, "Home page");
  await verifySocialPreview(home, "Home page");
  if (representativePost) {
    await verifyMetadata(
      representativePost,
      `Post page (${representativePath})`,
    );
  }

  for (const message of passes) {
    console.log(`✓ ${message}`);
  }

  if (failures.length > 0) {
    for (const message of failures) {
      console.error(`✗ ${message}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`\n${passes.length} UI smoke checks passed.`);
}

main().catch((error) => {
  console.error(`UI verification could not run: ${error.message}`);
  process.exitCode = 1;
});
