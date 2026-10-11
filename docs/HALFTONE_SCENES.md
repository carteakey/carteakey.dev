# Halftone scenes

The footer coast (`src/static/js/footer-scene.js`) is drawn with the same screen as the hero portrait: an orthogonal grid of accent dots whose radius is `0.6 × pitch × √coverage`, on a 6% accent tint. It was first an ascii.rest character scene ([night coast](https://ascii.rest/night-coast/) by @bas3line). That version was resampled from a 200 × 100 grid and squashed into a panorama, so it read blurry and striped. The scene is now authored for this site and credited as "after" the original.

## Sample at the display grid

The rule that makes it crisp: compute one coverage value per displayed dot. Do not render a fixed-size field and interpolate or stretch it. `makeScene({ cols, rows, theme })` takes the grid the canvas will draw (about 3.4 CSS px per dot, clamped to 3–4) and returns `frame(seconds) -> Float32Array`. The world is height 1 and width `cols / rows`. Landmarks (lighthouse, moon) are placed by fraction of the width so a phone still frames both. Landforms use world units so they never stretch.

Static layers (ridges, headland, pines, buildings, base tones) are computed once per size. Each frame only adds what moves: clouds, stars, ripples and the glitter path, the beam, the boat, and gulls. A frame costs about 5–8 ms at 300 × 75.

## Tone like a print

- **Day** coverage is ink on paper (`#f4f3ee`). **Night** coverage is light on `#101010`. Toggling the theme turns the same coast from day to night.
- Keep large quiet fields. The day sky is bare paper with haze only near the horizon, and the night sky is a faint gradient. Avoid mid-tone everywhere: it reads as fog, not halftone.
- Give each plane one flat tone (far range, near range, headland, pines), and make the orb the boldest shape in the sky.
- White objects on paper vanish. Give them a mid-tone body and shade them from the light's side (the lighthouse uses 0.2–0.5 by day).
- A gradient that crosses the minimum dot threshold draws a visible edge. Either end gradients at zero or keep the transition small (like the sun's halo).

## Scenes and placement

| Scene | Module | Where | Shape |
| --- | --- | --- | --- |
| coast | `footer-scene.js` | footer; 404 with `mode: "search"` | `coast` 4:1 (5:2 phone), `wide` 5:2 (3:2 phone) |
| bonfire | `scenes/bonfire.js` | guestbook | `square` |
| coffee | `scenes/coffee.js` | support | `square` |
| vinyl | `scenes/vinyl.js` | listening | `square` |

Place one with the macro; `halftone-scenes.js` (loaded by `base.njk`) mounts every `[data-halftone]` element:

```njk
{% from "components/halftone.njk" import halftone with context %}
{{ halftone("bonfire", "square", class="halftone-piece") }}
```

To add a scene: write a module with the same `makeScene` contract under `src/static/js/scenes/`, register it in `SCENES` in both `halftone-scenes.js` (cols across, still time) and `src/_data/halftoneStills.js` (still grid), and import helpers from `halftone-kit.js` with the release query, as the existing scenes do. Keep one moving scene per region of a page.

## Seasons

`seasonFor()` in `halftone-kit.js` reads the month in America/Toronto: winter December–March, spring April–May, summer June–August, autumn September–November. The coast takes `season` and changes only what a season changes: snow on the headland, pine tiers, roof and peaks with falling snow; a deciduous tree beside the lighthouse that blossoms, fills, thins, or stands bare; petals, leaves, or fireflies (summer nights) stamped over the finished frame. `stamp()` writes particles where they contrast, so a flake is ink on paper and paper on ink. Snow by day is pale ink (0.14) under the dark rim line: paper-white snow vanishes against a paper sky. The browser decides the season at view time; the build's stills use the build date. `?season=winter` previews another season.

## Player

`src/static/js/halftone.js` computes a scene frame at about 15 fps and caches its coverage. Drawing dots from that cache is cheap, so the cursor swell redraws on `requestAnimationFrame` at display rate without recomputing the scene. Pointer moves under reduced motion are handled the same way: one redraw per frame. The ink color (the viewport's CSS `color`, the accent) is read once per build, and builds re-run on resize or theme change. The device pixel ratio is capped at 2×. It pauses offscreen and in hidden tabs and applies the hero's slow diagonal breath. With reduced motion it draws one still frame.

The build renders every scene in both themes as still SVGs (`src/_data/halftoneStills.js` → `/img/halftone/{scene}-{day,night}.svg`). Wide scenes also get a phone-ratio still (`-m`), chosen with `<picture>` at the same 639px breakpoint as the CSS, so each still is composed exactly as the canvas will be at that size. The canvas fades in over the still for 0.4s, then the still steps aside. Dots are bucketed into 16 radii, each one round-capped path of zero-length strokes, which is roughly five times smaller than one `<circle>` per dot. `base.njk` preloads the footer's modules (`halftone.js`, `halftone-kit.js`, `footer-scene.js`, all with the release query) so they fetch in parallel.

Scenes keep the per-frame work small. Static layers are computed once per size; anything slow and smooth, like the coast's cloud field, refreshes at a few hertz instead of every frame.

## Checking a change

Render frames offline before reloading the site: `sharp` can rasterize an SVG of the frame at 2×. Inspect both themes at desktop (4:1) and phone (5:2), and compare two frames a second apart. Confirm that nothing overflows horizontally and that the fallback SVG loads with JavaScript disabled.
