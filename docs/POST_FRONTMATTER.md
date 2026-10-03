# Post Frontmatter Modes

Flags that control visibility, display, and listing behaviour for content in `src/posts/`.

## `hidden: true`

- **Excluded** from all collections (posts, feed, tags, sitemap, featuredPost).
- URL still accessible if you know it.
- Shows **"Draft: You've wandered into a work-in-progress post"** banner at the top of the post.
- Use for: fully private drafts you don't want indexed or listed.

## `draft: true`

- **Included** in all collections (posts, feed, tags) - publicly visible and listed.
- **Excluded** from `featuredPost` - won't appear in the homepage featured slot.
- Shows **"Note: I publish drafts even when not complete"** banner at the top of the post.
- Counted separately in `stats.drafts`.
- Use for: works-in-progress you're okay sharing but want to flag as incomplete.

## `featured: true`

- Appears in the **★ Featured** slot on the homepage.
- When multiple posts have `featured: true`, the newest one wins (by `updated` or `date`).
- To control priority explicitly: `featured: { weight: 1 }` - lower weight wins.
- Draft posts (`draft: true`) are excluded from the featured slot even if `featured: true` is also set.

## `pinned: true`

- Floats the post to the **top of the posts listing** (above date-sorted posts).
- Shows a **★** prefix in the feed list and card views.

## `updated: YYYY-MM-DD`

- Sets a "last updated" date shown alongside the post date.
- Used for sorting in the `featuredPost` collection (newer `updated` wins over `date`).
- Also updates the feed sort date for posts.

## Other Useful Fields

| Field                       | Effect                                                                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `description`               | Subtitle shown below title; used as feed summary. **Max 120 characters**, one sentence or two short ones. Enforced by `check:content`.     |
| `excerpt`                   | Alternative summary fallback for feed cards                                                                                               |
| `tags`                      | Array of tags (1–2 max); filtered through `filterTagList` to strip internal tags                                                          |
| `author`, `source`          | Minimal attribution data used for Quotations, Lexicon, and feed cards. Replaces hardcoded HTML callouts.                                  |
| `authored_by`               | Authorship badge: `human`, `ai-assisted`, `ai-generated`. Omit = shows **Unclassified** badge.                                            |
| `image`                     | **Required.** Thumbnail / OG image path under `/img/blog-sketches/unique/`; unique per post. Enforced by `check:content`.                  |
| `imageAlt`                  | **Required** with `image`. Describes the sketch's content.                                                                               |
| `collectionArchetype`       | Declares the collection page's layout archetype: `index`, `wall`, `shelf`, or `ledger`. See `docs/DESIGN_LANGUAGE.md`.                   |
| `fullWidth: true`           | Disables the sidebar on the post layout                                                                                                   |
| `conversationPlacement`     | Where to show comments - `sidebar` (default) or `bottom`                                                                                  |
| `featuredAt` / `pinnedAt`   | Override the date used for featured sort order                                                                                            |

## Key Files

- `eleventy.config.mjs` - collections, filters, plugins
- `src/_includes/layouts/post.njk` - post layout, draft/hidden banner logic
- `src/_data/featured.js` - featured post resolution helper
- `src/_data/stats.js` - site-wide stats (published/draft counts)
- `src/_includes/components/feed-card.njk` - feed list & grid card
- `src/index.njk` - homepage (featured post + recent feed)
- `src/feed.njk` - /feed/ page

## Eleventy Development Tips

- **Tag Visibility**: Internal routing tags (like `lexicon`, `til`, `now`) must be excluded from UI display by adding them to `filterTagList` in `eleventy.config.mjs`.
- **Feed Data Cascade**: When exposing Eleventy items to a feed collection that needs raw body HTML, pass the raw item (`original: entry`) rather than mapping a detached getter for `templateContent`. Detached getters break Nunjucks's ability to render the body for feed views.

## Devices (`src/devices/<slug>.md`)

Each machine or piece of gear is an entity with its own page at `/devices/<slug>/`, listed on `/devices/`.
Link to one from any post or note with `{% device "slug" %}` (renders a small chip with the device's emoji;
`{% device "slug", "label" %}` overrides the text). An unknown slug fails the build. The device page
lists every post/note that uses the shortcode under "Mentioned in".

| Field | Effect |
|---|---|
| `title` | Page title and chip text (e.g. the hostname `yeti-cachy`) |
| `emoji` | Icon shown in the chip, page header, and index |
| `aka` | Friendly name shown under the title |
| `kind` | `machine` or `gear` |
| `state` | `active`, `retired`, `sold`, ... shown as a badge. **Not `status`**: `src/_data/status.js` is global data and shadows it, rendering `[object Object]` |
| `role` | One-line role, used as the spec sheet heading and on the index |
| `description` | Intro paragraph |
| `station` | Optional desk/location, shown in the eyebrow |
| `specs` | List of `{ label, value }` rows for the spec sheet |
| `parts` | Optional list of `{ name, note }` shown under the spec sheet |
| `log` | Timeline of `{ date, text }`. **Quote the dates** (`"2026-09-30"`); unquoted YAML dates become JS `Date` objects and print as full timestamps |

The Markdown body is free-form notes (reviews, quirks, history). The `/uses/` host card for a machine links
to its device page via `device: <slug>` in `src/_data/uses.yaml`.
