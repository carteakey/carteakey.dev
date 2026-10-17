import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

// Every page that declares `collectionArchetype` must have a deliberate entry in
// src/_data/collectionViews.yaml (engine or bespoke, with a reason), so no
// collection layout exists by accident.

const REGISTRY = "src/_data/collectionViews.yaml";
const VIEWS = new Set(["stream", "list", "grid"]);
const GROUPS = new Set([undefined, "none", "year", "alpha"]);
const FILTERS = new Set(["authorship", "saved", "type"]);

const registry = load(await readFile(REGISTRY, "utf8"));
const errors = [];

const walk = async (dir) => {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(njk|md|html)$/.test(entry.name)) out.push(full);
  }
  return out;
};

const pages = new Map();
for (const file of await walk("src")) {
  const text = await readFile(file, "utf8");
  const frontMatter = text.startsWith("---")
    ? text.slice(3, text.indexOf("\n---", 3))
    : "";
  const match = frontMatter.match(/^collectionArchetype:\s*(\S+)/m);
  if (match) pages.set(file, { archetype: match[1], text });
}

const registered = new Set();
for (const [key, entry] of Object.entries(registry)) {
  const where = `${REGISTRY} → ${key}`;
  if (!entry.page) {
    errors.push(`${where}: missing \`page\``);
    continue;
  }
  registered.add(entry.page);
  if (!entry.why) errors.push(`${where}: missing \`why\``);
  if (typeof entry.engine !== "boolean")
    errors.push(`${where}: \`engine\` must be true or false`);

  const page = pages.get(entry.page);
  if (!page) {
    errors.push(
      `${where}: ${entry.page} does not exist or declares no collectionArchetype`,
    );
    continue;
  }
  if (page.archetype !== entry.archetype) {
    errors.push(
      `${where}: archetype ${entry.archetype} disagrees with ${entry.page} (${page.archetype})`,
    );
  }

  if (!entry.engine) continue;
  if (!new RegExp(`collectionKey = "${key}"`).test(page.text)) {
    errors.push(
      `${where}: ${entry.page} does not set collectionKey = "${key}"`,
    );
  }
  if (!Array.isArray(entry.types) || !entry.types.length)
    errors.push(`${where}: \`types\` must list feed types`);
  if (
    !Array.isArray(entry.views) ||
    !entry.views.length ||
    entry.views.some((view) => !VIEWS.has(view))
  ) {
    errors.push(
      `${where}: \`views\` must be a non-empty list of stream | list | grid`,
    );
  }
  if (!GROUPS.has(entry.group))
    errors.push(`${where}: unknown group ${entry.group}`);
  for (const filter of entry.filters || []) {
    if (!FILTERS.has(filter)) errors.push(`${where}: unknown filter ${filter}`);
  }
}

for (const file of pages.keys()) {
  if (!registered.has(file)) {
    errors.push(
      `${file} declares collectionArchetype but has no entry in ${REGISTRY}`,
    );
  }
}

if (errors.length) {
  console.error(`Collection registry check failed:\n- ${errors.join("\n- ")}`);
  process.exitCode = 1;
} else {
  const engine = Object.values(registry).filter((entry) => entry.engine).length;
  console.log(
    `Collection registry OK: ${pages.size} pages (${engine} on the engine, ${pages.size - engine} bespoke).`,
  );
}
