# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.0] - 2026-02-28

### Added
- `/colophon` page: stack, design philosophy, AI-assisted dev disclosure, source link; linked from footer
- `/now/archive/` redesigned: timeline with vertical line + accent dots replacing flat link list
- Now page: "Past updates →" link next to /now description
- `/til/` collection: Today I Learned entries with layout, list page, search, feed integration (yellow dot)
- `/reading/` shelf page: Currently Reading (with CSS progress bars), Read (star ratings), Want to Read
- `/changelog/` page: visual timeline parsed from CHANGELOG.md — version badges, Added/Changed/Fixed/Removed sections color-coded
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
- Navbar: About/Blog/Now text links hidden on mobile (sm: breakpoint) — compass + slider + dark mode remain; no more squished nav
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
- base.njk: Accent slider moved from extended footer (required scrolling ~1300 lines into page) into the nav bar, between the compass icon and dark mode toggle — now always visible on every page
- base.njk: Slider redesigned as a compact inline gradient bar (w-20/w-28) with a white hairline indicator; no thumb ball needed (gradient itself shows position)
- base.njk: Site title unified to "carteakey.dev" on both desktop and mobile — removes "Kartikey Chauhan" desktop variant and the `font-et-book` (Latin serif) font
- base.njk: Nav `py-3` → `py-3.5` (slightly taller for consistency with body text size)
- base.njk: Old footer slider block removed



### Fixed
- tailwind.css: Moved `.title-hover:hover` completely OUT of `@layer components` — in Tailwind v4, `@layer utilities` always beats `@layer components` regardless of specificity, so hover color was always overridden by `text-gray-900 dark:text-gray-100`. Unlayered CSS beats all layers. Added `!important` as belt-and-suspenders.
- base.njk: Accent slider thumb was invisible — Tailwind v4 only scans static HTML class names; dynamic Alpine `:class="themes[currentIndex].color"` bindings like `bg-amber-500` are never included in generated CSS. Fixed by switching to `:style="background-color: ${themes[currentIndex].hex}"` with hex values embedded directly in the data object (matching the `ACCENT_COLORS` map in theme.js).
- base.njk: Slider label now uses `x-text="themes[currentIndex].name"` (was `.label` — removed unused label field from theme data).



### Fixed
- tailwind.css: Added `.site-content .title-hover:hover` (specificity 0,3,0) alongside `.title-hover:hover` (0,2,0) — Tailwind's `dark:text-gray-100:is(.dark *)` also has 0,2,0 and wins by cascade order when equal; the higher-specificity rule now correctly applies accent color on hover in blog/snippets list rows
- base.njk: Accent slider `updateTheme()` now calls `window.setAccentTheme()` explicitly instead of bare `setAccentTheme()` — Alpine.js component scope doesn't reliably fall through to window globals, causing the slider to move visually but not update the CSS variable



### Fixed
- snippets.njk: Added `| reverse` to both list and grid loops — snippets collection is oldest-first by default (unlike posts which has an explicit sort); now shows newest snippets first, matching blog behavior



### Changed
- snippets.njk: Full rewrite to match blog (archive.njk) exactly — same inline h1+count header, same search field style, list view as default, list button first then grid, same list row design (date col + title + language tag), same grid card design (feed-card-full style with purple dot). Removed page-header component and wrapping max-w div.
- index.njk: Homepage feed now shows list toggle FIRST, then grid toggle (consistent with blog/snippets). Removed redundant "→ Feed" footer link (was duplicate of "All →" in header). Grid bumped to 3-col (lg:grid-cols-3). Shows 9 items.
- index.njk: Feed default is now list view (localStorage key h-feed-view), matching editorial density preference.

### Fixed
- index.njk: "All →" and "→ Feed" both linking to /feed/ (duplicate). Kept only "All →" in the section header.



### Fixed
- tailwind.css: Links are now gray (color: inherit) with underline by default, accent color on hover — removes all accent-as-default link color. Works consistently in both prose and not-prose contexts
- tailwind.css: Removed `!important` from `.not-prose a` reset — no longer needed since content links don't set accent by default
- tailwind.css: `.site-content picture` centering now scoped to `article picture` only — fixes profile avatar being pushed/clipped by `margin: 1.5em auto`
- tailwind.css: `.not-prose picture` reset added — avatars/icon images in UI components no longer affected by post-image centering rules
- feed.njk: Description changed from "/now snapshots" to "and updates"

### Changed
- index.njk: Homepage feed section now defaults to grid view (2-col compact cards); list toggle added; view persisted to localStorage key `h-feed-view`

## [1.6.2] - 2026-02-27

### Added
- base.njk: Global code block copy button — clipboard SVG icon appears on pre:hover, turns accent on hover, switches to checkmark on success
- tailwind.css: `.copy-code-btn` styles — positioned absolute, dark semi-transparent background, accent on hover

### Fixed
- base.njk: "More" (compass) nav icon now uses accent color
- tailwind.css: `.site-content .not-prose a` reset uses `!important` to definitively prevent accent color from leaking into feed cards and UI components
- archive.njk: Removed `| reverse` from both list/grid loops — `collections.posts` is already sorted newest-first in eleventy.config.mjs; `| reverse` was making it oldest-first
- snippets.njk: Grid cards switched from `card card-hover card-compact` to flat `border border-gray-200` style; list view rewritten as `divide-y` rows with date col + title + language tag (matches blog list design)
- tailwind.css: `.site-content picture` and `.site-content picture img` rules added — images in post content are now centered with `margin: auto`
- picture CSS: Added `text-align: center` and `display: inline-block` on img for proper centering



### Added
- src/static/css/prism/prism-light.css: New clean GitHub-inspired light syntax theme (replaces broken prism-coy)

### Fixed
- index.njk: Homepage footer → "→ Feed" (single clean link)
- index.njk: Profile avatar wrapped in constrained `w-20 h-20 rounded-full overflow-hidden` div — fixes blurriness and gradient ring
- eleventy.config.mjs: Image shortcodes now use `widths: [400, 800, 1200, "auto"]` with proper `sizes` (was `["auto"]` = single size only); removed `style="max-width: 100%; height: auto;"` inline style override
- tailwind.css: Added `picture { display: block }` + `picture img { max-width: 100%; height: auto }` global rules
- projects.njk: Removed `intro-block` card wrapper → plain text description; GitHub table redesigned as clean bordered table with `title-hover` links and `meta-text` dates; description column hidden on mobile
- gallery.njk: Removed `intro-block` card wrapper → plain text description
- theme.js / base.njk: Switched default Prism theme from `prism-coy` to `prism-light`



### Added
- stats.njk: Hero callout strip with 4 large accent-colored numbers (Posts, Snippets, This Year, Tags)
- feed.njk: List/grid toggle, type filter chips, inline search — list view defaults to homepage activity style
- base.njk: Footer nav links now have feather icons (clock, activity, edit-3, code, box, image, music, etc.)
- base.njk: Site title now shows accent color always (not just on hover)
- base.njk: Dark mode toggle icon uses accent color
- index.njk: Profile avatar larger (w-20 h-20) + conic gradient ring restored
- index.njk: Homepage footer link text cleaned up ("Blog · Snippets · Feed · Search")
- feed-card.njk: Pinned star icon (★) shown in list variant when item is pinned

### Changed
- theme.js: Exposed `setAccentTheme`, `isDarkMode`, `switchPrismTheme` as `window.*` globals — fixes accent slider in Alpine.js context
- tailwind.css: Code block background mode-aware — light gray in light mode, dark navy in dark mode; removed `!important` overrides
- package.json: Bumped all dependencies to latest (eleventy 3.1.2, tailwind 4.2.1, 11ty-img 6.0.4, sharp 0.34.5, etc.)

## [1.5.8] - 2026-02-26

### Changed
- post.njk: Post navigation redesigned — "Next →" / "← Previous" labels with title-hover links



### Fixed
- tailwind.css: `.site-content a` link styling scoped to `:is(p, li, blockquote, td, th) a` — prevents accent-color from applying to UI/nav/card links inside site-content
- base.njk: Added `not-prose` to `<nav>` and `<footer>` elements to isolate them from content typography styles
- tailwind.css: Added TOC (`<nav class="toc">`) styles — no disc bullets, clean link style with accent hover
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
- base.njk: Drop Tailwind prose entirely — replaced with custom `.site-content` typography class; body set to `text-sm` (14px); nav links tightened to `text-sm` (no md:text-base); site title reduced to `text-base`
- tailwind.css: Added comprehensive `.site-content` typography block (~200 lines) — 0.9375rem base, 1.65 line-height, all HTML elements styled. `.not-prose` escape hatch fully defined. Removes dependency on `@tailwindcss/typography`
- eleventy.config.mjs: `readableDate` filter changed from `DATE_FULL` to `MMM d, yyyy` (e.g., "Feb 26, 2026")
- theme.js: Fixed accent slider — removed `.prose` class manipulation from `updateAccentClasses` (only `setAccentVariables` needed)
- post.njk: Post article spacing tightened (`space-y-8` → `space-y-6`, header `space-y-5` → `space-y-3`); description `text-lg` → `text-sm`; sidebar headings `text-lg` → `text-sm`
- feed-card.njk: Removed `prose-sm dark:prose-invert` — replaced with `not-prose` to use site-content typography
- search.njk, uses.njk, newsletter.njk, guestbook.njk, stats.njk, quotes.njk, bookmarks.njk, blogroll.njk: Replaced `text-lg`/`text-xl` headings with `text-sm`/`text-base` for density consistency

## [1.5.3] - 2026-02-26

### Changed
- stats.njk, guestbook.njk, newsletter.njk: Replaced heavy glassmorphism `cardShell` (shadow-lg + bg-gray-100/80) with clean flat `border` cards — consistent with new dense editorial design language.
- post.njk: Sidebar author/TOC cards replaced `card-elevated` with flat border. Upvote/reaction active states now use `var(--accent-color)` via inline style instead of hardcoded amber classes.
- comment-pointer.njk: Replaced `card-elevated` with flat border card.
- snippet-tags.njk: Full rewrite — flat `divide-y` row list matching snippets.njk list view. Added breadcrumbs.
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
- UI: Second-pass redesign — coherent design language built from the ground up.
- feed-card.njk: New `list` variant for homepage (single-row grid layout: date · dot · type · title). `full` variant now uses `feed-card-full` (flat border card, no shadow) for the /feed page grid.
- index.njk: Full homepage rewrite. Clean hero (avatar + name + bio + quick links inline). Featured post as minimal text block. QOTD as bare blockquote. Feed section replaced masonry grid with a scannable `feed-list` single-column chronological activity log.
- archive.njk (blog): Full rewrite. Default list view (matches postslist.njk style: date left col, title+desc right). Grid view uses `feed-card-full` cards consistent with /feed. Search bar compact and inline with view toggle.
- feed.njk: Cleaned up, removed duplicate inline JS (handled by masonry-script include).
- postslist.njk: Refined layout — `md:w-36` fixed date column, tags below date on desktop, description `text-sm`, consistent with blog page.
- tailwind.css: Added `.feed-list`, `.feed-list-row`, `.feed-list-dot`, `.feed-list-date`, `.feed-list-type`, `.feed-list-title` for homepage activity list. Added `.feed-card-full` for grid cards. Removed heavy `.card-hover` box-shadow — now border-color transition only.



### Changed
- UI: Full "Dense Editorial" redesign — higher text density, flat list rows, less visual noise.
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
- Projects page: Redesigned cards — switched to `card card-hover` with fixed `h-40` image height, left-aligned text, GitHub icon next to title, `text-sm` descriptions, all tags shown, and image zoom on hover.
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
