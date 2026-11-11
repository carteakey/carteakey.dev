// Build-time backlinks: which content pages link to a given URL.
// Sources are content entries (posts, notes, TIL, lexicon, snippets, sheets,
// reviews, devices, folio); site-wide index pages are skipped because they
// link to everything. Keys are normalised paths ("/blog/x/") and, for anchor
// targets such as quotations, "path#anchor".

const SOURCE_DIRS =
  /\/src\/(posts|notes|til|lexicon|snippets|sheets|reviews|devices|folio|now)\//;
const LINK_PATTERNS = [
  /\]\(\s*<?((?:https?:\/\/(?:www\.)?carteakey\.dev)?\/[^)\s>]*)/g, // markdown
  /href\s*=\s*["']((?:https?:\/\/(?:www\.)?carteakey\.dev)?\/[^"']*)["']/g, // html
];

function normalise(raw) {
  let target = raw.replace(/^https?:\/\/(?:www\.)?carteakey\.dev/, "");
  if (!target.startsWith("/") || target.startsWith("//")) return null;
  let [path, hash = ""] = target.split("#");
  path = path.split("?")[0];
  if (/\.[a-z0-9]+$/i.test(path)) return null; // assets and raw files
  if (!path.endsWith("/")) path += "/";
  return { path, hash: hash ? decodeURIComponent(hash) : "" };
}

export function createBacklinks({ shouldHide }) {
  let built = null;
  let builtFrom = null;

  function build(all) {
    const index = new Map();
    const add = (key, source) => {
      if (!index.has(key)) index.set(key, new Map());
      index.get(key).set(source.url, source);
    };
    for (const item of all || []) {
      if (!item.url || !SOURCE_DIRS.test(item.inputPath || "")) continue;
      if (shouldHide(item) || item.data?.draft) continue;
      const raw = item.rawInput ?? item.page?.rawInput ?? "";
      if (typeof raw !== "string" || !raw) continue;
      const source = {
        url: item.url,
        title: item.data?.title || item.url,
        date: item.date,
      };
      for (const pattern of LINK_PATTERNS) {
        for (const match of raw.matchAll(pattern)) {
          const target = normalise(match[1]);
          if (!target || target.path === item.url) continue;
          add(target.path, source);
          if (target.hash) add(`${target.path}#${target.hash}`, source);
        }
      }
    }
    return index;
  }

  return {
    reset() {
      built = null;
      builtFrom = null;
    },
    lookup(url, all) {
      if (!url) return [];
      if (!built || builtFrom !== all) {
        built = build(all);
        builtFrom = all;
      }
      const [path, hash] = String(url).split("#");
      const key = hash
        ? `${path.endsWith("/") ? path : path + "/"}#${hash}`
        : path.endsWith("/")
          ? path
          : path + "/";
      const hits = built.get(key);
      if (!hits) return [];
      return [...hits.values()]
        .filter((s) => s.url !== path)
        .sort((a, b) => (b.date || 0) - (a.date || 0));
    },
  };
}
