import { readFileSync } from "fs";
import { execSync } from "child_process";

export default function () {
  let raw = "";
  try {
    raw = readFileSync("docs/CHANGELOG.md", "utf-8");
  } catch (_) {
    return [];
  }

  // Parse CHANGELOG.md version blocks
  const versionRe = /^## \[(\d+\.\d+\.\d+)\] - (\d{4}-\d{2}-\d{2})/m;
  const blocks = raw.split(/(?=^## \[\d+\.\d+\.\d+\])/m).filter((b) =>
    versionRe.test(b)
  );

  const entries = blocks.map((block) => {
    const header = versionRe.exec(block);
    const version = header ? header[1] : "?";
    const date = header ? header[2] : null;

    const sections = {};
    const sectionRe = /^### (Added|Changed|Fixed|Removed)\n([\s\S]*?)(?=^### |\z)/gm;
    let match;
    while ((match = sectionRe.exec(block)) !== null) {
      const sectionName = match[1];
      const items = match[2]
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("- "))
        .map((l) => l.slice(2).trim());
      if (items.length > 0) {
        if (!sections[sectionName]) sections[sectionName] = [];
        sections[sectionName].push(...items);
      }
    }

    return { version, date, sections, fromGit: false };
  });

  // Find earliest date in CHANGELOG
  const knownDates = entries.map((e) => e.date).filter(Boolean).sort();
  const earliest = knownDates[knownDates.length - 1]; // oldest entry

  // Pull git history for commits before earliest CHANGELOG entry
  try {
    const gitLog = execSync(
      `git log --format="%cd|||%s" --date=short${earliest ? ` --until="${earliest}"` : ""}`,
      { encoding: "utf-8", cwd: process.cwd() }
    );

    // Group commits by year-month
    const byMonth = {};
    for (const line of gitLog.split("\n")) {
      const [date, msg] = line.split("|||");
      if (!date || !msg || msg.startsWith("Merge") || msg.startsWith("chore(deps)")) continue;
      const ym = date.trim().slice(0, 7);
      if (!byMonth[ym]) byMonth[ym] = [];
      byMonth[ym].push(msg.trim());
    }

    // Create synthetic entries per month
    for (const [ym, commits] of Object.entries(byMonth).sort((a, b) => b[0].localeCompare(a[0]))) {
      const [year, month] = ym.split("-");
      const monthName = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleString("en-US", { month: "long" });
      entries.push({
        version: `${monthName} ${year}`,
        date: `${ym}-01`,
        sections: { Changed: commits.slice(0, 8) },
        fromGit: true,
      });
    }
  } catch (_) {
    // git not available — skip
  }

  return entries;
}
