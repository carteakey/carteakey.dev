#!/usr/bin/env node
import { readFile, writeFile, utimes } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SNAPSHOT_FILE = path.resolve("utils/post-snapshots.json");
const DATA_LOADER_FILE = path.resolve("src/_data/postSnapshots.js");

async function touchDataLoader() {
  if (existsSync(DATA_LOADER_FILE)) {
    const now = new Date();
    await utimes(DATA_LOADER_FILE, now, now);
  }
}

function extractFrontMatterAndBody(raw) {
  if (!raw.startsWith("---")) return { fm: "", body: raw };
  const parts = raw.split(/^---\r?\n/m);
  if (parts.length < 3) return { fm: "", body: raw };
  const fm = parts[1];
  const body = parts.slice(2).join("---\n");
  return { fm, body };
}

export function computeMetrics(markdownBody) {
  // Strip fenced code blocks and liquid/nunjucks shortcodes for prose metrics
  const withoutCode = markdownBody
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\{%[\s\S]*?%\}/g, " ");
  // Also strip markdown tables for pure prose metrics
  const proseOnly = withoutCode
    .split("\n")
    .filter((line) => !line.trim().startsWith("|"))
    .join("\n");

  const wordsArr = proseOnly.match(/\b[\w'-]+\b/g) || [];
  const words = wordsArr.length || 1;
  const k = 1000 / words;

  const numbers = (
    proseOnly.match(
      /\b\d+(?:\.\d+)?(?:%|x|×|k|B|GB|GiB|MB|MiB|tok\/s|t\/s)?\b/g,
    ) || []
  ).length;
  const bolds = (proseOnly.match(/\*\*[^*\n]+\*\*/g) || []).length;
  const inlineCode = (proseOnly.match(/`[^`\n]+`/g) || []).length;
  const emDashes = (proseOnly.match(/—/g) || []).length;
  const contractions = (
    proseOnly.match(
      /\b(?:I'm|I've|I'd|I'll|you're|you've|you'll|it's|don't|doesn't|didn't|can't|won't|isn't|aren't|wasn't|weren't|haven't|hasn't|hadn't|wouldn't|couldn't|shouldn't|that's|there's|what's|who's|let's|we're|we've|they're)\b/gi,
    ) || []
  ).length;
  const firstPerson = (proseOnly.match(/\b(?:I|me|my|mine|myself)\b/g) || [])
    .length;

  return {
    words,
    numbersPer1k: Number((numbers * k).toFixed(1)),
    boldPer1k: Number((bolds * k).toFixed(1)),
    codePer1k: Number((inlineCode * k).toFixed(1)),
    emDashes,
    contractionsPer1k: Number((contractions * k).toFixed(1)),
    firstPersonPer1k: Number((firstPerson * k).toFixed(1)),
  };
}

function extractPostBodyHtml(fullHtml) {
  const startMarker = '<div class="post-body';
  const startIdx = fullHtml.indexOf(startMarker);
  if (startIdx === -1) return "";
  const openTagEnd = fullHtml.indexOf(">", startIdx);
  if (openTagEnd === -1) return "";

  // Find matching closing </div> by counting nested divs
  let depth = 1;
  let pos = openTagEnd + 1;
  while (depth > 0 && pos < fullHtml.length) {
    const nextOpen = fullHtml.indexOf("<div", pos);
    const nextClose = fullHtml.indexOf("</div>", pos);
    if (nextClose === -1) break;
    if (nextOpen !== -1 && nextOpen < nextClose) {
      depth++;
      pos = nextOpen + 4;
    } else {
      depth--;
      if (depth === 0) {
        return fullHtml.slice(openTagEnd + 1, nextClose).trim();
      }
      pos = nextClose + 6;
    }
  }
  return "";
}

function toSlug(fileOrSlug) {
  const base = path.basename(fileOrSlug, ".md");
  return base.replace(/^\d{4}-\d{2}-\d{2}-/, "");
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const diffOnly = args.includes("--diff");
  const clearMode = args.includes("--clear");
  const clearAll = args.includes("--clear-all");
  const listMode = args.includes("--list");
  const files = args.filter((a) => !a.startsWith("--"));

  let snapshots = {};
  if (existsSync(SNAPSHOT_FILE)) {
    snapshots = JSON.parse(await readFile(SNAPSHOT_FILE, "utf8"));
  }

  if (listMode) {
    const keys = Object.keys(snapshots);
    if (keys.length === 0) {
      console.log("No active post snapshots.");
    } else {
      console.log(`Active post snapshots (${keys.length}):`);
      for (const k of keys) {
        console.log(`  - ${k} (${snapshots[k].sourceFile})`);
      }
    }
    return;
  }

  if (clearAll) {
    await writeFile(SNAPSHOT_FILE, "{}\n");
    await touchDataLoader();
    console.log(
      "[cleared] Removed all post snapshots. Diff workbench is now off locally.",
    );
    return;
  }

  if (clearMode) {
    if (files.length === 0) {
      console.error(
        "Usage: node utils/snapshot-post.mjs --clear <post.md | slug...>",
      );
      process.exit(1);
    }
    for (const f of files) {
      const slug = toSlug(f);
      if (snapshots[slug]) {
        delete snapshots[slug];
        console.log(`[cleared] Removed snapshot for "${slug}".`);
      } else {
        console.log(`[skip] No snapshot found for "${slug}".`);
      }
    }
    await writeFile(SNAPSHOT_FILE, JSON.stringify(snapshots, null, 2) + "\n");
    await touchDataLoader();
    return;
  }

  if (files.length === 0) {
    console.error(
      "Usage: node utils/snapshot-post.mjs [--force | --diff | --clear | --clear-all | --list] <post.md...>",
    );
    process.exit(1);
  }

  for (const file of files) {
    const absPath = path.resolve(file);
    const slug = toSlug(absPath);

    const rawMd = await readFile(absPath, "utf8");
    const { body } = extractFrontMatterAndBody(rawMd);
    const metrics = computeMetrics(body);

    if (diffOnly) {
      const snap = snapshots[slug];
      if (!snap) {
        console.log(`[no-snapshot] "${slug}":`, metrics);
      } else {
        console.log(`=== ${slug} ===`);
        console.table({
          Before: snap.beforeMetrics,
          After: metrics,
        });
      }
      continue;
    }

    if (snapshots[slug] && !force) {
      console.log(
        `[skip] Snapshot for "${slug}" already exists (use --force to overwrite).`,
      );
      continue;
    }

    // Find built HTML in _site/blog/
    const relFromPosts = path.relative(path.resolve("src/posts"), absPath);
    const dirPart = path.dirname(relFromPosts);
    const candidates = [
      path.resolve(
        "_site/blog",
        dirPart === "." ? "" : dirPart,
        slug,
        "index.html",
      ),
      path.resolve("_site/blog", slug, "index.html"),
    ];

    let beforeHtml = "";
    for (const c of candidates) {
      if (existsSync(c)) {
        const fullHtml = await readFile(c, "utf8");
        beforeHtml = extractPostBodyHtml(fullHtml);
        if (beforeHtml) break;
      }
    }

    if (!beforeHtml) {
      console.warn(
        `[warn] Could not find rendered .post-body in _site for "${slug}". Run build first.`,
      );
    }

    snapshots[slug] = {
      slug,
      sourceFile: path.relative(process.cwd(), absPath),
      capturedAt: new Date().toISOString(),
      beforeMetrics: metrics,
      beforeMarkdown: body.trim(),
      beforeHtml,
    };

    console.log(
      `[saved] Snapshot for "${slug}" (${metrics.words} words, ${metrics.numbersPer1k} nums/1k, ${metrics.boldPer1k} bolds/1k, ${metrics.emDashes} em-dashes, html=${beforeHtml.length} chars)`,
    );
  }

  if (!diffOnly) {
    await writeFile(SNAPSHOT_FILE, JSON.stringify(snapshots, null, 2) + "\n");
    await touchDataLoader();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
