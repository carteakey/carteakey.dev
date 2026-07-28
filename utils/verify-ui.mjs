import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

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
  return [...html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1].trim());
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
    const localPath = path.join(outputDir, decodeURIComponent(parsed.pathname).replace(/^\//, ""));
    try {
      await access(localPath);
      check(true, `${label} exists in the built site`);
    } catch {
      check(false, `${label} exists in the built site (${parsed.pathname})`);
    }
  }
}

async function verifyMetadata(html, label) {
  const canonical = attribute(html, /<link\b[^>]*rel=["']canonical["'][^>]*>/i, "href");
  const ogUrl = attribute(html, /<meta\b[^>]*property=["']og:url["'][^>]*>/i, "content");
  const ogImage = attribute(html, /<meta\b[^>]*property=["']og:image["'][^>]*>/i, "content");
  const twitterCard = attribute(html, /<meta\b[^>]*name=["']twitter:card["'][^>]*>/i, "content");
  const twitterUrl = attribute(html, /<meta\b[^>]*name=["']twitter:url["'][^>]*>/i, "content");
  const twitterImage = attribute(html, /<meta\b[^>]*name=["']twitter:image["'][^>]*>/i, "content");

  for (const [name, value] of Object.entries({ canonical, ogUrl, ogImage, twitterUrl, twitterImage })) {
    check(Boolean(value) && URL.canParse(value) && new URL(value).protocol === "https:", `${label}: ${name} is an absolute HTTPS URL`);
  }

  check(twitterCard === "summary_large_image", `${label}: Twitter card is summary_large_image`);
  check(canonical === ogUrl && canonical === twitterUrl, `${label}: canonical, Open Graph, and Twitter URLs agree`);
  check(ogImage === twitterImage, `${label}: Open Graph and Twitter images agree`);

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
      check(false, `${label}: JSON-LD block ${index + 1} parses (${error.message})`);
    }
  }
}

async function main() {
  const home = await readOutput("index.html");
  const archive = await readOutput("blog/index.html");
  const easterEggs = await readOutput("static/js/easter-eggs.js");
  const blogRoot = path.join(outputDir, "blog");
  const blogFiles = (await walk(blogRoot))
    .filter((file) => file.endsWith("index.html") && file !== path.join(blogRoot, "index.html"));
  let representativePost;
  let representativePath;

  for (const file of blogFiles) {
    const html = await readFile(file, "utf8");
    if (html.includes('"@type": "BlogPosting"')) {
      representativePost = html;
      representativePath = path.relative(outputDir, file);
      break;
    }
  }

  check(Boolean(representativePost), "A generated BlogPosting page is available for metadata checks");
  check(home.includes("/static/js/easter-eggs.js"), "The shared layout loads the easter-egg script");
  check(easterEggs.includes("konamiCode") && easterEggs.includes("showSecretMessage") && easterEggs.includes("sparkleMode"), "All three easter-egg triggers remain in the script");
  check(archive.includes("sm:flex-row") && archive.includes("hidden sm:block"), "The post list keeps its responsive row and thumbnail classes");
  check(archive.includes('id="blogList"') && archive.includes('id="blogGrid"'), "Both post list views are rendered");
  try {
    await access(path.join(outputDir, "hi/index.html"));
    check(false, "The Hindi proof page remains unpublished while translation work is paused");
  } catch {
    check(true, "The Hindi proof page remains unpublished while translation work is paused");
  }

  await verifyMetadata(home, "Home page");
  if (representativePost) {
    await verifyMetadata(representativePost, `Post page (${representativePath})`);
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
