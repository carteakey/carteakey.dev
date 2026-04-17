# carteakey.dev — Claude Code Guide

Personal blog built with Eleventy 3.x, Tailwind CSS v4, Alpine.js, and Nunjucks templates.

## Post Frontmatter Modes

These flags control visibility, display, and listing behaviour for posts in `src/posts/`.

### `hidden: true`
- **Excluded** from all collections (posts, feed, tags, sitemap, featuredPost).
- URL still accessible if you know it.
- Shows **"Draft: You've wandered into a work-in-progress post"** banner at the top of the post.
- Use for: fully private drafts you don't want indexed or listed.

### `draft: true`
- **Included** in all collections (posts, feed, tags) — publicly visible and listed.
- **Excluded** from `featuredPost` — won't appear in the homepage featured slot.
- Shows **"Note: I publish drafts even when not complete"** banner at the top of the post.
- Counted separately in `stats.drafts`.
- Use for: works-in-progress you're okay sharing but want to flag as incomplete.

### `featured: true`
- Appears in the **★ Featured** slot on the homepage.
- When multiple posts have `featured: true`, the newest one wins (by `updated` or `date`).
- To control priority explicitly: `featured: { weight: 1 }` — lower weight wins.
- Draft posts (`draft: true`) are excluded from the featured slot even if `featured: true` is also set.

### `pinned: true`
- Floats the post to the **top of the posts listing** (above date-sorted posts).
- Shows a **★** prefix in the feed list and card views.

### `updated: YYYY-MM-DD`
- Sets a "last updated" date shown alongside the post date.
- Used for sorting in the `featuredPost` collection (newer `updated` wins over `date`).
- Also updates the feed sort date for posts.

## Other Useful Fields

| Field | Effect |
|---|---|
| `description` | Subtitle shown below title; used as feed summary |
| `excerpt` | Alternative summary fallback for feed cards |
| `tags` | Array of tags; filtered through `filterTagList` to strip internal tags |
| `authored_by` | Authorship badge: `human`, `ai-assisted`, `ai-generated`. Omit = shows **Unclassified** badge. |
| `image` | OG image path for social sharing |
| `fullWidth: true` | Disables the sidebar on the post layout |
| `conversationPlacement` | Where to show comments — `sidebar` (default) or `bottom` |
| `featuredAt` / `pinnedAt` | Override the date used for featured sort order |

## Key Files

- `eleventy.config.mjs` — collections, filters, plugins
- `src/_includes/layouts/post.njk` — post layout, draft/hidden banner logic
- `src/_data/featured.js` — featured post resolution helper
- `src/_data/stats.js` — site-wide stats (published/draft counts)
- `src/_includes/components/feed-card.njk` — feed list & grid card
- `src/index.njk` — homepage (featured post + recent feed)
- `src/feed.njk` — /feed/ page
