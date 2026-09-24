# carteakey.dev Design Language

This site is not a product landing page. It should read like a personal notebook, archive, and workbench built by one person who thinks in systems, accumulates artifacts, and publishes in public.

The visual goal is not polish for its own sake. The goal is to make the structure feel authored.

> This document describes where the visual language landed. For the
> rounds that got cut, the reasoning behind specific decisions, and
> technical learnings along the way, see
> `docs/DESIGN_EXPERIMENTATION_LOG.md`.

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
- Confirmed the hard way: a generative soft-blurred-blob SVG wash tried
  behind the homepage intro read as a generic AI-hero gradient the moment
  it was actually visible enough to notice - removed. Grain and halftone
  dot-screen are textures; soft gradient blobs are not, no matter how
  muted the color.

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

### Editorial Post Primitives

Article-only helpers should feel like flat paper marks, not app widgets.

- Use `{% callout %}` for authored notes, warnings, examples, todos, and asides.
- Use `{% update %}` for dated inline changes inside posts.
- Use `{% define %}` for short term explanations.
- Use `{% sidenote %}` for quiet factual side context.
- Use `{% annotate %}` only for handwritten commentary.
- Keep blockquotes for quoted material, not generic callouts.

See `docs/BLOG_POST_FEATURES.md` for the current inventory and syntax.

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

**Revised** (Nous Research pivot - see `docs/DESIGN_EXPERIMENTATION_LOG.md`
for the full history). This section previously said "accent: selective, not
everywhere" and "do not use accent to compensate for weak layout." That was
right for the editorial/archival era of this site and wrong for the current
one - direct feedback was that a scattered, restrained accent read as
indecisive. The fix wasn't more restraint, it was full commitment to one
specific color used confidently and broadly.

- Background: warm paper (unchanged)
- Borders: quiet and visible (unchanged)
- Text: dark enough to read as print, not washed-out SaaS gray (unchanged)
- **Accent: one fixed saturated color, used broadly** - nav, links, borders,
  the avatar's duotone tint, badges. Not a user-selectable palette (there
  was one; it read as "the designer couldn't commit to a color" and was
  removed). Not confined to small restrained touches either - the accent
  should read as a real commitment, not a garnish.

### Halftone imagery

Real photos (the avatar, the footer's skyline band) get a genuine halftone
dot-screen in the accent color - dot *radius* modulated by the source
photo's actual luminance, not a CSS filter approximation (a filter can fake
a flat duotone but not true halftone; see the experimentation log for why
that distinction mattered in practice). Built with a small Node script
(sample source luminance on a grid, draw one SVG circle per cell) rather
than any runtime CSS trick.

The site's own line-art sketch illustrations (post header stamps, feed
thumbnails) are the exception - they stay **plain grayscale, no accent
tint**. Different sketches have different natural ink density, so
recoloring them all to the identical accent made them look inconsistent
with each other ("messy" - direct feedback). Two different problems,
two different fixes: halftone treats real photographs, flat recolor
doesn't work reliably across a set of independently-drawn line art.

Do not stack multiple effects on one image (a mistake made and reverted
earlier this session: the avatar briefly had duotone + grain + pixelation
all at once). Pick the one effect that's right for that image's content -
halftone for photos, plain grayscale for sketches - and stop there.

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

For cleanup work, keep the same principle: converge older pages onto the shared primitives before adding page-local styling.
