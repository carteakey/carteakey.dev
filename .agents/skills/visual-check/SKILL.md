---
name: visual-check
description: Screenshot carteakey.dev pages in light, dark, and mobile with headless Firefox and then actually look at them. Use after any template, CSS, layout, shortcode, or component change, before saying a visual change works, and whenever the user asks "how does it look" or reports something cut off, too big, or broken.
---

# Visual check

**Status: draft.** The screenshot workflow and dark-mode pref below were tested
end to end on 2026-10-01 (newsletter page: light, dark, mobile). The review
checklist is from this site's design language and has not been run as a routine yet.

Passing builds and 200 responses do not prove a layout works. Several fixes in
the 2026-09/10 sessions (gallery, feed card clamp, newsletter form, ink effects)
shipped without anyone seeing them. Look at the page.

## Run it

Needs the dev server up (see the `dev-server` skill; it is on `:8081` when
`llama-swap` holds `:8080`). Firefox is `/usr/bin/firefox`.

```sh
S=$SCRATCHPAD/vc            # always the session scratchpad, never the repo
sh .agents/skills/visual-check/scripts/shoot.sh $S newsletter /newsletter/ /now/
```

This writes, per page, `<name>-<slug>-light-desktop.png`,
`-dark-desktop.png`, and `-light-mobile.png` (390 px wide). Then **open each PNG
with the Read tool**; do not judge from file sizes. Raise `VC_HEIGHT=3000` for
long pages (Firefox captures the viewport only), and `VC_BASE=...` for another host.

## Gotchas (all hit while testing)

- **Dark mode needs `ui.systemUsesDarkTheme = 1`** in the throwaway profile's
  `user.js`. `layout.css.prefers-color-scheme.content-override` looks right and
  does nothing in headless. The site follows `prefers-color-scheme` (`theme.js`)
  unless `localStorage.theme` is set. If light and dark PNGs are byte-for-byte
  near identical, the pref did not apply.
- **Always `--no-remote` and a fresh `--profile`** so the user's real Firefox is
  never touched or locked. `shoot.sh` handles this.
- A dark vertical strip at the right edge of a PNG is the scrollbar, not a bug.
- Lazy images load only if they are inside the window: use a taller window.
- Scroll-triggered effects (`ink.js`: annotation draw-in, `sketch-draw` wipe) arm
  only below the fold; a tall screenshot shows the finished state. Reduced-motion
  is not emulated.

## What to check

Look at all three renderings of every page you touched.

- Squareness and flatness: no pills, soft shadows, gradients, rounded cards.
- One accent colour (cobalt). No stray teal, emerald, purple.
- Type roles: display titles, serif support copy, mono labels and dates.
- Dark mode: text contrast, borders still visible, images not inverted into
  negatives, sketches (`sketch-draw`) keep blue ink blue.
- Mobile at 390 px: no horizontal scroll, nothing clipped, form controls usable,
  columns collapse sensibly.
- Images: whole picture visible, not cropped mid-subject.
- Density: no giant empty gutters or one-card-per-screen layouts.

## Pages to cover by change type

- Layout/CSS: `/`, `/blog/`, one post, `/notes/`, `/feed/`, `/newsletter/`.
- Post primitives (callout, gallery, diagram, sketch): the post using it.
- Feed card: `/` and `/feed/` (stream, list, and grid views).
- New collection page: the page plus `/` if it links there.

## Report

Say what you looked at (page, theme, width), what is wrong (specific), and what
you could not check. If a screenshot fails, say so; never claim a visual check
you did not perform.
