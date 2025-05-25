import { readFileSync } from "fs";
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
import mermaidPlugin from '@kevingimbel/eleventy-plugin-mermaid';

import Image, { generateHTML } from "@11ty/eleventy-img";
import 'dotenv/config';

async function imageShortcode(src, alt, css) {
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
  };

  // You bet we throw an error on missing alt in `imageAttributes` (alt="" works okay)
  return generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });
}

async function imageShortcodeWithCaptions(src, alt, css, caption) {
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
  };

  const imageMarkup = generateHTML(metadata, imageAttributes, {
    whitespaceMode: "inline",
  });

  return `<figure>${imageMarkup}${caption ? `<figcaption class="font-thin italic -mt-5">${caption}</figcaption>` : ""}</figure>`;
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
  eleventyConfig.addPlugin(mermaidPlugin);

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
    return DateTime.fromJSDate(dateObj).toLocaleString(DateTime.DATE_FULL)
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
    return collectionApi.getFilteredByGlob("./src/posts/*.md").filter(post => {
      // Hide if hidden: true in frontmatter
      if (post.data.hidden === true) return false;
      // Hide if date is in the future
      if (post.date && post.date > now) return false;
      return true;
    });
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
    return collectionApi.getFilteredByGlob("src/now/archive/*.md");
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
