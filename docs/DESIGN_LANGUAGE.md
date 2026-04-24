# carteakey.dev Design Language

This site is not a product landing page. It should read like a personal notebook, archive, and workbench built by one person who thinks in systems, accumulates artifacts, and publishes in public.

The visual goal is not polish for its own sake. The goal is to make the structure feel authored.

## Core Feel

- Dense, but intentional
- Editorial, not corporate
- Squarish, not bubbly
- Archival, not app-like
- Personal, not branded startup clean
- Calm paper/workbench surface with pockets of chaos

The homepage should feel like an index to a body of work. Post pages should feel like reading a page from an active notebook. Collection pages should feel like shelves, ledgers, and folders.

## Visual Principles

### 1. Density is a signal

Whitespace is allowed, but not as the default answer to every layout problem.

Good density:
- tightly organized lists
- visible structure in the first viewport
- multiple meaningful entry points on the homepage
- rows, indexes, counts, metadata, and cross-links

Bad density:
- giant empty gutters with one small card floating in them
- oversized hero sections
- one item per screen when several can coexist cleanly
- decorative spacing that makes the site feel generic

### 2. Structure should reveal the mind behind the site

The site should expose:
- what gets written
- what gets saved
- what gets built
- what is still unfinished

Pages should feel like curated shelves, not a social feed or SaaS dashboard.

### 3. Squareness wins

Use sharp or nearly-sharp edges.

- Border radius should stay minimal.
- Avoid soft bubble buttons, soft pills, and floating glass cards.
- Lists, panels, and controls should feel flat, printed, and deliberate.

### 4. Texture over gradients

The page background should feel like light textured paper.

- Prefer paper/noise texture
- Prefer subtle tonal variation
- Avoid glossy gradients, blobs, neon glows, and glassmorphism

## Typography System

Typography is the primary design language. If the type is wrong, the page falls back into generic UI.

### Font Roles

#### Display font
Use for:
- major titles
- content titles in indexes
- section names that should feel authored

Tone:
- literary
- confident
- high-contrast

Current role:
- `var(--font-display)`

Examples:
- homepage featured title
- site index section names
- recent activity entry titles
- note titles
- major page titles

#### Serif body/supporting font
Use for:
- descriptions
- supporting copy
- notes/excerpts
- sidebar prose
- status copy
- commentary text

Tone:
- editorial
- readable
- reflective

Current role:
- `var(--font-serif)`

Examples:
- homepage descriptive blurbs
- note index body
- post support copy
- quote/source support text where appropriate

#### Monospace meta font
Use for:
- dates
- labels
- section kickers
- breadcrumbs
- counts
- small navigation metadata

Tone:
- archival
- index-like
- technical

Current role:
- `var(--font-mono)`

Examples:
- `Recent Activity`
- breadcrumbs
- dates
- counters
- small labels like `Writing`, `Notes`, `Outline`

#### UI sans
Use sparingly.

Use only for:
- functional controls that genuinely benefit from a neutral UI tone
- small technical widgets when editorial type would hurt clarity

Do not use it as the default answer for page copy.

Current role:
- `var(--font-sans)`

## Type Rules

### Use semantic classes, not one-off utility stacks

Bad:

```html
<p class="text-sm text-gray-500 dark:text-gray-400 font-semibold">
```

Good:

```html
<p class="home-directory-note">
<a class="feed-list-title">
<div class="note-index-body">
```

Reason: the redesign lives in semantic classes. Utility-only text styling breaks the cascade and causes mixed old/new typography across pages.

### Default mapping

- Titles of things to read: display
- Descriptions of things: serif
- Labels and metadata: mono
- Control-only UI: sans if needed

If unsure, choose serif over sans for content, and mono over sans for metadata.

## Layout Language

### Homepage

The homepage is an index, not a hero.

It should include:
- a fast sense of who this is
- entry points into writing, notes, projects, reading, etc.
- a visible current signal
- recent activity that feels important, not leftover

It should not feel like:
- a startup homepage
- a portfolio splash screen
- a single-feature landing page

### Collection pages

Collection pages should read like catalogs.

- prefer rows over isolated cards
- keep dates visible
- let titles carry weight
- use description text as editorial support, not filler

### Post pages

Post pages should feel like a reading surface with margin structure.

- use mono for labels and navigation metadata
- use serif for support prose
- keep side panels flat and square
- avoid playful UI treatment around serious writing

## Components

### Panels

Panels should feel like framed paper sections, not app cards.

- thin border
- almost-square corners
- no soft shadows unless extremely subtle
- transparent or paper-adjacent backgrounds

### Badges

Badges are metadata, not decoration.

- keep them flat
- keep them small
- mono works best
- reduce badge spam

Every badge needs a job:
- type
- count
- status
- authorship

If it is only there to make the UI feel busy, remove it.

### Lists

Lists are first-class.

- rows should have rhythm
- titles should be readable and typographically strong
- metadata should align cleanly without overpowering the entry
- avoid making lists look like stripped-down admin tables

### Quotes

Quotes should feel like pinned signals, not testimonial cards.

- strong text
- restrained framing
- clear source
- no quotation widget feel

## Color and Tone

- Background: warm paper
- Borders: quiet and visible
- Accent: selective, not everywhere
- Text: dark enough to read as print, not washed-out SaaS gray

Accent color should guide attention, not paint the whole page.

Use accent for:
- links that need draw
- active hover states
- restrained separators or quote rules

Do not use accent to compensate for weak layout.

## Anti-Patterns

Do not introduce:
- rounded dashboard cards
- glossy gradients
- giant marketing copy blocks
- oversized pill badges
- center-aligned landing page composition
- excessive whitespace as default style
- random sans body copy on otherwise editorial pages
- utility-only text stacks for content areas

## Implementation Rules

When building or redesigning a page:

1. Start from structure, not decoration.
2. Assign each text element a font role: display, serif, mono, or rare sans UI.
3. Prefer shared semantic classes in `src/static/css/tailwind.css`.
4. If a new repeated pattern appears twice, give it a named class.
5. Do not solve typography with raw utility chains unless the element is truly one-off and non-editorial.

## Shared Primitives

These are the current shared typography primitives for sweeping passes:

- `.editorial-kicker`
  - mono uppercase section labels, year markers, mini headings
- `.editorial-title` / `.editorial-title-link`
  - primary row/item titles
- `.editorial-title-compact` / `.editorial-title-link-compact`
  - tighter card/grid/item titles
- `.editorial-support`
  - normal supporting copy
- `.editorial-support-compact`
  - tighter descriptions/excerpts
- `.editorial-meta-link`
  - small mono links such as “View all”, “Full shelf”, “Permalink”
- `.footer-nav-heading`
  - footer column labels
- `.footer-nav-link`
  - footer navigation links
- `.footer-smallprint`
  - footer smallprint / maker note
- `.now-log`
  - serif prose lists on `/now/`

When you find a fallback `text-sm text-gray-500 font-semibold` stack in core content, replace it with one of these first before inventing another page-local class.

## Migration Checklist

Use this when reviewing a page after changes:

- Are titles using the display face where they should?
- Is support copy using serif instead of default sans?
- Are labels/dates/counts mono and uppercase where appropriate?
- Do rows and indexes feel intentional, not leftover?
- Are surfaces square and flat enough?
- Is there any rounded-card or startup UI drift?
- Did any `text-sm text-gray-500` style utility stack sneak back into core content?

## One-Line Prompt Version

If you need a compact instruction for later passes, use this:

> Make this page feel like carteakey.dev: dense editorial/archive design, textured paper background, squarish flat surfaces, display font for titles, serif for support copy, mono for metadata, minimal badge clutter, and structure that reads like an index of a mind rather than a startup UI.

For the actual cleanup workflow, pair this with [MIGRATION_PROCESS.md](./MIGRATION_PROCESS.md).
