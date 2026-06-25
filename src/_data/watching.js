import { readFile } from "node:fs/promises";
import { load } from "js-yaml";
import { fetchWithFallback } from "../_utils/fetchWithFallback.js";

const LETTERBOXD_USERNAME = "carteakey";
const PROFILE_URL = `https://letterboxd.com/${LETTERBOXD_USERNAME}/`;
const MANUAL_DATA_PATH = new URL("./watching-manual.yaml", import.meta.url);

function decodeXml(value = "") {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .trim();
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1]);
}

function stripHtml(value = "") {
  return decodeXml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function getImageSrc(value = "") {
  const match = value.match(/<img[^>]+src=["']([^"']+)["']/i);
  return decodeXml(match?.[1] || "");
}

function parseFeed(xml) {
  return [...xml.matchAll(/<item>[\s\S]*?<\/item>/gi)]
    .map(([item]) => {
      const title = getTag(item, "letterboxd:filmTitle");
      if (!title) return null;

      const description = getTag(item, "description");
      const review = stripHtml(description.replace(/<p>\s*<img[\s\S]*?<\/p>/i, ""));
      const watchedDate = getTag(item, "letterboxd:watchedDate");

      return {
        id: getTag(item, "guid"),
        title,
        year: Number.parseInt(getTag(item, "letterboxd:filmYear"), 10),
        rating: Number.parseFloat(getTag(item, "letterboxd:memberRating")) || null,
        liked: getTag(item, "letterboxd:memberLike") === "Yes",
        rewatch: getTag(item, "letterboxd:rewatch") === "Yes",
        watched: watchedDate ? new Date(`${watchedDate}T12:00:00Z`) : null,
        review: review.startsWith("Watched on ") ? "" : review,
        poster: getImageSrc(description),
        url: getTag(item, "link"),
        source: "letterboxd"
      };
    })
    .filter(Boolean);
}

function entryKey(entry) {
  if (entry.id) return entry.id;
  return `${entry.title || ""}:${entry.year || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function mergeEntries(letterboxdEntries = [], manualEntries = []) {
  const normalizeEntry = (entry) => ({
    ...entry,
    watched: entry.watched ? new Date(entry.watched) : null
  });
  const entries = new Map(
    letterboxdEntries.map((entry) => {
      const normalized = normalizeEntry(entry);
      return [entryKey(normalized), normalized];
    })
  );

  for (const rawManualEntry of manualEntries) {
    const manualEntry = normalizeEntry(rawManualEntry);
    const key = entryKey(manualEntry);
    if (manualEntry.hidden) {
      entries.delete(key);
      continue;
    }

    const syncedEntry = entries.get(key) || {};
    entries.set(key, {
      ...syncedEntry,
      ...manualEntry,
      source: syncedEntry.source ? "letterboxd+manual" : "manual"
    });
  }

  return [...entries.values()].sort((a, b) => new Date(b.watched || 0) - new Date(a.watched || 0));
}

export default async function () {
  const manual = load(await readFile(MANUAL_DATA_PATH, "utf8")) || {};
  const entries = await fetchWithFallback({
    cacheKey: `letterboxd-${LETTERBOXD_USERNAME}`,
    cacheDuration: "6h",
    fallbackData: [],
    fetchFn: async () => {
      const response = await fetch(`${PROFILE_URL}rss/`, {
        headers: { "User-Agent": "carteakey.dev watching diary" }
      });

      if (!response.ok) {
        throw new Error(`Letterboxd returned ${response.status}`);
      }

      return parseFeed(await response.text());
    }
  });

  return {
    profileUrl: PROFILE_URL,
    entries: mergeEntries(entries, manual.entries || [])
  };
}
