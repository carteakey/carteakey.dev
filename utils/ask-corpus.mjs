// Build-time corpus for agentcart (/ask/). Turns public Markdown pages into
// heading-sized chunks plus a small inverted index, so the edge function only
// has to look up the query's terms (no tokenising 800 KB per request).
//
// Only published, non-hidden, non-future pages go in, regardless of
// SHOW_HIDDEN: the corpus is served publicly and fed to third-party models.

const SOURCE_DIRS = [
  ["/posts/", "post"],
  ["/notes/", "note"],
  ["/snippets/", "snippet"],
  ["/til/", "til"],
  ["/lexicon/", "lexicon"],
  ["/devices/", "device"],
  ["/prompts/", "prompt"],
  ["/reviews/", "review"],
];

const CHUNK_CHARS = 1600;

export const STOPWORDS = new Set(
  (
    "a an and are as at be but by can do does for from had has have how i if in into is it its " +
    "me my no not of on or our so than that the their them then there these they this to too " +
    "was we were what when where which who why will with you your about just more most also " +
    "any all some such very would should could been being he she his her did done use used " +
    "tell know think like get got say says said write wrote written post posts blog site page " +
    "please explain show give anything something thing things much many way"
  ).split(" "),
);

export function tokenize(text) {
  return (
    text.toLowerCase().match(/[a-z0-9][a-z0-9.+_-]*[a-z0-9]|[a-z0-9]/g) || []
  ).filter((t) => !STOPWORDS.has(t) && t.length < 40);
}

function kindOf(inputPath = "") {
  const hit = SOURCE_DIRS.find(([dir]) => inputPath.includes(dir));
  return hit ? hit[1] : null;
}

// Keep the prose, drop the template machinery.
function cleanMarkdown(raw) {
  return raw
    .replace(/^---[\s\S]*?\n---\s*/, "")
    .replace(/\{#[\s\S]*?#\}/g, "")
    .replace(
      /\{%-?\s*(?:image|image_cc|remote_image|remote_image_cc|gallery|chart|progression_chart)\b[\s\S]*?-?%\}/g,
      "",
    )
    .replace(/\{%-?[\s\S]*?-?%\}/g, "")
    .replace(/\{\{[\s\S]*?\}\}/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitLong(text) {
  if (text.length <= CHUNK_CHARS) return [text];
  const out = [];
  let buf = "";
  for (const para of text.split(/\n\n+/)) {
    if (buf && buf.length + para.length > CHUNK_CHARS) {
      out.push(buf);
      buf = "";
    }
    buf = buf ? `${buf}\n\n${para}` : para;
  }
  if (buf) out.push(buf);
  return out.map((s) => s.slice(0, CHUNK_CHARS * 2));
}

function chunkPage(body) {
  const sections = [];
  let heading = "";
  let lines = [];
  let inFence = false;
  const flush = () => {
    const text = lines.join("\n").trim();
    if (text)
      for (const part of splitLong(text))
        sections.push({ heading, text: part });
    lines = [];
  };
  for (const line of body.split("\n")) {
    if (line.startsWith("```")) inFence = !inFence;
    const m = !inFence && line.match(/^#{1,3}\s+(.+)/);
    if (m) {
      flush();
      heading = m[1].replace(/[*_`]/g, "").trim();
    } else lines.push(line);
  }
  flush();
  return sections;
}

export function buildAskCorpus(items, now = new Date()) {
  const docs = [];
  const chunks = [];
  const seen = new Set();

  for (const item of items) {
    const kind = kindOf(item.inputPath);
    if (!kind || !item.url || seen.has(item.url)) continue;
    if (!String(item.inputPath).endsWith(".md")) continue;
    if (item.data?.hidden === true || item.data?.eleventyExcludeFromCollections)
      continue;
    if (item.date && item.date > now) continue;
    seen.add(item.url);

    const docId = docs.length;
    docs.push({
      u: item.url,
      t:
        (kind === "device" && item.data?.aka) ||
        item.data?.title ||
        item.fileSlug,
      k: kind,
      d: item.date ? item.date.toISOString().slice(0, 10) : null,
      g: (item.data?.tags || []).filter(
        (t) => !["posts", "notes", "snippets", "til"].includes(t),
      ),
    });
    // Devices keep their facts in front matter, not the body.
    if (kind === "device") {
      const d = item.data;
      const specs = (d.specs || []).map((s) => `${s.label}: ${s.value}`);
      const facts = [
        d.aka && `Also called ${d.aka}.`,
        d.role,
        d.description,
        d.station && `Location: ${d.station}`,
        d.state && `State: ${d.state}`,
        ...specs,
      ];
      chunks.push({
        doc: docId,
        h: "Specs",
        x: facts.filter(Boolean).join("\n"),
      });
    }
    for (const s of chunkPage(
      cleanMarkdown(item.rawInput || item.page?.rawInput || ""),
    )) {
      chunks.push({ doc: docId, h: s.heading, x: s.text });
    }
  }

  // Inverted index: term -> [[chunk, tf], ...]. Title and heading words count
  // three times so "what GPU do you use" finds the hardware page first.
  const postings = {};
  const lengths = [];
  chunks.forEach((c, i) => {
    const doc = docs[c.doc];
    const terms = [
      ...tokenize(c.x),
      ...Array(3)
        .fill(tokenize(`${doc.t} ${c.h} ${doc.g.join(" ")}`))
        .flat(),
    ];
    lengths.push(terms.length);
    const tf = {};
    for (const t of terms) tf[t] = (tf[t] || 0) + 1;
    for (const [t, n] of Object.entries(tf)) (postings[t] ||= []).push([i, n]);
  });

  return {
    v: 1,
    builtAt: now.toISOString(),
    avgLen: lengths.reduce((a, b) => a + b, 0) / Math.max(lengths.length, 1),
    docs,
    chunks: chunks.map((c, i) => ({ ...c, n: lengths[i] })),
    postings,
  };
}
