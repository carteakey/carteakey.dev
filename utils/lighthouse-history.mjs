#!/usr/bin/env node
// Appends one Lighthouse CI run to src/_data/lighthouse.json, which /stats/
// charts. Reads lighthouse-reports/manifest.json (lighthouserc.cjs, filesystem
// upload) and keeps the representative (median) run of each URL.
//
//   node utils/lighthouse-history.mjs [--source "label"]
//
// Also prints a Markdown digest of failing audits; the monthly workflow sends it
// to the job summary so the next fix starts from a list, not a report dump.
import { readFile, writeFile } from "node:fs/promises";

const DATA = "src/_data/lighthouse.json";
const MANIFEST = "lighthouse-reports/manifest.json";
const sourceArg = process.argv.indexOf("--source");
const source =
  sourceArg > -1
    ? process.argv[sourceArg + 1]
    : "Lighthouse CI, monthly workflow";

const score = (v) => (v == null ? null : Math.round(v * 100));
const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));

const pages = {};
const digest = [];
for (const run of manifest.filter((r) => r.isRepresentativeRun)) {
  const report = JSON.parse(await readFile(run.jsonPath, "utf8"));
  const path = new URL(run.url).pathname;
  const audit = (id) => report.audits[id]?.numericValue;
  pages[path] = {
    performance: score(run.summary.performance),
    accessibility: score(run.summary.accessibility),
    bestPractices: score(run.summary["best-practices"]),
    seo: score(run.summary.seo),
    lcp: Math.round(audit("largest-contentful-paint") ?? 0),
    cls: Math.round((audit("cumulative-layout-shift") ?? 0) * 1000) / 1000,
    tbt: Math.round(audit("total-blocking-time") ?? 0),
  };

  // Failing audits that carry weight in a category, heaviest first.
  const failing = [];
  for (const [category, { auditRefs }] of Object.entries(report.categories)) {
    for (const ref of auditRefs) {
      const a = report.audits[ref.id];
      if (ref.weight > 0 && a?.score !== null && a?.score < 0.9)
        failing.push({
          category,
          title: a.title,
          value: a.displayValue,
          weight: ref.weight,
        });
    }
  }
  failing.sort((a, b) => b.weight - a.weight);
  digest.push(`### ${path}`, "");
  for (const f of failing.slice(0, 8))
    digest.push(
      `- **${f.category}**: ${f.title}${f.value ? ` (${f.value})` : ""}`,
    );
  if (!failing.length) digest.push("- Nothing failing.");
  digest.push("");
}

if (!Object.keys(pages).length) {
  console.error(`No representative runs in ${MANIFEST}.`);
  process.exit(1);
}

let data = { headline: "/", runs: [] };
try {
  data = { ...data, ...JSON.parse(await readFile(DATA, "utf8")) };
} catch (_) {
  // first run
}

const date = new Date().toISOString().slice(0, 10);
data.runs = data.runs.filter((r) => r.date !== date);
data.runs.push({ date, source, pages });
data.runs.sort((a, b) => a.date.localeCompare(b.date));

await writeFile(DATA, `${JSON.stringify(data, null, 2)}\n`);
console.log(`## Lighthouse ${date}\n\n${digest.join("\n")}`);
