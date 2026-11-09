#!/usr/bin/env node
// Commit activity across my own repos, for the /now page.
//
//   node utils/commit-activity.mjs [--root ~/repos] [--author Kartikey] [--months 14]
//
// Scans every first-party checkout under --root (a directory with .git), counts the
// author's commits per month, fills empty months with zero, and writes
// src/_data/commitActivity.json. Private repos are included as counts only; no code,
// paths or messages leave the machine.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};

const root = path.resolve(opt("root", path.join(os.homedir(), "repos")));
const author = opt("author", "Kartikey");
const window = Number(opt("months", 14));
const out = path.resolve("src/_data/commitActivity.json");

const repos = fs
  .readdirSync(root, { withFileTypes: true })
  .filter(
    (d) => d.isDirectory() && fs.existsSync(path.join(root, d.name, ".git")),
  )
  .map((d) => d.name)
  .sort();

const perRepo = new Map();
for (const repo of repos) {
  let text = "";
  try {
    text = execFileSync(
      "git",
      [
        "-C",
        path.join(root, repo),
        "log",
        `--author=${author}`,
        "--date=format:%Y-%m",
        "--format=%ad",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
  } catch {
    continue;
  }
  const counts = new Map();
  for (const m of text.split(/\s+/).filter(Boolean))
    counts.set(m, (counts.get(m) || 0) + 1);
  if (counts.size) perRepo.set(repo, counts);
}

const allMonths = [
  ...new Set([...perRepo.values()].flatMap((c) => [...c.keys()])),
].sort();
if (!allMonths.length) {
  console.error("commit-activity: no commits found under", root);
  process.exit(1);
}

// Fill the gaps so the line chart does not skip a quiet month.
const monthly = [];
const [sy, sm] = allMonths[0].split("-").map(Number);
const [ey, em] = allMonths[allMonths.length - 1].split("-").map(Number);
for (
  let y = sy, m = sm;
  y < ey || (y === ey && m <= em);
  m === 12 ? ((y += 1), (m = 1)) : (m += 1)
) {
  const key = `${y}-${String(m).padStart(2, "0")}`;
  const commits = [...perRepo.values()].reduce(
    (n, c) => n + (c.get(key) || 0),
    0,
  );
  monthly.push({ month: key, commits });
}

const top = [...perRepo.entries()]
  .map(([repo, c]) => ({
    repo,
    commits: [...c.values()].reduce((a, b) => a + b, 0),
  }))
  .sort((a, b) => b.commits - a.commits)
  .slice(0, 10);

const recent = monthly.slice(-window);
const total = monthly.reduce((n, r) => n + r.commits, 0);

fs.writeFileSync(
  out,
  JSON.stringify(
    {
      generated: new Date().toISOString().slice(0, 10),
      author,
      repos: perRepo.size,
      total,
      sourceLabel: `git log --author, ${perRepo.size} repos`,
      months: recent,
      monthsLabel: `${recent[0].month} to ${recent[recent.length - 1].month}`,
      top,
      topTotal: top.reduce((n, r) => n + r.commits, 0),
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `commit-activity: ${perRepo.size} repos, ${total} commits, ${recent.length} months -> ${path.relative(process.cwd(), out)}`,
);
