import { getBuildHistory, getStatusEvents, recordBuildSnapshot } from "../_utils/statusLog.js";

const envGroups = {
  spotify: ["SPOTIFY_CLIENT_ID", "SPOTIFY_CLIENT_SECRET", "SPOTIFY_REFRESH_TOKEN"],
  steam: ["STEAM_API_KEY", "STEAM_USER_ID"],
  strava: ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET", "STRAVA_REFRESH_TOKEN"],
  upstash: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  openai: ["OPENAI_API_KEY"],
  openrouter: ["OPENROUTER_API_KEY"],
  ollama: ["OLLAMA_API_URL"],
};

function hasAll(names) {
  return names.every((name) => Boolean(process.env[name]));
}

function percent(part, total) {
  if (!total) return 100;
  return Math.round((part / total) * 100);
}

function summarizeEvents(events) {
  const since = Date.now() - 24 * 60 * 60 * 1000;
  const recent = events.filter((event) => new Date(event.timestamp).getTime() >= since);
  const errors = recent.filter((event) => event.level === "error").length;
  const warnings = recent.filter((event) => event.level === "warn").length;

  return {
    recent,
    errors,
    warnings,
    total: recent.length,
    latest: recent[0] || null
  };
}

function summarizeAttention(events) {
  const seen = new Set();

  return events
    .filter((event) => event.level === "error" || event.level === "warn")
    .filter((event) => {
      const key = `${event.source}:${event.message}:${event.fallback}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 4);
}

function summarizeBuilds(builds) {
  const tracked = builds.length;
  const successful = builds.filter((build) => build.status === "success").length;
  const clean = builds.filter((build) => Number(build.errors || 0) === 0).length;
  const quiet = builds.filter((build) => {
    return Number(build.errors || 0) === 0 && Number(build.warnings || 0) === 0;
  }).length;
  const durations = builds.map((build) => Number(build.durationMs || 0)).filter(Boolean);
  const averageDurationMs = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
    : 0;

  return {
    tracked,
    successful,
    successRate: percent(successful, tracked),
    cleanRate: percent(clean, tracked),
    quietRate: percent(quiet, tracked),
    averageDurationMs,
    latest: builds[0] || null
  };
}

function formatDisplayDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export default async function () {
  const checkedAt = new Date();
  const env = Object.fromEntries(
    Object.entries(envGroups).map(([key, names]) => [key, hasAll(names)])
  );
  const events = await getStatusEvents();
  const eventSummary = summarizeEvents(events);
  const memory = process.memoryUsage();
  const currentBuild = {
    status: "success",
    durationMs: Math.round(process.uptime() * 1000),
    rssMb: Math.round(memory.rss / 1024 / 1024),
    heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
    warnings: eventSummary.warnings,
    errors: eventSummary.errors
  };

  await recordBuildSnapshot(currentBuild);
  const builds = await getBuildHistory();

  return {
    checkedAt,
    env,
    envSummary: {
      configured: Object.values(env).filter(Boolean).length,
      total: Object.keys(env).length
    },
    events: events.slice(0, 12),
    eventSummary: {
      ...eventSummary,
      attention: summarizeAttention(eventSummary.recent)
    },
    builds: summarizeBuilds(builds),
    performance: {
      buildElapsedMs: currentBuild.durationMs,
      rssMb: currentBuild.rssMb,
      heapUsedMb: currentBuild.heapUsedMb,
      node: process.version
    },
    formatDisplayDate,
  };
}
