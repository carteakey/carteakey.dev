import fetch from "node-fetch";
import { AssetCache } from "@11ty/eleventy-fetch";

const API_ENDPOINT = "https://github-contributions-api.jogruber.de/v4/carteakey";
const CACHE_KEY = "github-contributions";

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
      return await cache.getCachedValue();
    } catch (cacheError) {
      console.error("No cached GitHub contributions available", cacheError);
      return normalizeContributions();
    }
  }
}
