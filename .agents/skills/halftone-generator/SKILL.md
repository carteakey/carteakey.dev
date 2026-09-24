---
name: halftone-generator
description: >
  Generate a genuine halftone dot-screen image (dot radius modulated by real
  per-pixel luminance, not a CSS filter approximation) from any source photo,
  in carteakey.dev's cobalt/Nous-Research visual language. Use this when
  replacing the homepage avatar or footer skyline image, or adding a new
  halftone treatment anywhere else on the site that needs the same look.
---

# Halftone Generator

Recreates the halftone-photo treatment used for the homepage avatar and the
footer skyline band: a real print-style halftone where each dot's *size*
(not just its presence) is driven by the source photo's actual brightness at
that point, giving genuine photographic detail rather than a flat recolor.

## When to reach for this vs. alternatives

- **Real photo that should read as a bold graphic image** (a portrait, a
  skyline, any hero-weight photograph): use this skill.
- **The site's own thin line-art sketch illustrations** (post header stamps,
  feed thumbnails): do **not** use this. They stay plain grayscale - see
  `docs/DESIGN_LANGUAGE.md`'s Halftone Imagery section for why (different
  sketches have different natural ink density; recoloring them all
  identically made them look inconsistent with each other).
- **Just need a flat accent-colored tint on an opaque image** (no need for
  per-pixel luminance detail): a CSS `mix-blend-mode` duotone is simpler and
  needs no build step - see `.duotone-cobalt` in `tailwind.css`. This skill
  is specifically for when the *texture itself* (visible dot detail) matters.

## Usage

```bash
node .agents/skills/halftone-generator/scripts/generate-halftone.mjs \
  <input-photo> <output.png> [options]
```

Run `node .agents/skills/halftone-generator/scripts/generate-halftone.mjs`
with no args to see the full option list (size, cell spacing, dot color,
backdrop, grain toggle). Defaults match the site's current look
(`#2323e6`, 1920x480, grain on).

**Always render to a scratch path first and look at it** (Read tool, or
copy into your scratchpad and view) before writing into `src/static/img/`.
Get the crop and contrast right before wiring it into a template.

## Day vs. night backdrop (important - read before setting `--backdrop`)

The generated image's "empty" areas (no dots) are **transparent** by
default - they show the source photo's *light* tones. What's behind that
transparency has to be considered against both of the site's themes,
because this is a fixed asset that doesn't itself know about light/dark
mode:

- If the source photo is naturally light in its empty areas (e.g. a
  daytime sky) and you're building the **light-theme** version: leave
  `--backdrop=transparent` (or a very low opacity, `--backdrop-opacity=0.05`
  or less). The page's own paper-colored background shows through and
  correctly reads as that light sky - this is deliberate, not the bug
  below.
- If you need the image to look the **same regardless of site theme**
  (e.g. the dark "night" variant, or any image that should read as fixed
  saturated color like the reference site's hero bands): give it its own
  **fully opaque** backdrop baked in (`--backdrop=#0a0a1f
  --backdrop-opacity=1`, or whatever fits the image). Do not rely on
  `--backdrop-opacity` below 1 for this case.

**The bug this avoids** (hit twice this session, on the avatar and the
footer band, before being fixed): if an image with sparse/transparent
"light tone" areas is shown with *no* fixed backdrop on the dark theme,
the page's near-black dark-mode background shows through those areas
instead of paper - which flips the photo's tonal read entirely. Areas that
should be the *lightest* part of the image (a sky, a highlight) become the
*darkest* thing on screen, and the photo looks like a negative. If you
want one asset to work correctly in both themes without a day/night pair,
it needs an opaque backdrop baked in from the start - it can never be
"transparent, whatever's behind it."

For a real day/night pair (what the footer band does): generate two
PNGs - one with the light-mode transparency trick, one with a baked-in
dark backdrop - and swap them with `dark:hidden` / `hidden dark:block` on
two stacked `<img>` tags, same pattern the nav's sun/moon toggle already
uses. See `.footer-photo-band` in `tailwind.css` and its markup in
`base.njk` for the working reference implementation.

**Do not** put an unconditional `display: block` (or any other rule with
equal-or-higher specificity than a single class) on a wrapper/img selector
that also carries `.hidden` / `dark:hidden` / `dark:block` utilities - it
will silently override the theme toggle regardless of which theme is
active, because those utilities are single-class selectors and lose the
specificity fight. This exact bug shipped once on the footer band; verify
the fix by checking `getComputedStyle(...).display` in both themes, not
just by looking at a screenshot in whichever theme happens to be active.

## Calibration notes (learned the hard way this session)

- **Don't force every pixel to one starting color** (e.g. `brightness(0)`
  in a CSS-filter version of this idea) before recoloring. Some source
  images use light-vs-dark *fully opaque* pixel values (not alpha) for
  real shading detail - forcing them all to black first destroys that
  detail and flattens the image into a silhouette. This script samples the
  actual luminance per-cell instead, which is why it doesn't have that
  failure mode.
- **A resize/downscale floor matters if you're also matching this to
  page-image thumbnails elsewhere.** Sharp's `.resize()` here targets the
  final output size directly, but if a *different* pipeline (e.g.
  eleventy-img thumbnails) generates a much smaller version of a similar
  source, thin detail can blur out disproportionately depending on that
  source's own line/edge density - two different source photos resized to
  the same tiny width won't necessarily lose the same amount of contrast.
  If matching color across multiple independently-processed images ever
  matters again, check the actually-served pixel values at the actual
  served size, not just the full-resolution source.
- Default `--contrast=1.3` and `--cell=3.2`/`--max-radius=2.0` are tuned
  for a ~1920x480 wide banner at normal viewing size. The homepage avatar
  (a much smaller, roughly-square crop) used a finer cell size and smaller
  max radius scaled to its own canvas - don't assume these exact defaults
  transfer to a very different aspect ratio or display size. Render to a
  scratch file and actually look at it (per the Usage note above) rather
  than trusting a specific number to carry over; check `git log -p --
  src/index.njk` around the avatar's introduction if you want the exact
  historical values as a starting point, not a guarantee.
