import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

// Content guardrails for the rules documented in AGENTS.md and docs/DESIGN_LANGUAGE.md.
// Run with `npm run check:content`. Exits non-zero when a rule is violated.

const ARCHETYPES = ["index", "wall", "shelf", "ledger"];

// Collection pages must declare which archetype they follow. The expected
// archetype per page lives in src/_data/collectionViews.yaml (see
// utils/check-collections.mjs for the rest of the registry rules).
const COLLECTION_PAGES = Object.fromEntries(
  Object.values(
    load(await readFile("src/_data/collectionViews.yaml", "utf8")),
  ).map((entry) => [entry.page, entry.archetype]),
);

// Permanent content must carry an explicit `date` and 1-2 Title Case tags.
const CONTENT_DIRS = [
  "src/posts",
  "src/snippets",
  "src/notes",
  "src/prompts",
  "src/quotations",
  "src/folio",
];

// Tags that intentionally break Title Case casing.
const TAG_ALLOWLIST = new Set(["11ty", "iOS"]);
const DESCRIPTION_MAX = 120;

const problems = [];

function frontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  try {
    return load(match[1]) || {};
  } catch (error) {
    problems.push(`front matter is not parseable YAML: ${error.message}`);
    return null;
  }
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(entryPath)));
    else if (/\.(md|njk)$/.test(entry.name)) files.push(entryPath);
  }
  return files;
}

function isTitleCase(tag) {
  return /^[A-Z0-9][A-Za-z0-9]*(?:-[A-Z0-9][A-Za-z0-9]*)*$/.test(tag);
}

async function checkContentFiles() {
  for (const dir of CONTENT_DIRS) {
    let files;
    try {
      files = await walk(dir);
    } catch {
      continue; // directory removed
    }

    for (const file of files) {
      const rel = path.relative(process.cwd(), file);
      const base = path.basename(file);
      if (base.startsWith("_") || base === "README.md") continue;

      const data = frontMatter(await readFile(file, "utf8"));
      if (!data) continue;
      if (data.permalink === false) continue;

      const tags = Array.isArray(data.tags) ? data.tags : [];
      if (tags.length > 2) {
        problems.push(
          `${rel}: ${tags.length} tags "${tags.join(", ")}" (max 2)`,
        );
      }
      for (const tag of tags) {
        if (!TAG_ALLOWLIST.has(tag) && !isTitleCase(tag)) {
          problems.push(`${rel}: tag "${tag}" is not Title Case`);
        }
      }

      if (!data.date) {
        problems.push(`${rel}: missing explicit \`date\` in front matter`);
      }

      // The description is the subtitle under the title and the feed summary: keep it one line.
      if (
        dir === "src/posts" &&
        data.description &&
        String(data.description).length > DESCRIPTION_MAX
      ) {
        problems.push(
          `${rel}: \`description\` is ${String(data.description).length} chars (max ${DESCRIPTION_MAX})`,
        );
      }

      // Every blog post needs a unique thumbnail sketch (see the `sketches` skill, Part A).
      if (dir === "src/posts" && !base.includes("template")) {
        if (!data.image) {
          problems.push(
            `${rel}: missing \`image\` thumbnail (every post needs one; see .agents/skills/sketches)`,
          );
        } else {
          if (!data.imageAlt)
            problems.push(`${rel}: has \`image\` but no \`imageAlt\``);
          if (!/^https?:/.test(String(data.image))) {
            try {
              await access(path.join("src/static", String(data.image)));
            } catch {
              problems.push(
                `${rel}: image file not found at src/static${data.image}`,
              );
            }
          }
        }
      }
    }
  }
}

async function checkCollectionPages() {
  for (const [rel, expected] of Object.entries(COLLECTION_PAGES)) {
    let content;
    try {
      content = await readFile(rel, "utf8");
    } catch {
      problems.push(
        `${rel}: listed as a collection page but the file is missing`,
      );
      continue;
    }

    const data = frontMatter(content);
    const declared = data?.collectionArchetype;

    if (!declared) {
      problems.push(
        `${rel}: missing \`collectionArchetype\` (expected "${expected}")`,
      );
    } else if (!ARCHETYPES.includes(declared)) {
      problems.push(
        `${rel}: unknown archetype "${declared}" (use ${ARCHETYPES.join(", ")})`,
      );
    } else if (declared !== expected) {
      problems.push(
        `${rel}: declares "${declared}" but this page reads as "${expected}"`,
      );
    }
  }
}

async function main() {
  await checkContentFiles();
  await checkCollectionPages();

  if (problems.length > 0) {
    console.error(`\nContent checks failed (${problems.length}):`);
    for (const problem of problems) console.error(`  ✗ ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    "Content checks passed: tags, dates, and collection archetypes are within policy.",
  );
}

main().catch((error) => {
  console.error(`Content checks could not run: ${error.message}`);
  process.exitCode = 1;
});
