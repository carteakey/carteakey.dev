import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const API_ENDPOINT = "https://github-contributions-api.jogruber.de/v4/carteakey";
const CACHE_KEY = "github-contributions";

const FALLBACK_DATA = {
  totalCount: 46,
  maxCount: 5,
  dailyAverage: 1.642857142857143,
  dailyAverageRounded: 1.6,
  weeklyAverage: 11.5,
  weeklyAverageRounded: 11.5,
  currentStreak: {
    length: 7,
    startDate: "2025-09-29",
    endDate: "2025-10-05",
  },
  longestStreak: {
    length: 7,
    startDate: "2025-09-29",
    endDate: "2025-10-05",
  },
  weeks: [
    {
      firstDay: "2025-09-08",
      contributionDays: [
        { date: "2025-09-08", count: 0, color: null, weekday: 0 },
        { date: "2025-09-09", count: 1, color: null, weekday: 1 },
        { date: "2025-09-10", count: 2, color: null, weekday: 2 },
        { date: "2025-09-11", count: 0, color: null, weekday: 3 },
        { date: "2025-09-12", count: 3, color: null, weekday: 4 },
        { date: "2025-09-13", count: 2, color: null, weekday: 5 },
        { date: "2025-09-14", count: 1, color: null, weekday: 6 },
      ],
    },
    {
      firstDay: "2025-09-15",
      contributionDays: [
        { date: "2025-09-15", count: 1, color: null, weekday: 0 },
        { date: "2025-09-16", count: 0, color: null, weekday: 1 },
        { date: "2025-09-17", count: 4, color: null, weekday: 2 },
        { date: "2025-09-18", count: 3, color: null, weekday: 3 },
        { date: "2025-09-19", count: 0, color: null, weekday: 4 },
        { date: "2025-09-20", count: 2, color: null, weekday: 5 },
        { date: "2025-09-21", count: 2, color: null, weekday: 6 },
      ],
    },
    {
      firstDay: "2025-09-22",
      contributionDays: [
        { date: "2025-09-22", count: 0, color: null, weekday: 0 },
        { date: "2025-09-23", count: 0, color: null, weekday: 1 },
        { date: "2025-09-24", count: 3, color: null, weekday: 2 },
        { date: "2025-09-25", count: 5, color: null, weekday: 3 },
        { date: "2025-09-26", count: 2, color: null, weekday: 4 },
        { date: "2025-09-27", count: 1, color: null, weekday: 5 },
        { date: "2025-09-28", count: 0, color: null, weekday: 6 },
      ],
    },
    {
      firstDay: "2025-09-29",
      contributionDays: [
        { date: "2025-09-29", count: 1, color: null, weekday: 0 },
        { date: "2025-09-30", count: 2, color: null, weekday: 1 },
        { date: "2025-10-01", count: 1, color: null, weekday: 2 },
        { date: "2025-10-02", count: 4, color: null, weekday: 3 },
        { date: "2025-10-03", count: 3, color: null, weekday: 4 },
        { date: "2025-10-04", count: 1, color: null, weekday: 5 },
        { date: "2025-10-05", count: 2, color: null, weekday: 6 },
      ],
    },
  ],
};

function normalizeContributions(payload) {
  if (!payload || !Array.isArray(payload.weeks)) {
    return {
      totalCount: 0,
      maxCount: 0,
      currentStreak: null,
      longestStreak: null,
      weeks: [],
    };
  }

  const weeks = payload.weeks.map((week) => ({
    firstDay: week.firstDay,
    contributionDays: Array.isArray(week.contributionDays)
      ? week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
          color: day.color,
          weekday: day.weekday,
        }))
      : [],
  }));

  const flatDays = weeks.flatMap((week) => week.contributionDays);
  const totalCount = flatDays.reduce((sum, day) => sum + (day.count || 0), 0);
  const maxCount = flatDays.reduce((max, day) => Math.max(max, day.count || 0), 0);
  const daysTracked = flatDays.length || 1; // avoid divide-by-zero
  const dailyAverage = totalCount / daysTracked;
  const weeklyAverage = dailyAverage * 7;

  return {
    totalCount,
    maxCount,
    dailyAverage,
    dailyAverageRounded: Number(dailyAverage.toFixed(1)),
    weeklyAverage,
    weeklyAverageRounded: Number(weeklyAverage.toFixed(1)),
    currentStreak: payload.contributions?.currentStreak || null,
    longestStreak: payload.contributions?.longestStreak || null,
    weeks,
  };
}

export default async function () {
  const cache = new AssetCache(CACHE_KEY);

  if (cache.isCacheValid("1d")) {
    return cache.getCachedValue();
  }

  try {
    const response = await fetch(API_ENDPOINT, {
      headers: {
        "User-Agent": "carteakey.dev (Eleventy cache)",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub contributions API responded with ${response.status}`);
    }

    const rawData = await response.json();
    const normalized = normalizeContributions(rawData);

    await cache.save(normalized, "json");
    return normalized;
  } catch (error) {
    console.error("Unable to fetch GitHub contributions", error);

    try {
      const cached = await cache.getCachedValue();
      if (cached) {
        return cached;
      }
    } catch (cacheError) {
      console.error("No cached GitHub contributions available", cacheError);
    }

    await cache.save(FALLBACK_DATA, "json");
    return FALLBACK_DATA;
  }
}
