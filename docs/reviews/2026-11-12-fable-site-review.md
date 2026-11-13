# Site review — 2026-11-12

Reviewer: Claude Fable 5.2, an external model reading the live site at `https://carteakey.dev`, not the author.
Status: open. No item here has been actioned yet. Nothing was changed during the review.

This file replaces the first, shorter pass saved earlier the same day. Three items from that pass were wrong and are retracted at the bottom.

## How to use this file

Each task below is independent. Pick one, do only that task, and stop.

Rules for whoever picks a task up:

1. Read `AGENTS.md` and `docs/DESIGN_LANGUAGE.md` first. The "Protected Personality" table in the design language is off limits. No task here asks you to remove or restyle anything in it. If a fix seems to need that, stop and ask the owner.
2. Do not create new pages or new components. Every task is an edit to an existing file.
3. "Evidence" is what the reviewer measured. "Where" is the file to start in; confirm it before editing, because the code may have moved. "Done when" is the check to run.
4. Tasks marked **Owner decision** need an answer from the owner before any code changes. Do not guess.
5. After a change, run `npm run check` and verify in a browser. Follow the changelog and version steps in `AGENTS.md`.

## Scope

About 25 pages on desktop (1024px wide): `/`, `/blog/`, one post (`/blog/local-inference/strata-on-an-rtx-4070/`), `/now/`, `/about/`, `/more/`, `/projects/`, `/uses/`, `/data/`, `/folio/`, `/notes/`, `/feed/`, `/cv/`, `/ai/`, `/ask/`, `/stats/`, `/gallery/`, `/vibes/`, `/quotes/`, `/guestbook/`, `/newsletter/`, `/search/`, `/changelog/`, `/bookmarks/`, and the 404. Mobile (375 × 812) on `/`, `/blog/` and the post. Dark mode on `/`, the post, `/guestbook/` and `/data/`. Page weight measured with `curl` and the browser's resource timing.

Not covered: images and animations (the review browser was hidden, so lazy images and animated scenes did not render), a Lighthouse run, keyboard navigation, and the pages not listed above.

## Verdict

The identity is strong and consistent: halftone avatar, pixel name, cobalt accent, paper grain, footer coast. Dark mode keeps all of it. The dense index pages are the best part. The look should be left alone.

The problems are in three places: how long it takes to reach the writing, small inconsistencies between pages, and font weight.

## Tasks

### A. Getting to the writing

**A1. Shorten the top of posts**

- Evidence: on the Strata post at 375px wide, the first sentence of body prose starts 2,028px down the page, which is 2.5 screens. Above it, in order: Draft notice, AI Assisted banner, description, meta row with a second AI Assisted badge, tags, sketch, Copy as Markdown, outline, a long checkpoint update box.
- Where: `src/_includes/layouts/post.njk` (draft notice near line 108, AI Assisted banner near line 122, badge near line 155).
- Change: the AI Assisted label appears twice. Keep the small badge in the meta row and remove the full-width banner, or reduce the banner to one line. Do not remove the authorship badge itself.
- Done when: the same post at 375px shows AI Assisted once above the fold, and the first body sentence starts at least 150px higher than before.
- **Owner decision:** whether the banner goes entirely or shrinks to one line.

**A2. Tables are three screens wide on a phone**

- Evidence: on the Strata post at 375px, four-column tables render 686–962px wide inside a 317px scroll container.
- Where: table styles in `src/static/css/tailwind.css` (search for `.wide-wrap table` and the prose table rules).
- Change: on narrow screens let table cells wrap and reduce cell padding so a four-column table needs at most about one extra screen of horizontal scroll. Do not change table markup in posts.
- Done when: at 375px no four-column table on that post is wider than 640px, and desktop tables look unchanged.

**A3. Chart labels are 9px on a phone**

- Evidence: the bar chart on the Strata post renders 540px wide in a 287px container, with text about 9px tall.
- Where: `src/static/css/tailwind.css` line ~5409 (`.chart-svg { min-width: 620px }`) and ~5422 (`.chart-card .data-card-scroll .chart-svg { min-width: 540px }`).
- Change: this is a trade-off between scrolling and legibility. **Owner decision:** keep the min-width (scroll, small text) or drop it on mobile (no scroll, smaller chart). Do not change it without an answer.

**A4. Body text size**

- Evidence: post body is Iosevka Aile at 15.4px on desktop and 15.0px on mobile, on posts of 2,600 words.
- Change: **Owner decision.** The reviewer's suggestion is to try 16–17px in `/lab/fonts/` first. Do not change the typeface; it is protected.

**A5. A draft leads the homepage**

- Evidence: the newest homepage card (Strata, Nov 9) opens on a page whose first box says "Draft: This post is a work in progress". The post has an eight-entry changelog.
- Where: `src/_includes/layouts/post.njk` line ~42 (`isDraft`), and the post's front matter in `src/posts/`.
- Change: **Owner decision:** either unmark long-lived drafts, or show a "draft" marker on feed cards so the notice is not a surprise.

### B. Homepage

**B1. The first row never changes**

- Evidence: three pinned cards fill the whole first row at desktop width. One is a note dated Mar 5, 2026 about authorship badges. The newest work starts in row two.
- Where: `pinned` in post and note front matter; flags are documented in `docs/POST_FRONTMATTER.md`.
- Change: **Owner decision:** unpin one or two items, or cap pinned cards on the homepage at one. Do not flatten the masonry feed; it is protected.

**B2. Dates disagree between pages**

- Evidence: the homepage shows the Strata post as Nov 9, 2026 and the optimization guide as Oct 18, 2026. `/blog/` shows the same posts as Oct 3 and Jun 12. The homepage uses the `updated` date, `/blog/` uses `date`, and neither says which.
- Where: the feed card component used by `src/index.njk` (find it with `grep -rn "feed-card" src/_includes`).
- Change: when a card shows `updated` and it differs from `date`, prefix the date with a mono "Updated" label. Do not change sort order.
- Done when: the Strata card on the homepage reads as an updated date, and cards whose `updated` equals `date` (or is absent) look unchanged.

**B3. Long note cards are cut off mid-sentence**

- Evidence: note cards on the homepage are clipped at a fixed height with a hard edge. Text stops mid-line with no fade or "more" cue.
- Where: the feed card styles in `src/static/css/tailwind.css` (search `feed-card`).
- Change: add a short fade to the paper colour at the bottom of clipped cards, in both themes. No new component.
- Done when: a clipped note card on the homepage ends in a fade in light and dark mode, and cards that are not clipped are unchanged.

### C. Consistency

**C1. Newsletter copy contradicts itself**

- Evidence: the homepage says "No weekly content treadmill. Just new posts and substantial updates." `/more/` describes the page as "Weekly digest". `/newsletter/` says both "New writing, sent when it is ready." and "A quiet weekly digest", and its checkbox says "I agree to receive a weekly digest".
- Where: `src/more.njk` line 54, `src/newsletter.njk` lines 15 and 72.
- Change: **Owner decision** on which is true (weekly at most, or only when ready). Then make all four strings say the same thing. Keep the owner's voice; do not rewrite into neutral product copy.

**C2. The 404 uses pill buttons**

- Evidence: four links on the 404 have `rounded-full` and raw Tailwind utility stacks. The design language bans pills and utility text stacks.
- Where: `src/404.md` lines 19–31. Line 23 also links to `/posts/`, a legacy URL; it should be `/blog/`.
- Change: replace the four pill links with the site's existing square button or link classes (look at how other pages style primary and secondary links before choosing). Fix the `/posts/` link.
- Done when: no element on the 404 has a border radius above 4px, `npm run check:design` passes, and the baseline in `utils/design-baseline.json` goes down, not up.

**C3. Decorative circles on `/data/`**

- Evidence: five `rounded-full opacity-10` circles sit in the corners of cards on `/data/`.
- Where: `src/_includes/components/cartebase-charts.njk` line 25.
- Change: remove the decorative circle. Halftone is the site's texture; soft translucent circles are listed as an anti-pattern.
- Done when: `/data/` has no `rounded-full` decoration and the cards otherwise look the same.

**C4. Post pages scroll sideways on desktop**

- Evidence: at a 1024px window with a visible scrollbar, the post page is 5px wider than the viewport. The cause is `.wide-wrap`, which measured from -5px to 1019px.
- Where: `src/static/css/tailwind.css` line ~4840. `.wide-wrap` sets `width: 100vw` and `margin-left: calc(50% - 50vw)`. `100vw` includes the scrollbar width, so the box is wider than the visible page.
- Change: stop the breakout from exceeding the visible width (for example, clip horizontal overflow on the page root, or size the breakout without `100vw`). Keep the breakout effect itself.
- Done when: on the Strata post, `document.documentElement.scrollWidth === document.documentElement.clientWidth` at 1024px and at 1440px, and wide tables still break out of the text column.

**C5. `/stats/` chart skips 2024**

- Evidence: the "Publishing cadence, 2021–2026" bar chart has x-axis labels 2021, 2022, 2023, 2025, 2026. A year with no posts is dropped, so the bars look consecutive.
- Where: `src/stats.njk` lines 27–70. `years` is built from the keys of `byYear`, so empty years never appear.
- Change: fill every year between the first and last with a zero.
- Done when: the chart shows 2024 with a zero-height bar.

**C6. Page headers drift**

- Evidence: `/search/` uses a plain `<h1>` in Iosevka Aile at 22px; every other page uses the Fraunces page header. `/gallery/`, `/vibes/` and `/quotes/` inset their header at 152px from the left while the site nav sits at 93px. Some pages have the kicker and count badge (`/blog/`, `/more/`, `/projects/`, `/bookmarks/`), others do not (`/stats/`, `/changelog/`, `/guestbook/`, `/newsletter/`, `/quotes/`, `/vibes/`, `/ai/`, `/data/`).
- Where: `src/search.njk` line 13; `components/page-header.njk`; the three full-bleed templates `src/gallery.njk`, `src/vibes.njk`, `src/quotes.njk`.
- Change, in this order, one commit each: (1) move `/search/` onto the shared page header; (2) align the header's left edge on the three full-bleed pages with the nav. A missing kicker is fine and needs no change.
- Done when: the `h1` on `/search/` computes to the Fraunces family, and on `/gallery/`, `/vibes/` and `/quotes/` the `h1` left edge equals the nav logo's left edge at 1024px.

**C7. Wikilink chips split across lines on mobile**

- Evidence: in the Strata post at 375px, `[[elastic --kv-grow]]` renders as three pieces over two lines, with the closing brackets orphaned.
- Where: the wikilink chip style in `src/static/css/tailwind.css`.
- Change: keep a chip's brackets attached to its text when it wraps.
- Done when: at 375px no chip on that post shows a bracket alone on a line.

**C8. Mobile `/blog/` controls**

- Evidence: at 375px there are five rows of controls before the first post (search, authorship filter, read filter, view toggle, jump-to). The year jump pills are 18px tall and the header icons are 27px, below a comfortable touch size.
- Where: `src/_data/collectionViews.yaml` (the Writing entry) and `components/collection-index.njk`.
- Change: **Owner decision** on which controls to collapse on mobile. Independently of that, raise the tap height of the jump pills and header icons to at least 32px without changing how they look.

**C9. Badge load on `/projects/`**

- Evidence: each card can carry four badge families: status, authorship, language, and tech hashtags. There are about 35 distinct hashtags and most are used once. The design language says every badge needs a job.
- Change: **Owner decision.** Note that `/projects/` changed on 2026-11-12 (PR #154), after this was measured; re-check before acting.

**C10. `/quotes/` and `/quotations/`**

- Evidence: two pages with near-identical names. `/quotes/` is life lessons plus the quote of the day; `/quotations/` is saved passages.
- Change: **Owner decision.** No code until the owner picks a name or a merge.

### D. Performance

Measured on the homepage: 718 KB transferred over 32 requests. Fonts are 606 KB of that, in 10 files.

| Font file | Size |
| --- | --- |
| IoskeleyMono Regular, Medium, SemiBold, Bold | 94 KB each |
| JetBrainsMono Regular | 90 KB |
| Iosevka Aile 400, 400 italic, 600, 700 | 32–37 KB each |
| Press Start 2P | 5 KB |

**D1. Ioskeley Mono is not subset**

- Evidence: four weights at 94 KB each, against about 33 KB for each Iosevka Aile weight.
- Where: `src/static/fonts/ioskeley-mono/`; `@font-face` rules at the top of `src/static/css/tailwind.css`; read `docs/FONT_STRATEGY.md` first.
- Change: subset the files to the character ranges the site uses (Latin plus the symbols that appear in content). Do not change the typeface.
- Done when: each Ioskeley Mono file is under 45 KB and `/lab/fonts/` plus a code-heavy post render with no missing glyphs.

**D2. Too many mono weights load on the homepage**

- Evidence: 400, 500, 600 and 700 all download on `/`.
- Change: find which elements use 500 and 600, and move them to 400 or 700 if the difference is not visible. **Owner decision** if any change is visible.
- Done when: the homepage requests at most two Ioskeley Mono files.

**D3. JetBrains Mono downloads although it is only a fallback**

- Evidence: `JetBrainsMono-Regular.woff2` (90 KB) loads on the homepage. It is second in the mono font stack, behind Ioskeley Mono.
- Where: find the rule that names JetBrains Mono first (`grep -n "JetBrains" src/static/css/tailwind.css`).
- Done when: the homepage makes no request for a JetBrains Mono file.

**D4. Fraunces comes from Google Fonts**

- Evidence: `fonts.googleapis.com` is requested on every page. Every other font is self-hosted, and `AGENTS.md` says to keep third-party assets self-hosted.
- Where: `src/_includes/layouts/base.njk` lines ~18–21.
- Change: self-host Fraunces under `src/static/fonts/` like the others.
- Done when: no request goes to `fonts.googleapis.com` or `fonts.gstatic.com`, and titles still render in Fraunces.

**D5. `/feed/` and `/data/` are very large documents**

- Evidence: `/feed/` is 1,074 KB of HTML (135 KB compressed), about 6,900 DOM nodes and 21,000px tall. `/data/` is 449 KB and about 7,500 nodes. `/feed/` renders every one of 129 items in three views (stream, list, wall).
- Change: **Owner decision.** Options are to render only the default view at build time, or to paginate. Both change how the collection engine works, so this needs a plan before code.

**D6. Two analytics scripts**

- Evidence: Google Analytics (`G-DKK1XXJY42` via `googletagmanager.com`) and Cloudflare Insights both run on every page.
- Change: **Owner decision** on which to keep.

### E. Dark mode and accessibility

Dark mode held up on every page checked. Basics are in place: a skip link, one `h1` per page, `lang` set, no unlabelled buttons or links on the homepage.

**E1. Small grey labels are low contrast in dark mode**

- Evidence: `rgb(107, 114, 128)` on `rgb(20, 20, 20)` is 3.8:1 at 11.5px. Seen on `.data-card-foot` (chart footers), `.post-byline-kicker`, and italic table captions. The usual minimum for small text is 4.5:1.
- Where: those classes in `src/static/css/tailwind.css`.
- Change: lighten the dark-mode colour of these labels until they reach 4.5:1. Do not change light mode.
- Done when: each of the three computes to at least 4.5:1 against its background in dark mode.

## Leave alone

These break a rule on paper and are better for it. Do not "fix" them.

- The coloured sticky notes on `/guestbook/`.
- The dark terminal on `/ask/`.
- Emoji in the section headings on `/uses/`.
- The number of pages under `/more/`.

## Retracted from the first pass

The earlier version of this file listed three things that were artifacts of the review browser being hidden, which stops animations and lazy images. They are not site bugs. Do not work on them.

- A blank area below the hero on the mobile homepage.
- An empty scene box above the heading on the 404.
- The avatar painting late on first load.

The first pass also guessed that the sideways scroll on posts came from a wide table. The cause is `.wide-wrap`; see C4.
