# Bug Report: Nested Layout Overlap in Feed Cards

**Status:** Resolved in 2.0.34 (2026-06-22).

## Problem Description
Following recent commit `0f12c2d` (which optimized post thumbnails into responsive AVIF/WebP formats using the async `post_thumbnail` shortcode), the homepage/Recent Activity and the Feed pages suffer from a recursive layout nesting bug where cards render nested inside one another, breaking page grids.

## Root Cause
1. **Nunjucks Macro Synchronicity Constraint:** Nunjucks macros are evaluated synchronously by Eleventy.
2. **Async Shortcode Inside Macro:** In `src/_includes/components/feed-card.njk`, the `feedCard` macro calls `{% post_thumbnail ... %}`, which is registered as an asynchronous shortcode in `eleventy.config.mjs` (it performs disk reads/writes using Sharp).
3. **Template Compilation Failure:** Because the macro is synchronous, Eleventy's Nunjucks compiler fails to resolve the asynchronous image shortcode properly. It silently fails to render the image, leaving the surrounding anchor tags (`<a>`) unclosed:
   ```html
   <a href="/blog/local-inference/local-llm-optimization/" class="shrink-0" style="text-decoration: none;">
     <!-- Thumbnail markup missing, and no closing </a> tag -->
   ```
4. **HTML Dom corruption:** Because the `<a>` tag remains open, the browser automatically nests the subsequent card markup inside the open link, leading to recursive card nesting.

---

## Resolution

The fix keeps image processing asynchronous without putting generated HTML into the feed collection:

1. `generatePostThumbnailMetadata()` performs the Eleventy Image work and returns reusable image metadata.
2. The async `feed` collection awaits that metadata for post items.
3. The synchronous `post_thumbnail_markup` shortcode turns the metadata into `<picture>` markup inside `feedCard`.
4. Templates outside macros continue using the existing async `post_thumbnail` shortcode.

This keeps presentation markup out of collection data, keeps the macro synchronous, and retains the responsive AVIF/WebP optimization.

Browser verification checks both `/` and `/feed/` for nested cards, cards inside links, missing thumbnail images, and console errors.

## Alternatives Considered

### Pre-generate Thumbnail HTML
Since the `feed` collection in `eleventy.config.mjs` is mapped inside an `async` function, we can pre-generate the responsive `<picture>` tags asynchronously during the collection build phase and attach them to the mapped items.

1. **In `eleventy.config.mjs`:**
   Modify the `feed` collection's posts mapping to run asynchronously using `Promise.all` and call the shortcode:
   ```js
   const posts = await Promise.all(
     collectionApi
       .getFilteredByGlob("./src/posts/**/*.md")
       .filter(...)
       .map(async (post) => {
         let imageHTML80 = null;
         let imageHTML96 = null;
         if (post.data.image) {
           imageHTML80 = await postThumbnailShortcode(post.data.image, ..., 80);
           imageHTML96 = await postThumbnailShortcode(post.data.image, ..., 96);
         }
         return {
           ...
           imageHTML80,
           imageHTML96
         };
       })
   );
   ```

2. **In `src/_includes/components/feed-card.njk`:**
   Render the pre-rendered string inside the macro synchronously:
   ```njk
   {{ item.imageHTML80 | safe }}
   ```
   This keeps the macro fully synchronous, avoiding any scope corruption or layout nesting issues.

### Revert to Static `<img>` tags inside `feed-card.njk`
If post thumbnail responsive optimization is not required in the feeds, revert the changes in `src/_includes/components/feed-card.njk` back to standard `<img>` tags pointing to `itemImage`.
