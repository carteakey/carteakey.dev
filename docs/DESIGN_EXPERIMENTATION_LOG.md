# Design Experimentation Log

A running record of design directions explored, what landed, what didn't, and
why. Unlike `DESIGN_LANGUAGE.md` (the current stated philosophy), this file
is a history - it keeps failed and superseded directions on record instead of
deleting them, because the "why we didn't do X" is often as useful as "what
we did."

## ✅ Resolved: DESIGN_LANGUAGE.md conflict

This was flagged before the Nous Research pivot was built out, asking
whether the destination philosophy doc needed updating to match. Resolved:
the vision moved on, and `DESIGN_LANGUAGE.md`'s Color and Tone / Texture
sections were rewritten to match once the direction was actually built and
settled (not before - a moving target isn't worth documenting). The
editorial/archival *structure* principles (density, squareness, no
rounded-card startup UI) turned out not to actually be in conflict - only
the color/accent philosophy needed to change.

## Round 1: "Cobalt Dither Monumentalism"

Starting point: homepage had six sections at equal visual weight, small
mono-label text throughout, a plain gradient accent-color slider, a flat
"All / No-Gen / Human" segmented control, and no serif anywhere despite
`--font-serif` existing as a token (it was aliased to the sans stack).

Inspired by a temple/moon halftone illustration and a Hermes app screenshot
(grain-on-color-block cards). Built:
- Visible film grain + warm vignette on `body::before/::after` (previously
  scaffolded but disabled, and later too subtle to notice - see Learnings).
- Fraunces display serif for the homepage H1 (`--font-monument`).
- A duotone-cobalt treatment for opaque images (avatar, project
  screenshots): grayscale + accent-color tint via `mix-blend-mode`.
- A pixelated avatar (decode-at-tiny-size trick, later switched to a
  pre-shrunk source PNG for reliability across browsers).
- `.stamp-cobalt`: an alpha-safe CSS `filter` recolor for the transparent
  sketch illustrations (post headers, feed thumbnails) - alpha-safe because
  a `mix-blend-mode` tint pseudo-element would also tint the transparent
  backdrop around the art, not just the art itself.
- Nav accent-color slider redesigned: icon + grain-textured track + a knob
  showing the actual selected color.
- Homepage size hierarchy: Featured Posts promoted to primary (bigger
  titles/thumbnails, wider column), Site Index and Recent Activity
  quieted.
- Mobile nav fix: About/Writing/Now were `hidden sm:flex` with zero mobile
  alternative - added a hamburger menu.
- Footer illustration (AI-generated line art, same style as the post
  stamps) - **cut**, see Round 2.
- A generative SVG "brush stroke wash" behind the homepage intro (soft
  blurred blob shapes in the accent color) - **superseded by Round 3**,
  read as a generic soft-gradient-blob hero rather than genuine painterly
  texture.

## Round 2: the cut

Direct feedback after living with Round 1: "cringe", "not tasteful", "feels
like a college project". Diagnosis: too many simultaneous effects, none
fully committed to.

Cut:
- The 22-color accent picker (nav slider) - removed entirely. A
  customizable palette reads as indecisive, not considered; a site should
  commit to one color.
- Avatar stacking (duotone + grain + pixelation, all at once) - reverted to
  a single full-resolution duotone-tinted photo.
- The footer illustration - reverted; "not tasteful" / "college project"
  reaction, not worth iterating further on.

Net: -240 / +28 lines. One fixed accent (slate, `#64748b`) replacing the
per-theme system everywhere, including `.stamp-cobalt`.

## Round 3 (in progress): Nous Research pivot

Reference: nousresearch.com. Full commitment to one saturated ultramarine
blue across the whole site (not muted), heavy *graphic* halftone dot-screen
on real photographic/painterly imagery (not the thin line-art sketches used
elsewhere on the site), and a bold oversized wordmark used as structural
type (e.g. the footer's giant ghost-text "NOUSRESEARCH").

Key technical distinction from Round 1's grain/dither: Round 1 used
`feTurbulence` fractal noise for texture - visually a "grain", not a
"halftone". A true halftone (dot *size* modulated by underlying luminance,
like a print screen) can't be faked convincingly with a CSS filter alone;
it needs per-pixel processing. Built via a small Node script: sample source
image luminance on a grid, draw one SVG `<circle>` per cell with radius
proportional to darkness, rasterize. First pass on the avatar photo
produced a recognizable, genuine halftone portrait - validates the
technique, not yet tuned or wired into the site.

Status: paused to flag the DESIGN_LANGUAGE.md conflict above before
proceeding further.

## Learnings (technical)

- **`::before` paints behind an element's real children; `::after` paints
  after them.** A `mix-blend-mode` tint meant to affect a photo has to live
  on `::after`, or it's invisibly occluded by the opaque image on top of
  it. (Cost a full round of "the tint isn't showing" debugging.)
- **CSS `filter` functions (`brightness`, `contrast`, `saturate`) don't
  touch the alpha channel** - only RGB. Good for recoloring transparent
  line art without needing a mask.
- **Forcing a source image to one starting tone (e.g. `brightness(0)`)
  before a recolor filter chain guarantees hue uniformity but destroys any
  *opaque* grayscale shading the art uses for detail** (not all these
  sketches use alpha for fine detail - some use light-vs-dark fully-opaque
  grays instead). Fan blades, gauge markings, etc. flattened into solid
  silhouettes. Don't force a single starting tone on art with real tonal
  range in it.
- **A filter recipe calibrated against one image's ink tone doesn't
  transfer to a different image with a different characteristic tone.**
  Two sketches with different natural "ink darkness" will render visibly
  different hues under the identical filter. Fix: solve the filter against
  *multiple* representative source tones at once (minimize combined
  error), not one.
- **Image resize/downscale blurs thin ink strokes by an amount that
  depends on each image's own line density** - not a fixed ratio across
  images. A 64px thumbnail floor measurably lightened one sketch's darkest
  ink far more than another's, which alone explained a chunk of the
  cross-thumbnail color-mismatch complaints. Raising the width floor
  (64px -> 96px in `generatePostThumbnailMetadata`) closed most of the gap
  before any filter retuning was needed - check the pipeline before
  assuming the bug is in the recolor math.
- **Two sketches with very different ink *density* (opaque pixel coverage)
  will still look differently saturated under an identical filter even
  with identical per-pixel color values** - denser fill reads more vivid
  than sparse thin lines purely from area coverage. This is a property of
  the source art, not fixable by filter tuning or a normalize/levels pass
  (confirmed: both images already used the full 0-255 tonal range with
  zero color-cast pixels - the difference is real content, not a
  processing bug).
- **A true halftone (variable dot size by luminance) needs per-pixel
  processing** - a `feTurbulence`-based grain is a different, softer
  effect and reads as "paper texture", not "halftone screen". If the goal
  is a graphic print-halftone look, generate it (Sharp raw pixel access +
  an SVG circle grid, in this case), don't try to fake it with a live CSS
  filter.
- **Bump the cache-busting version string (`versions.json`) after visual
  changes.** Several rounds of "I don't see the change" mid-session traced
  back to stale browser cache, not a real regression - the version string
  wasn't bumped once during a very long session of CSS/JS edits.

## Learnings (taste / process)

- Stacking multiple "loud" techniques on one element (avatar: duotone +
  grain + pixelation at once) reads as not knowing when to stop, even if
  each technique is individually reasonable.
- A user-customizable accent palette undercuts a site's sense of being
  *authored* - it reads as a demo feature. Commit to one color.
- Two unresolved aesthetic impulses coexisting (confident editorial serif
  headline + dense hacker-dashboard mono/badge/footer density) read as
  unfinished, not eclectic, until they're deliberately reconciled.
- When a generated/sourced decorative asset gets a flat negative reaction
  ("not tasteful", "college project"), revert it outright rather than
  iterating on position/opacity - that feedback is about the asset itself,
  not its placement.
- Verify visually (headless browser + real screenshots) before presenting
  work as done. Several fixes shipped as "done" earlier in this session
  turned out to be invisible or broken when actually rendered - guessing
  from CSS alone repeatedly produced false confidence.
