import { AssetCache } from "@11ty/eleventy-fetch";

const CACHE_KEY = "github_history";
const START_YEAR = 2018;
const START_MONTH = "2018-06";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// Pre-aggregated fallback baseline (2018-06 to 2026-10) in case network is down or rate-limited.
const STATIC_MONTHLY_BASELINE = [
  { month: "2018-06", count: 1 },
  { month: "2020-09", count: 3 },
  { month: "2020-10", count: 4 },
  { month: "2020-11", count: 14 },
  { month: "2020-12", count: 2 },
  { month: "2021-01", count: 9 },
  { month: "2021-02", count: 8 },
  { month: "2021-03", count: 10 },
  { month: "2021-04", count: 1 },
  { month: "2021-05", count: 20 },
  { month: "2021-06", count: 31 },
  { month: "2021-07", count: 2 },
  { month: "2021-08", count: 5 },
  { month: "2021-09", count: 34 },
  { month: "2021-10", count: 3 },
  { month: "2021-11", count: 11 },
  { month: "2021-12", count: 4 },
  { month: "2022-01", count: 2 },
  { month: "2022-02", count: 3 },
  { month: "2022-04", count: 44 },
  { month: "2022-05", count: 36 },
  { month: "2022-06", count: 17 },
  { month: "2022-07", count: 70 },
  { month: "2022-08", count: 64 },
  { month: "2022-09", count: 67 },
  { month: "2022-10", count: 65 },
  { month: "2022-11", count: 8 },
  { month: "2022-12", count: 30 },
  { month: "2023-01", count: 17 },
  { month: "2023-02", count: 21 },
  { month: "2023-03", count: 44 },
  { month: "2023-04", count: 14 },
  { month: "2023-05", count: 44 },
  { month: "2023-06", count: 40 },
  { month: "2023-07", count: 29 },
  { month: "2023-08", count: 18 },
  { month: "2023-09", count: 18 },
  { month: "2023-10", count: 20 },
  { month: "2023-11", count: 59 },
  { month: "2023-12", count: 38 },
  { month: "2024-01", count: 17 },
  { month: "2024-02", count: 23 },
  { month: "2024-03", count: 34 },
  { month: "2024-04", count: 72 },
  { month: "2024-05", count: 2 },
  { month: "2024-06", count: 3 },
  { month: "2024-07", count: 48 },
  { month: "2024-08", count: 91 },
  { month: "2024-09", count: 3 },
  { month: "2024-10", count: 1 },
  { month: "2024-11", count: 9 },
  { month: "2024-12", count: 1 },
  { month: "2025-02", count: 39 },
  { month: "2025-03", count: 38 },
  { month: "2025-04", count: 4 },
  { month: "2025-05", count: 38 },
  { month: "2025-06", count: 23 },
  { month: "2025-07", count: 16 },
  { month: "2025-08", count: 26 },
  { month: "2025-09", count: 53 },
  { month: "2025-10", count: 73 },
  { month: "2025-12", count: 10 },
  { month: "2026-01", count: 38 },
  { month: "2026-02", count: 376 },
  { month: "2026-03", count: 361 },
  { month: "2026-04", count: 292 },
  { month: "2026-05", count: 82 },
  { month: "2026-06", count: 121 },
  { month: "2026-07", count: 338 },
  { month: "2026-08", count: 170 },
  { month: "2026-09", count: 279 },
  { month: "2026-10", count: 200 },
];

function buildContiguousSeries(byMonthMap, endYear, endMonth) {
  const months = [];
  let y = START_YEAR;
  let mo = 6; // June 2018

  while (y < endYear || (y === endYear && mo <= endMonth)) {
    const mStr = `${y}-${String(mo).padStart(2, "0")}`;
    months.push(mStr);
    mo++;
    if (mo > 12) {
      mo = 1;
      y++;
    }
  }

  let cum = 0;
  const series = months.map((m) => {
    const count = byMonthMap[m] || 0;
    cum += count;
    return {
      month: m,
      count,
      cumulative: cum,
    };
  });

  const latestMonth = months[months.length - 1];
  const [lYear, lMonthNum] = latestMonth.split("-");
  const latestMonthLabel = `${MONTH_NAMES[Number(lMonthNum) - 1]} ${lYear}`;

  let peakMonth = { month: START_MONTH, count: 0, cumulative: 0 };
  for (const s of series) {
    if (s.count > peakMonth.count) {
      peakMonth = s;
    }
  }

  // Yearly totals
  const yearlyMap = {};
  for (const s of series) {
    const yr = s.month.slice(0, 4);
    yearlyMap[yr] = (yearlyMap[yr] || 0) + s.count;
  }
  const years = Object.keys(yearlyMap)
    .sort()
    .map((yr) => ({ year: yr, count: yearlyMap[yr] }));

  return {
    totalCount: cum,
    startMonth: START_MONTH,
    latestMonth,
    latestMonthLabel,
    peakMonth,
    monthly: series,
    years,
  };
}

function getFallbackData() {
  const byMonth = {};
  for (const item of STATIC_MONTHLY_BASELINE) {
    byMonth[item.month] = item.count;
  }
  const now = new Date();
  return buildContiguousSeries(
    byMonth,
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
  );
}

export default async function () {
  const cache = new AssetCache(CACHE_KEY);

  if (cache.isCacheValid("1d")) {
    const cached = await cache.getCachedValue();
    if (cached?.monthly?.length) return cached;
  }

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  try {
    const years = [];
    for (let yr = START_YEAR; yr <= currentYear; yr++) {
      years.push(yr);
    }

    const pages = await Promise.all(
      years.map(async (yr) => {
        const url = `https://github.com/users/carteakey/contributions?from=${yr}-01-01&to=${yr}-12-31`;
        const res = await fetch(url, {
          headers: { "User-Agent": "carteakey.dev (Eleventy cache)" },
        });
        if (!res.ok) {
          throw new Error(`GitHub returned ${res.status} for ${yr}`);
        }
        return res.text();
      }),
    );

    const cellPattern =
      /data-date="([^"]+)"[^>]*id="([^"]+)"[^>]*><\/td>\s*<tool-tip[^>]*for="\2"[^>]*>([^<]+)<\/tool-tip>/g;

    const byMonth = {};
    for (const html of pages) {
      for (const match of html.matchAll(cellPattern)) {
        const date = match[1];
        const m = date.slice(0, 7);
        const cm = match[3].match(/([\d,]+) contributions?/);
        const count = cm ? Number(cm[1].replaceAll(",", "")) : 0;
        byMonth[m] = (byMonth[m] || 0) + count;
      }
    }

    const result = buildContiguousSeries(byMonth, currentYear, currentMonth);

    if (result.monthly.length > 0 && result.totalCount > 0) {
      await cache.save(result, "json");
      return result;
    }

    throw new Error("Parsed zero contributions from GitHub");
  } catch (error) {
    console.warn("github-history: fetch failed, using fallback.", error.message);
    try {
      const cached = await cache.getCachedValue();
      if (cached?.monthly?.length) return cached;
    } catch {
      // ignore cache read errors
    }
    return getFallbackData();
  }
}
