import { AssetCache } from "@11ty/eleventy-fetch";

const API_ENDPOINT = "https://github.com/users/carteakey/contributions";
const CACHE_KEY = "github-contributions";
const EMPTY_DATA = {
  totalCount: 0,
  maxCount: 0,
  dailyAverage: 0,
  dailyAverageRounded: 0,
  weeklyAverage: 0,
  weeklyAverageRounded: 0,
  currentStreak: null,
  longestStreak: null,
  weeks: [],
};

function streakFromDays(days, fromEnd = false) {
  let length = 0;
  let best = { length: 0, startDate: null, endDate: null };
  let currentStart = null;

  for (const day of days) {
    if (day.count > 0) {
      currentStart ||= day.date;
      length += 1;
      if (length > best.length) {
        best = { length, startDate: currentStart, endDate: day.date };
      }
    } else {
      length = 0;
      currentStart = null;
    }
  }

  if (!fromEnd) return best.length ? best : null;

  const eligible = [...days];
  if (eligible.at(-1)?.count === 0) eligible.pop();
  const active = [];
  for (let index = eligible.length - 1; index >= 0 && eligible[index].count > 0; index -= 1) {
    active.unshift(eligible[index]);
  }

  return active.length
    ? { length: active.length, startDate: active[0].date, endDate: active.at(-1).date }
    : null;
}

function normalizeContributions(html) {
  const days = [];
  const cellPattern = /data-date="([^"]+)"[^>]*id="([^"]+)"[^>]*><\/td>\s*<tool-tip[^>]*for="\2"[^>]*>([^<]+)<\/tool-tip>/g;

  for (const match of html.matchAll(cellPattern)) {
    const countMatch = match[3].match(/([\d,]+) contributions?/);
    days.push({
      date: match[1],
      count: countMatch ? Number(countMatch[1].replaceAll(",", "")) : 0,
      color: null,
      weekday: new Date(`${match[1]}T00:00:00Z`).getUTCDay(),
    });
  }

  if (!days.length) throw new Error("GitHub contribution calendar contained no days");

  days.sort((a, b) => a.date.localeCompare(b.date));
  const weeksByDate = new Map();
  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - day.weekday);
    const firstDay = date.toISOString().slice(0, 10);
    if (!weeksByDate.has(firstDay)) weeksByDate.set(firstDay, []);
    weeksByDate.get(firstDay).push(day);
  }

  const totalCount = days.reduce((sum, day) => sum + day.count, 0);
  const maxCount = days.reduce((max, day) => Math.max(max, day.count), 0);
  const dailyAverage = totalCount / days.length;

  return {
    totalCount,
    maxCount,
    dailyAverage,
    dailyAverageRounded: Number(dailyAverage.toFixed(1)),
    weeklyAverage: dailyAverage * 7,
    weeklyAverageRounded: Number((dailyAverage * 7).toFixed(1)),
    currentStreak: streakFromDays(days, true),
    longestStreak: streakFromDays(days),
    weeks: [...weeksByDate].map(([firstDay, contributionDays]) => ({ firstDay, contributionDays })),
  };
}

export default async function () {
  const cache = new AssetCache(CACHE_KEY);

  if (cache.isCacheValid("1d")) {
    const cached = await cache.getCachedValue();
    if (cached?.weeks?.length) return cached;
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: { "User-Agent": "carteakey.dev (Eleventy cache)" },
    });
    if (!response.ok) throw new Error(`GitHub responded with ${response.status}`);

    const normalized = normalizeContributions(await response.text());
    await cache.save(normalized, "json");
    return normalized;
  } catch (error) {
    console.error("Unable to fetch GitHub contributions", error);
    try {
      const cached = await cache.getCachedValue();
      if (cached?.weeks?.length) return cached;
    } catch (cacheError) {
      console.error("No cached GitHub contributions available", cacheError);
    }
    return EMPTY_DATA;
  }
}
