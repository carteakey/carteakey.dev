import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE_DIR = path.join(process.cwd(), ".cache");
const EVENTS_PATH = path.join(CACHE_DIR, "status-events.json");
const BUILDS_PATH = path.join(CACHE_DIR, "status-builds.json");
const MAX_EVENTS = 80;
const MAX_BUILDS = 30;

let eventWriteQueue = Promise.resolve();
let buildWriteQueue = Promise.resolve();

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function cleanMessage(errorOrMessage) {
  const message = errorOrMessage instanceof Error
    ? errorOrMessage.message
    : String(errorOrMessage || "Unknown failure");

  return message.replace(/\s+/g, " ").slice(0, 240);
}

function normalizeEvent(event) {
  return {
    timestamp: new Date().toISOString(),
    level: event.level || "warn",
    source: event.source || "unknown",
    message: cleanMessage(event.error || event.message),
    fallback: event.fallback || "none",
    phase: event.phase || "build"
  };
}

export async function recordStatusEvent(event) {
  const entry = normalizeEvent(event);

  eventWriteQueue = eventWriteQueue.then(async () => {
    const events = await readJson(EVENTS_PATH, []);
    await writeJson(EVENTS_PATH, [entry, ...events].slice(0, MAX_EVENTS));
  });

  return eventWriteQueue.catch(() => undefined);
}

export async function getStatusEvents() {
  const events = await readJson(EVENTS_PATH, []);
  return Array.isArray(events) ? events : [];
}

export async function recordBuildSnapshot(snapshot) {
  const entry = {
    timestamp: new Date().toISOString(),
    status: snapshot.status || "success",
    durationMs: Number(snapshot.durationMs || 0),
    rssMb: Number(snapshot.rssMb || 0),
    heapUsedMb: Number(snapshot.heapUsedMb || 0),
    warnings: Number(snapshot.warnings || 0),
    errors: Number(snapshot.errors || 0)
  };

  buildWriteQueue = buildWriteQueue.then(async () => {
    const builds = await readJson(BUILDS_PATH, []);
    await writeJson(BUILDS_PATH, [entry, ...builds].slice(0, MAX_BUILDS));
  });

  return buildWriteQueue.catch(() => undefined);
}

export async function getBuildHistory() {
  const builds = await readJson(BUILDS_PATH, []);
  return Array.isArray(builds) ? builds : [];
}
