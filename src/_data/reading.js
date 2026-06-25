import { readFile } from "node:fs/promises";
import { load } from "js-yaml";
import { fetchWithFallback } from "../_utils/fetchWithFallback.js";

const GOODREADS_USER_ID = "202119302";
const GOODREADS_PROFILE_URL = "https://www.goodreads.com/carteakey";
const MANUAL_DATA_PATH = new URL("./reading-manual.yaml", import.meta.url);

const shelves = {
  currently_reading: "currently-reading",
  read: "read",
  want_to_read: "to-read"
};

function decodeXml(value = "") {
  return value
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
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

function parseGoodreadsFeed(xml, shelf) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, item]) => {
    const goodreadsId = getTag(item, "book_id");
    const rating = Number.parseInt(getTag(item, "user_rating"), 10);
    const finished = getTag(item, "user_read_at");

    return {
      title: getTag(item, "title"),
      author: getTag(item, "author_name"),
      goodreadsId,
      url: `https://www.goodreads.com/book/show/${goodreadsId}`,
      cover: getTag(item, "book_large_image_url") || getTag(item, "book_image_url"),
      ...(rating > 0 ? { rating } : {}),
      ...(finished ? { finished: new Date(finished).toISOString().slice(0, 10) } : {}),
      source: "goodreads",
      shelf
    };
  });
}

async function fetchShelf(shelf) {
  return fetchWithFallback({
    cacheKey: `goodreads-${GOODREADS_USER_ID}-${shelf}`,
    cacheDuration: "6h",
    fallbackData: [],
    fetchFn: async () => {
      const response = await fetch(
        `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${shelf}`,
        { headers: { "User-Agent": "carteakey.dev reading shelf" } }
      );

      if (!response.ok) {
        throw new Error(`Goodreads returned ${response.status}`);
      }

      return parseGoodreadsFeed(await response.text(), shelf);
    }
  });
}

function bookKey(book) {
  if (book.goodreadsId) return `goodreads:${book.goodreadsId}`;
  return `${book.title || ""}:${book.author || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function mergeBooks(goodreadsBooks = [], manualBooks = []) {
  const books = new Map(goodreadsBooks.map((book) => [bookKey(book), book]));

  for (const manualBook of manualBooks) {
    const key = bookKey(manualBook);
    if (manualBook.hidden) {
      books.delete(key);
      continue;
    }
    const syncedBook = books.get(key) || {};
    books.set(key, { ...syncedBook, ...manualBook, source: syncedBook.source ? "goodreads+manual" : "manual" });
  }

  return [...books.values()];
}

export default async function () {
  const manual = load(await readFile(MANUAL_DATA_PATH, "utf8")) || {};
  const shelfEntries = await Promise.all(
    Object.entries(shelves).map(async ([key, shelf]) => [key, await fetchShelf(shelf)])
  );

  return {
    profileUrl: GOODREADS_PROFILE_URL,
    ...Object.fromEntries(
      shelfEntries.map(([key, books]) => [key, mergeBooks(books, manual[key])])
    )
  };
}
