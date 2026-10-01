#!/usr/bin/env node
// Design and consistency lint for carteakey.dev (docs/DESIGN_LANGUAGE.md,
// AGENTS.md rule 6). It is a RATCHET: existing debt is recorded in
// utils/design-baseline.json and may only go down. Any new violation, or any
// file getting worse, fails. Fixing debt and re-snapshotting locks the gain in.
//
//   node utils/check-design.mjs                    check (exit 1 on regression)
//   node utils/check-design.mjs --update-baseline  re-snapshot (refuses if anything got worse)
//   node utils/check-design.mjs --update-baseline --force   allow increases (say why in the commit)
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "js-yaml";

const BASELINE = "utils/design-baseline.json";
const args = new Set(process.argv.slice(2));

// ── Template rules: counted per file, compared with the baseline ───────────
const TEMPLATE_RULES = {
  "soft-radius": /\brounded-(lg|xl|2xl|3xl)\b/g,
  "pill-or-circle": /\brounded-full\b/g,
  "soft-shadow": /\bshadow-(md|lg|xl|2xl)\b/g,
  gradient: /\b(bg-gradient-to-[a-z]+|backdrop-blur[a-z-]*)\b/g,
  "off-palette-colour":
    /\b(?:text|bg|border|from|to|via)-(?:teal|emerald|rose|amber|purple|indigo|violet|pink|fuchsia|cyan|sky|lime|orange|green|red|yellow)-\d{2,3}\b/g,
  "utility-text-stack":
    /text-(?:xs|sm)[^"'`]*text-(?:gray|stone|zinc|slate)-\d+/g,
  "inline-style": / style="/g,
};

// ── Post rules: raw markup that should be a shortcode or a shared class ───
const POST_RULES = {
  "raw-html-block":
    /<(?:div|svg|table|section|figure|style|script|canvas|iframe)\b/g,
  "class-attribute": /\sclass="/g,
  "utility-class-in-post":
    /\b(?:rounded-(?:lg|xl|2xl)|shadow-(?:md|lg|xl)|bg-(?:teal|emerald|rose|amber)-\d+)\b/g,
};

const AUTHORED_BY = new Set(["human", "ai-assisted", "ai-generated"]);
const CONTENT_DIRS = [
  "src/posts",
  "src/notes",
  "src/snippets",
  "src/prompts",
  "src/quotations",
  "src/folio",
  "src/lexicon",
];

async function walk(dir, exts) {
  let out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(await walk(p, exts));
    else if (exts.some((x) => e.name.endsWith(x))) out.push(p);
  }
  return out;
}

function frontMatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return { data: {}, body: text };
  let data = {};
  try {
    data = load(m[1]) || {};
  } catch {
    /* check-content reports unparseable front matter */
  }
  return { data, body: text.slice(m[0].length) };
}

const stripCode = (s) =>
  s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
const count = (s, re) => (s.match(re) || []).length;

const hardErrors = []; // rules with no baseline: always fail
const counts = {}; // { file: { rule: n } } for ratcheted rules
const add = (file, rule, n) => {
  if (!n) return;
  (counts[file] ||= {})[rule] = n;
};

// ── 1. Templates ───────────────────────────────────────────────────────────
for (const file of await walk("src", [".njk"])) {
  const text = await readFile(file, "utf8");
  for (const [rule, re] of Object.entries(TEMPLATE_RULES))
    add(file, rule, count(text, re));
}

// ── 2. Posts and notes: markup, frontmatter, changelog ─────────────────────
const knownTagsSeen = new Set();
for (const dir of CONTENT_DIRS) {
  for (const file of await walk(dir, [".md"])) {
    const base = path.basename(file);
    if (
      base.startsWith("_") ||
      base === "README.md" ||
      file.includes("template")
    )
      continue;
    const { data, body } = frontMatter(await readFile(file, "utf8"));
    const isPost = dir === "src/posts";
    const isLong = isPost || dir === "src/notes";

    if (isPost) {
      const prose = stripCode(body);
      for (const [rule, re] of Object.entries(POST_RULES))
        add(file, rule, count(prose, re));
    }

    for (const t of Array.isArray(data.tags) ? data.tags : [])
      knownTagsSeen.add(String(t));

    if (data.authored_by !== undefined && !AUTHORED_BY.has(data.authored_by)) {
      hardErrors.push(
        `${file}: authored_by "${data.authored_by}" is invalid (use human, ai-assisted, or ai-generated)`,
      );
    }
    if (isLong && data.authored_by === undefined)
      add(file, "missing-authored_by", 1);

    if (isPost) {
      const cl = body.match(
        /^## [^\n]*Changelog[^\n]*\n\n\| Date \| Note \|\n\| --- \| --- \|\n((?:\|[^\n]*\n?)+)/m,
      );
      if (cl) {
        const dates = [...cl[1].matchAll(/^\|\s*(\d{4}-\d\d-\d\d)\s*\|/gm)].map(
          (m) => m[1],
        );
        const newest = [...dates].sort().at(-1);
        if (dates.length > 1 && dates[0] < dates[dates.length - 1]) {
          hardErrors.push(
            `${file}: changelog is oldest-first; keep it newest-first like the template`,
          );
        }
        const updated = data.updated
          ? String(
              data.updated instanceof Date
                ? data.updated.toISOString().slice(0, 10)
                : data.updated,
            )
          : null;
        if (newest && updated && updated < newest) {
          hardErrors.push(
            `${file}: updated ${updated} is older than the newest changelog row ${newest}`,
          );
        }
      } else if (
        data.updated &&
        String(data.updated) !==
          String(
            data.date instanceof Date
              ? data.date.toISOString().slice(0, 10)
              : data.date,
          )
      ) {
        add(file, "updated-without-changelog", 1);
      }
    }
  }
}

// ── 3. Tag registry: new tags must be added deliberately ───────────────────
let baseline = { counts: {}, knownTags: [] };
try {
  baseline = JSON.parse(await readFile(BASELINE, "utf8"));
} catch {
  /* first run */
}
const registry = new Set(baseline.knownTags || []);
const newTags = [...knownTagsSeen].filter((t) => !registry.has(t));

// ── Compare with the baseline ──────────────────────────────────────────────
const regressions = [];
let remaining = 0;
for (const [file, rules] of Object.entries(counts)) {
  for (const [rule, n] of Object.entries(rules)) {
    remaining += n;
    const allowed = baseline.counts?.[file]?.[rule] ?? 0;
    if (n > allowed) regressions.push(`${file}: ${rule} ${allowed} -> ${n}`);
  }
}

if (args.has("--update-baseline")) {
  if ((regressions.length || newTags.length) && !args.has("--force")) {
    console.error(
      "Refusing to update the baseline: things got worse. Fix them, or re-run with --force and explain why.",
    );
    [...regressions, ...newTags.map((t) => `new tag "${t}"`)].forEach((r) =>
      console.error("  ✗ " + r),
    );
    process.exit(1);
  }
  const sorted = Object.fromEntries(
    Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
  );
  const tags = [
    ...new Set([...(args.has("--force") ? registry : []), ...knownTagsSeen]),
  ].sort();
  await writeFile(
    BASELINE,
    JSON.stringify({ counts: sorted, knownTags: tags }, null, 2) + "\n",
  );
  console.log(
    `Baseline updated: ${remaining} known violations across ${Object.keys(sorted).length} files, ${tags.length} registered tags.`,
  );
  process.exit(0);
}

const problems = [
  ...hardErrors,
  ...regressions.map(
    (r) =>
      `${r} (new design drift; use a shared class/shortcode, or fix an existing one to make room)`,
  ),
  ...newTags.map(
    (t) =>
      `tag "${t}" is not in the tag registry (reuse an existing tag, or add it deliberately with --update-baseline --force)`,
  ),
];

if (problems.length) {
  console.error(`\nDesign checks failed (${problems.length}):`);
  problems.forEach((p) => console.error("  ✗ " + p));
  console.error("\nSee docs/DESIGN_LANGUAGE.md and AGENTS.md rule 6.");
  process.exit(1);
}
console.log(
  `Design checks passed (${remaining} known violations remain in the baseline; none new).`,
);
