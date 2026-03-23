import { readFileSync, promises as fsPromises } from "fs";
import path from "path";
import { load } from "js-yaml";

import { DateTime } from "luxon";
import markdownIt from "markdown-it";
import markdownItAnchor from "markdown-it-anchor";
import { full as emoji } from 'markdown-it-emoji'
import eleventyGoogleFonts from "eleventy-google-fonts";

import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import eleventyPluginFeathericons from 'eleventy-plugin-feathericons';
import pluginTOC from 'eleventy-plugin-toc';
import eleventyWebcPlugin from "@11ty/eleventy-plugin-webc";
import { EleventyRenderPlugin } from "@11ty/eleventy";
import { EleventyHtmlBasePlugin } from "@11ty/eleventy";
import { feedPlugin } from "@11ty/eleventy-plugin-rss";

import Image, { generateHTML } from "@11ty/eleventy-img";
import 'dotenv/config';
import upvotesData from "./src/_data/upvotes.js";

function mapSrcToPublicUrl(src) {
  // If already an absolute URL or starts with site public path, return as-is
  if (/^https?:\/\//i.test(src) || src.startsWith("/")) {
    return src;
  }
  // Map common source path to passthrough public path
  if (src.startsWith("./src/static/img")) {
    return src.replace("./src/static/img", "/img");
  }
  // Default: return unchanged
  return src;
}

const POST_ASSET_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".svg",
  ".bmp",
  ".heic",
  ".heif",
  ".mp4",
  ".mp3",
  ".wav",
  ".ogg",
  ".webm",
  ".mov",
  ".pdf",
  ".txt",
  ".csv",
  ".json",
  ".yaml",
  ".yml",
  ".zip",
  ".tar",
  ".gz",
  ".tgz",
  ".bz2",
  ".7z",
  ".html",
  ".htm",
  ".xml",
  ".py",
  ".ipynb",
  ".js",
  ".ts",
  ".css"
]);

const OUTPUT_ROOT = path.resolve("_site");

function resolveRelativeUrl(url, options = {}) {
  if (typeof url !== "string") {
    return url;
  }

  if (!/^\.\.?(\/|$)/.test(url)) {
    return url;
  }

  const { sourceDir } = options;

  const urlMatch = url.match(/^([^?#]+)([?#].*)?$/);
  const relativePath = urlMatch?.[1] ?? url;
  const suffix = urlMatch?.[2] ?? "";

  if (!sourceDir) {
    const fallback = path.posix.normalize(path.posix.join(options.baseDir ?? "/", relativePath));
    const absolute = fallback.startsWith("/") ? fallback : `/${fallback}`;
    return `${absolute}${suffix}`;
  }

  const resolved = path.posix.normalize(path.posix.join(sourceDir, relativePath));

  let sitePath;
  if (resolved.startsWith("src/posts/")) {
    sitePath = resolved.replace(/^src\/posts/, "/blog");
  } else if (resolved.startsWith("src/")) {
    sitePath = resolved.replace(/^src\//, "/");
  } else {
    sitePath = `/${resolved}`;
  }

  return `${sitePath}${suffix}`;
}

async function copyPostAssets(srcDir, destDir) {
  let entries;
  try {
    entries = await fsPromises.readdir(srcDir, { withFileTypes: true });
  } catch (_) {
    return;
  }

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      await copyPostAssets(srcPath, destPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();
    if (!POST_ASSET_EXTENSIONS.has(extension)) {
      continue;
    }

    await fsPromises.mkdir(path.dirname(destPath), { recursive: true });
    await fsPromises.copyFile(srcPath, destPath);
  }
}

async function imageShortcode(src, alt, css) {
  // Preserve animation for GIFs by bypassing transformation
  if (/\.gif$/i.test(src)) {
    const publicSrc = mapSrcToPublicUrl(src);
    return `<img src="${publicSrc}" alt="${alt ?? ''}" class="${css ?? ''}" loading="lazy" decoding="async" />`;
  }
  let metadata = await Image(src, {
    widths: [400, 800, 1200, "auto"],
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: "./_site/img/",
  });

  let imageAttributes = {
    class: css,
    alt,
    sizes: "(min-width: 768px) 720px, 100vw",
    loading: "lazy",
    decoding: "async",
    "data-zoomable": "",
  };

  return generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });
}

async function imageShortcodeWithCaptions(src, alt, css, caption) {
  // Preserve animation for GIFs by bypassing transformation
  if (/\.gif$/i.test(src)) {
    const publicSrc = mapSrcToPublicUrl(src);
    const imageMarkup = `<img src="${publicSrc}" alt="${alt ?? ''}" class="${css ?? ''}" loading="lazy" decoding="async" />`;
    return `<figure>${imageMarkup}${caption ? `<figcaption class="font-thin italic">${caption}</figcaption>` : ""}</figure>`;
  }
  let metadata = await Image(src, {
    widths: [400, 800, 1200, "auto"],
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: "./_site/img/",
  });

  let imageAttributes = {
    class: css,
    alt,
    sizes: "(min-width: 768px) 720px, 100vw",
    loading: "lazy",
    decoding: "async",
    "data-zoomable": "",
  };

  const imageMarkup = generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });

  return `<figure>${imageMarkup}${caption ? `<figcaption class="font-thin italic">${caption}</figcaption>` : ""}</figure>`;
}

export const config = {
  pathPrefix: "/",
  // Control which files Eleventy will process
  // e.g.: *.md, *.njk, *.html, *.liquid
  templateFormats: ["md", "njk", "html", "liquid"],

  // Pre-process *.md files with: (default: `liquid`)
  markdownTemplateEngine: "njk",

  // Pre-process *.html files with: (default: `liquid`)
  htmlTemplateEngine: "njk",
  dir: {
    input: "src",
    includes: "_includes",
    data: "_data",
    output: "_site",
  },
}

export default function (eleventyConfig) {
  eleventyConfig.setTemplateFormats("md,njk,html,liquid");
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin)
  eleventyConfig.addWatchTarget("./src/**/*/*.css");
  // Copy the `img` and `css` folders to the output
  // Copy all static images (includes subfolders like /static/img/vibes)
  eleventyConfig.addPassthroughCopy({ "./src/static/img": "/img/" });
  eleventyConfig.addPassthroughCopy("./src/static/css/prism-a11y-dark.css");
  eleventyConfig.addPassthroughCopy({ "./src/static/css/prism": "/static/css/prism" });
  eleventyConfig.addPassthroughCopy({ "./src/static/js": "/static/js" });
  eleventyConfig.addPassthroughCopy("./src/_redirects");
  eleventyConfig.addPassthroughCopy("./src/static/Kartikey_Chauhan_Resume_2023.pdf");
  eleventyConfig.addPassthroughCopy({ "./src/static/img/favicon": "/" });
  eleventyConfig.addPassthroughCopy({ "./src/admin/config.yml": "./admin/config.yml" });
  eleventyConfig.addPassthroughCopy({ "./src/static/fonts": "/static/fonts" });


  // Add plugins
  eleventyConfig.addPlugin(syntaxHighlight);
  eleventyConfig.addPlugin(pluginNavigation);
  eleventyConfig.addPlugin(eleventyGoogleFonts);
  eleventyConfig.addPlugin(eleventyPluginFeathericons);
  eleventyConfig.addPlugin(EleventyRenderPlugin);
  eleventyConfig.addPlugin(feedPlugin, {
    type: "atom", // Specify Atom feed
    outputPath: "/feed.xml", // Desired output path
    collection: {
      name: "posts", // Use the 'posts' collection
      limit: 0,      // Include all posts (0 = no limit)
    },
    metadata: {
      language: "en", // From site metadata
      title: "carteakey.dev", // From site metadata
      subtitle: "Data Science, Python, SQL, Linux", // From site metadata
      base: "https://carteakey.dev/", // From site metadata (metadata.url)
      author: {
        name: "Kartikey Chauhan", // From site metadata
        email: "carteakey.dev@gmail.com" // Updated email
      }
    }
  });

  // WebC
  eleventyConfig.addPlugin(eleventyWebcPlugin, {
    components: [
      // …
      // Add as a global WebC component
      "npm:@11ty/eleventy-img/*.webc",
    ]
  });

  // https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat("yyyy-LL-dd");
  });

  eleventyConfig.addFilter("postDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_MED);
  });

  eleventyConfig.addFilter("formatDate", (dateObj) => {
    return DateTime.fromISO(dateObj).toFormat("MMM-yy");
  });

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("MMM d, yyyy");
  });
  eleventyConfig.addFilter("shortDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("MMM yy");
  });

  // Archive-specific date filters
  eleventyConfig.addFilter("archiveTitle", (dateInput) => {
    let dateTime;
    if (typeof dateInput === 'string') {
      dateTime = DateTime.fromISO(dateInput);
    } else if (dateInput instanceof Date) {
      dateTime = DateTime.fromJSDate(dateInput);
    } else {
      dateTime = DateTime.fromISO(dateInput.toString());
    }
    return `Now (${dateTime.toFormat("MMM d, yyyy")})`;
  });

  eleventyConfig.addFilter("archiveHeading", (dateInput) => {
    let dateTime;
    if (typeof dateInput === 'string') {
      dateTime = DateTime.fromISO(dateInput);
    } else if (dateInput instanceof Date) {
      dateTime = DateTime.fromJSDate(dateInput);
    } else {
      dateTime = DateTime.fromISO(dateInput.toString());
    }
    return dateTime.toFormat("MMM d, yyyy");
  });

  eleventyConfig.addFilter("archivePermalink", (dateInput) => {
    let dateString;
    if (typeof dateInput === 'string') {
      dateString = dateInput;
    } else if (dateInput instanceof Date) {
      dateString = DateTime.fromJSDate(dateInput).toFormat("yyyy-MM-dd");
    } else {
      dateString = dateInput.toString();
    }
    return `/now/archive/${dateString}/`;
  });

  eleventyConfig.addFilter("archiveReadableDate", (dateInput) => {
    // Handle both string and Date object inputs
    if (typeof dateInput === 'string') {
      return DateTime.fromISO(dateInput).toFormat("MMM d, yyyy");
    } else if (dateInput instanceof Date) {
      return DateTime.fromJSDate(dateInput).toFormat("MMM d, yyyy");
    } else {
      return DateTime.fromISO(dateInput.toString()).toFormat("MMM d, yyyy");
    }
  });

  //Image Plugin
  eleventyConfig.addAsyncShortcode("image", imageShortcode);
  eleventyConfig.addAsyncShortcode("image_cc", imageShortcodeWithCaptions);

  // Generate thumbnails for gallery images
  async function galleryImageShortcode(src) {
    let metadata = await Image(src, {
      widths: [400], // thumbnail width
      formats: ['webp'],
      outputDir: "./_site/img/thumbnails/",
      urlPath: "/img/thumbnails/",
      filenameFormat: function (id, src, width, format, options) {
        const extension = format;
        const name = src.split('/').pop().split('.')[0];
        return `${name}-${width}w.${extension}`;
      }
    });

    return metadata.webp[0].url;
  }

  eleventyConfig.addAsyncShortcode("thumbnail", galleryImageShortcode);


  // Get the first `n` elements of a collection.
  eleventyConfig.addFilter("head", (array, n) => {
    if (!Array.isArray(array) || array.length === 0) {
      return [];
    }
    if (n < 0) {
      return array.slice(n);
    }

    return array.slice(0, n);
  });

  // Return the smallest number argument
  eleventyConfig.addFilter("min", (...numbers) => {
    return Math.min.apply(null, numbers);
  });

  function filterTagList(tags) {
    return (tags || []).filter(
      (tag) => ["all", "nav", "post", "posts", "snippets"].indexOf(tag) === -1
    );
  }

  eleventyConfig.addFilter("filterTagList", filterTagList);

  // Sort tags by post count (descending)
  eleventyConfig.addFilter("sortTagsByCount", function (tagList, collections) {
    return tagList.map(tag => ({
      name: tag,
      count: (collections[tag] || []).filter(post => !post.data.hidden).length
    }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  });

  // Add split filter for breadcrumbs
  eleventyConfig.addFilter("split", function (str, separator) {
    if (typeof str !== 'string') return [];
    return str.split(separator);
  });

  // Add utility filters for stats page
  eleventyConfig.addFilter("max", function (value, max) {
    return Math.max(value, max);
  });

  eleventyConfig.addFilter("min", function (value, max) {
    return Math.min(value, max);
  });

  eleventyConfig.addFilter("round", function (value, decimals = 0) {
    return decimals === 0 ? Math.round(value) : Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  });

  eleventyConfig.addFilter("uniq", function (array) {
    return [...new Set(array)];
  });

  eleventyConfig.addFilter("map", function (array, property) {
    return array.map(item => item[property]);
  });

  eleventyConfig.addFilter("flat", function (array) {
    return array.flat();
  });

  const parseHostname = (value) => {
    if (!value) return '';
    try {
      const normalized = String(value).trim();
      if (!normalized) return '';
      const url = normalized.startsWith('http') ? new URL(normalized) : new URL(`https://${normalized}`);
      return url.hostname.replace(/^www\./, '');
    } catch (error) {
      return '';
    }
  };

  eleventyConfig.addFilter("domainFromUrl", function (value) {
    return parseHostname(value);
  });

  eleventyConfig.addFilter("domainInitial", function (value) {
    const domain = parseHostname(value);
    return domain ? domain[0].toUpperCase() : '#';
  });

  eleventyConfig.addFilter("faviconUrl", function (value) {
    const domain = parseHostname(value);
    return domain ? `https://icons.duckduckgo.com/ip3/${domain}.ico` : null;
  });

  eleventyConfig.addFilter("date", function (date, format) {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    // Simple date formatting - extend as needed
    if (format === 'MMMM d, yyyy "at" h:mm a') {
      return dateObj.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    // PHP-style format chars
    if (format === 'Y') return dateObj.getFullYear().toString();
    if (format === 'n') return (dateObj.getMonth() + 1).toString();
    if (format === 'X') return Math.floor(dateObj.getTime() / 1000).toString();
    if (format === 'MMM d') return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (format === 'h:mm a') return dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (format === 'YYYY') return dateObj.getFullYear().toString();
    if (format === 'MMM d, yyyy') return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return dateObj.toLocaleDateString();
  });

  eleventyConfig.addFilter("truncate", function (str, length = 100) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  });

  // Note: 'uniq' and 'head' filters are already defined above

  eleventyConfig.addFilter("keys", function (obj) {
    return Object.keys(obj);
  });

  // Format number with commas (e.g. 12345 → "12,345")
  eleventyConfig.addFilter("numberString", function (n) {
    return Number(n).toLocaleString('en-US');
  });

  // Merge two objects (for building maps in templates)
  eleventyConfig.addFilter("merge", function (obj, extra) {
    return Object.assign({}, obj, extra);
  });

  eleventyConfig.addTransform("normalizePostAssetLinks", function (content, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) {
      return content;
    }

    const relativeOutput = path.relative(OUTPUT_ROOT, outputPath).split(path.sep).join("/");
    const directoryName = path.posix.dirname(relativeOutput);
    const baseDir = directoryName === "." ? "/" : `/${directoryName}`;

    let sourceDir;
    const inputPath = this?.page?.inputPath;
    if (inputPath) {
      const relativeInput = path.relative(process.cwd(), inputPath).split(path.sep).join("/");
      const inputDirectory = path.posix.dirname(relativeInput);
      if (inputDirectory && inputDirectory !== ".") {
        sourceDir = inputDirectory;
      }
    }

    let transformed = content.replace(/\b(href|src)=("|')([.]{1,2}\/(?:[^"']*))("|')/g, (match, attr, quoteStart, url, quoteEnd) => {
      const normalized = resolveRelativeUrl(url, { sourceDir, baseDir });
      return `${attr}=${quoteStart}${normalized}${quoteEnd}`;
    });

    transformed = transformed.replace(/\b(href|src)=("|')\/posts\/(?!\s)([^"']*)("|')/g, (match, attr, quoteStart, rest, quoteEnd) => {
      return `${attr}=${quoteStart}/blog/${rest}${quoteEnd}`;
    });

    return transformed;
  });

  // Add reading time filter (estimates based on average reading speed of 200 words per minute)
  eleventyConfig.addFilter("readingTime", function (content) {
    if (!content) return "1 min read";

    // Strip HTML tags and count words
    const text = content.replace(/<[^>]+>/g, '');
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;

    // Average reading speed: 200 words per minute
    const readingTimeMinutes = Math.ceil(wordCount / 200);

    if (readingTimeMinutes === 1) {
      return "1 min read";
    } else {
      return `${readingTimeMinutes} min read`;
    }
  });

  // Word count filter (returns raw number)
  eleventyConfig.addFilter("wordCount", function (content) {
    if (!content) return 0;
    const text = content.replace(/<[^>]+>/g, '');
    return text.split(/\s+/).filter(word => word.length > 0).length;
  });

  // Sum word counts across a collection of posts (using templateContent)
  eleventyConfig.addFilter("sumWordCounts", function (posts) {
    if (!Array.isArray(posts)) return 0;
    return posts.reduce((total, post) => {
      const text = (post.templateContent || '').replace(/<[^>]+>/g, '');
      return total + text.split(/\s+/).filter(w => w.length > 0).length;
    }, 0);
  });

  // Group collection items by year, return { year: count } map
  eleventyConfig.addFilter("countByYear", function (posts) {
    if (!Array.isArray(posts)) return {};
    const map = {};
    for (const post of posts) {
      const yr = new Date(post.date).getFullYear().toString();
      map[yr] = (map[yr] || 0) + 1;
    }
    return map;
  });

  // Count posts in a given year+month (both strings like "2026", "2")
  eleventyConfig.addFilter("countInYearMonth", function (posts, year, month) {
    if (!Array.isArray(posts)) return 0;
    return posts.filter(p => {
      const d = new Date(p.date);
      return d.getFullYear().toString() === year && (d.getMonth() + 1).toString() === month;
    }).length;
  });

  // Sort posts by date descending regardless of pinned status
  eleventyConfig.addFilter("sortByDate", function (posts) {
    if (!Array.isArray(posts)) return posts;
    return [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  });

  // Add snippet tags collection
  eleventyConfig.addCollection("snippetTags", function (collection) {
    let tagSet = new Set();
    collection.getFilteredByTag("snippets").forEach(item => {
      (item.data.tags || []).forEach(tag => {
        if (tag !== "snippets") {
          tagSet.add(tag);
        }
      });
    });
    return [...tagSet];
  });

  // Create an array of all tags (excluding snippet tags)
  eleventyConfig.addCollection("tagList", function (collection) {
    let tagSet = new Set();
    collection.getAll()
      .filter(item => !item.data.tags?.includes("snippets")) // Only include non-snippet content
      .forEach((item) => {
        (item.data.tags || []).forEach((tag) => tagSet.add(tag));
      });

    return filterTagList([...tagSet]);
  });

  // Custom posts collection: hide posts with hidden: true or future date
  eleventyConfig.addCollection("posts", function (collectionApi) {
    const now = new Date();
    return collectionApi
      .getFilteredByGlob("./src/posts/**/*.md")
      .filter(post => {
        // Hide if hidden: true in frontmatter
        if (post.data.hidden === true) return false;
        // Hide if date is in the future
        if (post.date && post.date > now) return false;
        return true;
      })
      .sort((a, b) => {
        // Pinned posts first, then by date (newest first)
        const aPinned = a.data.pinned ? 1 : 0;
        const bPinned = b.data.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return b.date - a.date;
      });
  });

  // Featured post: pick the best post with featured: true from the posts collection
  eleventyConfig.addCollection("featuredPost", function (collectionApi) {
    const now = new Date();
    const posts = collectionApi
      .getFilteredByGlob("./src/posts/**/*.md")
      .filter(post => {
        if (post.data.hidden === true) return false;
        if (post.data.draft === true) return false;
        if (post.date && post.date > now) return false;
        if (!post.data.featured) return false;
        return true;
      });

    // Sort by weight (lower first), then by updated/date (newest first)
    posts.sort((a, b) => {
      const wA = (typeof a.data.featured === 'object' ? a.data.featured.weight : undefined) ?? Infinity;
      const wB = (typeof b.data.featured === 'object' ? b.data.featured.weight : undefined) ?? Infinity;
      if (wA !== wB) return wA - wB;
      const dateA = new Date(a.data.updated || a.date).getTime() || 0;
      const dateB = new Date(b.data.updated || b.date).getTime() || 0;
      return dateB - dateA;
    });

    return posts[0] || null;
  });

  // Group posts by folder for /blog/{folder}/ listings
  eleventyConfig.addCollection("postFolders", function (collectionApi) {
    const now = new Date();
    const humanize = (value = "") => {
      return value
        .replace(/[-_]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    };

    const normalizeRelativePath = (inputPath) => {
      return inputPath.replace(/^.*?src\/?posts\//, "");
    };

    const folderMap = new Map();

    collectionApi
      .getFilteredByGlob("./src/posts/**/*.md")
      .filter((post) => {
        if (post.data.hidden === true) return false;
        if (post.date && post.date > now) return false;
        return true;
      })
      .forEach((post) => {
        const relativePath = normalizeRelativePath(post.inputPath);
        const parts = relativePath.split("/");
        parts.pop(); // remove filename

        if (parts.length === 0) {
          return; // root-level posts live at /blog/ directly
        }

        const key = parts.join("/");
        const url = `/blog/${key}/`;

        if (!folderMap.has(key)) {
          const segments = parts.map((segment) => ({
            raw: segment,
            label: humanize(segment),
          }));

          folderMap.set(key, {
            key,
            url,
            name: segments[segments.length - 1].label,
            segments,
            posts: [],
          });
        }

        folderMap.get(key).posts.push(post);
      });

    folderMap.forEach((folder) => {
      folder.posts.sort((a, b) => b.date - a.date);
      folder.displayPath = folder.segments.map((segment) => segment.label).join(" / ");
    });

    return Array.from(folderMap.values()).sort((a, b) => a.url.localeCompare(b.url));
  });

  // Custom allPages collection: like collections.all but hides hidden:true and future-dated posts
  eleventyConfig.addCollection("allPages", function (collectionApi) {
    const now = new Date();
    return collectionApi.getAll().filter(page => {
      // Only filter posts, not all pages, for hidden/future
      if (page.inputPath && page.inputPath.includes("/posts/")) {
        if (page.data.hidden === true) return false;
        if (page.date && page.date > now) return false;
      }
      return true;
    });
  });

  // Add a collection for now page lookbacks
  eleventyConfig.addCollection("nowLookback", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/now/lookback/*.md");
  });

  // Add a collection for now page archive
  eleventyConfig.addCollection("nowArchive", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/now/archive/*.md")
      .filter(item => !item.inputPath.includes('_template.md'));
  });

  // TIL collection
  eleventyConfig.addCollection("til", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/til/**/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Notes collection
  eleventyConfig.addCollection("notes", function (collectionApi) {
    const now = new Date();
    return collectionApi.getFilteredByGlob("./src/notes/**/*.md")
      .filter((note) => {
        if (note.data.hidden === true) return false;
        if (note.date && note.date > now) return false;
        return true;
      })
      .sort((a, b) => b.date - a.date);
  });

  // Add a unified feed collection across key content types
  eleventyConfig.addCollection("feed", async function (collectionApi) {
    const now = new Date();

    const stripHtml = (html = "") => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const truncate = (text = "", limit = 220) => {
      if (text.length <= limit) return text;
      return `${text.slice(0, limit).trimEnd()}…`;
    };

    const normalizeDate = (value) => {
      if (value instanceof Date && !Number.isNaN(value.valueOf())) {
        return value;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.valueOf()) ? null : parsed;
    };

    const posts = collectionApi
      .getFilteredByGlob("./src/posts/**/*.md")
      .filter((post) => {
        if (post.data.hidden === true) return false;
        if (post.date && post.date > now) return false;
        return true;
      })
      .map((post) => {
        post.data.feedType = "post";
        const postDate = normalizeDate(post.data.updated) || post.date;
        const summarySource = post.data.description || post.data.excerpt || "";
        const summary = summarySource ? truncate(stripHtml(summarySource)) : null;
        return {
          type: "post",
          title: post.data.title,
          date: postDate,
          url: post.url,
          summary,
          readingTime: post.data.readingTime,
          tags: (post.data.tags || []).filter((tag) => tag !== "posts" && tag !== "post"),
          pinned: !!post.data.pinned,
          authored_by: post.data.authored_by ?? null,
        };
      });

    const snippets = collectionApi
      .getFilteredByTag("snippets")
      .filter((snippet) => {
        if (snippet.data.hidden === true) return false;
        if (snippet.date && snippet.date > now) return false;
        return true;
      })
      .map((snippet) => {
        snippet.data.feedType = "snippet";
        const summarySource = snippet.data.description || snippet.data.excerpt || "";
        const summary = summarySource ? truncate(stripHtml(summarySource)) : null;
        return {
          type: "snippet",
          title: snippet.data.title,
          date: snippet.date,
          url: snippet.url,
          summary,
          readingTime: snippet.data.readingTime,
          original: snippet,
          authored_by: snippet.data.authored_by ?? null,
        };
      });

    const notes = collectionApi
      .getFilteredByGlob("./src/notes/**/*.md")
      .filter((entry) => {
        if (entry.data.hidden === true) return false;
        if (entry.date && entry.date > now) return false;
        return true;
      })
      .map((note) => {
        note.data.feedType = "note";
        const excerptSource = note.data.excerpt || "";
        const summary = excerptSource ? truncate(stripHtml(excerptSource), 260) : null;
        return {
          type: "note",
          title: note.data.title || "Note",
          date: note.date,
          url: note.url && note.url !== false ? note.url : null,
          summary,
          pinned: !!note.data.pinned,
          original: {
            get templateContent() {
              try { return note.templateContent; } catch (_) { return ""; }
            },
          },
          authored_by: note.data.authored_by ?? null,
        };
      });

    const nowUpdates = collectionApi
      .getFilteredByGlob("./src/now/archive/*.md")
      .filter((entry) => !entry.inputPath.includes("_template"))
      .map((entry) => {
        const archiveDate = normalizeDate(entry.data.archiveDate) || entry.date;
        const display = archiveDate ? DateTime.fromJSDate(archiveDate).toFormat("MMM d, yyyy") : "Now";
        const summarySource = entry.data.summary || entry.data.description || "";
        return {
          type: "now",
          title: `Now Update — ${display}`,
          date: archiveDate,
          url: entry.url,
          summary: summarySource ? truncate(stripHtml(summarySource), 220) : null,
          original: {
            get templateContent() {
              try { return entry.templateContent; } catch (_) { return ""; }
            },
          },
        };
      });

    let photosData = [];
    try {
      photosData = load(readFileSync("src/_data/photos.yaml", "utf-8"));
    } catch (_) {
      photosData = [];
    }

    const photos = (Array.isArray(photosData) ? photosData : [])
      .map((photo) => {
        const photoDate = normalizeDate(photo.date);
        if (!photoDate) return null;
        return {
          type: "photo",
          title: photo.title,
          date: photoDate,
          url: photo.path,
          summary: truncate(photo.description || "", 200),
          media: {
            src: photo.path,
            alt: photo.title,
            width: photo.width,
            height: photo.height,
          },
        };
      })
      .filter(Boolean);

    let vibeFeed = [];
    try {
      const vibesModule = await import(new URL("./src/_data/vibes.js", import.meta.url));
      const vibesData = await vibesModule.default();
      if (Array.isArray(vibesData?.feed)) {
        vibeFeed = vibesData.feed;
      }
    } catch (_) {
      vibeFeed = [];
    }

    const vibes = vibeFeed
      .map((entry) => {
        const vibeDate = normalizeDate(entry.date);
        if (!vibeDate) return null;
        return {
          type: "vibe",
          title: entry.title,
          date: vibeDate,
          url: entry.url,
          summary: "New vibe board addition",
          media: entry.media,
        };
      })
      .filter(Boolean);

    const tilEntries = collectionApi
      .getFilteredByGlob("./src/til/**/*.md")
      .filter((entry) => {
        if (entry.data.hidden === true) return false;
        if (entry.date && entry.date > now) return false;
        return true;
      })
      .map((entry) => {
        const summarySource = entry.data.description || entry.data.excerpt || "";
        const summary = summarySource ? truncate(stripHtml(summarySource)) : null;
        return {
          type: "til",
          title: entry.data.title,
          date: entry.date,
          url: entry.url,
          summary,
          original: entry,
        };
      });

    const folioEntries = collectionApi
      .getFilteredByGlob("./src/folio/**/index.html")
      .filter((entry) => {
        if (entry.data.hidden === true) return false;
        if (entry.date && entry.date > now) return false;
        return true;
      })
      .map((entry) => {
        const summarySource = entry.data.description || "";
        const summary = summarySource ? truncate(stripHtml(summarySource)) : null;
        return {
          type: "folio",
          title: entry.data.title || "Folio",
          date: entry.date,
          url: entry.url,
          summary,
          original: entry,
        };
      });

    const combined = [
      ...posts,
      ...snippets,
      ...notes,
      ...tilEntries,
      ...folioEntries,
      ...nowUpdates,
      ...photos,
      // ...vibes,
    ].filter((item) => item.date instanceof Date && !Number.isNaN(item.date.valueOf()));

    return combined.sort((a, b) => {
      // Pinned items first (any type), then by date (newest first)
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return b.date - a.date;
    });
  });

  eleventyConfig.addCollection("popularPosts", async function (collectionApi) {
    const now = new Date();
    const upvoteMap = (await upvotesData())?.posts || {};

    return collectionApi
      .getFilteredByGlob("./src/posts/**/*.md")
      .filter((post) => {
        if (post.data.hidden === true) return false;
        if (post.date && post.date > now) return false;
        return true;
      })
      .map((post) => ({
        title: post.data.title,
        url: post.url,
        count: Number(upvoteMap[post.fileSlug] || 0),
        date: post.date,
      }))
      .filter((entry) => entry.count > 0)
      .sort((a, b) => b.count - a.count || b.date - a.date);
  });

  // Customize Markdown library and settings:
  let markdownLibrary = markdownIt({
    html: true,
    linkify: true,
  })
    .use(markdownItAnchor, {
      permalink: markdownItAnchor.permalink.ariaHidden({
        placement: "after",
        class: "direct-link",
        symbol: "#",
      }),
      level: [1, 2, 3, 4],
      slugify: eleventyConfig.getFilter("slugify"),
    })
    .use(emoji);
  eleventyConfig.setLibrary("md", markdownLibrary);
  //Table of Contents
  eleventyConfig.addPlugin(pluginTOC, {
    ul: true
  })

  markdownLibrary.renderer.rules.code_inline = (tokens, idx, { langPrefix = "" }) => {
    const token = tokens[idx];
    return `<code class="${langPrefix}">${markdownLibrary.utils.escapeHtml(token.content)}</code>`;
  };

  eleventyConfig.on("eleventy.after", async () => {
    const srcDir = path.resolve("src/posts");
    const destDirs = [path.resolve("_site/blog"), path.resolve("_site/posts")];

    try {
      for (const destDir of destDirs) {
        await fsPromises.mkdir(destDir, { recursive: true });
        await copyPostAssets(srcDir, destDir);
      }
    } catch (error) {
      console.warn("Failed to copy post assets", error);
    }
  });

  // Override Browsersync defaults (used only with --serve)
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = readFileSync("_site/404.html");

        browserSync.addMiddleware("*", (req, res) => {
          // Provides the 404 content without redirect.
          res.writeHead(404, { "Content-Type": "text/html; charset=UTF-8" });
          res.write(content_404);
          res.end();
        });
      },
    },
    ui: false,
    ghostMode: false,
  });

  //yaml support
  eleventyConfig.addDataExtension("yaml", (contents) => load(contents));
}
