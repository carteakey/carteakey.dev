import { readFileSync } from "fs";
import { execSync } from "child_process";
import markdownIt from "markdown-it";
import { load } from "js-yaml";

// Builds /changelog/ as months: a written summary (changelogSummaries.yaml),
// generated counts, and the versions nested underneath. Months older than
// docs/CHANGELOG.md come from git history.

const SECTIONS = ["Added", "Changed", "Fixed", "Removed"];
const md = markdownIt({ html: false, linkify: false });

function parseItems(body) {
  const items = [];
  for (const line of body.split("\n")) {
    const nested = /^\s{2,}- (.*)/.exec(line);
    const top = /^- (.*)/.exec(line);
    if (top) items.push({ html: md.renderInline(top[1].trim()), children: [] });
    else if (nested && items.length)
      items.at(-1).children.push(md.renderInline(nested[1].trim()));
  }
  return items;
}

function parseChangelog(raw) {
  const versionRe = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/;
  return raw
    .split(/(?=^## \[\d+\.\d+\.\d+\])/m)
    .map((block) => {
      const header = versionRe.exec(block);
      if (!header) return null;
      const sections = {};
      // Split on section headings rather than matching to an end anchor:
      // JavaScript has no \z, and `(?=...|\z)` silently stopped at the letter z.
      for (const part of block.split(/^### /m).slice(1)) {
        const name = part.slice(0, part.indexOf("\n")).trim();
        if (!SECTIONS.includes(name)) continue;
        const items = parseItems(part.slice(part.indexOf("\n") + 1));
        if (items.length) (sections[name] ||= []).push(...items);
      }
      return { version: header[1], date: header[2], sections, fromGit: false };
    })
    .filter(Boolean);
}

function gitMonths(before) {
  try {
    const log = execSync(
      `git log --format="%cd|||%s" --date=short${before ? ` --before="${before}"` : ""}`,
      { encoding: "utf-8", cwd: process.cwd() },
    );
    const byMonth = {};
    for (const line of log.split("\n")) {
      const [date, msg] = line.split("|||");
      if (
        !date ||
        !msg ||
        msg.startsWith("Merge") ||
        msg.startsWith("chore(deps)")
      )
        continue;
      (byMonth[date.trim().slice(0, 7)] ||= []).push({
        html: md.renderInline(msg.trim()),
        children: [],
      });
    }
    return Object.entries(byMonth).map(([ym, commits]) => ({
      version: "git history",
      date: `${ym}-01`,
      sections: { Changed: commits },
      fromGit: true,
    }));
  } catch (_) {
    return []; // git not available
  }
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pb[i] - pa[i];
  return 0;
}

function loadSummaries() {
  try {
    return (
      load(readFileSync("src/_data/changelogSummaries.yaml", "utf-8")) || {}
    );
  } catch (_) {
    return {};
  }
}

export default function () {
  let raw = "";
  try {
    raw = readFileSync("docs/CHANGELOG.md", "utf-8");
  } catch (_) {
    return [];
  }

  const entries = parseChangelog(raw);
  const oldest = entries
    .map((e) => e.date)
    .sort()
    .at(0);
  entries.push(...gitMonths(oldest));

  const summaries = loadSummaries();
  const months = {};
  for (const entry of entries) {
    const key = entry.date.slice(0, 7);
    (months[key] ||= []).push(entry);
  }

  return Object.entries(months)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, versions]) => {
      versions.sort(
        (a, b) =>
          Number(a.fromGit) - Number(b.fromGit) ||
          b.date.localeCompare(a.date) ||
          compareVersions(a.version, b.version),
      );
      const counts = { releases: 0, commits: 0 };
      for (const name of SECTIONS) counts[name] = 0;
      for (const v of versions) {
        if (v.fromGit) counts.commits += v.sections.Changed.length;
        else {
          counts.releases += 1;
          for (const name of SECTIONS)
            counts[name] += v.sections[name]?.length || 0;
        }
      }
      const [year, month] = key.split("-").map(Number);
      const summary = summaries[key];
      return {
        key,
        label: new Date(year, month - 1, 1).toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        summary: summary ? md.renderInline(String(summary).trim()) : "",
        counts,
        versions,
      };
    });
}
