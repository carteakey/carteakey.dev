# Rendering ASCII illustrations

The footer uses the MIT-licensed [night coast](https://ascii.rest/night-coast/) scene by [@bas3line](https://github.com/bas3line/ascii). Its source and license are self-hosted under `src/static/js/vendor/ascii/`. The dots are Unicode characters, so this is character art rather than strictly seven-bit ASCII.

## How the picture is made

A scene factory prepares its geometry and returns a pure `frame(seconds) -> string` function. The coast samples a 200-column, 100-row grid. It computes brightness from the moon, cloud cover, sea, buildings, and moving lighthouse beam, then quantizes those samples into `space`, `·`, `•`, and `●`. A small ordered-dither pattern makes four density levels appear more gradual. Changing the time changes the lighting, not the layout of the page.

This technique can also draw a silhouette, terrain, a small terminal ornament, or a diagram. Start with a fixed grid and a static frame. Map brightness or distance to a short character ramp; animate only a parameter with an obvious visual purpose. Ordinary text, controls, and data tables should stay HTML.

## Size the cells, not just the font

The column count determines the horizontal scale. A typical monospace character advances about `0.6021em`, so 200 columns need `120.42em`. The footer's container query sets `font-size: calc(100cqw / 120.42)` and `line-height: 0.6021`. This makes each cell approximately square and preserves the scene's 2:1 proportions at every width. For another font, measure its character advance; for another scene, use its column and row counts instead of copying these constants.

Give the illustration its own explicit block width and reset figure, prose, and code-block defaults. In particular, global `figure { display: table; max-width: ... }` and `.not-prose pre { font-size: inherit }` can make a correct frame look small or clipped. The footer rules are unlayered and scoped to `.site-content .ascii-coast`, so these generic rules cannot silently override its geometry.

## Keep the scene's light direction

The coast encodes brighter regions with larger dots. Light dots on its own dark ground preserve that intended brightness. Dark dots on a light background reverse the picture's visual polarity and make the moon and beam read incorrectly. The night illustration therefore keeps a dark ground in both page themes; the caption and navigation follow the page theme. A future daytime scene should use an intentionally inverted density mapping, not just inherit a text color.

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

It loads only when visible, caps playback at 15 frames per second, pauses off screen and in hidden tabs, and restores the static frame for reduced motion. Import or network failures retain the fallback. Keep a single restrained scene per region rather than making every element animate.

## Check a new illustration

Inspect the whole scene in light and dark themes at phone, tablet, and desktop widths. Compare its bounding width with its intended container and check for horizontal overflow. Verify animation changes visible frames, off-screen frames pause, reduced motion stays still, and the page remains useful with JavaScript disabled. Preserve the original artist's license and link attribution for reused scenes.
