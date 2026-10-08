# Rendering ASCII illustrations

The footer uses the MIT-licensed [alpine dawn](https://ascii.rest/alpine-dawn/) and [night coast](https://ascii.rest/night-coast/) scene by [@bas3line](https://github.com/bas3line/ascii). Its source and license are self-hosted under `src/static/js/vendor/ascii/`. The dots are Unicode characters, so this is character art rather than strictly seven-bit ASCII.

## How the picture is made

A scene factory prepares its geometry and returns a pure `frame(seconds) -> string` function. The coast samples a 200-column, 100-row grid. It computes brightness from the moon, cloud cover, sea, buildings, and moving lighthouse beam, then quantizes those samples into `space`, `·`, `•`, and `●`. A small ordered-dither pattern makes four density levels appear more gradual. Changing the time changes the lighting, not the layout of the page. The vendored factories have a small local extension: an optional `density` Float32Array receives continuous coverage before four-character quantization. Night mode stores light coverage; daytime stores ink coverage. The original character output remains available as a build-time fallback.

This technique can also draw a silhouette, terrain, a small terminal ornament, or a diagram. Start with a fixed grid and a static frame. Map brightness or distance to a short character ramp; animate only a parameter with an obvious visual purpose. Ordinary text, controls, and data tables should stay HTML.

## Size the cells, not just the font

The column count determines the horizontal scale. A typical monospace character advances about `0.6021em`, so 200 columns need `120.42em`. The footer's container query sets `font-size: calc(100cqw / 120.42)` and `line-height: 0.6021`. This makes each cell approximately square before presentation. The footer then deliberately scales the complete frame vertically to 40% for a compact 5:1 desktop panorama, or about 67% for a 3:1 mobile strip. This is an illustration treatment: keep square cells for diagrams whose geometry must remain accurate. For another font, measure its character advance; for another scene, use its column and row counts instead of copying these constants.

Give the illustration its own explicit block width and reset figure, prose, and code-block defaults. In particular, global `figure { display: table; max-width: ... }` and `.not-prose pre { font-size: inherit }` can make a correct frame look small or clipped. The footer rules are unlayered and scoped to `.site-content .ascii-coast`, so these generic rules cannot silently override its geometry.

## Keep the scene's light direction

Both source scenes encode brighter regions with larger dots. Night mode preserves that ramp on a dark ground, mixing the active accent with 28% white for visibility. Day mode adapts alpine dawn for warm paper: clear sky has no ink, mountains and foreground pines receive stronger coverage, and the lake fades toward paper. Drifting clouds, three gliding birds, and broad moving reflection bands keep motion readable in the compact strip. The `ascii-day.js` adapter reverses the fallback character ramp (`space ↔ ●`, `· ↔ •`).

Both first frames are rendered at build time. CSS selects the daytime or nighttime pre from the page's `.dark` class, including with reduced motion. Each player observes its own element: the hidden theme stops playback and the visible theme loads lazily. Use this same pattern for another pair of scenes; preserve cell dimensions and explicitly choose the appropriate density polarity for each ground.

## Smooth dots like the hero

`ascii-halftone.js` draws continuous coverage as antialiased canvas circles rather than displaying four Unicode dot sizes. Bilinear sampling and a staggered, square dot screen remove the old vertical stripes. Dot area follows coverage (`radius ∝ sqrt(coverage)`); the canvas uses up to 2× device pixel ratio, reads the active accent from CSS, and redraws on resize or theme/accent changes. It paints the same fixed-height panorama without squashing individual circles. The scene grid and the display dot grid are independent.

The ASCII fallback remains underneath until drawing succeeds. Reduced motion still gets a smooth canvas frame at time zero. The shared player's optional `renderFrame` callback handles canvas output, while its default continues to write text. `renderStatic: true` permits a visible canvas scene to load and render once even with reduced motion enabled. Hidden themes and offscreen scenes pause.

## Render once, then play when visible

`src/_data/ascii.js` computes the first frame during Eleventy builds. The template escapes it into an `aria-hidden` pre element, so decoration is present without JavaScript and does not flood screen readers with character noise. Keep useful text and attribution outside that element.

`playAscii` in `src/static/js/ascii-player.js` accepts an element and an asynchronous loader returning a frame function:

```js
import { playAscii } from "./ascii-player.js";

const stop = playAscii(document.querySelector("[data-my-scene]"), async () => {
  const { default: makeScene } = await import("./vendor/my-scene.js");
  return makeScene();
}, { fps: 8 });

// Call stop() if the containing view is removed.
```

It loads only when visible, caps playback at 15 frames per second, pauses off screen and in hidden tabs, and restores the static frame for reduced motion. The footer entry script uses the release version query, and each dynamic import propagates that query through the full module graph. This is essential because Netlify serves static assets with a year-long immutable cache. Unversioned scripts and styles use network-first service-worker caching; the cached copy remains an offline fallback. Import or network failures retain the fallback. Keep a single restrained scene per region rather than making every element animate.

## Check a new illustration

Inspect the whole scene in light and dark themes at phone, tablet, and desktop widths. Compare its bounding width with its intended container and check for horizontal overflow. Compare rendered screenshots a second apart, rather than checking only text or array changes. Verify visible cloud/bird/reflection movement, off-screen frames pause, reduced motion stays still, and the page remains useful with JavaScript disabled. Preserve the original artist's license and link attribution for reused scenes.
