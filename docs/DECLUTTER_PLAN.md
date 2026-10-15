# The Declutter Project: Master Architecture & Execution Plan

- **Branch**: `declutter` (branched cleanly from `main` @ `effbfe7`)
- **Goal**: Strip away accumulated platform chrome, duplicate DOM trees, fractured content taxonomies, and slashpage sprawl so `carteakey.dev` reads like an authored notebook and high-density personal workbench.
- **Execution Rule**: Every module below is self-contained. After completing any module (or sub-module checkpoint), run `npm run check` (`check:version`, `check:content`, `check:design`, `verify`) and commit before moving to the next module.

---

## Architecture Transformation Overview

```mermaid
flowchart TD
  subgraph Before["Current State (~60 Templates / 6 Content Engines)"]
    H1["Homepage: 3-Col JS Masonry Wall + TypeIt"]
    P1["Post Layout: 3-Col Cage + 12 Header/Footer Widgets"]
    C1["6 Collections: Posts, Folios, Notes, TIL, Snippets, Quotations"]
    V1["View Toggles: 2-3x Duplicate DOM per Collection"]
    S1["41 Flat Slashpages in /more/"]
  end

  subgraph After["Decluttered State (Authored Workbench)"]
    H2["Homepage: 2-Col Index (Flagship Canon vs. Live Lab Log)"]
    P2["Post Layout: Quiet 2-Col Asymmetric Prose + Margin Rail"]
    C2["2 Primitives: Essays (/blog/) & Unified Log (/notes/)"]
    V2["Single Authored Archetype per Page (Zero View Toggles)"]
    S2["4 Deep Ledger Rooms (/ai, /now, /uses, /about) + Categorized /more/"]
  end

  Before --> After
```

---

## Module 1: Information Architecture & Nesting Under `/ai/`

**Objective**: Group AI sub-pages under `/ai/`, merge duplicate quote collections, retire redundant sitemap pages, and turn `/more/` into a 4-column categorized directory.

### 1.1 Nest `/skills/` and `/prompts/` under `/ai/`
- [ ] **Move Skills to `/ai/skills/`**:
  - [ ] Update permalink in [`src/skill-library.njk`](file:///home/kchauhan/repos/carteakey.dev/src/skill-library.njk) from `/skills/` to `/ai/skills/`.
  - [ ] Update individual skill layout [`src/_includes/layouts/skill.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/skill.njk) breadcrumbs to point to `/ai/` → `/ai/skills/`.
  - [ ] Add sub-navigation ledger rail across `/ai/`, `/ai/skills/`, `/ai/prompts/`, and `/folio/model-tier-list/`.
- [ ] **Move Prompts to `/ai/prompts/`**:
  - [ ] Update permalink in [`src/prompts.njk`](file:///home/kchauhan/repos/carteakey.dev/src/prompts.njk) from `/prompts/` to `/ai/prompts/`.
  - [ ] Update [`src/prompts/prompts.json`](file:///home/kchauhan/repos/carteakey.dev/src/prompts/prompts.json) (or frontmatter permalink pattern) so prompt entries resolve under `/ai/prompts/{{ page.fileSlug }}/` (or keep permalinks with 301s).
- [ ] **Redirects & Checks**:
  - [ ] Add 301 redirects in [`src/_redirects`](file:///home/kchauhan/repos/carteakey.dev/src/_redirects) for `/skills/` → `/ai/skills/` and `/prompts/` → `/ai/prompts/` (plus wildcard `/prompts/:splat` → `/ai/prompts/:splat`).
  - [ ] Update internal links in [`src/ai.njk`](file:///home/kchauhan/repos/carteakey.dev/src/ai.njk), [`src/more.njk`](file:///home/kchauhan/repos/carteakey.dev/src/more.njk), and [`src/_includes/layouts/base.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/base.njk).

### 1.2 Merge `/quotes/` and `/quotations/`
- [ ] **Unify into `/quotes/` ([`src/quotes.njk`](file:///home/kchauhan/repos/carteakey.dev/src/quotes.njk))**:
  - [ ] Keep Quote of the Day at the top of `/quotes/`.
  - [ ] Render the 5 annotated markdown entries from `src/quotations/*.md` (with their commentary and context) alongside the curated quotes from `src/_data/quotes.js` in a single cohesive layout.
  - [ ] Remove [`src/quotations.njk`](file:///home/kchauhan/repos/carteakey.dev/src/quotations.njk) from `eleventyNavigation` and replace it with a 301 redirect `/quotations/` → `/quotes/` in [`src/_redirects`](file:///home/kchauhan/repos/carteakey.dev/src/_redirects).
  - [ ] Remove `"src/quotations.njk": "index"` from `ARCHETYPE_PAGES` in [`utils/check-content.mjs`](file:///home/kchauhan/repos/carteakey.dev/utils/check-content.mjs).

### 1.3 Redesign `/more/` into a 4-Column Categorized Workbench Directory
- [ ] **Replace flat alphabetical `<ul>` in [`src/more.njk`](file:///home/kchauhan/repos/carteakey.dev/src/more.njk)** with a 4-section `.surface` ledger grid:
  - [ ] **Column 1 — Writing & Canon**: `/blog`, `/notes` (The Log), `/folio`, `/reviews`, `/tags`, `/search`
  - [ ] **Column 2 — AI & Homelab**: `/ai`, `/folio/model-tier-list`, `/ai/skills`, `/ai/prompts`, `/status`
  - [ ] **Column 3 — Shelves & Media**: `/now`, `/reading`, `/watching`, `/listening`, `/games`, `/gallery`, `/vibes`, `/quotes`, `/bookmarks`, `/blogroll`
  - [ ] **Column 4 — Person & Meta**: `/about`, `/uses`, `/projects`, `/cv`, `/data`, `/workouts`, `/guestbook`, `/newsletter`, `/colophon`, `/changelog`, `/stats`
- [ ] Remove user-facing links to `/page-list/` and `/more/` self-link from [`src/more.njk`](file:///home/kchauhan/repos/carteakey.dev/src/more.njk).

---

## Module 2: Content Taxonomy Consolidation (`Essays` vs. `The Log`)

**Objective**: Reduce 6 separate writing collections into 2 clear reader mental models: **Essays (`/blog/`)** for long-form writing/series, and **The Log (`/notes/`)** for all short-form observations, TILs, and code snippets.

### 2.1 Build the Unified Log at `/notes/` ([`src/notes.njk`](file:///home/kchauhan/repos/carteakey.dev/src/notes.njk))
- [ ] **Create a `collections.log` collection in [`eleventy.config.mjs`](file:///home/kchauhan/repos/carteakey.dev/eleventy.config.mjs)**:
  - [ ] Merge `notes` (`src/notes/*.md`), `til` (`src/til/*.md`), and `snippets` (`src/snippets/*.md`) into one reverse-chronological stream with normalized `.type` (`note`, `til`, `snippet`).
- [ ] **Add lightweight Alpine filter pills at the top of [`src/notes.njk`](file:///home/kchauhan/repos/carteakey.dev/src/notes.njk)**:
  - [ ] `All` · `Notes` · `Code Snippets` · `TIL` (syncing with URL hash or query param `?type=snippet` so direct links work).
  - [ ] Preserve the tag filter and search input for code snippets when filtering by `Code Snippets`.
- [ ] **Redirect standalone index pages while preserving item permalinks**:
  - [ ] Keep individual item permalinks (`/notes/...`, `/snippets/...`, `/til/...`) intact so no external links or syndication URLs (`tweet_url`) break.
  - [ ] Redirect `/til/` → `/notes/?type=til` and `/snippets/` → `/notes/?type=snippet` in [`src/_redirects`](file:///home/kchauhan/repos/carteakey.dev/src/_redirects) (or keep lightweight pre-filtered views and remove them from top-level navigation).
  - [ ] Retire the redundant HTML `/feed/` page (redirect `/feed/` → `/notes/`), while keeping `/feed/feed.xml` and `/feed/feed.json` untouched.

---

## Module 3: Retire View Toggles & Duplicate DOM Trees

**Objective**: Commit to a single authored layout per page archetype, stop rendering 2–3x duplicate DOM trees per collection, and move the AI Authorship filter out of the global navbar into the collection toolbar.

### 3.1 Commit Each Collection to One Archetype
- [ ] **`/blog/` ([`src/archive.njk`](file:///home/kchauhan/repos/carteakey.dev/src/archive.njk)) → Index Archetype**:
  - [ ] Keep the dense chronological list view (with `Pinned` section, year jump bar, and sketch stamp thumbnails).
  - [ ] Delete the hidden `x-show="view === 'grid'"` masonry duplicate DOM and view-toggle toolbar.
- [ ] **`/notes/` ([`src/notes.njk`](file:///home/kchauhan/repos/carteakey.dev/src/notes.njk)) → Stream Archetype**:
  - [ ] Keep the readable chronological stream view (with inline note prose, media, and code).
  - [ ] Delete the hidden `list` and `grid` duplicate DOM trees and `feed-masonry-script.njk` include.
- [ ] **`/projects/` ([`src/projects.njk`](file:///home/kchauhan/repos/carteakey.dev/src/projects.njk)) → Wall Archetype**:
  - [ ] Keep the project wall grid.
  - [ ] Delete the hidden `list` duplicate DOM tree and view-toggle toolbar.
- [ ] **Clean up unused view-toggle plumbing**:
  - [ ] Remove [`src/_includes/components/view-toggle.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/components/view-toggle.njk) and `src/static/js/collection-views.js` once no template imports them.
  - [ ] Update [`utils/verify-ui.mjs`](file:///home/kchauhan/repos/carteakey.dev/utils/verify-ui.mjs#L248-L263) assertions to verify the single canonical layout on `/blog/`, `/notes/`, and `/projects/`.

### 3.2 Relocate the AI Authorship Filter
- [ ] **Remove the global `filter` icon dropdown from [`src/_includes/layouts/base.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/base.njk#L203-L221)**:
  - [ ] Leaves the top header clean with only `About`, `Writing`, `Now`, `AI`, Search, `/more/` Compass, and Dark Mode.
- [ ] **Add a compact inline Authorship Filter pill in `/blog/` and `/notes/` toolbars**:
  - [ ] `All · Human + Assisted · Human Only` right next to the search/filter bar where `data-authored-by` items actually live.

---

## Module 4: Homepage Redesign — Architectural Index vs. Live Log

**Objective**: Replace the 3-column JS masonry wall and TypeIt animation on [`src/index.njk`](file:///home/kchauhan/repos/carteakey.dev/src/index.njk) with a deliberate 2-column workbench layout that separates Flagship Writing from the Daily Lab Log.

### 4.1 Clean Up the Homepage Intro ([`src/index.njk`](file:///home/kchauhan/repos/carteakey.dev/src/index.njk#L12-L43))
- [ ] Remove `<script src="/static/js/typeit.min.js">` and the `<p class="home-typing-line">` element (which duplicates the static dek immediately below it).
- [ ] Update `.home-link-row` to highlight the core workbench rooms: `About` · `Now` · `AI` · `Projects` · `Writing` · `Log` · `GitHub ↗`.

### 4.2 Replace the 3-Column Masonry Grid with a 2-Column Workbench Split
- [ ] **Left Column (`lg:col-span-7`) — Flagship Essays, Series & Folios**:
  - [ ] **Pinned / Featured Essays**: Top 4–5 flagship posts with monochrome sketch stamps, date, reading time, and subtitle dek.
  - [ ] **Research Series & Folios Shelf**: Compact 2x2 ledger cards for **Local Inference** (`/blog/local-inference/`), **Coding Agents** (`/blog/agents/`), **Sortling** (`/blog/sortling/`), and **The AI Model Tier List** (`/folio/model-tier-list/`).
  - [ ] **Recent Essays**: Clean chronological index rows of the latest 5 posts (`All writing →`).
- [ ] **Right Column (`lg:col-span-5`) — The Live Lab Log**:
  - [ ] Compact `.surface` chronological ticker of the latest 10 short-form entries from `collections.log` (Notes, TILs, Snippets).
  - [ ] Each row shows `[TYPE]` mono badge, date, title (or compact 2-line note preview), and `tweet_url` indicator if syndicated (`Full log →`).
- [ ] Remove `{% include "components/feed-masonry-script.njk" %}` from [`src/index.njk`](file:///home/kchauhan/repos/carteakey.dev/src/index.njk).

---

## Module 5: Post Reading Experience Declutter ([`post.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk))

**Objective**: Strip away the 3-column cage and 12 header/footer widgets so long-form technical posts read like a calm, authoritative notebook page.

### 5.1 Shift from 3-Column Cage to 2-Column Asymmetric Layout
- [ ] **Remove the Left Sidebar Author Bio Card ([`post.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk#L59-L94))**:
  - [ ] Delete the redundant headshot/bio box on posts (keep `editorial-sidebar.njk` only if a post explicitly declares `theme: editorial` and `sidebar`).
  - [ ] Update `.post-wrap` in [`src/static/css/tailwind.css`](file:///home/kchauhan/repos/carteakey.dev/src/static/css/tailwind.css) to a clean 2-column grid (`minmax(0, 44rem) 16rem` at `xl+`): prose on the left, sticky Outline + `{% sidenote %}` margin notes on the right.
  - [ ] Simplify the `--wide-bleed` resize script since wide tables only need to respect the right rail.

### 5.2 Compress Pre-Post Chrome into a Single Monospace Ledger Rail
- [ ] **Replace the 3 separate header blocks** (colored AI disclaimer box, 4-chip meta row with live view count, and standalone Copy Markdown row) with **one compact mono ledger bar** below `.post-dek`:
  - [ ] `2026-10-03 · 12 min read · #AI #Self-Host · [AI-Assisted] · [Copy .md]`
  - [ ] Clicking `[AI-Assisted]` or hovering shows the authorship note in a clean tooltip/disclosure instead of a permanent 3-line blue/purple alert banner above every post.
  - [ ] Remove `#viewCount` / `#viewCountNumber` from the header so page load doesn't flash `- views`.

### 5.3 Fix Mobile Outline & Prune Post-Footer Bloat
- [ ] **Move Mobile Table of Contents to the Top**:
  - [ ] Move the `xl:hidden` Outline from line 814 (below Giscus comments!) to a collapsible `<details class="surface surface-compact xl:hidden my-4">` immediately before `.post-body`.
- [ ] **Remove Post-Footer Clutter**:
  - [ ] Remove `<section class="learning-post-panel">` ("Reading tracker / Mark as read") and `<script defer src="/static/js/learning-progress.js">` ([`post.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk#L269-L287)).
  - [ ] Remove `#postReactions` (5-emoji bar) and its 120-line client-side fetch script ([`post.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk#L289-L332), [`L464-L585`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk#L464-L585)).
  - [ ] Combine the **Upvote button**, **Updated date**, and **Copy Markdown** into a single clean end-of-article sign-off bar above the Series/Next-Prev links and Giscus comments.

---

## Module 6: Consolidate Slashpages into 4 Cohesive Ledger Rooms

**Objective**: Turn thin standalone slashpages into 4 deep, interconnected Ledger rooms while keeping legacy URLs working via anchors or 301 redirects.

- [ ] **Room 1 — `/ai/` (The AI & Homelab Hub)**:
  - [ ] Connect `/ai/`, `/folio/model-tier-list/`, `/ai/skills/`, and `/ai/prompts/` with a shared top sub-ledger navigation bar.
  - [ ] Fold the standalone `/devices/yeti-cachy/` spec details into `/ai/#homelab` (and `/uses/#hardware`).
- [ ] **Room 2 — `/now/` (The Live Media & Life Ledger)**:
  - [ ] Enhance [`src/now.njk`](file:///home/kchauhan/repos/carteakey.dev/src/now.njk) so the Goodreads (`reading`), Letterboxd (`watching`), Spotify (`listening`), and Steam (`games`) sections read as a unified 2x2 Media Ledger with links to the full shelves.
- [ ] **Room 3 — `/uses/` (The Workbench & Tools Ledger)**:
  - [ ] Merge the 3 items from [`src/tools.njk`](file:///home/kchauhan/repos/carteakey.dev/src/tools.njk) and hardware from [`src/devices.njk`](file:///home/kchauhan/repos/carteakey.dev/src/devices.njk) directly into [`src/uses.njk`](file:///home/kchauhan/repos/carteakey.dev/src/uses.njk).
  - [ ] Redirect `/tools/` → `/uses/#tools` and `/devices/` → `/uses/#hardware` in [`src/_redirects`](file:///home/kchauhan/repos/carteakey.dev/src/_redirects).
- [ ] **Room 4 — `/about/` (Profile, CV & Meta Ledger)**:
  - [ ] Add a top sub-navigation ledger rail linking `/about/` · `/cv/` · `/workouts/` · `/data/` · `/colophon/`.

---

## Module 7: Design Guard Ratchet & Codebase Hygiene

**Objective**: Pay down the biggest pockets of `utils/design-baseline.json` debt (currently 744 violations) and split monolithic config/CSS/JS files into clean modules.

### 7.1 Design Baseline Paydown (`744` → `< 150`)
- [ ] **[`src/_includes/components/feed-card.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/components/feed-card.njk) (36 violations → 0)**:
  - [ ] Replace 19 `inline-style` attributes and 9 `off-palette-colour` classes with semantic `.feed-card-*` classes in `tailwind.css`.
- [ ] **[`src/_includes/layouts/base.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/base.njk) (47 violations → 0)**:
  - [ ] Replace all `style="color: var(--accent-color)"` with `.text-accent` and `style="display: none;"` with `x-cloak`.
- [ ] **[`src/_includes/layouts/post.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/post.njk), [`note.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/note.njk), [`skill.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/skill.njk), [`til.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/til.njk) (34 violations → 0)**:
  - [ ] Clean up remaining utility text stacks, pill radii, and off-palette badges during the Module 5 post layout refactor.
- [ ] **[`src/folio/index.njk`](file:///home/kchauhan/repos/carteakey.dev/src/folio/index.njk) & [`src/changelog.njk`](file:///home/kchauhan/repos/carteakey.dev/src/changelog.njk) (42 violations → 0)**:
  - [ ] Replace off-palette badge colors with `.badge` and `.surface` tokens.
- [ ] Run `node utils/check-design.mjs --update-baseline` after each file to ratchet the baseline down permanently.

### 7.2 JS, CSS & Eleventy Config Modularization
- [ ] **Extract 20 Inline `<script>` Blocks from [`base.njk`](file:///home/kchauhan/repos/carteakey.dev/src/_includes/layouts/base.njk)**:
  - [ ] Keep only the synchronous `<head>` theme/accent bootstrap inline.
  - [ ] Move keyboard shortcuts, code-copy buttons, image lightbox, and outbound link tracking into `/static/js/workbench.js` (`defer`).
- [ ] **Split [`src/static/css/tailwind.css`](file:///home/kchauhan/repos/carteakey.dev/src/static/css/tailwind.css) (5,239 lines)**:
  - [ ] Break into `src/static/css/partials/{tokens,typography,surfaces,navigation,prose,collections,halftone}.css` imported by `tailwind.css`, pruning dead selectors from retired view toggles and post widgets.
- [ ] **Split [`eleventy.config.mjs`](file:///home/kchauhan/repos/carteakey.dev/eleventy.config.mjs) (2,164 lines)**:
  - [ ] Extract `config/collections.mjs`, `config/filters.mjs`, `config/shortcodes.mjs`, and `config/images.mjs`.

---

## Execution Order & Verification Protocol

| Step | Module | Est. Scope | Verification Gate |
| :--- | :--- | :--- | :--- |
| **Phase 1** | **Module 1**: IA, `/ai/skills` & `/ai/prompts` nesting, `/quotes` merge, `/more` 4-col ledger | 8 files | `npm run check` + visual check `/ai/`, `/more/`, `/quotes/` |
| **Phase 2** | **Module 2 & 3**: Unified Log (`/notes/`), retire View Toggles, relocate AI filter | 10 files | `npm run check` + update `verify-ui.mjs` + visual check `/blog/`, `/notes/`, `/projects/` |
| **Phase 3** | **Module 4**: Homepage 2-Column Index vs. Live Log + drop TypeIt & Masonry | 3 files | `npm run check` + visual check `/` (desktop, dark, mobile) |
| **Phase 4** | **Module 5**: Post Layout Declutter (2-col asymmetric, 1-line meta rail, mobile TOC, prune widgets) | 3 files | `npm run check` + visual check long-form post |
| **Phase 5** | **Module 6**: Slashpage Ledger Rooms (`/uses` + `/tools` + `/devices`, `/now` media spread, `/about` rail) | 6 files | `npm run check` + redirect verification |
| **Phase 6** | **Module 7**: Design Baseline Paydown + `base.njk` script extraction + CSS/Config split | 12 files | `node utils/check-design.mjs --update-baseline` + `npm run check` |
