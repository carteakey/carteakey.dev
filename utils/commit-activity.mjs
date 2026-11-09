#!/usr/bin/env node
// Commit activity across my own repos, for the /now page.
//
//   node utils/commit-activity.mjs [--root ~/repos] [--author Kartikey] [--gh-user carteakey] [--months 14]
//
// Scans every first-party checkout under --root (a directory with .git), counts the
// author's commits per month, fills empty months with zero, adds pull requests opened
// per month from `gh search prs`, and writes src/_data/commitActivity.json plus the
// Excalidraw spec diagrams/now-shipping.spec.json. Private repos contribute counts
// and repo names only; no code, paths or messages leave the machine.
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
const ghUser = opt("gh-user", "carteakey");
const window = Number(opt("months", 14));
const out = path.resolve("src/_data/commitActivity.json");
const trendSpecOut = path.resolve("diagrams/now-shipping.spec.json");
const reposSpecOut = path.resolve("diagrams/now-shipping-repos.spec.json");

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

const recent = monthly.slice(-window);
const total = monthly.reduce((n, r) => n + r.commits, 0);

// All-time top repos
const allTimeTop = [...perRepo.entries()]
  .map(([repo, c]) => ({
    repo,
    commits: [...c.values()].reduce((a, b) => a + b, 0),
  }))
  .sort((a, b) => b.commits - a.commits)
  .slice(0, 10);

// Latest month breakdown (what I am actively shipping now)
const latestMonthKey = recent[recent.length - 1].month;
const latestMonthTop = [...perRepo.entries()]
  .map(([repo, c]) => ({
    repo,
    commits: c.get(latestMonthKey) || 0,
  }))
  .filter((r) => r.commits > 0)
  .sort((a, b) => b.commits - a.commits);
const latestMonthTotal = latestMonthTop.reduce((n, r) => n + r.commits, 0);

// Pull requests I opened, from GitHub search (public and private repos I can
// see). Cached in .cache/prs-cache.json to avoid GitHub secondary rate limits.
let prsByMonth = new Map();
const prCachePath = path.resolve(".cache/prs-cache.json");
if (fs.existsSync(prCachePath)) {
  try {
    const cached = JSON.parse(fs.readFileSync(prCachePath, "utf8"));
    for (const [m, count] of Object.entries(cached)) prsByMonth.set(m, count);
  } catch {}
}

try {
  const raw = execFileSync(
    "gh",
    [
      "search",
      "prs",
      `--author=${ghUser}`,
      "--limit",
      "1000",
      "--json",
      "createdAt",
      "-q",
      ".[].createdAt",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  prsByMonth = new Map();
  for (const d of raw.split(/\s+/).filter(Boolean)) {
    const m = d.slice(0, 7);
    prsByMonth.set(m, (prsByMonth.get(m) || 0) + 1);
  }
  fs.mkdirSync(".cache", { recursive: true });
  fs.writeFileSync(
    prCachePath,
    JSON.stringify(Object.fromEntries(prsByMonth), null, 2) + "\n",
  );
} catch (err) {
  if (prsByMonth.size) {
    console.warn(
      "commit-activity: gh search rate-limited or failed; using cached PR counts",
    );
  } else {
    console.warn(
      "commit-activity: gh unavailable and no cache, skipping the PR series",
    );
    prsByMonth = null;
  }
}

const thisMonth = new Date().toISOString().slice(0, 7);
const months = recent.map((r) => ({
  ...r,
  ...(prsByMonth ? { prs: prsByMonth.get(r.month) || 0 } : {}),
  ...(r.month === thisMonth ? { partial: true } : {}),
}));
const complete = months.filter((r) => !r.partial);
const peak = complete.reduce((a, b) => (b.commits > a.commits ? b : a));
const monthName = (key, style = "long") =>
  new Date(`${key}-15T12:00:00Z`).toLocaleString("en", {
    month: style,
    timeZone: "UTC",
  });
const sum = (key) => months.reduce((n, r) => n + (r[key] || 0), 0);
const topTotal = allTimeTop.reduce((n, r) => n + r.commits, 0);

fs.writeFileSync(
  out,
  JSON.stringify(
    {
      generated: new Date().toISOString().slice(0, 10),
      author,
      repos: perRepo.size,
      total,
      since: `${monthName(allMonths[0], "short")} ${allMonths[0].slice(0, 4)}`,
      sourceLabel: `git log --author, ${perRepo.size} repos`,
      months,
      monthsLabel: `${months[0].month} to ${months[months.length - 1].month}`,
      monthsCommits: sum("commits"),
      ...(prsByMonth ? { monthsPrs: sum("prs") } : {}),
      peak: {
        month: peak.month,
        name: monthName(peak.month),
        commits: peak.commits,
      },
      latestMonth: {
        month: latestMonthKey,
        name: monthName(latestMonthKey),
        partial: Boolean(months[months.length - 1].partial),
        total: latestMonthTotal,
        top: latestMonthTop.slice(0, 8),
        topTwoShare: latestMonthTotal
          ? Math.round(
              (((latestMonthTop[0]?.commits || 0) +
                (latestMonthTop[1]?.commits || 0)) /
                latestMonthTotal) *
                100,
            )
          : 0,
      },
      top: allTimeTop,
      topTotal,
      topTwoShare: Math.round(
        (((allTimeTop[0]?.commits || 0) + (allTimeTop[1]?.commits || 0)) /
          total) *
          100,
      ),
    },
    null,
    2,
  ) + "\n",
);

// Excalidraw specs for /now (rendered by utils/render-excalidraw-chart.sh)
const niceMax = (v, step) =>
  Math.max(step, Math.ceil((v * 1.15) / step) * step);
const commitStep = 100;
const prStep = 10;
const panels = [
  {
    name: "commits / month",
    maxY: niceMax(Math.max(...months.map((r) => r.commits)), commitStep),
    step: commitStep,
    values: months.map((r) => r.commits),
    accent: true,
    highlight: [months.indexOf(peak)],
    partialLast: Boolean(months[months.length - 1].partial),
  },
];
if (prsByMonth) {
  const prPeak = complete.reduce((a, b) => (b.prs > a.prs ? b : a));
  panels.push({
    name: "pull requests opened / month",
    maxY: niceMax(Math.max(...months.map((r) => r.prs)), prStep),
    step: prStep,
    values: months.map((r) => r.prs),
    highlight: [months.indexOf(prPeak)],
    partialLast: Boolean(months[months.length - 1].partial),
  });
}
fs.mkdirSync(path.dirname(trendSpecOut), { recursive: true });
fs.writeFileSync(
  trendSpecOut,
  JSON.stringify(
    {
      title: "Shipping activity · 14-month trend",
      width: 780,
      panelHeight: 250,
      gap: 100,
      labels: months.map((r, i) => ({
        lbl: monthName(r.month, "short"),
        ...(r.partial
          ? { sub: "so far" }
          : i === 0 || r.month.endsWith("-01")
            ? { sub: r.month.slice(0, 4) }
            : {}),
      })),
      panels,
    },
    null,
    2,
  ) + "\n",
);

// Horizontal bar chart spec for latest month repo breakdown
const reposToShow = latestMonthTop.slice(0, 6);
const maxRepoCommits = Math.max(10, ...reposToShow.map((r) => r.commits));
const repoStep = maxRepoCommits <= 30 ? 5 : maxRepoCommits <= 60 ? 10 : 20;
const repoMax = niceMax(maxRepoCommits, repoStep);
const isPartial = Boolean(months[months.length - 1].partial);
const reposTitle = `${monthName(latestMonthKey)}${isPartial ? " so far" : ""} · commits by repo`;

fs.writeFileSync(
  reposSpecOut,
  JSON.stringify(
    {
      title: reposTitle,
      unit: "commits",
      max: repoMax,
      step: repoStep,
      scale: 350 / repoMax,
      ax: 240,
      bars: reposToShow.map((r, i) => ({
        label: r.repo,
        value: r.commits,
        text: String(r.commits),
        accent: i < 2,
      })),
    },
    null,
    2,
  ) + "\n",
);

console.log(
  `commit-activity: ${perRepo.size} repos, ${total} commits, ${months.length} months -> ${path.relative(process.cwd(), out)} + specs in ${path.relative(process.cwd(), path.dirname(trendSpecOut))}`,
);
