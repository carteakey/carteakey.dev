import { seasonFor } from "../static/js/halftone-kit.js";

// Still SVG frames of every halftone scene: the no-JS fallback under the
// canvas. Same screen as the hero portrait: r = 0.6 pitch at full coverage.
// Dots are bucketed by radius; each bucket is one path of round-capped,
// zero-length strokes in integer cell units (far smaller than <circle>s).
const LEVELS = 16;
const INK = { day: "#2323e6", night: "#6d6dff" };
// Coast stills come in each layout's own ratio (desktop and phone, footer and
// 404), composed exactly as the canvas will be, so the swap never jumps.
const SCENES = [
  { name: "coast", module: "footer-scene.js", cols: 220, rows: 55, still: 4.2 },
  {
    name: "coast-m",
    module: "footer-scene.js",
    cols: 150,
    rows: 60,
    still: 4.2,
  },
  {
    name: "coast-search",
    module: "footer-scene.js",
    cols: 175,
    rows: 70,
    still: 4.2,
    mode: "search",
  },
  {
    name: "coast-search-m",
    module: "footer-scene.js",
    cols: 120,
    rows: 80,
    still: 4.2,
    mode: "search",
  },
  {
    name: "bonfire",
    module: "scenes/bonfire.js",
    cols: 72,
    rows: 72,
    still: 1.3,
  },
  { name: "coffee", module: "scenes/coffee.js", cols: 60, rows: 60, still: 2 },
  { name: "vinyl", module: "scenes/vinyl.js", cols: 72, rows: 72, still: 0.4 },
  {
    name: "bottle",
    module: "scenes/bottle.js",
    cols: 64,
    rows: 64,
    still: 1.5,
  },
  {
    name: "bottle-ashore",
    module: "scenes/bottle.js",
    cols: 64,
    rows: 64,
    still: 1.5,
    mode: "ashore",
  },
  { name: "moon", module: "scenes/moon.js", cols: 72, rows: 72, still: 0 },
  {
    name: "projector",
    module: "scenes/projector.js",
    cols: 72,
    rows: 72,
    still: 1.5,
  },
];

function toSvg(coverage, cols, rows, ink) {
  const buckets = Array.from({ length: LEVELS }, () => []);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const c = coverage[j * cols + i];
      if (c < 0.015) continue;
      const level = Math.min(
        LEVELS - 1,
        Math.round(Math.sqrt(c) * (LEVELS - 1)),
      );
      if (level > 0) buckets[level].push(`M${i} ${j}h0`);
    }
  }
  const paths = buckets
    .map((d, level) =>
      d.length
        ? `<path stroke-width='${((1.2 * level) / (LEVELS - 1)).toFixed(3)}' d='${d.join("")}'/>`
        : "",
    )
    .join("");
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' width='${cols * 4.5}' height='${rows * 4.5}' preserveAspectRatio='xMidYMid slice'><rect width='100%' height='100%' fill='${ink}' fill-opacity='0.06'/><g transform='translate(.5 .5)' fill='none' stroke='${ink}' stroke-linecap='round'>${paths}</g></svg>`;
}

export default async function () {
  const season = seasonFor();
  const stills = [];
  for (const scene of SCENES) {
    const { default: makeScene } = await import(`../static/js/${scene.module}`);
    for (const theme of ["day", "night"]) {
      const frame = makeScene({ ...scene, theme, season })(scene.still);
      stills.push({
        name: scene.name,
        theme,
        svg: toSvg(frame, scene.cols, scene.rows, INK[theme]),
      });
    }
  }
  return stills;
}
