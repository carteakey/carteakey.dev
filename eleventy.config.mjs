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
    const sizes = "(min-width: 30em) 50vw, 100vw";
    return `<img src="${publicSrc}" alt="${alt ?? ''}" class="${css ?? ''}" loading="lazy" decoding="async" sizes="${sizes}" style="max-width: 100%; height: auto;" />`;
  }
  let metadata = await Image(src, {
    widths: ["auto"],
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: "./_site/img/",
  });

  const sizes = "(min-width: 30em) 50vw, 100vw";
  
  let imageAttributes = {
    class: css,
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
    style: "max-width: 100%; height: auto;",
  };

  // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
  return generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });
}

async function imageShortcodeWithCaptions(src, alt, css, caption) {
  // Preserve animation for GIFs by bypassing transformation
  if (/\.gif$/i.test(src)) {
    const publicSrc = mapSrcToPublicUrl(src);
    const sizes = "(min-width: 30em) 50vw, 100vw";
    const imageMarkup = `<img src="${publicSrc}" alt="${alt ?? ''}" class="${css ?? ''}" loading="lazy" decoding="async" sizes="${sizes}" style="max-width: 100%; height: auto;" />`;
    return `<figure>${imageMarkup}${caption ? `<figcaption class="font-thin italic">${caption}</figcaption>` : ""}</figure>`;
  }
  let metadata = await Image(src, {
    widths: ["auto"],
    formats: ['avif', 'webp', 'jpeg'],
    outputDir: "./_site/img/",
  });

  const sizes = "(min-width: 30em) 50vw, 100vw";
  
  let imageAttributes = {
    class: css,
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
    style: "max-width: 100%; height: auto;",
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

export default function(eleventyConfig) {
  eleventyConfig.setTemplateFormats("md,njk,html,liquid");
  eleventyConfig.addPlugin(EleventyHtmlBasePlugin)
  eleventyConfig.addWatchTarget("./src/**/*/*.css");
  // Copy the `img` and `css` folders to the output
  // Copy all static images (includes subfolders like /static/img/vibes)
  eleventyConfig.addPassthroughCopy({"./src/static/img":"/img/"});
  eleventyConfig.addPassthroughCopy("./src/static/css/prism-a11y-dark.css");
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
      limit: 10,     // Number of posts to include (0 for all)
    },
    metadata: {
      language: "en", // From site metadata
      title: "carteakey.dev", // From site metadata
      subtitle: "Data Science, Python, SQL, Linux", // From site metadata
      base: "https://carteakey.dev/", // From site metadata (metadata.url)
      author: {
        name: "Kartikey Chauhan", // From site metadata
        email: "kartychauhan@gmail.com" // From site metadata
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
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_FULL);
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
  eleventyConfig.addAsyncShortcode("image_cc",imageShortcodeWithCaptions);

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

  // Add split filter for breadcrumbs
  eleventyConfig.addFilter("split", function(str, separator) {
    if (typeof str !== 'string') return [];
    return str.split(separator);
  });

  // Add utility filters for stats page
  eleventyConfig.addFilter("max", function(value, max) {
    return Math.max(value, max);
  });

  eleventyConfig.addFilter("min", function(value, max) {
    return Math.min(value, max);
  });

  eleventyConfig.addFilter("round", function(value, decimals = 0) {
    return decimals === 0 ? Math.round(value) : Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  });

  eleventyConfig.addFilter("uniq", function(array) {
    return [...new Set(array)];
  });

  eleventyConfig.addFilter("map", function(array, property) {
    return array.map(item => item[property]);
  });

  eleventyConfig.addFilter("date", function(date, format) {
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
    
    return dateObj.toLocaleDateString();
  });

  eleventyConfig.addFilter("truncate", function(str, length = 100) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
  });

  eleventyConfig.addFilter("uniq", function(array) {
    return [...new Set(array)];
  });

  eleventyConfig.addFilter("keys", function(obj) {
    return Object.keys(obj);
  });

  eleventyConfig.addFilter("head", function(array, count) {
    return array.slice(0, count);
  });

  // Add reading time filter (estimates based on average reading speed of 200 words per minute)
  eleventyConfig.addFilter("readingTime", function(content) {
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

  // Add snippet tags collection
  eleventyConfig.addCollection("snippetTags", function(collection) {
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
  eleventyConfig.addCollection("posts", function(collectionApi) {
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
        .sort((a, b) => b.date - a.date); // newest first
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
  eleventyConfig.addCollection("allPages", function(collectionApi) {
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
  eleventyConfig.addCollection("nowLookback", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/now/lookback/*.md");
  });

  // Add a collection for now page archive
  eleventyConfig.addCollection("nowArchive", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/now/archive/*.md")
      .filter(item => !item.inputPath.includes('_template.md'));
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
        };
      });

    const microposts = collectionApi
      .getFilteredByGlob("./src/microposts/**/*.md")
      .filter((entry) => {
        if (entry.data.hidden === true) return false;
        if (entry.date && entry.date > now) return false;
        return true;
      })
      .map((micropost) => {
        micropost.data.feedType = "micropost";
        const excerptSource = micropost.data.excerpt || "";
        const summary = excerptSource ? truncate(stripHtml(excerptSource), 260) : null;
        return {
          type: "micropost",
          title: micropost.data.title || "Micropost",
          date: micropost.date,
          url: micropost.url && micropost.url !== false ? micropost.url : null,
          summary,
          original: micropost,
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
          original: entry,
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

    const combined = [
      ...posts,
      ...snippets,
      ...microposts,
      ...nowUpdates,
      ...photos,
      // ...vibes,
    ].filter((item) => item.date instanceof Date && !Number.isNaN(item.date.valueOf()));

    return combined.sort((a, b) => b.date - a.date);
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
    const destDir = path.resolve("_site/blog");

    try {
      await fsPromises.mkdir(destDir, { recursive: true });
      await copyPostAssets(srcDir, destDir);
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
