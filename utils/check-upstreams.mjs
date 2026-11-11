#!/usr/bin/env node
// Report drift between .agents/sources.yaml and the upstreams it pins.
// Read-only: prints what changed and how to refresh; never edits files.
//
//   npm run check:upstreams            # report, exit 0
//   npm run check:upstreams -- --strict  # exit 1 if anything drifted
//
// Uses GITHUB_TOKEN if set (unauthenticated GitHub API allows 60 req/hour).

import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const MANIFEST = path.join(ROOT, ".agents/sources.yaml");
const strict = process.argv.includes("--strict");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "check-upstreams",
};
if (process.env.GITHUB_TOKEN)
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function gh(apiPath) {
  const res = await fetch(`https://api.github.com${apiPath}`, { headers });
  if (!res.ok)
    throw new Error(`${res.status} ${res.statusText} for ${apiPath}`);
  return res.json();
}

function versionParts(tag, prefix) {
  return tag
    .slice(prefix.length)
    .replace(/^v/, "")
    .split(/[.-]/)
    .map((p) => (/^\d+$/.test(p) ? Number(p) : p));
}

function compareTags(a, b, prefix) {
  const pa = versionParts(a, prefix);
  const pb = versionParts(b, prefix);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x === y) continue;
    if (typeof x === "number" && typeof y === "number") return x - y;
    return String(x).localeCompare(String(y));
  }
  return 0;
}

async function latestTag(src) {
  const prefix = src.tag_prefix ?? "";
  const tags = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh(`/repos/${src.repo}/tags?per_page=100&page=${page}`);
    tags.push(...batch.map((t) => t.name));
    if (batch.length < 100) break;
  }
  const matching = tags.filter(
    (t) => t.startsWith(prefix) && /\d/.test(t.slice(prefix.length)),
  );
  if (!matching.length)
    throw new Error(`no tags matching "${prefix}" in ${src.repo}`);
  return matching.sort((a, b) => compareTags(a, b, prefix)).at(-1);
}

async function check(src) {
  if (src.kind === "git-tag") {
    const latest = await latestTag(src);
    const drift = compareTags(latest, src.pinned, src.tag_prefix ?? "") > 0;
    return {
      drift,
      latest,
      link: drift
        ? `https://github.com/${src.repo}/compare/${src.pinned}...${latest}`
        : `https://github.com/${src.repo}/releases/tag/${latest}`,
    };
  }
  if (src.kind === "gist") {
    const g = await gh(`/gists/${src.gist}`);
    const drift = new Date(g.updated_at) > new Date(src.pinned);
    return { drift, latest: g.updated_at, link: `${g.html_url}/revisions` };
  }
  throw new Error(`unknown kind "${src.kind}"`);
}

const { sources } = loadYaml(fs.readFileSync(MANIFEST, "utf8"));
let drifted = 0;
let failed = 0;

for (const src of sources) {
  try {
    const r = await check(src);
    if (r.drift) {
      drifted++;
      console.log(
        `DRIFT  ${src.id}: pinned ${src.pinned} -> upstream ${r.latest}`,
      );
      console.log(`       ${r.link}`);
      console.log(
        `       use: ${src.use}; refresh: ${src.refresh ?? "see .agents/skills/update-skill/SKILL.md"}`,
      );
    } else {
      console.log(`ok     ${src.id}: ${src.pinned}`);
    }
  } catch (err) {
    failed++;
    console.log(`WARN   ${src.id}: could not check (${err.message})`);
  }
}

console.log(
  `\n${sources.length} sources, ${drifted} drifted, ${failed} unchecked.`,
);
if (drifted)
  console.log(
    "Update pinned in .agents/sources.yaml only after merging the change.",
  );
process.exit(strict && drifted ? 1 : 0);
