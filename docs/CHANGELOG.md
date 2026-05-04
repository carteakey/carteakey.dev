# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.6] - 2026-04-30
### Added
- Added editorial post shortcodes for semantic callouts, dated inline updates, definition popovers, and true sidenotes.
- Added `docs/BLOG_POST_FEATURES.md` as the canonical feature inventory for future post-authoring and agent cleanup work.

### Changed
- Migrated obvious legacy blockquote callouts in existing posts to the new editorial callout/update primitives.
- Removed stale unused annotation/margin-note CSS utilities and the obsolete `statblock` documentation reference.
- Updated the design language guide with the current post-level editorial primitives.

## [2.0.5] - 2026-04-30
### Added
- Added Markdown footnote support for inline references (`[^id]`) and definitions (`[^id]: note`) with compact endnote styling in the site's editorial typography layer.

### Changed
- Hidden content now renders in local/dev builds with explicit "Hidden" labels in post pages, archive listings, feed cards, tag pages, and search.
- Production builds continue to exclude `hidden: true` content from page output, collections, tags, search, and raw text exports.

## [2.0.4] - 2026-04-25
### Added
- Created `src/notes/_template.md` for standardized note creation with `hidden: true` by default.

### Changed
- Standardized frontmatter across all existing notes (layout, authored_by, permalink, date format).
- Updated `eleventy.config.mjs` to include `description` and `tags` in the note feed mapping for consistent card rendering.

## [2.0.3] - 2026-04-25
### Fixed
- Fixed the masonry layout in the unified feed's grid view by restoring the missing `feed-masonry` class to the grid container and ensuring all items possess the `.feed-card` class required by the layout script.
- Standardized `feed-card.njk` class names to match existing `tailwind.css` tokens (`feed-card-full`, `feed-card-stream`).

## [2.0.2] - 2026-04-25
### Added
- Added a unique monochrome hero sketch for "What Obsidian Shouldn't Be" following the blog-sketch editorial workflow.

## [2.0.1] - 2026-04-25

### Changed
- Standardized content attribution across the site by moving manual attribution HTML into frontmatter metadata (`author`, `source`) and natively rendering it in the post layout and feed cards (matching the Quotations style).
- Refined the "Grandiloquent" list page by tightening whitespace and integrating the new dynamic attribution rendering.
- Renamed the "Grandiloquent" filter pill to "Lexicon" in the feed UI to match the card badge text.
- Filtered out the internal `grandiloquent` tag from rendering visibly in post metadata.

### Fixed
- Fixed an issue where `/now/` updates and notes were appearing as empty blocks in the stream feed by correcting how Eleventy passes their `templateContent` in the data cascade.

## [2.0.0] - 2026-04-24

### Added
- `docs/MIGRATION_PROCESS.md`: Added a repeatable migration workflow for bringing older pages onto the new design language without one-off typography patching.

### Changed
- `colophon.njk`: Rewrote the colophon around the current archive/workbench design language, updated the stack/fonts notes, and added an explicit redesign history that tracks this release as major redesign #6.
- Promoted the ongoing redesign line to `2.0.0` to mark the archive/workbench reset as a fresh visual baseline rather than another incremental polish pass.

## [1.9.30] - 2026-04-24

### Changed
- Added reusable editorial typography primitives for section labels, titles, support copy, meta links, footer navigation, and `/now/` prose so broader cleanup passes stop depending on one-off utility stacks.
- Carried the new type layer through `archive.njk`, the footer mega nav, and the `/now/` page plus its workout/game snippets so those sections no longer fall back to the older default UI text treatment.

## [1.9.29] - 2026-04-24

### Added
- `docs/DESIGN_LANGUAGE.md`: Added a working design-language guide covering typography roles, density, surfaces, anti-patterns, and implementation rules for future redesign passes.

## [1.9.28] - 2026-04-24

### Changed
- Promoted the homepage Recent Activity block from utilitarian feed rows to a denser editorial contents list by giving entries stronger display typography, better vertical rhythm, and less truncation.
- Carried the same typography system into the notes index and note layout so `/notes/` and individual note pages no longer fall back to the older plain UI text treatment.

## [1.9.27] - 2026-04-24

### Changed
- Applied the editorial type layer more broadly across post-page support chrome: breadcrumbs now use the mono uppercase header treatment, and draft/AI notices, sidebar copy, outline links, and conversation prompts now inherit the same serif support-copy styling as the rest of the redesign.

## [1.9.26] - 2026-04-24

### Changed
- Carried the homepage editorial type system through the remaining support copy so selected-work notes, featured descriptions, and site-index descriptions no longer fall back to the plain UI sans.

## [1.9.25] - 2026-04-24

### Changed
- Reworked the lower homepage into a cleaner four-block grid so featured writing, recent activity, quote of the day, and popular posts each get their own space.
- Renamed the user-facing “Blog” section to “Writing” across homepage labels, navigation, breadcrumbs, footer links, and the archive page while keeping the `/blog/` URL stable.
- Tightened the homepage site index to six more intentional sections and moved its labels onto the display type so it stops falling back to the older UI font.

## [1.9.24] - 2026-04-24

### Changed
- Swapped the ruled notebook treatment for a lighter textured-paper background that feels closer to an archive page than a startup landing page.
- Reworked the editorial typography stack so display headings use `et-book`, body copy uses `Crimson Pro`, and shared page headers/posts inherit the same print-like hierarchy.
- Renamed the homepage featured/collection language from “Essay” to “Blog” and restored the shorter personal bio copy on the homepage.
- Brought `post.njk` further into the new system with squarer author/media chrome, flatter comment and reaction controls, and cleaner next/previous navigation.

## [1.9.23] - 2026-04-24

### Added
- `startHere.yaml`: Added a curated homepage canon used by the new Selected Work index section.

### Changed
- Reworked the shared site design language away from rounded glassy cards toward sharper, denser editorial surfaces with mono labels, flatter controls, and paper-like ruled backgrounds.
- Rebuilt the homepage as an index of work and thinking: denser intro, at-a-glance counts, Selected Work, Site Index, Featured Blog, Recent Activity, and Signal/Popular sections.
- Tightened navigation and footer chrome to match the new archive/workbench feel instead of app-style controls.

### Fixed
- `feed-card.njk`: Removed a duplicated macro tail that was breaking Nunjucks parsing for `/feed/` during Eleventy builds.

## [1.9.22] - 2026-04-24

### Fixed
- Converted `about.md`, `more.md`, `colophon.md`, `now-archive.md`, and `folio/radiohead/links.md` to `.njk` — the markdown processor was wrapping Nunjucks-rendered `page-header` HTML in invalid `<p>` tags, causing horizontal indentation on the heading.
- feed-card.njk: Loosened quotation clip threshold from `max-h-32` to `max-h-44` so more quote text is visible before the fade overlay.

## [1.9.21] - 2026-04-24

### Added
- cv.njk: Full page redesign using site-consistent `.surface` cards, `page-header` component, feather icon section headings, tech/domain badge pills, and contact strip — replaces raw HTML tables and inline styles.

### Changed
- base.njk: Rebalanced footer mega-menu — moved Games, Workouts, Listening, and Life in data from the overloaded EXPLORE column into ABOUT ME for even distribution.
- base.njk: Changed Vibes nav icon from `music` to `image` (visual/meme collection, not music).
- post.njk: Moved AI Assisted / AI Generated notice banner from below the copy-markdown button to immediately after the Draft notice, grouping all post-status notices together at the top of the article header. Uses `.surface surface-compact` styling for visual consistency.

### Fixed
- feed-card.njk: Fixed quotation author/source attribution being clipped by `overflow-hidden` in grid view. Quote text now clips independently in its own `max-h-32` container while author name and source are always visible below it.

## [1.9.20] - 2026-04-24

### Changed
- Standardized the visual language of remaining legacy custom box containers (Newsletter form, Guestbook submission, Search results, 404 hints, EthicalAds wrappers, and Post sidebar boxes) to use the cohesive `.surface` component design system (glassmorphism backgrounds, standard rounded borders, and subtle box-shadows).

## [1.9.19] - 2026-04-24

### Added
- Added a distinct `.badge-featured` utility class utilizing an amber color palette to visually separate the "Featured" post from standard "Pinned" posts.

### Changed
- Replaced the text "Pinned" and the unicode star (★) with a `bookmark` Feather icon across all pinned badges to visually distinguish them from Featured items.

### Fixed
- Resolved an Eleventy data cascade collision where the global `featured.js` object erroneously shadowed boolean `featured` frontmatter flags, restoring correct Featured post selection and styling on the homepage.
- Renamed the global `featured.js` data file to `featuredItems.js` to avoid namespace collisions with local post fields.

## [1.9.18] - 2026-04-22

### Changed
- Refactored `/folio/ai-memes` to be fully config-based, migrating hardcoded grid cards to a dynamic Eleventy loop driven by `src/_data/memes.yaml`.
- Updated `media-import` skill to append AI meme configurations sequentially to YAML rather than directly injecting HTML blocks.

## [1.9.17] - 2026-04-22

### Changed
- Introduced a shared `page-header` component and applied it across major archive, collection, utility, and project pages to unify section intros.
- Standardized badge and metadata styling across blog, feed, snippets, TIL, quotations, workouts, and project listings with reusable badge primitives.
- Consolidated card/surface styling around shared surface classes so featured modules, feed cards, side panels, and GitHub sections feel visually related.

## [1.9.16] - 2026-04-22

### Added
- Added a monochrome Notion-style blog sketch image pack under `src/static/img/blog-sketches/`.
- Added `docs/BLOG_SKETCH_IMAGES.md` documenting a unique transparent per-post image workflow.
- Added `.agents/skills/blog-sketches/` with a reusable style guide and transparent sketch prep helper.
- Added optional post image rendering for article lead images, feed cards, featured posts, and blog archive thumbnails.


## [1.9.15] - 2026-04-19

### Added
- Added manual guestbook entries to the `guestbook.yaml` data file.

### Changed
- Grouped all local AI inference and benchmark posts under a new `local-inference` series folder. Added backward-compatible 301 redirects to `src/_redirects` to retain their original URLs.
- Established `agents` and `homelab` series folders, grouping related posts. Added `giscusTerm` frontmatter overrides to retain original discussion threads.
- Dismantled broad `tech` and `personal` folders into standalone tagged posts.
- Added `docs/TAXONOMY.md` to formalize the difference between Series (folders) and Tags.

## [1.9.14] - 2026-04-04

### Added
- 4 new quotes added to the Quotes collection (Anonymous, David Foster Wallace, Nassim Nicholas Taleb, Douglas Adams).
- 10 new Agent Tick (AI memes) cards added to the folio.
- 9 new vibes screenshots added to the vibes collection.
- 4 original local photos imported with accurate EXIF tracking and metadata.

### Changed
- Unified media ingestion skill (`.agents/skills/media-import/SKILL.md`) established, defining standard pipeline logic for processing raw files from the `inbox/` into `photos.yaml`, `vibes`, and `ai-memes`.
- Enforced MD5 hashing for photography imports to deduplicate uploads against previously ingested local photos.
- Radiohead visual archive imagery fully migrated from root images folder directly into `src/static/img/folio/radiohead/` for better isolation.

### Added
- Created Prompt Library page (`/prompts/`) with prompts collection for testing language models.
- Added first prompt: "Bouncing Balls in Spinning Heptagon" - complex physics simulation challenge.
- Added short introduction to Gemma 4 26B-A4B post highlighting key features and model capabilities.
- Added folio page dates documentation in `docs/instructions.md` to clarify that dates are permanent and manually controlled.

### Changed
- Moved utility scripts (`add-photo.mjs`, `bulk-add-photos.mjs`, `check-engagement-merge.mjs`, `remove_em_dashes.py`) from root to `utils/` directory.
- Updated package.json script references to point to new `utils/` location.
- Updated documentation references in `.github/copilot-instructions.md` and `AGENTS.md` to reflect new script paths.
- Linked bouncing balls prompt from Gemma post benchmarks section.

## [1.9.12] - 2026-03-24

### Changed
- Agent Tick folio caption QA pass: refined several meme titles/captions for clearer, less generic copy while preserving the original tone.
- Improved Agent Tick meme media accessibility by tightening alt text wording and adding an explicit `aria-label` on the video card.

## [1.9.11] - 2026-03-23

### Added
- Search page now supports type/tag/year filters with URL state sync and sort controls (relevance/newest/oldest).
- Home page now shows a “Popular posts” section based on Redis-backed upvote totals.
- Blog archive now includes year jump links with grouped year headings for easier browsing.
- Added print-focused styles to improve readability and remove non-essential UI in printed output.

### Changed
- Search index payload was reduced by truncating embedded content in the client-side index.
- Search result tag links now route snippet tags to `/snippets/tags/{slug}/` and post tags to `/tags/{slug}/`.
- Theme-color handling is now centralized to one dynamic meta tag synced with accent color and dark mode.
- Steam and Strava data fetch modules now use quieter logging and cleaner cache-read handling.

### Fixed
- Strava cache reads now await `AssetCache.getCachedValue()` for both token and activities, preventing stale/invalid-cache flow issues.
- Removed unused legacy `src/_data/stats.js` module to avoid stale estimate-based data paths.

## [1.9.10] - 2026-03-23

### Changed
- GitHub repos data fetch now persists successful responses to Eleventy `AssetCache` and falls back to cached data when live fetches fail.
- Spotify and QOTD data modules now use quieter, safer logging (no token/payload dumps), while preserving existing data fallbacks.
- Aligned top-level `sharp` dependency to `^0.33.5` to match `@11ty/eleventy-img` and reduce duplicate libvips runtime warnings.

### Fixed
- Prevented accidental generation of the placeholder `/now/archive/YYYY-MM-DD/` page by disabling permalink output in `src/now/archive/_template.md`.
- Removed stale `.DS_Store` artifacts from `src/folio` source tree.
- Synced `docs/TODO.md` status for already-implemented items: stats density updates, lazy image loading, post TOC, and blog post JSON-LD.

## [1.9.9] - 2026-03-18

### Changed
- Pinned post indicators are now icon-only (★) across blog archive list view, blog grid view, and feed cards (list/grid), removing the extra `Pinned` text label.

## [1.9.8] - 2026-03-18

### Added
- Agent Tick folio now tracks and displays a live visitor view counter using the existing Netlify `upvote` function (`trackView=true`), aligned with the Radiohead folio pattern.

## [1.9.7] - 2026-03-18

### Changed
- Agent Tick UI copy now uses a terminal prompt glyph (`❯`) instead of `//`, and the main header title now includes a tick icon next to `TICK`.

### Fixed
- Deduplicated AI meme media by file hash and removed older long-caption duplicate cards/assets.

## [1.9.6] - 2026-03-18

### Changed
- Hidden `Unforwarder v2: Kill the Noise, Save the Memories` from public collections/feed while keeping its direct URL accessible.

## [1.9.5] - 2026-03-18

### Added
- AI memes folio: 11 new memes added (total: 14 entries)
- Video support for folio memes with inline playback (click to play/pause)

### Changed
- AI memes folio: Updated permalink from `/folio/ai-memes/` to `/folio/agent-tick/`
- AI memes folio: Improved captions - replaced text-copying descriptions with concise, witty titles

### Fixed
- Folio index now points to the Agent Tick canonical URL (`/folio/agent-tick/`) and legacy `/folio/ai-memes/` links redirect correctly.
- GPT-OSS optimization post cleanup: removed leaked merge-conflict markers (`<<<<<<< HEAD` / branch tail) from the published content.

## [1.9.4] - 2026-03-17

### Added
- `/folio/ai-memes/` - "Agent Tick ✓": a visual chronicle of AI absurdity featuring memes about vibe coding, ChatGPT, Claude, prompt engineering, and the agent era
- Terminal-meets-editorial design: Playfair Display headlines + IBM Plex Mono metadata, terminal green (#00ff87) accent, the ✓ as brand glyph
- Random meme button with scroll + highlight animation
- Source attribution links for meme origins
- First 3 memes: XKCD-style agent/vibe coding + prompt engineer dating

## [1.9.3] - 2026-03-13

### Added
- Added `npm run metrics:merge-check` admin utility to compare old/new slug Redis counters and print expected merged totals for both `upvotes` and `views` (supports optional namespace, e.g. snippets).

## [1.9.2] - 2026-03-13

### Added
- Snippet pages now track and display per-snippet view counts using namespaced keys (`snippet:{fileSlug}`) to avoid collisions with post counters.

### Fixed
- Expanded slug transition merging for engagement counters so legacy and canonical keys are summed for both `upvotes` and `views`, including historical draft→final renames and space→hyphen slug transitions.

## [1.9.1] - 2026-03-13

### Fixed
- Preserved engagement continuity for renamed posts by merging legacy Redis upvote/view keys into canonical slugs (including `optimizing gpt-oss-120b-local inference` -> `optimizing-gpt-oss-120b-local-inference`).
- Restored the existing GPT-OSS post discussion thread after slug rename by allowing a post-level Giscus term override.

## [1.9.0] - 2026-03-03

### Added
- `/folio/` section: themed standalone web pages for personal obsessions - each with its own design, fonts, palette
- `/folio/radiohead/` - first folio: a curated web archive of Radiohead's internet presence, archive maze sites, essential albums, B-sides, fan databases, and personal notes
- Folio link added to footer navigation (Explore category) and `/more/` page

## [1.8.5] - 2026-03-01

### Added
- uses.yaml: Audio section with AirPods Pro 2, Sennheiser HD 4.50 BTNC, Crinacle Zero 2, Moondrop Chu 2, Moondrop Quarks DSP

### Changed
- uses.yaml: Updated peripherals - Dell P3424WEB, Apple Magic Keyboard, Redragon Kumara, Logitech M720 Triathlon, Akai MPK Mini
- uses.yaml: Retired Dell U2722D, Keychron K2, Logitech MX Master 3, Sony WH-1000XM4

## [1.8.4] - 2026-02-28

### Changed
- uses.yaml: Renamed Productivity → Organize section; added all devices (Mac Work/Personal, Windows PC, Asus FX505, Raspberry Pi); switched password manager to Bitwarden + Apple Passwords + Microsoft Authenticator; switched browsers to Safari/Edge/Firefox; added Raindrop.io + Hoarder bookmarks; added Apple Notes, Google Calendar, Apple Reminders; replaced GitHub Projects with Notion for project tracking
- uses.yaml: Retired Arc Browser and 1Password

## [1.8.1] - 2026-02-28

### Changed
- Stats page (`/stats/`) full redesign: Dense Editorial layout, row-item stats, posts-per-year CSS bar chart, real word count (summed from rendered post content), avg words/post - removed card grid and fake estimated word count

### Added
- `sumWordCounts` filter: sums word counts across a posts collection using actual rendered content
- `countByYear` filter: groups collection items by year, returns `{ year: count }` map
- `wordCount` filter: strips HTML and counts words in a content string
- `numberString` filter: formats numbers with thousands commas (e.g. 12,345)
- `merge` filter: merges two objects (used in template data building)

## [1.8.0] - 2026-02-28

### Added
- `/colophon` page: stack, design philosophy, AI-assisted dev disclosure, source link; linked from footer
- `/now/archive/` redesigned: timeline with vertical line + accent dots replacing flat link list
- Now page: "Past updates →" link next to /now description
- `/til/` collection: Today I Learned entries with layout, list page, search, feed integration (yellow dot)
- `/reading/` shelf page: Currently Reading (with CSS progress bars), Read (star ratings), Want to Read
- `/changelog/` page: visual timeline parsed from CHANGELOG.md - version badges, Added/Changed/Fixed/Removed sections color-coded
- `src/_data/changelog.js`: parses CHANGELOG.md into version objects for the changelog page
- `src/_data/reading.yaml`: book data structure for reading shelf
- TIL type added to feed collection (yellow dot, "TIL" badge)
- Colophon link added to footer credit line

## [1.7.2] - 2026-02-27

### Added
- Notes: `src/microposts/` renamed to `src/notes/`; "micropost" → "note" everywhere (type, badge, filter)
- Notes: each note now has a permalink at `/notes/{slug}/` and renders via `layouts/note.njk`
- More page: proper h1 + description line below title (matches other listing pages)

### Fixed
- Nav: font bumped to `text-base` on title + links; `gap-1` added to icon list for mobile breathing room
- Mobile footer: 2-col categorized grid with icons (Read + Explore) instead of unstructured flat list
- Profile image: `items-center` on mobile flex column; text block `text-center sm:text-left`
- Feed list on mobile: date column hidden below 480px (3-col grid: dot + type + title); visible on wider screens



### Fixed
- Homepage feed grid: add `data-feed-masonry` + masonry script include so grid cards have true dynamic heights (matching feed page)
- Mobile slider: replaced w-20 touch-hostile range input with a tap-to-cycle colored dot on xs screens; full gradient slider remains on sm+
- Footer mobile: replaced 2×2 grid (ugly) with flat wrapped inline link list on mobile; 4-column categorized grid retained for md+



### Changed
- Navbar: About/Blog/Now text links hidden on mobile (sm: breakpoint) - compass + slider + dark mode remain; no more squished nav
- Homepage feed view toggle: replaced custom active state with `view-toggle` CSS + feather icons (consistent with blog/snippets)
- Feed page: search moved into header row alongside view toggle (like blog); view toggle uses `view-toggle` CSS + icon-only feather icons; h1 now matches blog sizing; item count shown inline



### Changed
- Default accent color changed from amber to teal (`#14b8a6`)
- Feed grid on homepage now uses `items-start` for dynamic card heights (matches other grids)

### Removed
- Dead CSS: `.card-elevated`, `.card-glass`, `.intro-block` blocks removed from tailwind.css
- Service worker: replaced stale `prism-coy.css` cache entry with `prism-light.css`

## [1.6.8] - 2026-02-27

### Changed
- base.njk: Accent slider moved from extended footer (required scrolling ~1300 lines into page) into the nav bar, between the compass icon and dark mode toggle - now always visible on every page
- base.njk: Slider redesigned as a compact inline gradient bar (w-20/w-28) with a white hairline indicator; no thumb ball needed (gradient itself shows position)
- base.njk: Site title unified to "carteakey.dev" on both desktop and mobile - removes "Kartikey Chauhan" desktop variant and the `font-et-book` (Latin serif) font
- base.njk: Nav `py-3` → `py-3.5` (slightly taller for consistency with body text size)
- base.njk: Old footer slider block removed



### Fixed
- tailwind.css: Moved `.title-hover:hover` completely OUT of `@layer components` - in Tailwind v4, `@layer utilities` always beats `@layer components` regardless of specificity, so hover color was always overridden by `text-gray-900 dark:text-gray-100`. Unlayered CSS beats all layers. Added `!important` as belt-and-suspenders.
- base.njk: Accent slider thumb was invisible - Tailwind v4 only scans static HTML class names; dynamic Alpine `:class="themes[currentIndex].color"` bindings like `bg-amber-500` are never included in generated CSS. Fixed by switching to `:style="background-color: ${themes[currentIndex].hex}"` with hex values embedded directly in the data object (matching the `ACCENT_COLORS` map in theme.js).
- base.njk: Slider label now uses `x-text="themes[currentIndex].name"` (was `.label` - removed unused label field from theme data).



### Fixed
- tailwind.css: Added `.site-content .title-hover:hover` (specificity 0,3,0) alongside `.title-hover:hover` (0,2,0) - Tailwind's `dark:text-gray-100:is(.dark *)` also has 0,2,0 and wins by cascade order when equal; the higher-specificity rule now correctly applies accent color on hover in blog/snippets list rows
- base.njk: Accent slider `updateTheme()` now calls `window.setAccentTheme()` explicitly instead of bare `setAccentTheme()` - Alpine.js component scope doesn't reliably fall through to window globals, causing the slider to move visually but not update the CSS variable



### Fixed
- snippets.njk: Added `| reverse` to both list and grid loops - snippets collection is oldest-first by default (unlike posts which has an explicit sort); now shows newest snippets first, matching blog behavior



### Changed
- snippets.njk: Full rewrite to match blog (archive.njk) exactly - same inline h1+count header, same search field style, list view as default, list button first then grid, same list row design (date col + title + language tag), same grid card design (feed-card-full style with purple dot). Removed page-header component and wrapping max-w div.
- index.njk: Homepage feed now shows list toggle FIRST, then grid toggle (consistent with blog/snippets). Removed redundant "→ Feed" footer link (was duplicate of "All →" in header). Grid bumped to 3-col (lg:grid-cols-3). Shows 9 items.
- index.njk: Feed default is now list view (localStorage key h-feed-view), matching editorial density preference.

### Fixed
- index.njk: "All →" and "→ Feed" both linking to /feed/ (duplicate). Kept only "All →" in the section header.



### Fixed
- tailwind.css: Links are now gray (color: inherit) with underline by default, accent color on hover - removes all accent-as-default link color. Works consistently in both prose and not-prose contexts
- tailwind.css: Removed `!important` from `.not-prose a` reset - no longer needed since content links don't set accent by default
- tailwind.css: `.site-content picture` centering now scoped to `article picture` only - fixes profile avatar being pushed/clipped by `margin: 1.5em auto`
- tailwind.css: `.not-prose picture` reset added - avatars/icon images in UI components no longer affected by post-image centering rules
- feed.njk: Description changed from "/now snapshots" to "and updates"

### Changed
- index.njk: Homepage feed section now defaults to grid view (2-col compact cards); list toggle added; view persisted to localStorage key `h-feed-view`

## [1.6.2] - 2026-02-27

### Added
- base.njk: Global code block copy button - clipboard SVG icon appears on pre:hover, turns accent on hover, switches to checkmark on success
- tailwind.css: `.copy-code-btn` styles - positioned absolute, dark semi-transparent background, accent on hover

### Fixed
- base.njk: "More" (compass) nav icon now uses accent color
- tailwind.css: `.site-content .not-prose a` reset uses `!important` to definitively prevent accent color from leaking into feed cards and UI components
- archive.njk: Removed `| reverse` from both list/grid loops - `collections.posts` is already sorted newest-first in eleventy.config.mjs; `| reverse` was making it oldest-first
- snippets.njk: Grid cards switched from `card card-hover card-compact` to flat `border border-gray-200` style; list view rewritten as `divide-y` rows with date col + title + language tag (matches blog list design)
- tailwind.css: `.site-content picture` and `.site-content picture img` rules added - images in post content are now centered with `margin: auto`
- picture CSS: Added `text-align: center` and `display: inline-block` on img for proper centering



### Added
- src/static/css/prism/prism-light.css: New clean GitHub-inspired light syntax theme (replaces broken prism-coy)

### Fixed
- index.njk: Homepage footer → "→ Feed" (single clean link)
- index.njk: Profile avatar wrapped in constrained `w-20 h-20 rounded-full overflow-hidden` div - fixes blurriness and gradient ring
- eleventy.config.mjs: Image shortcodes now use `widths: [400, 800, 1200, "auto"]` with proper `sizes` (was `["auto"]` = single size only); removed `style="max-width: 100%; height: auto;"` inline style override
- tailwind.css: Added `picture { display: block }` + `picture img { max-width: 100%; height: auto }` global rules
- projects.njk: Removed `intro-block` card wrapper → plain text description; GitHub table redesigned as clean bordered table with `title-hover` links and `meta-text` dates; description column hidden on mobile
- gallery.njk: Removed `intro-block` card wrapper → plain text description
- theme.js / base.njk: Switched default Prism theme from `prism-coy` to `prism-light`



### Added
- stats.njk: Hero callout strip with 4 large accent-colored numbers (Posts, Snippets, This Year, Tags)
- feed.njk: List/grid toggle, type filter chips, inline search - list view defaults to homepage activity style
- base.njk: Footer nav links now have feather icons (clock, activity, edit-3, code, box, image, music, etc.)
- base.njk: Site title now shows accent color always (not just on hover)
- base.njk: Dark mode toggle icon uses accent color
- index.njk: Profile avatar larger (w-20 h-20) + conic gradient ring restored
- index.njk: Homepage footer link text cleaned up ("Blog · Snippets · Feed · Search")
- feed-card.njk: Pinned star icon (★) shown in list variant when item is pinned

### Changed
- theme.js: Exposed `setAccentTheme`, `isDarkMode`, `switchPrismTheme` as `window.*` globals - fixes accent slider in Alpine.js context
- tailwind.css: Code block background mode-aware - light gray in light mode, dark navy in dark mode; removed `!important` overrides
- package.json: Bumped all dependencies to latest (eleventy 3.1.2, tailwind 4.2.1, 11ty-img 6.0.4, sharp 0.34.5, etc.)

## [1.5.8] - 2026-02-26

### Changed
- post.njk: Post navigation redesigned - "Next →" / "← Previous" labels with title-hover links



### Fixed
- tailwind.css: `.site-content a` link styling scoped to `:is(p, li, blockquote, td, th) a` - prevents accent-color from applying to UI/nav/card links inside site-content
- base.njk: Added `not-prose` to `<nav>` and `<footer>` elements to isolate them from content typography styles
- tailwind.css: Added TOC (`<nav class="toc">`) styles - no disc bullets, clean link style with accent hover
- post.njk: Avatar hover glow → accent CSS variable gradient (removes hardcoded amber-400)



### Changed
- page-header.njk: h1 `text-2xl` → `text-xl` for density consistency
- 404.md: h1 `text-4xl/5xl` → `text-3xl/4xl`, cards flattened (removed bg+shadow), text-lg → text-sm, amber hover links → `title-hover`, py-20 → py-16
- quotes.njk: h1 `text-3xl` → `text-xl`, quote cards `card-padding` → `card-compact`, `text-base` → `text-sm`
- skills.njk: `text-lg` → `text-sm` on breakdown heading
- stats.njk: card padding `p-5 sm:p-6` → `p-3 sm:p-4`, tag icon bg → accent color via CSS variable
- guestbook.njk: headings `text-lg` → `text-sm`
- newsletter.njk: headings `text-lg` → `text-sm`
- blogroll.njk, bookmarks.njk: headings `text-lg` → `text-sm`
- postslist.njk, archive.njk: Pinned badge → accent CSS variable (removes hardcoded amber)
- post.njk: avatar hover glow → accent CSS variable gradient (removes hardcoded amber)
- base.njk: skip-link `focus:bg-amber-500` → `style="background: var(--accent-color)"`
- tailwind.css: `.badge-count` → accent CSS variable (removes hardcoded amber); `.tag-interactive:hover` → accent CSS variable; `color-mix` for consistent theming



### Changed
- base.njk: Drop Tailwind prose entirely - replaced with custom `.site-content` typography class; body set to `text-sm` (14px); nav links tightened to `text-sm` (no md:text-base); site title reduced to `text-base`
- tailwind.css: Added comprehensive `.site-content` typography block (~200 lines) - 0.9375rem base, 1.65 line-height, all HTML elements styled. `.not-prose` escape hatch fully defined. Removes dependency on `@tailwindcss/typography`
- eleventy.config.mjs: `readableDate` filter changed from `DATE_FULL` to `MMM d, yyyy` (e.g., "Feb 26, 2026")
- theme.js: Fixed accent slider - removed `.prose` class manipulation from `updateAccentClasses` (only `setAccentVariables` needed)
- post.njk: Post article spacing tightened (`space-y-8` → `space-y-6`, header `space-y-5` → `space-y-3`); description `text-lg` → `text-sm`; sidebar headings `text-lg` → `text-sm`
- feed-card.njk: Removed `prose-sm dark:prose-invert` - replaced with `not-prose` to use site-content typography
- search.njk, uses.njk, newsletter.njk, guestbook.njk, stats.njk, quotes.njk, bookmarks.njk, blogroll.njk: Replaced `text-lg`/`text-xl` headings with `text-sm`/`text-base` for density consistency

## [1.5.3] - 2026-02-26

### Changed
- stats.njk, guestbook.njk, newsletter.njk: Replaced heavy glassmorphism `cardShell` (shadow-lg + bg-gray-100/80) with clean flat `border` cards - consistent with new dense editorial design language.
- post.njk: Sidebar author/TOC cards replaced `card-elevated` with flat border. Upvote/reaction active states now use `var(--accent-color)` via inline style instead of hardcoded amber classes.
- comment-pointer.njk: Replaced `card-elevated` with flat border card.
- snippet-tags.njk: Full rewrite - flat `divide-y` row list matching snippets.njk list view. Added breadcrumbs.
- newsletter.njk: Input focus rings use `accent-field` class. Icon circles simplified (no amber background). Removed `hover:shadow-lg`.
- guestbook.njk: Form inputs use `accent-field`. Header aligned with other pages.
- stats.njk: postsThisMonth counter uses `var(--accent-color)`. Tag icon no longer hardcoded amber.
- page width: Stepped down one Tailwind size at each breakpoint (md:2xl, lg:3xl, xl:4xl).


### Fixed
- index.njk: Featured section `★ Featured` label and `Read →` link now use `var(--accent-color)` instead of hardcoded amber, respecting the accent theme switcher.
- now.njk: Removed `cardShell` variable, tightened layout, date in `meta-text` style. `not-prose` wrapper around snippets avoids prose override.
- workouts-snippet.njk, games-snippet.njk: Replaced `cardShell`+shadow cards with `feed-card-full` style. Hover colors use `var(--accent-color)`. Reduced padding.
- tags-list.njk: Tag links now use `accent-link` class (respects theme switcher) instead of hardcoded `text-amber-600`.
- search.njk: Result title hover and loading spinner use `var(--accent-color)` instead of hardcoded amber.
- snippets.njk: Arrow link on list-view items uses `var(--accent-color)` on hover.
- base.njk: Restored `prose-lg` for comfortable reading line height.


### Changed
- UI: Second-pass redesign - coherent design language built from the ground up.
- feed-card.njk: New `list` variant for homepage (single-row grid layout: date · dot · type · title). `full` variant now uses `feed-card-full` (flat border card, no shadow) for the /feed page grid.
- index.njk: Full homepage rewrite. Clean hero (avatar + name + bio + quick links inline). Featured post as minimal text block. QOTD as bare blockquote. Feed section replaced masonry grid with a scannable `feed-list` single-column chronological activity log.
- archive.njk (blog): Full rewrite. Default list view (matches postslist.njk style: date left col, title+desc right). Grid view uses `feed-card-full` cards consistent with /feed. Search bar compact and inline with view toggle.
- feed.njk: Cleaned up, removed duplicate inline JS (handled by masonry-script include).
- postslist.njk: Refined layout - `md:w-36` fixed date column, tags below date on desktop, description `text-sm`, consistent with blog page.
- tailwind.css: Added `.feed-list`, `.feed-list-row`, `.feed-list-dot`, `.feed-list-date`, `.feed-list-type`, `.feed-list-title` for homepage activity list. Added `.feed-card-full` for grid cards. Removed heavy `.card-hover` box-shadow - now border-color transition only.



### Changed
- UI: Full "Dense Editorial" redesign - higher text density, flat list rows, less visual noise.
- base.njk: Reduced nav padding (`py-8` → `py-3`), smaller site title, border-bottom separator on nav.
- base.njk: Switched `prose-lg` → `prose-base` for tighter body typography.
- base.njk: Spotify now-playing rendered as compact inline text row instead of glassmorphism card.
- base.njk: Footer nav stripped of Feather icons for cleaner density; compressed spacing.
- base.njk: Footer bottom bar collapsed into single row (tagline + theme picker + copyright).
- index.njk: Avatar shrunk (`w-32 h-32` → `w-16 h-16`), removed glowing border animation.
- index.njk: Intro block condensed to two tight lines.
- index.njk: QOTD rendered as left-border blockquote, no card shell.
- index.njk: Featured post uses flat bordered box instead of glassmorphism card.
- index.njk: Feed section header and grid tightened.
- postslist.njk: Switched from `card-elevated` cards to flat `divide-y` list rows.
- postslist.njk: Monospace date in left column, smaller title/description text, compact tags.
- feed-card.njk: Removed card shell; now uses bottom-border flat row style.
- feed-card.njk: Badge shrunk to small label (no pill), date inline monospace.
- feed-card.njk: Padding reduced from `1.25rem` to `0.75rem 0`.
- tailwind.css: Added `.meta-text` utility (monospace, small, tracked).
- tailwind.css: Added `.row-item` utility for flat border-b list rows.
- tailwind.css: Reduced `card-elevated` shadow depth significantly.
- tailwind.css: Reduced `card-glass` blur/shadow intensity.

## [1.4.7] - 2026-02-18

### Fixed
- post(2026-02-18-optimizing-qwen3-coder-next-local-inference): Remove `{#...}` Pandoc anchor from heading that was being parsed as an unclosed Nunjucks comment, causing a fatal build error.

### Added
- post(2026-02-18-optimizing-qwen3-coder-next-local-inference): HTML comment stub for a future GPT-OSS-120B vs Qwen3-Coder-Next head-to-head comparison post.
- post(2026-02-18-optimizing-qwen3-coder-next-local-inference): Added `-ctk q8_0` and `-ctv q8_0` parameters to llama-server configuration for KV cache and token vector quantization.

## [1.4.6] - 2026-02-09

### Added
- Guestbook: New sticky-notes design with pastel colors, random rotations, CSS tape decorations, and Caveat handwriting font.
- Guestbook: Data-driven entries from `guestbook.yaml` with Netlify Forms submission and manual curation note.
- Uses page: Neofetch-style ASCII art hardware info block with monospace specs display.
- Uses page: "Retired" section with strikethrough styling and retirement dates for old tools.
- Uses page: "Changelog" section with timestamped tool change history.
- Skills page: New `/skills` page added to footer navigation.

### Changed
- Footer: Reorganized into 4-column categorized grid (Read, Explore, About Me, Meta) with Feather icons on every link.
- Footer: Theme picker moved below navigation, made compact alongside copyright line.
- Projects page: Redesigned cards - switched to `card card-hover` with fixed `h-40` image height, left-aligned text, GitHub icon next to title, `text-sm` descriptions, all tags shown, and image zoom on hover.
- Uses page: Complete overhaul from grid cards to text-based multi-column layout with emoji icons per item.
- More page: Fixed width shrinkage by switching from `layouts/base.njk` to `layouts/home.njk`.
- More page: Removed manual breadcrumbs include (handled by `home.njk` layout).
- Navigation: Replaced `more-horizontal` (•••) icon with `compass` for the More page link.

### Fixed
- More page: Content no longer narrower than other pages due to incorrect layout template.


## [1.4.5] - 2026-02-09

### Added
- Blog page: Search filter (like snippets) with live filtering by title, tags, and description.
- Footer: Social media icon links (LinkedIn, GitHub, Search, RSS, Newsletter) in centered row.

### Changed
- Card component: Updated background to white (`#fff`) in light mode and solid dark gray in dark mode for consistency with feed masonry cards.
- Blog cards: Added data attributes for filtering (`data-title`, `data-tags`, `data-body`).
- Footer navigation: Enhanced with all site links, separators, and "Made with ❤️" section.
- UPDATED labels: Standardized to uppercase format (`text-xs uppercase tracking-wide`) across `/now`, `/bookmarks`, `/feed`, and blog posts.
- Post tags: Now display in uppercase with improved tracking for consistency.
- More page: Updated to 2x2 grid layout with increased spacing.
- npm packages: Updated all dependencies (added 66, removed 73, changed 185 packages).

### Fixed
- Template error: Removed orphaned `{% endif %}` tag in base.njk footer.
- Duplicate footer navigation: Removed duplicate nav section from extended footer, keeping only accent theme slider.

## [1.4.4] - 2026-01-04

### Added
- Post layout: Author profile card in the left sidebar (XL screens) with photo, name, tagline, and social links.
- Swirly arrow annotation CSS component (`.annotate`) for adding handwritten-style margin notes to text.
- Annotation variants: `.annotate-left`, `.annotate-right`, `.annotate-up` for different arrow directions.
- Handwritten note utilities: `.handnote` for inline styled text, `.margin-note` for sidebar notes.

### Fixed
- Navbar: vertical alignment of nav links, "more" dots icon, and dark mode toggle button now properly centered.
- Navbar: replaced `<span>` elements with semantic `<li>` elements for better accessibility.

### Changed
- Comment pointer component: now uses `.card-elevated` styling with accent-colored CTA button.
- Comment pointer component: updated icon from "message-circle" to "arrow-down" for better clarity.

## [1.4.3] - 2026-01-03

### Added
- Visual polish: new `.card-elevated` component with layered shadows and smooth hover lift effect.
- Visual polish: `.card-glass` glassmorphism variant with backdrop blur.
- Visual polish: `.link-glow` animated underline effect for links.
- Visual polish: `.gradient-border` animated gradient border on hover.
- Visual polish: `.text-gradient` utility for accent-colored gradient text.
- Visual polish: `.divider-gradient` refined horizontal rule with gradient fade.
- Visual polish: staggered entrance animations (`.animate-enter`, `.stagger-1` through `.stagger-5`).
- Visual polish: `.btn-shine` shimmer effect for buttons.
- Visual polish: `.focus-ring` refined focus states with accent glow.
- Visual polish: `.accent-glow` and `.accent-glow-hover` shadow effects.
- Visual polish: custom scrollbar styling (light/dark mode aware).
- Visual polish: `.animate-float` floating animation for decorative elements.
- Visual polish: improved `::selection` highlighting using accent color.

### Changed
- Homepage intro: profile photo now has gradient glow halo on hover.
- Homepage intro: name styled with gradient text effect.
- Homepage: Quote of the Day uses glassmorphism card with left border accent.
- Homepage: Feed section header uses gradient text.
- Feed cards: upgraded to `.card-elevated` with refined shadows and hover states.
- Navigation: site title has gradient text effect on hover.
- Navigation: nav links use animated underline (`.link-glow`).
- Navigation: dark mode toggle and "more" button have rounded hover backgrounds.
- Footer: social icons have rounded hover backgrounds with scale effect.
- Footer: Spotify widget uses glassmorphism card style.
- Post layout: title uses gradient text effect.
- Post layout: TOC sidebar uses `.card-elevated` styling.
- Post layout: tags have hover scale animation.
- Post layout: divider uses gradient fade.

## [1.4.2] - 2026-01-03

### Added
- Netlify CMS: "Hidden (Draft)" toggle field for publishing/unpublishing blog posts.

## [1.4.1] - 2026-01-03

### Fixed
- Dark mode toggle now works correctly (fixed syntax error in Prism theme switching).
- Blog page tag filtering uses proper array-based includes check for reliable post visibility.
- Dark mode background color changed from bluish (#0c0c0e) to warm charcoal (#111110) with no blue tint.

## [1.4.0] - 2026-01-03

### Added
- Skip-to-content accessibility link for keyboard and screen reader navigation.
- Service worker for offline reading with cache-first strategy for static assets.
- `/uses` page listing hardware, software, and tools used for development.
- Privacy-friendly view count tracking via Upstash Redis, displayed on blog posts.
- Interactive tag filtering on `/blog/` page using Alpine.js (no page reload).
- Search URL state persistence (`?q=`) with keyboard navigation (arrow keys + Enter).
- Self-hosted Alpine.js, TypeIt, and Prism CSS themes (removed CDN dependencies).

### Changed
- Site background redesigned with softer slate/marble-white gradient and subtle paper grain texture.
- Dark mode background updated to match the cleaner aesthetic.
- RSS feed now includes all posts (removed 10-post limit).
- All email references updated to carteakey.dev@gmail.com.

### Fixed
- Heading hierarchy issues in CV, Newsletter, and Post templates (h1→h3 skips).
- Duplicate filter definitions removed from eleventy.config.mjs (head, uniq).
- Prism theme switching now uses element ID selector for reliability.

## [1.3.20] - 2025-10-12

### Added
- Netlify `_redirects` now covers every legacy `/post-slug` path, bouncing visitors to the new `/blog/` URLs without 404s.

### Changed
- `workouts-snippet.njk` surfaces the three latest Strava activities in responsive cards so desktop layouts form a single row.
- `/now/` adopts the shared card shell, compresses the hero photo, and aligns workouts/games into three-column grids like their dedicated pages.
- `/quotes/` reuses the masonry grid script from the feed/gallery so saved quotes auto-span by height.

### Fixed
- The hero photo on `/now/` now uses the same constrained styling as blog imagery, avoiding the oversized frame on large displays.

## [1.3.19] - 2025-10-11

### Added
- Dedicated `/guestbook` page, each using the shared card shell and navigation breadcrumbs.
- Netlify-backed guestbook form with email and GitHub issue fallbacks for alternative submissions.

### Changed
- Stats intro now owns a self-deprecating data joke, the quotes page moved to the unified card layout, and the blog archive lists every post inside matching cards.
- Bookmarks, blogroll, snippets, and feed cards all reuse the single card shell so surface treatments stay consistent site-wide.

### Fixed
- Steam playtime conversion now emits decimal hours, ensuring recent games display accurate hour counts instead of rounding to zero.

## [1.3.18] - 2025-10-11

### Changed
- Global grain overlay now leans on a gentler turbulence blend with lower opacity so the paper backdrop reads as texture rather than static.
- Homepage feed CTA inherits the active accent palette, and the stats technical details compress into accent-lined columns for quicker scanning.
- Newsletter feature cards adopt badge-style icon caps so headings and glyphs stay aligned.

### Fixed
- Workout widgets on `/now` and `/workouts` now use the shared card shell while respecting Strava map aspect ratios.
- Project gallery and newsletter inputs drop harsh white panels in favour of the gray card tokens, and sitewide `bg-white` utilities were swapped for softer grays.
- Search field border and help links now follow the accent theme, keeping the interface consistent after the amber palette removal.

## [1.3.17] - 2025-10-11

### Changed
- Projects, games, stats, newsletter, and workouts now share the same card treatment as the blogroll/bookmarks layouts for a cohesive surface.
- Newsletter subscribe CTA picks up the active accent palette, and supporting cards reuse the new shell styling.
- Vibes board sizing rules tighten to pack images closer together for a denser collage.

### Fixed
- Featured post selection now honours optional weights and falls back to the most recent flagged entry so the homepage pin reliably appears.

## [1.3.15] - 2025-10-11

### Changed
- Grain overlay now uses a softer fractal noise texture with gentle blending in light and dark themes.
- Post imagery gains tighter max-widths, rounded framing, and tuned shadows for better long-form readability.
- Mobile navigation swaps the lone home icon for a `carteakey.dev` wordmark and centers the hero portrait on small screens.

### Fixed
- Featured posts flagged with `featured: true` finally surface in the homepage callout again.

## [1.3.14] - 2025-10-11

### Added
- Feed page gains a load-more control that reveals timeline items in batches while keeping the masonry layout tidy.

### Changed
- Global backdrop now layers a subtle grain overlay over the existing gradients for a paper-like finish.
- Tailwind theme exposes every bundled font family and drops unused variants so utilities like `font-urbanist` or `font-geist` just work.
- Homepage feed heading includes a direct link to `/feed/` with an arrow affordance for quick access.

### Fixed
- Featured post callout now reliably surfaces the first post marked with `featured: true`.

## [1.3.13] - 2025-10-05

### Added
- About page now surfaces a random fact sourced from a maintainable data list.
- Homepage introduces a featured post card driven by a `featured` front matter flag.
- Feed links now appear in `/more/` via an inline icon and the footer utility row.

### Changed
- Global font sizing scales down to roughly 90% to match the preferred zoom level.

### Fixed
- Quotes and blogroll pages render breadcrumbs again for consistent navigation.

## [1.3.12] - 2025-10-05

### Added
- New meta post “How I Let AI Run Wild on My Blog (with Copilot & Codex)” outlining the current prompt and instructions workflow.

### Changed
- Homepage feed now reuses the masonry grid script from `/feed/` so cards auto-span to their content height.
- Primary navigation drops the dropdown menu in favour of a three-dot icon link that jumps straight to `/more/`.
- Breadcrumbs stay hidden on small screens to free up vertical space while remaining available on desktop.

### Fixed
- GitHub contributions widget ships with a local fallback dataset so the heatmap renders even when the API cannot be reached.

## [1.3.11] - 2025-10-05

### Changed
- Desktop reading frame padding tightened while keeping the notebook frame centered.

### Fixed
- Full-width pages now stretch the main content edge-to-edge while navigation and footer stay centered using the new wrapper utility.

## [1.3.10] - 2025-10-05

### Changed
- Notebook reading frame now uses a translucent panel with squared edges and a softer drop shadow to keep the focus on the page.
- Base layout picks up extra top and bottom padding so the notebook frame sits comfortably within the desktop backdrop.

### Fixed
- Guarded the post layout TOC helper so Eleventy no longer crashes when a post provides no headings.

## [1.3.9] - 2025-10-05

### Added
- Inline critical CSS block in the base layout to style the shell before the main bundle loads.

### Changed
- Global background now uses a subtle gradient treatment tailored for light and dark modes.
- Footer social and utility icons stay on a single line on compact screens while keeping the grouped layout on desktop.
- Bookmarks entries adopt the shared card styling used by blogroll and projects for consistent presentation.
- The feed timeline now uses a masonry grid with ResizeObserver-driven spanning to match the gallery flow.

### Fixed
- Feed cards no longer leave gaps after font or media loads thanks to the new span recalculation script.

## [1.3.8] - 2025-10-04

### Added
- Conversation pointer component that links to `#post-comments`, usable inline or in the sidebar.
- Feed page masonry script to auto-resize cards so the timeline flows like the gallery grid.

### Changed
- Notebook frame widened with square corners, deeper padding, and a gray gradient doodle backdrop.
- Long-form prose now uses the `et-book` family with a slightly wider measure for calmer reading.
- TOC and sidebar callouts share the primary background, pick up extra padding, and adopt the accent-aware controls.

### Fixed
- Feed cards now recalc their spans after fonts and images load, preventing gaps and overlaps in the new layout.

## [1.3.7] - 2025-10-04

### Added
- Post sidebar now has a dedicated "Conversation space" card ready for future inline comments alongside the outline.
- Accent-aware utility classes (`accent-link`, `accent-button`, `accent-button-outline`, `accent-focus`) driven by CSS variables for reusable theming.

### Changed
- Post layout adopts a notebook-style frame on desktop with an off-white surround that stays hidden on mobile and `fullWidth` pages.
- Outline and sidebar styling reuse the accent palette and off-white backdrop to match the refreshed reading frame.

### Fixed
- Bookmarks "Open an issue" CTA and 404 hero buttons now inherit the active accent theme instead of being locked to amber.

## [1.3.6] - 2025-10-04

### Added
- Ambient off-white doodle backdrop using `src/static/img/patterns/hobbies-doodle.svg` and a softened site frame around the reading column.

### Changed
- Feed grids now align cards to their natural height so content length dictates the card size on /feed and the homepage.
- Bookmarks layout refresh adds favicon badges, domain metadata, and breathing room for descriptions.

### Fixed
- "Back to Top" button now honors the active accent theme across light and dark modes.
- Bookmark timestamps reuse the `readableDate` filter for parity with posts and snippets.

## [1.3.5] - 2025-10-04

### Added
- Stats page now reads Lighthouse scores from `_data/lighthouse.json`, exposing the run metadata alongside the four category scores.

### Changed
- Feed page and homepage now share a reusable card component with styling that matches other site cards and uses denser typography.
- Snippets index adopts the site card grid, refreshed search UI, and inline metadata chips for languages and tags.
- Base layout typography tightened across the site to increase information density without sacrificing readability.

### Fixed
- Footer icon set now stays on a single row on mobile viewports.

## [1.3.4] - 2025-10-04

### Added
- Projects page now renders a cached GitHub contributions heatmap backed by the new `githubContributions` data source.
- Floating "Back to Top" control appears on scroll with reduced-motion friendly smooth scrolling.

### Changed
- 404 page adopts the main layout with curated fallback links and contact prompts.
- Bookmarks view uses the same card grid styling as Blogroll/Projects, with per-category counts and anchors.

### Fixed
- Feed, homepage, and GPT-OSS benchmark comparison images now go through the Eleventy image pipeline for responsive, optimised output.

## [1.3.3] - 2025-10-04

### Added
- Post reactions: emoji-based feedback bar backed by a new Netlify function (`reactions.js`) and Upstash hashes, including localStorage safeguards.
- Documentation refresh: `docs/instructions.md` now captures the full Copilot/Codex playbook alongside the active `docs/prompt.md` brief.
- Meta: "Working with Copilot & Codex on carteakey.dev" post covering the agent workflow and release loop.

### Changed
- Bookmarks page now surfaces totals, per-category anchors, sorted entries, and three new resources across architecture, career, and systems operations.
- Eleventy build adds an output transform that normalises relative asset links inside posts and rewrites legacy `/posts/` URLs to `/blog/`.
- TODO tracking reorganised with an auto-archived "Completed TODOs" section to keep the active list focused.

### Fixed
- Relative links to assets stored beside posts now resolve correctly in the generated site while maintaining the same repo-friendly paths.

## [1.3.2] - 2025-10-01

### Added
- Feed: extended unified timeline to include photos, vibe board entries, microposts, snippets, blog posts, and /now archive updates with per-type metadata.
- Blog folders: automatic `/blog/{folder}/` listing pages generated from the posts directory structure, with breadcrumb-aware pagination.
- Post asset pipeline: copies allowed files stored alongside posts into the matching `/blog/` output path so relative links (e.g., `./diagram.png`) work out of the box.
- Documentation: EthicalAds setup guide at `docs/ETHICAL_ADS_SETUP.md` detailing configuration steps.

### Changed
- Homepage and `/feed/` cards restyled to match site card design and retitled from "Recent Activity" to "Feed" everywhere.
- Primary blog index now lives at `/blog/` (with legacy `/posts/` redirect) and sample posts moved under `/blog/tech/` and `/blog/personal/` to demonstrate folder routing.
- Posts referencing the GPT OSS benchmarks bundle now use relative asset links (`../gpt-oss-benchmarks/...`) to align with the new asset pipeline.

## [1.3.1] - 2025-10-01

### Added
- Micropost collection with inline-only entries feeding the unified activity stream.
- EthicalAds placement for posts and snippets, backed by a reusable sidebar component and global script loader.
- Gradient KC logo (`src/static/img/logo.svg`) now displayed in the site navigation.

### Changed
- Restyled the feed page and homepage activity cards for type-aware badges, improved spacing, and better responsiveness.
- Homepage "Recent Activity" now lives beneath the Quote of the Day and surfaces six latest items across all content types.
- Documentation housekeeping: developer guides (e.g., Copilot instructions) now live under `docs/` for a single source of truth.

## [1.3.0] - 2025-09-30

### Added
- **Stats Page**: Dedicated Lighthouse Performance section with all 4 categories (Performance: 94, Accessibility: 95, Best Practices: 100, SEO: 91)
  - Visual progress bars for each metric
  - Color-coded cards with gradient backgrounds
  - Individual icons for each category (zap, users, shield, search)
- **Stats Page**: Total words written metric (estimated ~800 words per post)
  - Shows total words in thousands (k) format
  - Displays average words per post
- **Stats Page**: Total visitors count tracked via Redis
  - Real-time visitor tracking from Upstash Redis
  - Integrated with existing analytics infrastructure
- **Stats Page**: Denser, more informative meta information section
  - Now displays 12 technical details in compact grid layout
  - Added: CSS Framework (Tailwind CSS v4), JS Framework (Alpine.js), Hosting (Netlify)
  - Added: Template Engine (Nunjucks), Syntax Highlighting (PrismJS), Comments (Giscus)
  - Added: Analytics (Upstash Redis), Build Time
  - Improved visual hierarchy with uppercase labels and better spacing
- **Feed Page**: New unified activity feed at `/feed/`
  - Combines posts and snippets in reverse chronological order
  - Visual indicators for content type (Post vs Snippet)
  - Color-coded borders (blue for posts, purple for snippets)
  - Displays tags, dates, and descriptions for each item
  - Added to navigation menu (order: 10)
- **Homepage**: Replaced "Recent Posts" section with "Recent Activity" feed
  - Shows latest 5 items from unified feed
  - Includes both posts and code snippets
  - Better visual design with type badges and borders
  - Links to full activity feed, posts, and snippets pages

### Changed
- **Data Layer**: Created `visitors.js` data file for Redis-based visitor tracking
- **Collections**: Added new "feed" collection that merges posts and snippets
  - Each item tagged with `feedType` property for easy filtering
  - Maintains proper date sorting across content types
- **Footer Navigation**: Simplified layout with visual separators instead of categories
  - Removed category headings (Main, Work, Content, etc.)
  - Added bullet point separators (•) between logical groups
  - More compact, less whitespace
  - All links in single flowing row with wrapping
- **More Page**: Changed to alphabetically sorted list
  - Removed category sections
  - Single "All Pages" section with A-Z sorting

## [1.2.0] - 2025-09-30

### Added
- Bookmarks page: New curated reading list of recommended articles and resources
  - Organized by categories (Development, Career, Learning, Communication, etc.)
  - 10+ carefully selected links with descriptions and tags
  - External link indicators for better UX
- Stats page: Total upvotes metric showing aggregate engagement across all posts
- Projects page: GitHub contributions graph visualization
  - Shows yearly contribution activity
  - Integrated using ghchart.rshah.org service
- Footer: Better alt text for Spotify album artwork (accessibility improvement)
- Footer navigation: Categorized site navigation into logical groups
  - Main (About, Now, Blog, CV)
  - Work (Projects, Snippets)
  - Content (Gallery, Vibes, Quotes)
  - Lifestyle (Games, Workouts)
  - Resources (Search, Stats, Blogroll, Bookmarks, Newsletter, More)

### Changed
- Footer: Reorganized icon links into visual groups with separators (no labels)
  - Social icons (LinkedIn, GitHub)
  - Discovery icons (Search, Blogroll)
  - Subscribe icons (RSS, Newsletter)
  - Better mobile responsiveness with flex layout
- More page: Updated to reflect new categorized structure matching footer navigation

### Fixed
- Stats page: Fixed "Days Since Last Post" calculation bug
  - Now correctly uses the latest post date instead of build date
  - Accurate day count display

## [1.1.1] - 2025-01-14

### Changed
- Blogroll: Increased information density with 2-column grid layout and compact cards
- Navigation: Removed Search, Blogroll, and Newsletter from main nav dropdown (now only in footer)
- Stats page: Added Lighthouse performance score card with A11y and SEO metrics

### Fixed
- Stats page: Fixed "Days Since Last Post" bug - now correctly shows days since most recent post instead of first post

### Added
- Footer: Added Newsletter (mail icon) and Blogroll (bookmark icon) to footer icons for quick access

## [1.1.0] - 2025-01-14

### Added
- Search functionality across posts and snippets
  - Full-text search with live filtering
  - Search by title, description, content, or tags
  - Results sorted by relevance
  - Clean UI with result count display
  - Search icon in footer for easy access
- Related posts feature
  - Automatically shows up to 3 related posts based on shared tags
  - Compact design with border accent
  - Displays at the bottom of each blog post
- Loading states for dynamic content
  - Added loading spinner for upvote count fetching
  - Smooth opacity transition during loading
  - Newsletter form submission loading state
- Blogroll page
  - Expanded to 30+ recommended blogs and websites
  - Includes web dev, self-hosting, AI/ML, and data science resources
  - Organized with descriptions and topic tags
  - External link indicators
- Newsletter signup page
  - Email subscription via Netlify Forms
  - Privacy-conscious with consent checkbox
  - Success/error states with clear messaging
  - Honeypot spam protection
  - Links to RSS feed as alternative
  - Focused on AI, data science, and self-hosting topics

### Changed
- Post list layout: date and reading time now stack vertically in left column (desktop)
- Navigation: Added Search, Blogroll, and Newsletter to dropdown menu
- More page: Updated with all new pages including search, blogroll, and newsletter
- Newsletter wording updated to focus on AI, data science, and self-hosting content
- Related posts section made more compact with cleaner design

### Fixed
- Search functionality now properly handles snippets collection
- Search results display correctly with all content types

## [1.0.1] - 2025-01-14

### Fixed
- Easter egg features now working correctly
  - Konami code (↑↑↓↓←→←→BA) key detection fixed with proper case-insensitive comparison
  - Double-click site title detection improved with timestamp-based logic
  - Triple-click footer sparkle mode now properly detects clicks in footer area
  - Shift+click theme slider achievement counter wrapped in DOMContentLoaded
- Reading time layout in post list view
  - Desktop: Date and reading time now displayed in single left column (stacked vertically)
  - Tags moved to separate row below description in left column
  - Mobile: Maintains horizontal inline layout with proper separators

### Added
- Comprehensive testing guide (TESTING_GUIDE.md)
  - Step-by-step instructions for testing all easter eggs
  - Methods to validate JSON-LD structured data
  - Tools and techniques for testing Open Graph and Twitter Card tags
  - Troubleshooting section for common issues
  - Production testing checklist

## [1.0.0] - 2025-01-14

### Added
- Estimated reading time feature for blog posts
  - Added `readingTime` filter calculating based on 200 words per minute
  - Display reading time with clock icon in post layouts
  - Show reading time in post list views (both mobile and desktop)
  - Automatic word count from content with HTML tag stripping
- JSON-LD structured data for enhanced SEO
  - BlogPosting schema for blog posts with headline, description, author, dates, keywords
  - WebSite schema for homepage with SearchAction potential
  - Proper author and publisher information
  - Integration with existing metadata
- SEO meta tags optimization for social media sharing
  - Open Graph meta tags for Facebook and LinkedIn sharing
  - Twitter Card meta tags for enhanced Twitter previews
  - Article-specific Open Graph tags for blog posts (published_time, author, tags)
  - Canonical URLs for SEO
  - Theme color meta tags for mobile browsers
  - Fallback to avatar.png for social media preview images
- Breadcrumb navigation component for better site navigation
  - Added reusable breadcrumbs component (`src/_includes/components/breadcrumbs.njk`)
  - Integrated breadcrumbs into post, snippet, home, and major page layouts
  - Custom `split` filter added to Eleventy config for URL parsing
  - Breadcrumbs show hierarchical navigation with home icon and chevron separators
  - Special handling for known sections (Blog, Now, Snippets, Gallery, etc.)
  - Responsive design with proper dark mode support
- Easter egg features for enhanced user engagement:
  - Konami Code easter egg (↑↑↓↓←→←→BA) triggers floating animated icons and celebratory message
  - Secret message reveal on double-clicking site title/logo
  - Sparkle trail mouse effect activated by triple-clicking footer
  - Secret click counter with achievements (activated by Shift+Click on theme slider)
  - Custom CSS animations for all easter egg effects (float, bounce, sparkle, slideIn/Out)

## [1.8.2] - 2026-02-28

### Added
- `/notes/` list page: all notes sorted by date with inline content + permalink, listed in footer + more page
- Keyboard shortcuts: changed from `g+key` to `Ctrl/Cmd+key` (Mac-aware); visible `? shortcuts` button in footer
- Now archive: shows full entry content inline like changelog (not just link)
- Changelog: extended with git history before first CHANGELOG.md entry, grouped by month, styled as "Commits" with gray dots
- Reading shelf section added to `/now` page (currently-reading books with progress bars)
- Footer Read category: Notes, TIL, Reading links added; Meta category: Changelog, Colophon added
- More page: updated with all new pages (notes, til, reading, changelog, colophon)

### Fixed
- More page: removed duplicate breadcrumbs (home.njk already renders them for non-root pages)
- Stats: posts this year / posts this month counts now correctly use `countInYearMonth` filter (previous `date("Y")`/`date("n")` calls failed silently)
- Stats: Latest post now sorted by date (not pinned order) via `sortByDate` filter; font sized down to `text-xs`
- Stats: Lighthouse section is now 2-column grid on sm+ screens
- `date()` filter: extended to support `"Y"`, `"n"`, `"X"`, `"MMM d"`, `"h:mm a"`, `"YYYY"` format strings
- New filters: `countInYearMonth`, `sortByDate`

## [1.8.3] - 2026-02-26

### Changed
- Keyboard shortcuts: removed all Ctrl/Cmd combos (hijacked browser shortcuts); now bare letter keys (h/b/f/s/n/t/r/d/?/) - no modifier required
- Added `/` shortcut for search navigation

### Fixed
- Changelog: removed 8-entry-per-month cap on git history commits (show all)
- Now archive: images constrained to max-h-48 so they don't dominate the timeline
